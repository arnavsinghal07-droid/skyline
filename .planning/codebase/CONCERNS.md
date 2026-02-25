# Codebase Concerns

**Analysis Date:** 2026-02-25

## Architecture Gap: Monorepo Structure Not Implemented

**Issue:** CLAUDE.md specifies a monorepo with `apps/`, `packages/`, and `tools/` directories, but the actual codebase is a single Next.js 15 application.

**Files:** Root directory structure; no `packages/ai/`, `packages/db/`, `tools/`, `workflows/` directories exist.

**Impact:**
- Cannot isolate business logic from API routes (violates "All LLM calls go through `packages/ai/client.ts`" rule)
- No shared type/schema library (`packages/shared/`)
- Anthropic SDK called directly from API routes instead of through centralized client
- Impossible to implement the planned repository pattern for database access

**Fix approach:** Either:
1. Implement full monorepo split (major refactor: 3-5 days)
2. Acknowledge single-app design and update CLAUDE.md to reflect actual architecture
3. Create logical separation within the Next.js app (minimal: create `src/services/`, `src/ai/`, `src/db/` directories with clear boundaries)

**Current state:** Actively blocking Brief v2 (UI Direction + Data Model Hints) and all subsequent phases.

---

## Missing Core Modules (Per CLAUDE.md Plan)

**Issue:** The following production modules are documented in CLAUDE.md but completely absent from the codebase.

**Modules Not Started:**
- `packages/ai/` — RAG pipeline, LLM wrappers, prompts, evals
- `packages/db/` — Prisma schema, Supabase client, repositories
- `packages/shared/` — Zod schemas, types, constants
- `tools/` — Python scripts for pipeline, connectors, competitive, usage, exports, evals
- `workflows/` — Markdown SOPs for ingestion, queries, briefs, UI proposals, etc.
- Qdrant vector database integration (mentioned in CLAUDE.md RAG pipeline)

**Files:** Nonexistent directories

**Impact:**
- The RAG pipeline (6 sequential steps: RECEIVE → TRANSCRIBE → CHUNK → ENRICH → EMBED → INDEX) is completely unimplemented
- No retrieval step before Claude calls (violates "Reranking always runs before final LLM call" rule)
- No prompt management; prompts are inline strings in API routes
- No deterministic tools for signal enrichment, embedding, or competitive intelligence
- Current implementation manually fetches 150 documents and passes them raw to Claude — not a proper RAG system

**Fix approach:**
1. Create `packages/ai/` with typed Anthropic client and prompt constants
2. Create `packages/db/` with Prisma setup (if moving to ORM) or lightweight repository pattern
3. Create `packages/shared/` with all Zod schemas
4. Decide on local vs. remote Qdrant deployment
5. Implement Python tools for pipeline steps incrementally

**Current state:** Completely blocks usage data ingestion, competitive intelligence, interview guide generation, and signal loop closer phases.

---

## LLM Integration Violations

**Issue:** Anthropic SDK called directly from API routes instead of centralized client.

**Files:**
- `src/app/api/query/route.ts` line 2, 87
- `src/app/api/briefs/generate/route.ts` line 2, 65

**Code:**
```typescript
// VIOLATION: Direct import and instantiation
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic()

// Instead of centralized client:
// const { chat } = await aiClient.completionWithStreaming(...)
```

**Impact:**
- Cannot implement model rotation or cost tracking
- Cannot implement prompt versioning for A/B testing
- API key management scattered
- Violates CLAUDE.md rule: "All LLM calls go through `packages/ai/client.ts`. Never call the Anthropic SDK directly from `apps/`."

**Fix approach:** Create `src/lib/ai/client.ts` with typed wrappers:
```typescript
export async function queryWithStreaming(opts: QueryOpts): Promise<...> {
  // All Anthropic SDK calls here
  // Central place for error handling, logging, cost tracking
}
```

---

## Hallucination Risk: No Citation Grounding

**Issue:** The brief generation prompt (line 78-81 in `src/app/api/query/route.ts`) explicitly tells Claude "If fewer than 3 relevant signals exist, use the most relevant ones and **repeat the best quote if needed**." This violates the core trust principle.

**Files:** `src/app/api/query/route.ts` lines 79-80

**Code:**
```typescript
// RISK: Allows fabricated evidence
"Include exactly 3 evidence items. If fewer than 3 relevant signals exist,
use the most relevant ones and repeat the best quote if needed."
```

**Impact:**
- Claude can repeat the same customer quote 3 times if only 1 customer provided feedback
- Users cannot tell if evidence is real or fabricated repetition
- Violates CLAUDE.md: "Never fabricate citations — if retrieval returns nothing, say so explicitly."

**Fix approach:**
1. Change prompt to only include evidence that actually exists
2. If < 3 signals: return what exists with lower confidence
3. Modify evidence display to show "Evidence from X unique customers" not "3 evidence items"
4. Update brief generation to not require exactly 3 pieces of evidence

