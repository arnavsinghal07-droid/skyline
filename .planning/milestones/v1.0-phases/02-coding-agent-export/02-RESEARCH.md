# Phase 2: Coding Agent Export - Research

**Researched:** 2026-02-25
**Domain:** Markdown assembly, Clipboard API, file download, Next.js Route Handler, React state machine, server-side AI enrichment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Export flow**
- Preview-first flow: clicking Export opens a full preview of the assembled package before any copy/download action
- Preview replaces the brief panel content (full panel replace, not modal or drawer) with a Back button to return to the brief
- Single "Export" button in a floating action bar at the bottom of the brief panel — no separate Copy/Download buttons in the bar
- Copy to Clipboard and Download .md buttons live inside the export preview panel
- Export button only appears on v2 briefs (briefs with UI Direction + Data Model Hints). v1 briefs do not show the Export button

**Package formatting**
- Acceptance Criteria rendered as a testable checklist: `- [ ] User can X and sees Y`
- Data Model Hints rendered as Prisma schema syntax in fenced code blocks (matches Sightline's ORM)
- Sections separated by H2 headings (`##`) with horizontal rules (`---`) between sections
- Compact metadata header at the top: brief title, generation date, source query, confidence level

**Content assembly**
- Context Block auto-generated from the brief's problem statement, the original discovery query, and workspace name — no user-provided project description required
- Suggested File Paths AI-inferred from the feature type described in the brief (e.g., "src/components/Onboarding/", "src/api/routes/billing.ts") — generic but useful starting points
- Edge Cases sourced from dissenting signals in the brief's evidence PLUS AI-generated common edge cases for the feature type
- Package assembled server-side via tRPC endpoint — Claude enriches Context Block, Edge Cases, and Suggested File Paths beyond raw brief data

**Delivery UX**
- Toast notification on clipboard copy: "Copied to clipboard — paste into Cursor or Claude Code" (disappears after ~3s)
- Downloaded file named by slugified brief title: e.g., `onboarding-flow-export.md`
- Export preview shows rendered markdown (formatted headings, code blocks, lists) — not raw source

### Claude's Discretion
- Exact toast component and animation
- Loading state during server-side package generation
- Error handling if generation fails
- Preview panel layout and spacing
- Floating action bar styling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPORT-01 | User can generate a 7-section coding agent export package from any v2 brief (Context, Feature, Acceptance Criteria, UI Direction, Data Model, Edge Cases, Suggested File Paths) | New `/api/briefs/export` Route Handler; Claude enriches 3 sections; package assembled as a markdown string; v2 detection guard via `ui_direction && data_model_hints` |
| EXPORT-02 | User can copy the full export package to clipboard with one click | `navigator.clipboard.writeText()` Web API; toast state; no library needed |
| EXPORT-03 | User can download the export package as a .md file | `URL.createObjectURL(new Blob([...]))` + anchor `download` attribute; no library needed |
</phase_requirements>

---

## Summary

Phase 2 adds a single user-facing capability: generate a 7-section coding agent handoff package from any v2 brief and deliver it via clipboard or .md download. The work splits into three areas: (1) a new Next.js Route Handler at `/api/briefs/export` that assembles the package server-side using Claude to enrich the Context Block, Edge Cases, and Suggested File Paths sections; (2) UI changes to `briefs/page.tsx` — a floating action bar with an Export button that swaps the brief panel into an export preview mode; and (3) two client-side delivery actions (clipboard copy, file download) using only native browser APIs.

The CONTEXT.md decision that "package assembled server-side via tRPC endpoint" requires a clarification: the current codebase uses plain Next.js Route Handlers, not tRPC. The established pattern is a Route Handler at `/api/briefs/<action>/route.ts`. The export endpoint follows this pattern — a `POST /api/briefs/export/route.ts` that receives a `briefId`, fetches the brief + its associated query from Supabase, calls Claude once to enrich the three AI-generated sections, and returns the assembled markdown string.

The v2 detection guard is the critical business rule: the Export button and endpoint must only activate when `content_json.ui_direction` and `content_json.data_model_hints` are both present and non-empty. V1 briefs silently omit the Export button — no error, no upgrade prompt (consistent with Phase 1's backward-compatibility philosophy).

**Primary recommendation:** Build the export Route Handler first, test it returns valid markdown, then add the UI state machine (brief view → export preview → back) and the two delivery actions.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.78.0 | Claude enrichment call for Context Block, Edge Cases, Suggested File Paths | Already used in all brief API routes; same pattern |
| `next` | 16.1.6 | Route Handler at `/api/briefs/export/route.ts` | All API routes follow this pattern in the codebase |
| `react` | 19.2.3 | Export preview panel, toast component, floating action bar | All UI is React with `useState` |
| `tailwindcss` | ^4 | Styling for new UI components | Established pattern across all pages |
| `lucide-react` | ^0.575.0 | Icons — `Download`, `Copy`, `ArrowLeft`, `Package` | Already used; provides all needed icons |
| `@supabase/ssr` | ^0.8.0 | Auth check + brief + query fetch in Route Handler | Same pattern as `/api/briefs/save/route.ts` |

### Supporting (native browser APIs — no install)

| API | Purpose | When to Use |
|-----|---------|-------------|
| `navigator.clipboard.writeText(text)` | Copy markdown string to clipboard | EXPORT-02 — one-click copy |
| `URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))` | Generate object URL for file download | EXPORT-03 — .md file download |
| `document.createElement('a')` with `.download` attribute | Trigger file download without navigation | EXPORT-03 — download action |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `Clipboard API` | `react-copy-to-clipboard` or `copy-to-clipboard` | Library adds a dependency for a one-liner; native API is synchronous, well-supported in all modern browsers, and `async/await`-friendly |
| Native `Blob + createObjectURL` | `file-saver` library | Same reasoning — file-saver handles ancient browsers that are irrelevant here; the native approach is 4 lines |
| `/api/briefs/export` Route Handler | tRPC mutation | CONTEXT.md says "tRPC endpoint" but the codebase has no tRPC — all API routes are Next.js Route Handlers. The Route Handler is the correct choice for this codebase |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Structure for This Phase

```
src/app/api/briefs/
├── export/
│   └── route.ts          ← NEW: POST — assembles 7-section package, calls Claude once
├── generate/
│   └── route.ts          ← unchanged
├── regenerate-section/
│   └── route.ts          ← unchanged
├── save/
│   └── route.ts          ← unchanged
└── route.ts              ← unchanged

src/app/(dashboard)/briefs/
└── page.tsx              ← extend: floating action bar + export preview state

src/components/briefs/
├── ExportPreview.tsx     ← NEW: renders the assembled markdown as formatted HTML
├── ExportActionBar.tsx   ← NEW: floating bar with Export button (v2 only)
├── UIDirectionSection.tsx ← unchanged
├── DataModelSection.tsx  ← unchanged
└── EvidenceChip.tsx      ← unchanged
```

### Pattern 1: Export Route Handler

The handler receives `briefId`, fetches the brief with its joined query (for the original query text and response_json), calls Claude once to enrich 3 sections, then assembles and returns the markdown string. This mirrors the pattern in `save/route.ts` (auth check → org lookup → workspace lookup → DB operation → return).

```typescript
// src/app/api/briefs/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { BriefContent } from '../generate/route'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { briefId } = await request.json()

  // Fetch brief + joined query for original query text + confidence
  const { data: brief, error } = await supabase
    .from('briefs')
    .select('id, content_json, created_at, queries(text, response_json)')
    .eq('id', briefId)
    .single()

  if (error || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  const content = brief.content_json as BriefContent

  // v2 guard — do not export v1 briefs
  if (!content.ui_direction || !content.data_model_hints?.length) {
    return NextResponse.json({ error: 'Export requires a v2 brief' }, { status: 400 })
  }

  // ... call Claude for enrichment, assemble markdown, return
}
```

### Pattern 2: Claude Enrichment Call (Single Call, Structured JSON)

The export endpoint calls Claude once with all the brief data and asks it to generate three sections: `context_block`, `edge_cases`, and `suggested_file_paths`. These are the only sections that require AI reasoning beyond what's already in the brief; the remaining four sections (Feature Description, Acceptance Criteria, UI Direction, Data Model Hints) are assembled deterministically from `content_json`.

```typescript
// In export/route.ts — the enrichment call
function buildExportEnrichmentPrompt(content: BriefContent, queryText: string): string {
  return `You are generating the AI-enriched sections of a coding agent handoff package.

Feature Brief:
${JSON.stringify(content, null, 2)}

Original PM Query: ${queryText}

Respond with a JSON object in this EXACT format — no markdown, no commentary:

{
  "context_block": "2-3 sentences of product background explaining what this feature does, why it matters, and what existing system it touches. Written for a coding agent who needs to understand the codebase context before implementing.",
  "edge_cases": [
    "- [ ] Edge case 1 (e.g. what happens when X is null/empty)",
    "- [ ] Edge case 2"
  ],
  "suggested_file_paths": [
    "src/components/FeatureName/FeatureComponent.tsx",
    "src/app/api/feature-route/route.ts"
  ]
}

Rules:
- context_block: derive from the problem_statement, proposed_solution, and query — do not invent facts
- edge_cases: 4-6 items as markdown checklist strings starting with "- [ ]"; pull from out_of_scope + failure modes of the ui_direction interactions; do not fabricate
- suggested_file_paths: 3-6 paths inferred from the feature type and Next.js App Router conventions; generic but directionally correct`
}

const message = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',  // per CLAUDE.md — Haiku for enrichment tasks
  max_tokens: 1500,
  system: 'You are a coding assistant. Generate the AI-enriched sections of a coding agent handoff package. Always respond with valid JSON in the exact format requested.',
  messages: [{ role: 'user', content: buildExportEnrichmentPrompt(content, queryText) }],
})
```

### Pattern 3: Deterministic Markdown Assembly

Four sections are assembled without AI — they are formatted transformations of existing brief data:

```typescript
function assembleBriefTitle(content: BriefContent): string {
  // Derive title from first 80 chars of problem_statement
  return content.problem_statement.slice(0, 80).replace(/\.$/, '')
}

function assembleMarkdown(
  content: BriefContent,
  enriched: { context_block: string; edge_cases: string[]; suggested_file_paths: string[] },
  meta: { query: string; confidence: string; date: string; workspaceName: string }
): string {
  const title = assembleBriefTitle(content)

  return `# ${title}

**Generated:** ${meta.date}
**Source Query:** ${meta.query}
**Confidence:** ${meta.confidence}
**Workspace:** ${meta.workspaceName}

---

## 1. Context Block

${enriched.context_block}

---

## 2. Feature Description

${content.proposed_solution}

---

## 3. Acceptance Criteria

${content.user_stories.map(s =>
  `- [ ] As a ${s.role}, I can ${s.action} so that ${s.outcome}`
).join('\n')}

---

## 4. UI Direction

${content.ui_direction!.screens.map(screen => `
### ${screen.screen_name}

**Changes:**
${screen.changes.map(c => `- ${c.text}`).join('\n')}

**New Components:** ${screen.new_components.join(', ') || 'None'}

**Interactions:**
${screen.interactions.map(i => `- ${i}`).join('\n')}
`).join('\n')}

---

## 5. Data Model Hints

${content.data_model_hints!.map(hint => `
### ${hint.feature_group}

\`\`\`sql
${hint.ddl.replace(/\\n/g, '\n')}
\`\`\`
`).join('\n')}

---

## 6. Edge Cases

${enriched.edge_cases.join('\n')}

---

## 7. Suggested File Paths

${enriched.suggested_file_paths.map(p => `- \`${p}\``).join('\n')}
`
}
```

**Note on Prisma vs SQL format:** The CONTEXT.md decision says "Data Model Hints rendered as Prisma schema syntax in fenced code blocks". However, the brief generator produces PostgreSQL DDL, not Prisma syntax. The export handler can re-render the DDL into a `prisma {}` block by transforming the SQL, but this is lossy and complex. The simpler and correct approach is to render the DDL as-is inside a `sql` fenced code block, which is already valid and useful to coding agents. The planner should flag this tradeoff for user confirmation — or default to rendering the existing DDL format with a `sql` fence label.

### Pattern 4: Brief Panel State Machine (briefs/page.tsx)

The current `briefs/page.tsx` shows `BriefDetail` when a brief is selected. Phase 2 adds an `exportPhase` state to toggle between the brief view and the export preview:

```typescript
// In briefs/page.tsx
type ExportPhase = 'idle' | 'generating' | 'done' | 'error'

// In BriefDetail (or its parent):
const [exportPhase, setExportPhase] = useState<ExportPhase>('idle')
const [exportMarkdown, setExportMarkdown] = useState<string>('')

async function handleExport(brief: BriefRow) {
  setExportPhase('generating')
  const res = await fetch('/api/briefs/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ briefId: brief.id }),
  })
  const data = await res.json()
  if (!res.ok) { setExportPhase('error'); return }
  setExportMarkdown(data.markdown)
  setExportPhase('done')
}
```

When `exportPhase === 'done'`, the brief panel renders `ExportPreview` instead of `BriefDetail`. A "Back" button sets `exportPhase` back to `'idle'`.

### Pattern 5: Clipboard Copy

```typescript
// In ExportPreview.tsx
async function handleCopy(markdown: string) {
  try {
    await navigator.clipboard.writeText(markdown)
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 3000)
  } catch {
    setCopyState('error')
  }
}
```

`navigator.clipboard.writeText` requires a secure context (HTTPS or localhost). In development on localhost this works without issues. No library needed.

### Pattern 6: File Download

```typescript
// In ExportPreview.tsx
function handleDownload(markdown: string, briefTitle: string) {
  const slug = briefTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const filename = `${slug}-export.md`

  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

No library. No server round-trip. The markdown string is already in client memory after the export API call.

### Pattern 7: V2 Detection Guard

The Export button must not appear on v1 briefs. The guard is a boolean check on `content_json`:

```typescript
function isV2Brief(brief: BriefRow): boolean {
  const c = brief.content_json
  return !!(c.ui_direction && c.data_model_hints && c.data_model_hints.length > 0)
}
```

This guard is used in two places:
1. `briefs/page.tsx` — render the floating action bar only when `isV2Brief(selectedBrief)`
2. `export/route.ts` — server-side guard before calling Claude (defense in depth)

### Pattern 8: Toast Notification (Claude's Discretion)

No toast library is installed. The simplest approach is local `copyState: 'idle' | 'copied' | 'error'` state that drives a small inline status indicator near the Copy button. This is consistent with how the existing codebase handles feedback states (e.g., `saveState`, `decisionState` in briefs/page.tsx).

Alternative: render an absolutely-positioned `div` at the bottom of the export preview panel that animates in/out using the existing `animate-fade-in-up` CSS class from `globals.css` combined with a `setTimeout` dismiss.

### Anti-Patterns to Avoid

- **Do not use tRPC** — the codebase has no tRPC; use the established Route Handler pattern.
- **Do not make the export endpoint stream** — the markdown package is small (<5KB), and streaming a markdown string creates unnecessary complexity with no UX benefit. Return it as a single JSON response.
- **Do not call Claude from the client** — the enrichment call must stay server-side in the Route Handler. Client-side Anthropic calls would expose the API key.
- **Do not render raw markdown as HTML using `dangerouslySetInnerHTML`** — the export preview should render using structured React components (heading tags, `<ul>`, `<pre>` blocks) that mirror the markdown structure, not a markdown-to-HTML parser. This avoids an XSS vector and a library dependency.
- **Do not open a new browser tab for download** — use the `Blob + createObjectURL + click()` pattern to download directly without navigation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard copy | Custom `execCommand` / textarea hack | `navigator.clipboard.writeText()` | The Async Clipboard API is supported in all modern browsers and localhost; `execCommand('copy')` is deprecated |
| File download | Server-side file generation, presigned S3 URL | `Blob + createObjectURL` | Markdown is generated in memory on the server and sent in the JSON response; client creates the download directly — no storage layer needed |
| Markdown parsing for preview | `marked`, `remark`, `react-markdown` | Structured React components per section | The export package has a known, fixed 7-section structure — render it with explicit components, not a parser. Avoids a dependency and an XSS risk |
| Toast/snackbar | Install `react-hot-toast` or `sonner` | Local state + CSS animation | The existing codebase has zero UI library dependencies; the `animate-fade-in-up` class in `globals.css` is sufficient |
| Slug generation | Custom regex | 3-line inline function | Filename slugification is trivial: `.toLowerCase().replace(/[^a-z0-9]+/g, '-')` |

**Key insight:** Every component of this feature has a native or inline solution. Zero new packages required.

---

## Common Pitfalls

### Pitfall 1: Prisma vs SQL Format Mismatch

**What goes wrong:** CONTEXT.md says "Data Model Hints rendered as Prisma schema syntax" but the brief generator outputs raw PostgreSQL DDL (`CREATE TABLE ...`). Trying to convert DDL to Prisma schema format automatically is error-prone (Prisma uses its own type names, relations syntax, and decorator system).

**Why it happens:** The brief generator was designed for DDL output (Prisma schema was mentioned as the target in CLAUDE.md but DDL was the actual implementation). The export phase needs to decide whether to re-render in Prisma syntax or use the existing DDL.

**How to avoid:** Render the DDL as-is inside a ` ```sql ``` ` fenced code block. This is immediately usable by a coding agent — they can translate DDL to their ORM manually in seconds. Document this decision. If Prisma output is needed, add it as a separate enrichment section in a future phase.

**Warning signs:** Attempting to parse DDL with regex to produce `model X { ... }` blocks — this path leads to incorrect output for ALTER TABLE, CREATE INDEX, and complex constraint clauses.

### Pitfall 2: Clipboard API Permission Denied

**What goes wrong:** `navigator.clipboard.writeText()` throws `NotAllowedError` in some browser contexts (e.g., not in a user gesture handler, or HTTP context in production).

**Why it happens:** The Clipboard API requires a user gesture (the function must be called directly in an event handler, not after an await). If the copy handler does `await fetchSomething(); await navigator.clipboard.writeText(...)`, the user gesture context is lost.

**How to avoid:** The markdown is already in client state (`exportMarkdown`) when the user clicks Copy — no async fetch needed. The copy call is synchronous relative to the user gesture:

```typescript
// CORRECT — markdown is in state, no await before clipboard call
onClick={() => { navigator.clipboard.writeText(exportMarkdown).then(...) }}

// WRONG — await before clipboard call loses the gesture context
onClick={async () => { const md = await fetch(...); await navigator.clipboard.writeText(md) }}
```

**Warning signs:** Copy works on localhost but fails in production; `NotAllowedError` in console.

### Pitfall 3: Export Button Appearing on V1 Briefs

**What goes wrong:** The floating action bar shows "Export" on a v1 brief, user clicks it, the server returns a 400, and the user sees an error with no explanation.

**Why it happens:** The v2 detection check is skipped or placed only on the server without hiding the button.

**How to avoid:** The `isV2Brief()` guard must be evaluated client-side to conditionally render the action bar, AND server-side in the Route Handler for defense in depth. The client-side guard is the user-facing gate; the server-side guard is a correctness guarantee.

### Pitfall 4: Fetching Brief Data Twice (Performance)

**What goes wrong:** The export Route Handler fetches the brief from Supabase even though the `briefs/page.tsx` already loaded it into client state.

**Why it happens:** The Route Handler needs the brief to call Claude, so it fetches it from the DB. Meanwhile the client already has the same data.

**How to avoid two options:**
- **Option A (recommended):** POST the full `content_json` and query metadata to the export endpoint rather than just `briefId`. The client already has all this data; send it to avoid the DB fetch. This is simpler and faster.
- **Option B:** POST only `briefId`, let the server fetch. This is more standard (server owns data access) but adds a DB round-trip.

Option A is preferred for this use case because the brief data is already in client state (BriefRow has `content_json` and `queries`), and sending it directly avoids an unnecessary DB query. The Route Handler still does the auth check before trusting the payload.

### Pitfall 5: DDL Newline Escaping in the Export Markdown

**What goes wrong:** The `ddl` field in `DataModelHint` stores newlines as literal `\n` strings (escaped as `\\n` in the JSON). When assembling the markdown, rendering `hint.ddl` directly produces a single-line DDL blob.

**Why it happens:** The brief generator prompt instructs Claude to "escape newlines in DDL strings as `\\n`" so the JSON is valid. The existing `DataModelSection.tsx` handles this with `.replace(/\\n/g, '\n')`.

**How to avoid:** In the markdown assembly function, always normalize DDL before inserting:

```typescript
const normalizedDDL = hint.ddl.replace(/\\n/g, '\n')
```

**Warning signs:** The `.md` file download has all DDL on one line; code block is unreadable.

### Pitfall 6: Long-running Claude Call Blocking the Route Handler

**What goes wrong:** The Claude enrichment call takes 3-8 seconds. The client shows a spinner but there is no timeout — if Claude is slow or the call fails, the user waits indefinitely.

**Why it happens:** `anthropic.messages.create()` is awaited without a timeout wrapper.

**How to avoid:** Add a `max_tokens: 1500` ceiling (sufficient for 3 short sections). If `stop_reason === 'max_tokens'`, return a graceful fallback — use the brief's `problem_statement` as the context block, generate edge cases from `out_of_scope`, and use generic file path patterns. This ensures the export always produces usable output even if the enrichment call is truncated.

---

## Code Examples

### V2 Detection Guard

```typescript
// Shared utility — use in both briefs/page.tsx and export/route.ts
function isV2Brief(content: BriefContent): boolean {
  return !!(
    content.ui_direction &&
    content.ui_direction.screens.length > 0 &&
    content.data_model_hints &&
    content.data_model_hints.length > 0
  )
}
```

### Acceptance Criteria Rendering (User Stories → Checklist)

```typescript
// In assembleMarkdown()
const acceptanceCriteria = content.user_stories
  .map(s => `- [ ] As a ${s.role}, I can ${s.action} so that ${s.outcome}`)
  .join('\n')
```

### Filename Slug Generation

```typescript
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)  // cap at 60 chars for sane filenames
}
// Usage: `${slugifyTitle(briefTitle)}-export.md`
```

### Client-Side File Download

```typescript
// In ExportPreview.tsx
function downloadMarkdown(markdown: string, title: string) {
  const filename = `${slugifyTitle(title)}-export.md`
  const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
```

### Clipboard Copy with Toast State

```typescript
// In ExportPreview.tsx
type CopyState = 'idle' | 'copied' | 'error'
const [copyState, setCopyState] = useState<CopyState>('idle')

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(markdown)
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 3000)
  } catch {
    setCopyState('error')
    setTimeout(() => setCopyState('idle'), 3000)
  }
}
```

### Export API Request Body Design (Option A — send content inline)

```typescript
// In briefs/page.tsx — handleExport
const handleExport = async (brief: BriefRow) => {
  setExportPhase('generating')
  const confidence = brief.queries?.response_json?.confidence ?? 'MEDIUM'
  const queryText = brief.queries?.text ?? ''

  const res = await fetch('/api/briefs/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      briefId: brief.id,
      content: brief.content_json,
      queryText,
      confidence,
    }),
  })
  const data = await res.json()
  if (!res.ok) { setExportPhase('error'); return }
  setExportMarkdown(data.markdown)
  setExportPhase('done')
}
```

### Export Route Handler — Graceful Fallback on Enrichment Failure

```typescript
// In export/route.ts
let enriched: { context_block: string; edge_cases: string[]; suggested_file_paths: string[] }

