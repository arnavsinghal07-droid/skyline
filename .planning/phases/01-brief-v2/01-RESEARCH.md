# Phase 1: Brief v2 - Research

**Researched:** 2026-02-25
**Domain:** AI brief generation, React UI composition, TypeScript type extension, prompt engineering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**UI Direction presentation**
- Grouped cards layout — each screen gets its own card with three buckets: Changes, New Components, Interactions
- Summary + expand by default — show screen name, change count, and first 2 items; click to expand full detail
- Three-bucket categorization matches the existing UIDirection TypeScript type (changes, new_components, interactions)
- Always use cards, even when only 1 screen is affected — consistent presentation regardless of content volume

**Data Model rendering**
- SQL DDL format with syntax highlighting — familiar to backend engineers, directly copy-pasteable
- Rationale as inline SQL comments (-- comments directly below each statement) — context travels with the code when copied
- Group related changes by feature, not by table — e.g., "Onboarding tracking" groups the new table + ALTER on users together
- Include obvious index suggestions (CREATE INDEX for foreign keys and commonly queried fields) alongside schema changes

**Evidence grounding UX**
- Inline chip + hover for UI Direction — small numbered badge [3 signals · HIGH] next to each change
- Chip shows both signal count and confidence level (HIGH/MED/LOW) — quick read without hovering
- Hover reveals signal previews (customer quotes, usage stats); click expands to full evidence
- Low-evidence UI suggestions included with visible "Low evidence" warning badge — transparent about certainty, PM decides whether to keep
- Data Model Hints use rationale comments only (no evidence chips) — schema changes are derived from the already-grounded UI direction

**Generation experience**
- Section-by-section streaming — each brief section streams in progressively (Problem Statement → Solution → User Stories → UI Direction → Data Model Hints → Success Metrics → Out of Scope)
- Token limit errors show partial brief + retry — completed sections displayed, failed section gets clear error banner with suggestions and retry button
- Per-section regenerate — each section gets a regenerate icon so users can re-roll just UI Direction without losing the rest
- v1 backward compatibility — existing v1 briefs render normally with a subtle "Not available — generated before v2" message where new sections would be; no upgrade prompt

### Claude's Discretion
- Loading skeleton design during section streaming
- Exact card styling (shadows, borders, spacing, typography)
- Hover popover positioning and animation
- Error banner copy and retry UX details
- How to detect "obvious" indexes for inclusion

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRIEF-01 | User can generate a brief with UI Direction section showing screen-by-screen component changes grounded in customer evidence | Prompt expansion + new BriefContent type + UIDirectionSection component + evidence chip pattern |
| BRIEF-02 | User can generate a brief with Data Model Hints section showing typed table/field suggestions with rationale | DataModelHint type + SQL DDL rendering + syntax highlighting (CSS-only approach) + prompt expansion |
| BRIEF-03 | User can view existing v1 briefs without errors after the v2 upgrade (backward compatibility) | Optional fields + nullish rendering guards in BriefDetail/BriefPanel |
| BRIEF-04 | Brief generation handles token limits gracefully — returns structured error instead of truncated JSON | Raised max_tokens + JSON parse detection + structured error shape + partial-brief recovery |
</phase_requirements>

---

## Summary

Phase 1 upgrades the existing brief generator from a 5-section v1 to a 7-section v2 by adding `ui_direction` and `data_model_hints` to the TypeScript type, the prompt, the API parse logic, and the two rendering surfaces (query page `BriefPanel` and briefs page `BriefDetail`). The codebase is pure Next.js 15 App Router — no tRPC, no separate packages layer — so all changes are co-located in `src/app/api/briefs/generate/route.ts` (backend) and `src/app/(dashboard)/` pages (frontend).

The biggest technical risk is the current `max_tokens: 1500` ceiling in `generate/route.ts`. The v1 prompt already fills most of this budget; adding two verbose sections will silently truncate the JSON and cause a parse error. This must be raised to ≥ 4000 before any other changes. The STATE.md note confirms this: "max_tokens must be raised to 4000 before touching the prompt — current 1500 budget causes silent JSON truncation."