---

## Brief v2 Sections Missing

**Issue:** CLAUDE.md specifies briefs must have 7 sections (Problem Statement, Proposed Solution, User Stories, UI Direction, Data Model Hints, Success Metrics, Out of Scope). Current implementation only has 5 sections.

**Files:** `src/app/api/briefs/generate/route.ts` lines 6-16

**Missing sections:**
- `ui_direction: UIDirection` — Screen-by-screen component changes
- `data_model_hints: DataModelHint[]` — Table/field suggestions with types

**Code:**
```typescript
export interface BriefContent {
  problem_statement: string
  proposed_solution: string
  user_stories: Array<...>
  success_metrics: string[]
  out_of_scope: string[]
  // Missing: ui_direction, data_model_hints
}
```

**Impact:**
- Cannot export to coding agents (blocked feature)
- Briefs don't provide data model guidance (blocks all backend implementation guidance)
- UI proposals not grounded in customer signals

**Fix approach:**
1. Update prompt in `src/app/api/briefs/generate/route.ts` to ask Claude for UI Direction
2. Add UI Direction rendering to `src/app/(dashboard)/query/page.tsx` BriefPanel
3. Implement Data Model Hints generation
4. Update database schema to store new fields in briefs.content_json

**Current state:** Marked "Not started" in CLAUDE.md — this is highest priority per build state table.

---

## Coding Agent Export Not Implemented

**Issue:** CLAUDE.md specifies a full coding agent export format (7 components: Context Block, Feature Description, Acceptance Criteria, UI Direction, Data Model Hints, Edge Cases, Suggested File Paths). No export mechanism exists.

**Files:** No export endpoints; `src/app/api/briefs/route.ts` doesn't implement export

**Impact:**
- Users cannot send briefs to Cursor or Claude Code
- Breaks the core YC loop: "export complete implementation packages to coding agents"
- Blocks Stripe billing integration and landing page

**Fix approach:**
1. Create `src/app/api/briefs/[id]/export/route.ts`
2. Implement formatters for Linear, Notion, Cursor, Claude Code targets
3. Add export buttons to briefs UI
4. Test with actual coding agents

---

## Database Schema Misalignment

**Issue:** Current schema in `supabase/migrations/001_initial_schema.sql` doesn't support complete brief structure and is missing fields mentioned in CLAUDE.md.

**Files:** `supabase/migrations/001_initial_schema.sql`

**Specific gaps:**
- `briefs.content_json` stores the entire BriefContent object but schema doesn't validate its shape
- No `ui_direction` or `data_model_hints` fields in schema (stores in JSON blob)
- `decisions.evidence_ids` is TEXT[] but should reference actual chunk IDs with proper relationships
- Missing `decisions.dissenting_signals` field (mentioned in CLAUDE.md Decision Log type)
- No `usage_signals` table (planned for quantitative signal ingestion)
- No `chunks` table never filled — documents stored in `documents.metadata` JSONB instead of vector chunks

**Impact:**
- Cannot properly query UI directions or data model hints
- RLS policies won't work on actual evidence relationships
- Usage data pipeline cannot be implemented

**Fix approach:**
1. Add migration to create structured `ui_directions` and `data_model_hints` tables
2. Add `dissenting_signals` field to decisions
3. Properly populate `chunks` table during ingestion
4. Create `usage_signals` table for Mixpanel/Amplitude events
5. Add foreign key from `decisions.evidence_ids` to `chunks.id`

---

## Error Handling Gaps

**Issue:** Error handling is minimal and inconsistent across routes. Silent failures and inadequate logging.

**Files:**
- `src/app/api/query/route.ts` line 156: Returns 400 if no documents found, but user gets opaque error
- `src/app/api/briefs/generate/route.ts` line 105: Generic "Failed to generate brief" masks actual error
- `src/app/api/sources/upload/route.ts` line 123: Batch errors not handled gracefully
- `src/app/(dashboard)/query/page.tsx` line 390: Silent failure on brief save

**Examples:**
```typescript
// Opaque error — user doesn't know why
if (docsError || !documents || documents.length === 0) {
  await send({
    type: 'error',
    message: 'No signals found. Upload some customer feedback first.',
  })
  return
}

// Generic catch swallows real error
catch (err) {
  console.error('[Sightline] Brief generation error:', err)
  return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
}

// Silent failure in client
catch {
  setSaveState('error')
}
```

**Impact:**
- Users cannot debug failures
- Developers cannot monitor production issues
- Trust erodes when errors don't explain what went wrong

**Fix approach:**
1. Create error types/enums (`InsufficientSignalsError`, `AIServiceError`, etc.)
2. Log errors with context: user ID, org ID, request payload (redacted)
3. Return actionable error messages to client: "No signals found. Upload at least 5 customer feedback items to begin."
4. Implement error tracking service (e.g., Sentry)