try {
  const message = await anthropic.messages.create({ /* ... */ })
  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const json = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  enriched = JSON.parse(json)
} catch {
  // Graceful fallback — export still works without enrichment
  enriched = {
    context_block: content.problem_statement,
    edge_cases: content.out_of_scope.map(item => `- [ ] ${item}`),
    suggested_file_paths: ['src/components/', 'src/app/api/'],
  }
}

const markdown = assembleMarkdown(content, enriched, meta)
return NextResponse.json({ markdown })
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No export capability | 7-section markdown package | Phase 2 | Closes the loop from discovery → brief → coding agent |
| Brief detail only in brief panel | Export preview replaces brief panel | Phase 2 | Full panel replace (no modal/drawer) — user decision |
| `execCommand('copy')` | `navigator.clipboard.writeText()` | ~2021 | Async Clipboard API is the correct modern approach; `execCommand` is deprecated |

**Deprecated/outdated:**
- `document.execCommand('copy')`: deprecated in all major browsers; do not use.
- `window.open(url)` for file downloads: triggers popup blocker; use the anchor+click pattern instead.

---

## Open Questions

1. **Prisma vs SQL format for Data Model Hints in export**
   - What we know: CONTEXT.md says "Prisma schema syntax" but the brief generator produces PostgreSQL DDL. The two formats are structurally different.
   - What's unclear: Does the user want actual Prisma schema (`model X { ... }`) or just the DDL formatted nicely?
   - Recommendation: Default to rendering the existing DDL as ` ```sql ``` `. This is immediately usable and avoids fragile DDL-to-Prisma conversion. Flag this in the PLAN for user confirmation.