Syntax highlighting for SQL DDL has no installed library (no Prism, Shiki, or similar is in `package.json`). The decision calls for syntax highlighting — the lightest path that matches the existing dark theme is manual CSS token coloring on a `<pre>/<code>` block using Tailwind utility classes per token type. This avoids a new dependency and aligns with the project's pattern of not adding packages for single-use UI concerns.

**Primary recommendation:** Fix `max_tokens` first, extend the `BriefContent` type with optional new fields, update the prompt to produce them, then build the two new display components, and add v1 backward compatibility guards last.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@anthropic-ai/sdk` | ^0.78.0 | LLM calls for brief generation | Used directly in `generate/route.ts` — violates CLAUDE.md's `packages/ai/client.ts` rule, but the monorepo structure doesn't exist yet; continue the direct pattern until it's scaffolded |
| `next` | 16.1.6 | App Router, Route Handlers, streaming | Route handlers use `NextRequest`/`NextResponse` pattern already established |
| `react` | 19.2.3 | UI components | All new components are client components using `useState` |
| `tailwindcss` | ^4 | Styling | All existing components use Tailwind utility classes; follow the same pattern |
| `lucide-react` | ^0.575.0 | Icons | Already used throughout; use `ChevronDown`, `RefreshCw`, `AlertCircle`, `Info` for new UI |
| `zod` | ^4.3.6 | Runtime schema validation | Available but not currently used in brief generation — can add for JSON parse safety |

### Supporting (no new packages needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `CSS` classes | — | SQL syntax token coloring | Span-wrap SQL keywords with Tailwind color classes for DDL highlighting |
| Native `useState` + `useRef` | — | Expand/collapse card state, hover popover | Keep component state local — no Zustand needed for UI-only state |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual CSS token coloring | `shiki` or `prism-react-renderer` | Shiki/Prism are correct for complex code but add a dependency; SQL DDL has ~8 token types and the dark theme is custom — manual coloring is 20 lines and zero config |
| Anthropic streaming (SSE) | Standard JSON response | The query route streams; the brief route does not — section-by-section streaming requires a new SSE endpoint for briefs, or stream from the existing one. The decision calls for "section-by-section streaming" which requires a new streaming endpoint pattern |
| `JSON.parse` + try/catch | Zod `safeParse` | Zod adds safety + structured errors; worthwhile here because the parse fail path is now user-visible (partial brief recovery) |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Structure for This Phase

```
src/app/api/briefs/
├── generate/
│   └── route.ts          ← extend BriefContent type + prompt + max_tokens fix
├── regenerate-section/
│   └── route.ts          ← NEW: per-section regeneration endpoint (POST)
├── save/
│   └── route.ts          ← no changes needed
└── route.ts              ← no changes needed

src/app/(dashboard)/
├── query/
│   └── page.tsx          ← extend BriefPanel with new sections + streaming state
└── briefs/
    └── page.tsx          ← extend BriefDetail with new sections + v1 guards

src/components/briefs/    ← NEW: extract shared brief rendering components
├── UIDirectionSection.tsx
├── DataModelSection.tsx
└── EvidenceChip.tsx
```

### Pattern 1: Extending `BriefContent` with Optional New Fields

The current type lives in `src/app/api/briefs/generate/route.ts` and is re-imported by both `query/page.tsx` and `briefs/page.tsx` via `import type { BriefContent }`. Extending it with optional fields gives backward compatibility automatically — v1 briefs stored in the database JSONB column simply lack the new keys.

```typescript
// src/app/api/briefs/generate/route.ts

export interface UIDirectionScreen {
  screen_name: string
  changes: Array<{
    text: string
    signal_count?: number
    confidence?: 'HIGH' | 'MED' | 'LOW'
    low_evidence?: boolean
  }>
  new_components: string[]
  interactions: string[]
}

export interface UIDirection {
  screens: UIDirectionScreen[]
}

export interface DataModelHint {
  feature_group: string   // e.g. "Onboarding tracking"
  ddl: string             // Raw SQL DDL string with inline -- comments as rationale
}