---

## Incomplete Onboarding Flow

**Issue:** Onboarding works but has gaps between specification and implementation.

**Files:** `src/app/onboard/page.tsx`, `src/app/api/onboard/route.ts`

**Gaps:**
- No validation that org name is unique
- No email verification before creating account
- No product context collection (CLAUDE.md mentions `workspaces.product_context` field)
- No error recovery if org creation fails mid-flow

**Impact:**
- Teams could accidentally create multiple orgs with same name
- Unverified emails could be used by attackers
- Product context not set up means briefs aren't grounded in product details

**Fix approach:**
1. Add unique constraint on `organizations(name, owner_id)` (need to add owner_id field)
2. Add email verification step
3. Collect product context (e.g., "B2B SaaS for Slack", "Mobile fitness app")
4. Store product_context in workspace.product_context
5. Use product context in Claude prompts for better recommendations

---

## Session Management Vulnerability

**Issue:** Middleware refreshes auth sessions, but error handling if session fails is weak.

**Files:** `src/middleware.ts` (not provided but referenced in MEMORY.md)

**Risk:** If session refresh fails, user is silently logged out without explanation.

**Fix approach:**
1. Gracefully handle session failures
2. Offer re-login option instead of silent failure

---

## Missing Confidence Score Definition

**Issue:** CLAUDE.md specifies confidence levels (HIGH, MEDIUM, LOW) but logic for assigning them is vague and currently hardcoded.

**Files:** `src/app/api/query/route.ts` line 81

**Code:**
```typescript
"confidence: HIGH = clear signal from 3+ customers |
MEDIUM = 1–2 customers or mixed signals |
LOW = no relevant signals or conflicting data."
```

**Problems:**
1. "3+ customers" assumes distinct customers, but current data model stores metadata in document, not normalized customer table
2. "Mixed signals" is vague — what percentage of conflicting signals triggers MEDIUM?
3. No actual logic to compute confidence; Claude is told to just pick one

**Impact:**
- Cannot track confidence accuracy over time
- Cannot weight evidence properly
- Cannot build confidence scoring model

**Fix approach:**
1. Implement actual confidence scoring algorithm in `src/lib/ai/scoring.ts`
2. Count unique customers in evidence
3. Analyze sentiment polarization
4. Track confidence prediction accuracy in decision log outcomes

---

## No Eval System

**Issue:** CLAUDE.md specifies "Eval before shipping any pipeline change — `python tools/evals/run_eval.py --suite full`" but no evaluation framework exists.

**Files:** No `tools/evals/` directory

**Impact:**
- Cannot measure RAG quality (retrieval relevance, ranking quality)
- Cannot validate that brief generation improvements don't hurt accuracy
- Cannot compare model versions (Haiku vs Sonnet)
- Can't know if system is getting better or worse

**Fix approach:**
1. Create evaluation dataset (annotate 50 queries with ground truth answers)
2. Implement eval harness: score retrieval, reranking, generation separately
3. Track metrics over time
4. Block deployments if metrics degrade

---

## No Integration with Supabase Realtime

**Issue:** CLAUDE.md vision includes "living, queryable knowledge base" but no real-time updates to UI when new signals arrive.

**Impact:**
- Users must refresh to see new data
- Collaboration between team members not visible in real-time
- Demo experience is weak

**Fix approach:** Implement Supabase Realtime subscriptions in dashboard pages for live updates.

---

## Scalability Concern: Fetching 150 Documents per Query

**Issue:** `src/app/api/query/route.ts` line 153 fetches all 150 latest documents for every query without filtering.

**Code:**
```typescript
const { data: documents } = await supabase
  .from('documents')
  .select('id, type, metadata')
  .eq('org_id', org_id)
  .limit(150)  // Always 150, no filtering
  .order('created_at', { ascending: false })
```

**Impact:**
- With 10k documents, paying for full table scan on every query
- Token usage unbounded; could hit rate limits
- Cost scales linearly with document count, not query quality
- Violates proper RAG: should retrieve relevant subset first (hybrid search), then rerank

**Fix approach:**
1. Implement Qdrant hybrid search (dense + sparse embedding)
2. Top-K retrieve (40-50 documents)
3. Rerank to top-12
4. Pass only top-12 to Claude

---

## Type Safety Issues

**Issue:** Inconsistent type definitions and use of generic types.

**Files:**
- `src/app/api/query/route.ts` line 28-32: Document type is loose (Record<string, string> for metadata)
- `src/app/(dashboard)/query/page.tsx` line 126-127: BriefPhase uses string union instead of enum
- `src/app/(dashboard)/briefs/page.tsx` line 18: Confidence type not imported from route file

