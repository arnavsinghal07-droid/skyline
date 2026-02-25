# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `Sidebar.tsx`, `BriefCard.tsx`)
- Route handlers: lowercase `route.ts` in route directories (e.g., `src/app/api/query/route.ts`)
- Utility files: lowercase with hyphens when needed (e.g., `server.ts`, `client.ts`)
- Page components: lowercase filename in directory (e.g., `src/app/(dashboard)/query/page.tsx`)

**Functions:**
- camelCase for all functions and methods
- Descriptive names reflecting action: `buildPrompt()`, `readStream()`, `handleSubmit()`, `getConfidence()`
- Event handlers prefixed with `handle`: `handleSubmit()`, `handleLogDecision()`, `handleGenerateBrief()`
- Helper functions prefixed with verb: `formatDate()`, `getConfidence()`, `isActive()`
- Type guards and predicates: `getConfidence()`, `isActive()`

**Variables:**
- camelCase for local variables, state, and constants: `query`, `phase`, `briefPhase`, `saveState`, `selectedId`
- State variables follow pattern: `[state, setState]` from `useState()` hooks
- Type narrowing variables: `user`, `profile`, `workspace`, `document`, `brief`
- Descriptive names over abbreviations: `activeQuery` not `aq`, `selectedBrief` not `sb`

**Types:**
- Suffixed `Schema` for validation schemas: `generateBriefSchema`
- Suffixed with type category for discriminated unions: `Phase = 'idle' | 'querying' | 'done' | 'error'`
- State machine types named explicitly: `BriefPhase`, `SaveState`, `DecisionState`
- Interface prefixes: `interface QueryResult`, `interface BriefContent`
- Record types with full capitalization: `Record<string, SomeType>`

**Constants:**
- SCREAMING_SNAKE_CASE for truly global constants (e.g., `BATCH = 500`, `CONFIDENCE_MAP`)
- EXAMPLE_QUERIES, CONFIDENCE_STYLES: exported constants at module top
- Nested objects in constants use camelCase: `CONFIDENCE_STYLES: Record<Confidence, { badge: string; dot: string; label: string }>`

## Code Style

**Formatting:**
- 2-space indentation (per ESLint config)
- Line length: ~80-100 characters (observed in prompt construction sections)
- Trailing semicolons required (TypeScript strict)
- No HTML `<form>` elements — controlled React components with `onClick`/`onChange` handlers

**Linting:**
- ESLint with Next.js core web vitals and TypeScript presets
- Config: `eslint.config.mjs` (flat config format)
- Run: `npm run lint`
- No custom overrides observed — uses ESLint defaults + Next.js recommendations

**String Quotes:**
- Single quotes for JavaScript strings: `'use client'`, `'Unauthorized'`
- Double quotes for JSX attribute values: `className="..."`
- Template literals for interpolation: `` `data: ${JSON.stringify(event)}\n\n` ``

## Import Organization

**Order:**
1. React and Next.js imports: `import { useState } from 'react'`, `import { useRouter } from 'next/navigation'`
2. Third-party packages: `import { Anthropic } from '@anthropic-ai/sdk'`, `import { createClient } from '@supabase/supabase-js'`
3. Local absolute imports: `import { createClient } from '@/lib/supabase/server'`
4. Type imports: `import type { QueryResult } from '@/app/api/query/route'`
5. Lucide icons grouped: `import { ArrowRight, Loader2, AlertCircle } from 'lucide-react'`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for imports from `src/` directory
- Examples: `@/lib/supabase/server`, `@/app/api/query/route`, `@/components/dashboard/sidebar`

## Error Handling

**Patterns:**
- Try-catch for JSON parsing and external API calls
- Conditional null checks immediately after async operations: `if (!user || authError)`, `if (!profile)`
- Error messages returned as JSON: `return NextResponse.json({ error: '...' }, { status: 400 })`
- Anthropic SDK errors caught specifically: `if (apiErr instanceof Anthropic.APIError)`
- Supabase errors checked via destructuring: `const { error } = await supabase.from(...)`
- Graceful fallbacks: `?? null`, `?? []`, `?? 'unknown'`

**Error Logging:**
- Errors logged to console with `[Sightline]` prefix for identification
- Format: `console.error('[Sightline] Context:', { details })`
- Example: `console.error('[Sightline] Anthropic APIError', { status, message, error, headers })`
- Low-level errors on status failures not always logged to reduce noise

**Status Codes:**
- `400`: Invalid request body or missing required fields
- `401`: Unauthorized (no user or auth error)
- `404`: Resource not found (profile, workspace, document)
- `500`: Internal server error (database failures, API failures)