export interface BriefContent {
  problem_statement: string
  proposed_solution: string
  user_stories: Array<{
    role: string
    action: string
    outcome: string
  }>
  success_metrics: string[]
  out_of_scope: string[]
  // v2 additions — optional so v1 briefs don't crash
  ui_direction?: UIDirection
  data_model_hints?: DataModelHint[]
}
```

### Pattern 2: V1 Backward Compatibility Guard

Every new section in `BriefDetail` and `BriefPanel` wraps in a conditional render:

```tsx
{c.ui_direction ? (
  <UIDirectionSection direction={c.ui_direction} />
) : (
  <DetailSection label="UI Direction">
    <p className="text-xs text-white/25 italic">
      Not available — generated before v2
    </p>
  </DetailSection>
)}
```

This is the only change needed for BRIEF-03. The JSONB `content_json` column in Postgres stores whatever shape was written — no migration needed.

### Pattern 3: Token Limit Fix + Structured Error Recovery

The current route returns a 500 on any parse error. With v2 the response is larger and parse failures are more likely. The new pattern:

```typescript
// In generate/route.ts
const message = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',  // per CLAUDE.md — Haiku for brief generation
  max_tokens: 4000,                     // MUST raise from current 1500
  // ...
})

const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
const jsonStr = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

// Check for truncation: if stop_reason is 'max_tokens', JSON will be incomplete
if (message.stop_reason === 'max_tokens') {
  return NextResponse.json(
    {
      error: 'Brief generation hit the token limit. The brief was truncated.',
      error_code: 'TOKEN_LIMIT',
      partial_text: rawText,  // return what we have for client-side partial display
    },
    { status: 422 }
  )
}