**Impact:**
- Cannot enforce metadata schema across codebase
- Typos in state names (e.g., `'generat'` vs `'generating'`) won't be caught
- Type changes in one file require manual updates elsewhere

**Fix approach:**
1. Create `src/types/index.ts` with all shared types and enums
2. Import from single source of truth
3. Use `as const` for state literals

---

## Missing Documentation

**Issue:** No inline comments explaining non-obvious logic, especially in streaming handlers and error paths.

**Files:**
- `src/app/(dashboard)/query/page.tsx` lines 41-67: SSE parsing logic has no comments
- `src/app/api/query/route.ts` lines 34-82: Prompt construction is complex and undocumented

**Impact:**
- Future maintainers cannot understand intent
- Bug fixes are risky
- Onboarding new developers is slow

**Fix approach:** Add JSDoc comments to complex functions explaining intent and edge cases.

---

## Test Coverage Gaps

**Issue:** No tests exist for critical paths.

**Impact:**
- Cannot refactor safely
- Query logic bugs could go undetected
- Brief generation prompt changes are risky

**Files affected:**
- All API routes: no unit tests
- All components: no component tests
- No integration tests for query → brief → save flow

**Fix approach:**
1. Add Jest config and unit tests for API routes
2. Add React Testing Library tests for components
3. Add end-to-end tests for core flows

---

## Performance: No Caching

**Issue:** Every query re-fetches and re-analyzes the same signals.

**Impact:**
- Identical queries run Claude twice (once for analysis, once for brief generation)
- Network roundtrips accumulate
- Token spending is wasteful

**Fix approach:**
1. Cache Claude responses by query text hash
2. Cache retrieved documents by org_id + date range
3. Implement cache invalidation on new signal upload

---

## Missing Metrics & Monitoring

**Issue:** No observability into system behavior or user outcomes.

**Impact:**
- Cannot know if features are working
- Cannot debug production issues
- Cannot prove product value to users

**Metrics needed:**
- Query success rate and latency
- Brief generation success rate
- Decision logging adoption
- Time from query to decision

**Fix approach:** Integrate Posthog or similar for product analytics.

---

## Brief Saving Without Validation

**Issue:** `src/app/api/briefs/save/route.ts` inserts brief without validating that it matches BriefContent schema.

**Files:** `src/app/api/briefs/save/route.ts` line 50-59

**Risk:** Corrupted or incomplete briefs saved to database.

**Fix approach:**
1. Add Zod schema validation
2. Reject invalid briefs with clear error message

---

## Incomplete Sources Page

**Issue:** `src/app/(dashboard)/sources/page.tsx` exists but doesn't show uploaded signals or allow filtering/search.

**Impact:**
- Users cannot see what data is in the system
- Cannot verify signal quality before querying
- Cannot debug "no signals found" errors

**Fix approach:**
1. Show uploaded signals in list (with pagination)
2. Show signal counts by type
3. Add search/filter by customer name, date, source type
4. Show data quality metrics (missing fields, sentiment distribution)

---

## Environment Variables Not Validated at Startup

**Issue:** Missing NEXT_PUBLIC_SUPABASE_* variables will cause runtime errors, not startup errors.

**Files:** `src/lib/supabase/server.ts` line 8-9 uses `!` operator but doesn't validate

**Fix approach:**
```typescript
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
```

---

## Query Results Not Persisted Fully

**Issue:** Query results saved to database (good), but only the final JSON is stored. Supporting signals/chunks are not linked.

**Files:** `src/app/api/query/route.ts` line 226-234

**Impact:**
- Cannot trace query results back to source signals
- Cannot audit decision justification later
- Cannot measure if retrieved signals were relevant

**Fix approach:** Store `signal_chunk_ids` array in queries table, linking to chunks table.

---

## No Dissenting Signals in Brief Generation

**Issue:** CLAUDE.md specifies briefs should show "dissenting_signals" (evidence against the recommendation), but feature not implemented.

**Impact:**
- Users see only positive evidence
- Cannot make balanced decisions
- Biases recommendations toward data that supports conclusion

**Fix approach:**
1. Modify query prompt to ask Claude to identify conflicting signals
2. Store dissenting signals in brief
3. Display in UI with clear labeling

---

## Summary of Blockers

**High Priority (blocking entire next phase):**
1. Brief v2 UI Direction + Data Model Hints (4 days)
2. Monorepo/packages structure decision (3-5 days or replan)
3. Proper RAG pipeline with Qdrant (5-7 days)
4. Python tools infrastructure (3 days)

**Medium Priority (blocking specific features):**
1. Hallucination risk (evidence duplication)
2. Error handling improvements
3. Type safety across codebase

**Low Priority (nice to have soon):**
1. Caching
2. Monitoring/observability
3. Test coverage
4. Documentation

---

*Concerns audit: 2026-02-25*