## Logging

**Framework:** `console` object (no external logging library)

**Patterns:**
- Prefixed logs: `console.log('[Sightline] ...')`
- Used sparingly in production code — mainly for debug info during streaming
- Example: `console.log('[Sightline] calling Anthropic — model: claude-haiku-4-5-20251001, tokens: 1200')`
- Errors logged with context objects: `console.error('[Sightline] Brief generation error:', err)`

## Comments

**When to Comment:**
- Comments used to delineate logical sections in long files
- Section comments: `// ---------------------------------------------------------------------------`
- Mid-section comments: `// ── Context label ────────────────────────────────────────────────────────`
- Comments explain WHY, not WHAT
- Example: `// body can only be read once` explains the reason for reading before stream

**JSDoc/TSDoc:**
- Not used (TSDoc/JSDoc comments not observed in codebase)
- Type information conveyed via TypeScript types, not comments
- Function intent is explicit from naming convention

## Function Design

**Size:**
- Functions average 20–40 lines (typical routes)
- Long functions (60–120+ lines) are page components with inline sub-components
- Each function has a single responsibility

**Parameters:**
- Route handlers: `request: NextRequest` and no other parameters
- Event handlers: `(e: React.ChangeEvent<HTMLInputElement>)` or `() => void`
- Component props: Single object parameter with destructuring: `({ confidence }: { confidence: QueryResult['confidence'] })`
- Helper functions: Explicit typed parameters

**Return Values:**
- Route handlers return `NextResponse` or `Response` with appropriate status codes
- Event handlers return `void`
- Async functions return `Promise<T>`
- Null coalescing used for safe defaults: `user.id ?? null`

## Module Design

**Exports:**
- Default exports for page components: `export default function QueryPage()`
- Named exports for utilities and components: `export interface QueryResult`, `export function buildPrompt()`
- Type exports: `export type SSEEvent = ...`
- Avoid exporting mutables; prefer explicit factory patterns

**Barrel Files:**
- Not used in this codebase
- Each file has a single primary export
- Components and utilities imported directly by path

**File Organization:**
- Co-located types at top of file after imports
- Constants section marked with comment block: `// ---------------------------------------------------------------------------`
- Helper functions before main component/handler
- Sub-components defined before page component
- Main export at the very end of file

**Example structure (from `src/app/(dashboard)/query/page.tsx`):**
```
1. 'use client' directive
2. Imports (React, Next.js, third-party, local)
3. Type definitions
4. Constants (EXAMPLE_QUERIES, CONFIDENCE_STYLES)
5. Helper functions (readStream)
6. Sub-components (ConfidenceBadge, EvidenceCard, BriefPanel)
7. Main page component
```

## State Management

**Frontend:**
- `useState()` for component-level state
- State variables: `[value, setValue]` naming convention
- Multiple related states grouped: `const [phase, setPhase] = useState<Phase>('idle')`
- Type-safe state with discriminated unions: `type Phase = 'idle' | 'querying' | 'done' | 'error'`

**Server State:**
- `fetch()` calls directly in event handlers (no query library)
- Response parsing immediately after fetch: `const data = await res.json()`
- Error handling via `.ok` check: `if (!res.ok) throw new Error(...)`

## Controlled Components

**Input Elements:**
- No `<form>` tags
- Controlled inputs with `value`, `onChange`, `onKeyDown` handlers
- Buttons with `onClick` handlers
- Example: `<input value={input} onChange={e => setInput(e.target.value)} />`

## Conditional Rendering

**Patterns:**
- Ternary operators for simple conditions: `{phase === 'idle' ? <div>...</div> : null}`
- Logical AND for single condition: `{result && <div>...</div>}`
- Multi-condition with nested ternaries (avoid long chains):
```typescript
{phase === 'done' && brief && (
  <div>...</div>
)}
```
- `.map()` for list rendering with keys: `{items.map((item, i) => <div key={i}>{item}</div>)}`

## CSS and Styling

**Framework:** Tailwind CSS with atomic class strings
- Utility-first approach: `className="flex items-center gap-2 px-3 py-2"`
- Conditional classes via ternary or `.join()`:
```typescript
className={[
  'base-classes',
  isActive ? 'active-classes' : 'inactive-classes',
].join(' ')}
```
- Dark mode colors with opacity: `bg-white/[0.04]`, `border-white/[0.06]`, `text-white/35`
- Transition utilities: `transition-all`, `duration-100`
- Animation utilities: `animate-spin`, `animate-pulse`

---

*Convention analysis: 2026-02-25*