let brief: BriefContent
try {
  brief = JSON.parse(jsonStr)
} catch {
  return NextResponse.json(
    { error: 'Failed to parse AI response. Please try again.', error_code: 'PARSE_ERROR' },
    { status: 500 }
  )
}
```

The client handles `error_code: 'TOKEN_LIMIT'` by showing the error banner with retry. For BRIEF-04, returning a structured error with `error_code` rather than a generic 500 is the key distinction.

### Pattern 4: Section-by-Section Streaming

The user decision calls for streaming where each section appears progressively. The current brief generation is a single `anthropic.messages.create()` (non-streaming) that returns the full JSON at once. There are two implementation approaches:

**Option A (simpler — recommended for this phase):** Generate the full brief in one shot (non-streaming), but on the client show a section-by-section loading reveal where each section animates in with a 100ms stagger after the API response arrives. This satisfies the "progressive appearance" feel without requiring a streaming endpoint or partial JSON parsing.

**Option B (true streaming):** Convert the brief endpoint to SSE streaming, emit structured `section_complete` events as Claude writes each JSON field. This requires partial JSON parsing (difficult with standard `JSON.parse`) or a two-phase prompt that asks Claude to stream section-by-section in a predictable format.

Option A is the correct choice for this phase: it matches the "streaming/progress indicator" CLAUDE.md requirement for loading states, avoids the complexity of partial JSON streaming, and can be upgraded to true streaming later. The reveal animation creates the progressive appearance the user described.

**Loading skeleton pattern** (Claude's discretion area): 7 skeleton rows, each with a `bg-white/[0.06] animate-pulse` block matching the section's expected height. The existing `SkeletonCard` component in `briefs/page.tsx` demonstrates the established pattern.

### Pattern 5: Per-Section Regenerate

Each section gets a small regenerate icon button. On click, it calls a new endpoint `/api/briefs/regenerate-section` with `{ briefId, section, queryResult }` and patches just that section in the local state.

```typescript
// New endpoint: /api/briefs/regenerate-section/route.ts
// POST body: { section: keyof BriefContent, queryResult: QueryResult, query: string }
// Returns: { section: string, data: unknown }
```

This keeps each section independently regeneratable without affecting the others. The local state in `query/page.tsx` holds the `BriefContent` object — patching a single key is a simple `setBrief(prev => ({ ...prev, [section]: newData }))`.

### Pattern 6: Evidence Chips

The evidence chip `[3 signals · HIGH]` is purely cosmetic metadata attached to each `UIDirectionScreen.changes[]` item. Claude generates the `signal_count` and `confidence` fields alongside the `text` field in the prompt. The chip renders as a `<span>` with tailwind classes matching the existing `ConfidenceBadge` pattern.

Low-evidence indicator: when `low_evidence: true`, show a warning variant: `text-amber-400 bg-amber-400/[0.08] border border-amber-400/20` with a warning icon instead of signal count.

Hover behavior: use `group` + `group-hover:` Tailwind pattern to show a popover on parent hover. Since there is no tooltip library installed, a simple `absolute` positioned `div` inside a `relative` wrapper achieves the hover preview. The expand-to-full-evidence action sets a local `expandedSignalId` state to show a modal or expanded panel.

### Anti-Patterns to Avoid

- **Do not add Prisma or a new ORM** — the schema is already in Supabase, and `content_json` is JSONB; no migration needed for v2 since the new fields are additive.
- **Do not change the `model` for brief generation** — CLAUDE.md specifies `claude-haiku-4-5-20251001` for brief generation (enrichment tagging, UI proposal generation). Keep this.
- **Do not call the Anthropic SDK from a new location outside `generate/route.ts`** — the monorepo structure does not yet exist, so the direct call in the existing route is the established pattern. The `regenerate-section` endpoint should import and call the same `anthropic` instance.
- **Do not use `any` in TypeScript** — use `unknown` and narrow with type guards or Zod.
- **Do not inline prompt strings in component files** — the prompt builder lives in `generate/route.ts`; the regenerate-section endpoint should import the same `buildBriefPrompt` function or a dedicated `buildSectionPrompt` function from that file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SQL syntax highlighting | Custom tokenizer/parser | CSS span-wrapping with Tailwind color classes | SQL DDL has ~8 relevant token types (CREATE, TABLE, ALTER, field names, types, comments); a 30-line manual tokenizer with regex splits is sufficient and avoids a dependency |
| Hover tooltip | Custom popover with position calculations | `relative`/`absolute` Tailwind pattern with `group-hover:` | The chip hover preview is simple text, no complex positioning needed; no library justified |
| JSON streaming parse | Custom streaming JSON parser | Two-phase prompt or client-side stagger animation | Partial JSON parsing is a known hard problem; avoid by using Option A (stagger reveal) |
| Token counting | Anthropic tokenizer API | `stop_reason === 'max_tokens'` check | The SDK's response includes `stop_reason`; no need to pre-count tokens |

**Key insight:** The complexity budget for this phase is in the prompt and type system, not in new infrastructure. Avoid adding packages.

---

## Common Pitfalls

### Pitfall 1: Silent JSON Truncation (CRITICAL — already documented in STATE.md)
**What goes wrong:** Claude generates a valid partial JSON that stops mid-string or mid-array because it hits `max_tokens: 1500`. `JSON.parse` throws, the route returns 500, the user sees "Failed to generate brief" with no useful recovery path.
**Why it happens:** The v1 prompt + response was already ~1200 tokens. Adding UI Direction (which needs screen descriptions, component names, interaction text, signal counts) and Data Model Hints (DDL strings can be 200-400 tokens each) easily pushes total output to 3000-4000 tokens.
**How to avoid:** Raise `max_tokens` to 4000 as the FIRST change in this phase. Check `message.stop_reason === 'max_tokens'` in the response and return `error_code: 'TOKEN_LIMIT'` before attempting `JSON.parse`.
**Warning signs:** Brief generates for simple queries but fails for complex ones; error messages are generic "Failed to generate brief".

### Pitfall 2: Type Import Coupling
**What goes wrong:** `BriefContent` is exported from `generate/route.ts` and imported in two pages and the regenerate endpoint. If the type changes in a backward-incompatible way, TypeScript will error in multiple files at once.
**Why it happens:** The type is the shared contract between API and UI — it's used across route handlers and pages.
**How to avoid:** Make `ui_direction` and `data_model_hints` optional fields (with `?`). Existing code that renders `c.user_stories` will keep working unchanged. New rendering code that accesses `c.ui_direction` will guard with `c.ui_direction ? ... : fallback`.

### Pitfall 3: Prompt JSON Structure Reliability
**What goes wrong:** Claude generates UI Direction with inconsistent structure — sometimes `changes` is an array of strings, sometimes an array of objects; sometimes it omits `confidence` or `signal_count` entirely.
**Why it happens:** The prompt must be very precise about the exact JSON shape for nested structures. The current brief prompt works because the fields are flat strings and simple arrays. The new sections have nested objects.
**How to avoid:**
1. Include a complete JSON example in the prompt (show don't tell)
2. Use Zod `safeParse` on the response to validate shape — if validation fails, fall back to a simplified version rather than crashing
3. Add explicit rules: "changes must be an array of objects with text, signal_count, confidence fields — never an array of strings"

### Pitfall 4: Evidence Chip Data Origin
**What goes wrong:** The evidence chips showing `[3 signals · HIGH]` require that Claude track how many source signals each UI change is grounded in. If Claude invents these numbers, the "trust is the product" principle is violated.
**Why it happens:** The brief generation prompt receives the `QueryResult` which contains `evidence[]` (3 items). Claude is asked to generate UI Direction and annotate each change with signal count and confidence — but it's reasoning from the same 3 evidence items, not a richer set.
**How to avoid:** In the prompt, instruct Claude to derive `signal_count` from how many of the provided evidence items support each UI change, not to invent additional signals. Cap at the evidence count (typically 3). Make clear in the prompt that `low_evidence: true` should be set when only 1 evidence item supports the change. This keeps the chips honest.

### Pitfall 5: `BriefPanel` State Explosion (query page)
**What goes wrong:** Adding per-section regeneration state (loading, error, done per section) to the already-stateful `query/page.tsx` leads to a large `useState` proliferation and hard-to-follow render logic.
**Why it happens:** The query page already manages `briefPhase`, `brief`, `briefError`, `saveState` plus the query states. Per-section regeneration adds a new `Record<keyof BriefContent, 'idle' | 'regenerating' | 'error'>` dimension.
**How to avoid:** Extract `BriefPanel` into its own component file in `src/components/briefs/` with its own local state for section regeneration. The parent page only needs to know the overall `brief` value and `saveState`. Section-level state lives inside `BriefPanel`.

### Pitfall 6: Hover Popover Z-index Conflicts
**What goes wrong:** The evidence chip hover popover is clipped by `overflow-y-auto` on the brief section container.
**Why it happens:** `overflow: auto` creates a new stacking context; absolutely positioned children cannot escape it.
**How to avoid:** The brief section container uses `overflow-y-auto` for scrolling. Either: (a) move the popover to a portal (React `createPortal`), or (b) use CSS `overflow: visible` on the inner container and `overflow-y: scroll` on the outer, or (c) keep hover previews short enough to render within the container without clipping. Option (c) is simplest — keep hover preview to 2-3 lines of quote text that fits within the card.

---

## Code Examples

### Prompt Extension for v2 Sections

```typescript
// In buildBriefPrompt — add after existing out_of_scope section in the JSON spec
// Source: CLAUDE.md UIDirection and DataModelHint types