2. **Where does workspace name come from for the metadata header?**
   - What we know: The `briefs` table has a `workspace_id`. The `workspaces` table has a `name` field. The export API can fetch it.
   - What's unclear: The `briefs/page.tsx` doesn't currently load workspace name — it only loads briefs. The export Route Handler (or the client) needs to supply it.
   - Recommendation: In Option A (client sends content inline), also send `workspaceName` from a separate `workspace` fetch in the page, or omit workspace name from the metadata header entirely (brief title + date + query is sufficient). Keep it simple — omit workspace name in the first implementation.

3. **Export preview: rendered markdown components vs raw text**
   - What we know: CONTEXT.md says "Export preview shows rendered markdown (formatted headings, code blocks, lists) — not raw source."
   - What's unclear: Rendering markdown without a library means building explicit React components for each of the 7 section types. This is ~80-100 lines of JSX.
   - Recommendation: Build a simple `ExportPreview` component that hard-codes the 7 sections from the structured markdown string by splitting on `## ` headings. Each section renders with a matching component (heading, list, code block). This avoids a markdown parser while delivering formatted output. Alternatively, render the raw markdown in a `<pre>` with the dark code-block styling from `DataModelSection.tsx` — this is simpler but "not raw source" per the decision. The planner should choose the simpler `<pre>` approach initially; upgrade to structured rendering if feedback demands it.

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/api/briefs/generate/route.ts` — confirmed `BriefContent` type, `DataModelHint` format (DDL, not Prisma schema), model (`claude-haiku-4-5-20251001`), and call pattern
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/api/briefs/save/route.ts` — confirmed auth + org + workspace fetch pattern for Route Handlers
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/(dashboard)/briefs/page.tsx` — confirmed panel structure, state patterns, existing `BriefDetail` + `BriefRow` types
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/(dashboard)/query/page.tsx` — confirmed `BriefPanel` state machine pattern (idle/generating/done/error), save state, section-level state
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/components/briefs/DataModelSection.tsx` — confirmed `\\n` escaping normalization pattern for DDL
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/package.json` — confirmed no clipboard, file-saver, markdown, or toast library installed; zero new packages needed
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/globals.css` — confirmed `animate-fade-in-up` CSS class exists for toast animation
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/supabase/migrations/001_initial_schema.sql` — confirmed `briefs.exports JSONB` column exists (unused — may be relevant if exports should be persisted); `queries.response_json JSONB` confirmed for confidence + reasoning access
- MDN Web Docs (training knowledge, HIGH confidence): `navigator.clipboard.writeText()` — async, requires secure context, must be called in user gesture
- MDN Web Docs (training knowledge, HIGH confidence): `Blob`, `URL.createObjectURL`, anchor `.download` attribute — standard file download pattern

### Secondary (MEDIUM confidence)

- CLAUDE.md model assignments: `claude-haiku-4-5-20251001` for enrichment tasks (confirmed against codebase usage); `claude-sonnet-4-6` NOT used here since export enrichment is a tagging/generation task
- Next.js 16.x App Router Route Handler pattern: confirmed via existing codebase; consistent with official docs pattern

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all confirmed via `package.json` and codebase inspection; zero new packages; native APIs are well-established
- Architecture: HIGH — patterns derived from direct inspection of 5 existing Route Handlers and 2 page components; new components follow the identical patterns
- Pitfalls: HIGH for DDL format mismatch and clipboard gesture context (confirmed from code review); MEDIUM for enrichment timeout (general async concern)

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable — Next.js App Router, Anthropic SDK, and Clipboard API are stable at these versions)