`  "ui_direction": {
    "screens": [
      {
        "screen_name": "Name of the affected screen (e.g. 'Onboarding Step 1')",
        "changes": [
          {
            "text": "Description of the UI change",
            "signal_count": 2,
            "confidence": "HIGH",
            "low_evidence": false
          }
        ],
        "new_components": ["ComponentName1", "ComponentName2"],
        "interactions": ["Clicking X does Y", "Form validates on blur"]
      }
    ]
  },
  "data_model_hints": [
    {
      "feature_group": "Feature name grouping these changes (e.g. 'Onboarding tracking')",
      "ddl": "CREATE TABLE onboarding_steps (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  -- Tracks which step the user completed\\n  user_id UUID NOT NULL REFERENCES users(id),\\n  step_number INTEGER NOT NULL,\\n  completed_at TIMESTAMPTZ\\n);\\nCREATE INDEX ON onboarding_steps (user_id);"
    }
  ]`

// Rules to add to the prompt:
// - signal_count: count how many of the provided evidence items support this change (max 3)
// - confidence: HIGH if 3 evidence items, MED if 2, LOW if 1
// - low_evidence: true if signal_count is 1
// - DDL must include inline -- rationale comments
// - DDL must include CREATE INDEX for all foreign keys
// - Group related table changes under one feature_group
// - Escape newlines in DDL strings as \\n
```

### Checking `stop_reason` for Token Limit Detection

```typescript
// Source: Anthropic SDK response shape (confirmed via sdk @0.78.0)
const message = await anthropic.messages.create({ /* ... */ })

// message.stop_reason is typed as 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
if (message.stop_reason === 'max_tokens') {
  return NextResponse.json(
    { error: 'Token limit reached', error_code: 'TOKEN_LIMIT', partial_text: rawText },
    { status: 422 }
  )
}
```

### SQL DDL Syntax Highlighting (Manual CSS Token Coloring)

```tsx
// src/components/briefs/DataModelSection.tsx
// No library needed — regex split on SQL keywords

const SQL_KEYWORDS = /\b(CREATE|TABLE|INDEX|ALTER|ADD|COLUMN|NOT NULL|PRIMARY KEY|DEFAULT|REFERENCES|ON DELETE CASCADE|UNIQUE|CHECK)\b/gi
const SQL_TYPES = /\b(UUID|TEXT|JSONB|TIMESTAMPTZ|INTEGER|NUMERIC|BOOLEAN|DATE)\b/g
const SQL_COMMENTS = /(--[^\n]*)/g
const SQL_FUNCTIONS = /\b(gen_random_uuid|now|auth\.uid)\(\)/g

function highlightDDL(ddl: string): React.ReactNode {
  // Split on tokens, wrap each in colored span
  // Keywords: text-blue-400, Types: text-amber-300, Comments: text-white/35 italic, Functions: text-purple-400
  // Return array of spans
}
```

### UIDirectionCard Component Structure

```tsx
// src/components/briefs/UIDirectionSection.tsx
function UIDirectionCard({ screen }: { screen: UIDirectionScreen }) {
  const [expanded, setExpanded] = useState(false)
  const previewChanges = screen.changes.slice(0, 2)
  const remainingCount = screen.changes.length - 2

  return (
    <div className="bg-[#0a0a12] border border-white/[0.06] rounded-lg overflow-hidden">
      {/* Card header: screen name + change count + expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <span className="text-xs font-medium text-white/70">{screen.screen_name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/25">{screen.changes.length} changes</span>
          <ChevronDown size={12} className={`text-white/25 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Preview: first 2 changes always visible */}
      <div className="px-4 pb-3 space-y-1.5">
        {previewChanges.map((change, i) => (
          <ChangeRow key={i} change={change} />
        ))}
        {!expanded && remainingCount > 0 && (
          <button onClick={() => setExpanded(true)} className="text-[10px] text-white/25 hover:text-white/40">
            +{remainingCount} more
          </button>
        )}
      </div>

      {/* Expanded: remaining changes + new_components + interactions */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-4">
          {/* remaining changes */}
          {screen.changes.slice(2).map((change, i) => (
            <ChangeRow key={i} change={change} />
          ))}
          {/* new_components bucket */}
          {screen.new_components.length > 0 && (
            <Bucket label="New Components" items={screen.new_components} />
          )}
          {/* interactions bucket */}
          {screen.interactions.length > 0 && (
            <Bucket label="Interactions" items={screen.interactions} />
          )}
        </div>
      )}
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `max_tokens: 1500` | Must raise to 4000 | This phase | Enables full v2 JSON without truncation |
| 5-section `BriefContent` | 7-section with optional `ui_direction` + `data_model_hints` | This phase | New sections optional for v1 compatibility |
| Generic 500 on parse failure | Structured error with `error_code` + partial recovery | This phase | Satisfies BRIEF-04 — user gets actionable error |
| Brief rendered in page-local components | Extracted `UIDirectionSection`, `DataModelSection`, `EvidenceChip` in `src/components/briefs/` | This phase | Both `query/page.tsx` and `briefs/page.tsx` render the same brief — shared components prevent duplication |

**Deprecated/outdated:**
- `claude-haiku-4-5-20251001` at `max_tokens: 1500` for brief generation: insufficient budget for v2, must raise.

---

## Open Questions

1. **Section-by-section streaming: Option A (stagger reveal) vs Option B (true SSE streaming)**
   - What we know: Option A is simpler and has zero backend changes; Option B requires a new SSE endpoint and partial JSON handling. The CONTEXT.md says "section-by-section streaming" which implies progressive appearance.
   - What's unclear: Does the user expect actual streaming (text appearing word by word) or just sections appearing one-at-a-time after generation completes?
   - Recommendation: Implement Option A (stagger reveal after complete generation) as the v1 of this feature. It satisfies the requirement with minimal risk. Document that true streaming is a future enhancement.

2. **Per-section regenerate: where does the evidence come from?**
   - What we know: The `regenerate-section` endpoint needs to call Claude to regenerate one section. It needs the original `queryResult` (evidence + recommendation) and `query` to do this. But when regenerating from the `briefs/page.tsx` (saved briefs), the `queryResult` is not stored in the `briefs` table — only `content_json` is.
   - What's unclear: Should `regenerate-section` be available only in the query flow (where `queryResult` is in client state), or also on saved briefs?
   - Recommendation: Scope per-section regenerate to the query flow only in this phase. On the saved briefs page, omit the regenerate buttons. The `queries` table has `response_json` which contains the equivalent of `queryResult` — could be fetched by `query_id`, but that adds complexity. Defer to Phase 2 if needed.

3. **Evidence chip data quality: grounded vs inferred**
   - What we know: `signal_count` and `confidence` in the evidence chip are derived from Claude's reasoning about the 3 evidence items in `queryResult.evidence`. Claude cannot access more than those 3 items.
   - What's unclear: Will Claude reliably produce accurate signal counts (1-3) rather than hallucinated higher numbers?
   - Recommendation: Cap `signal_count` in the TypeScript type at a max of 3 (matching `evidence.length`). Add a validation step after parse: `if (change.signal_count > queryResult.evidence.length) change.signal_count = queryResult.evidence.length`. This prevents inflated counts.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/api/briefs/generate/route.ts` — current `BriefContent` type, `max_tokens: 1500`, model, prompt structure
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/(dashboard)/briefs/page.tsx` — rendering pattern, component structure, styling conventions
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/src/app/(dashboard)/query/page.tsx` — `BriefPanel`, brief generation flow, save flow
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/package.json` — confirmed no syntax highlighting library installed
- Direct code inspection of `/Users/arnavsinghal/pm-copilot/supabase/migrations/001_initial_schema.sql` — `briefs.content_json JSONB` is schemaless; v1 data will not be broken by v2 type additions
- `/Users/arnavsinghal/pm-copilot/.planning/STATE.md` — confirmed `max_tokens: 1500` is documented as a blocker: "max_tokens must be raised to 4000 before touching the prompt"
- `/Users/arnavsinghal/pm-copilot/CLAUDE.md` — model assignments: Haiku for brief generation (enrichment tagging, UI proposal generation); `claude-sonnet-4-6` for reasoning and query answering

### Secondary (MEDIUM confidence)
- Anthropic SDK `stop_reason` type: `'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'` — known from SDK type definitions in `@anthropic-ai/sdk` (present in node_modules)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed via `package.json` inspection; no new installs needed
- Architecture: HIGH — patterns derived from direct codebase inspection; all file paths verified
- Pitfalls: HIGH for token limit and type coupling (confirmed from code); MEDIUM for evidence chip data quality (depends on Claude behavior)

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable — Next.js App Router patterns and Anthropic SDK are stable at these versions)
