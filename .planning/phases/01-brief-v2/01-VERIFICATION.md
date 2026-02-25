---
phase: 01-brief-v2
verified: 2026-02-25T21:00:00Z
status: human_needed
score: 11/11 must-haves verified
re_verification: false
human_verification:
  - test: "Generate a new brief from query page and visually inspect UI Direction and Data Model Hints sections"
    expected: "UI Direction shows screen cards with expand/collapse, evidence chips [N signals · HIGH/MED/LOW], three-bucket layout (Changes, New Components, Interactions). Data Model Hints shows syntax-highlighted SQL DDL grouped by feature (blue keywords, amber types, purple functions, italic comments)."
    why_human: "Visual rendering of evidence chips, DDL syntax highlighting colors, and expand/collapse behavior cannot be verified programmatically"
  - test: "Hover an evidence chip on a UI Direction change row"
    expected: "A popover opens (upward, above the chip) showing up to 2 signal quote previews with customer name — truncated at 60 chars with ellipsis"
    why_human: "CSS hover state and popover positioning cannot be verified by static analysis"
  - test: "Click the refresh icon on any section (e.g., Problem Statement) in the query page brief panel"
    expected: "The RefreshCw icon spins, a call is made to /api/briefs/regenerate-section, and only that section updates in place — all other sections remain unchanged"
    why_human: "State patching behavior and partial UI update require live browser verification"
  - test: "Open an existing v1 brief on the briefs page (if any saved briefs exist from before this phase)"
    expected: "Brief renders without JS errors. UI Direction section shows 'Not available — generated before v2'. Data Model Hints section shows 'Not available — generated before v2'."
    why_human: "Backward compatibility with real stored v1 data (no ui_direction or data_model_hints keys) requires live data in the database"
  - test: "Observe the stagger reveal animation when a new brief generates"
    expected: "After brief generation completes, 7 sections appear sequentially with roughly 200ms delay between each, each section fading up into view (not snapping in)"
    why_human: "Animation timing and visual smoothness require human observation in the browser"
---

# Phase 1: Brief v2 Verification Report

**Phase Goal:** Users can generate briefs that include evidence-grounded UI Direction and Data Model Hints, completing the full brief structure required for the coding agent handoff
**Verified:** 2026-02-25T21:00:00Z
**Status:** human_needed — all automated checks pass, 5 items need human browser verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/briefs/generate returns BriefContent JSON with ui_direction and data_model_hints populated | VERIFIED | `route.ts` line 181 returns `{ brief }` after signal_count capping; prompt at lines 79-101 instructs Claude to fill both fields |
| 2 | POST /api/briefs/generate returns error_code TOKEN_LIMIT with status 422 when Claude hits max_tokens | VERIFIED | `route.ts` lines 157-165: `if (message.stop_reason === 'max_tokens') return NextResponse.json({ error_code: 'TOKEN_LIMIT' }, { status: 422 })` |
| 3 | POST /api/briefs/generate with max_tokens 4000 does not silently truncate v2 JSON | VERIFIED | `route.ts` line 145: `max_tokens: 4000`; stop_reason check at line 157 is placed BEFORE JSON.parse at line 168 |
| 4 | POST /api/briefs/regenerate-section returns a regenerated section when given section name, query, and queryResult | VERIFIED | `regenerate-section/route.ts` lines 103-159: validates section in VALID_SECTIONS, calls Claude with buildSectionPrompt, returns `{ section, data: parsed.value }` |
| 5 | Existing v1 callers importing BriefContent still compile — new fields are optional | VERIFIED | `generate/route.ts` lines 36-39: `ui_direction?: UIDirection` and `data_model_hints?: DataModelHint[]` — both optional. TypeScript compilation passes with zero errors in phase files |
| 6 | User generates a brief and sees UI Direction section with screen cards, evidence chips, and three-bucket layout | VERIFIED (code) | `UIDirectionSection.tsx` implements expand/collapse UIDirectionCard with Changes+EvidenceChip, New Components pills, Interactions bullets; wired in `query/page.tsx` lines 385-403 |
| 7 | User generates a brief and sees evidence chips [N signals · HIGH/MED/LOW] with hover popover | VERIFIED (code) | `EvidenceChip.tsx` renders chip with signalCount, CONFIDENCE_COLORS, popover on group-hover showing up to 2 evidence quotes |
| 8 | User generates a brief and sees Data Model Hints with syntax-highlighted SQL DDL | VERIFIED (code) | `DataModelSection.tsx` implements highlightDDL with 8 token types (keyword/type/function/comment); wired in `query/page.tsx` lines 405-421 |
| 9 | User opens a v1 brief and sees it render without errors, with 'Not available' message for new sections | VERIFIED (code) | `briefs/page.tsx` lines 197-216: both sections guarded with `c.ui_direction ?` and `c.data_model_hints && c.data_model_hints.length > 0 ?` checks with "Not available — generated before v2" fallback |
| 10 | User sees loading skeleton while brief generation is in progress, then sections appear with stagger reveal | VERIFIED (code) | `query/page.tsx` lines 259-268: 7 animate-pulse skeleton rows; lines 181-192: setInterval at 200ms increments `visibleSections`; `globals.css` defines `@keyframes fadeInUp` and `.animate-fade-in-up` |
| 11 | User clicks regenerate icon and that section regenerates without affecting the rest of the brief | VERIFIED (code) | `query/page.tsx` lines 194-217: `handleRegenerate` fetches `/api/briefs/regenerate-section`, extracts `{ data }` from response, calls `onBriefUpdate(prev => ({ ...prev, [section]: data }))` — only patches that field |

**Score:** 11/11 truths verified (code-level). 5 truths require human browser verification for UX quality.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/briefs/generate/route.ts` | BriefContent v2 type, expanded prompt, token limit handling | VERIFIED | 187 lines; exports `UIDirectionScreen`, `UIDirection`, `DataModelHint`, `BriefContent`, `POST`; max_tokens 4000; stop_reason check before JSON.parse; signal_count capping |
| `src/app/api/briefs/regenerate-section/route.ts` | Per-section brief regeneration endpoint | VERIFIED | 160 lines; exports `POST`; VALID_SECTIONS array covers all 7 fields; `buildSectionPrompt` with section-specific JSON shapes; TOKEN_LIMIT 422 error |
| `src/components/briefs/UIDirectionSection.tsx` | UIDirectionCard with expand/collapse, three-bucket layout | VERIFIED | 147 lines; `'use client'`; imports UIDirection/UIDirectionScreen types; UIDirectionCard sub-component with useState expand; preview/expanded areas; three buckets |
| `src/components/briefs/DataModelSection.tsx` | DataModelSection with SQL DDL syntax highlighting | VERIFIED | 173 lines; `'use client'`; imports DataModelHint type; highlightDDL function with 8 token types; `\\n` unescaping before highlighting |
| `src/components/briefs/EvidenceChip.tsx` | Evidence chip badge with hover popover | VERIFIED | 83 lines; `'use client'`; CONFIDENCE_COLORS map; low-evidence variant with AlertCircle; popover opens upward (bottom-full) |
| `src/app/(dashboard)/query/page.tsx` | BriefPanel with v2 sections, stagger reveal, per-section regenerate | VERIFIED | Imports UIDirectionSection, DataModelSection; 7-section render with `visibleSections` gate; SectionWithRegen wrapper; handleRegenerate calls /api/briefs/regenerate-section; TOKEN_LIMIT error message |
| `src/app/(dashboard)/briefs/page.tsx` | BriefDetail with v2 sections and v1 backward compatibility guards | VERIFIED | Imports UIDirectionSection, DataModelSection; renders both v2 sections with explicit v1 guards; "Not available — generated before v2" message in both fallback paths |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `UIDirectionSection.tsx` | `src/app/api/briefs/generate/route.ts` | `import type { UIDirection, UIDirectionScreen }` | VERIFIED | Line 5: `import type { UIDirection, UIDirectionScreen } from '@/app/api/briefs/generate/route'` |
| `DataModelSection.tsx` | `src/app/api/briefs/generate/route.ts` | `import type { DataModelHint }` | VERIFIED | Line 4: `import type { DataModelHint } from '@/app/api/briefs/generate/route'` |
| `query/page.tsx` | `src/app/api/briefs/regenerate-section/route.ts` | `fetch('/api/briefs/regenerate-section')` | VERIFIED | Line 198: `fetch('/api/briefs/regenerate-section', { method: 'POST', ... })` |
| `briefs/page.tsx` | `UIDirectionSection.tsx` | renders UIDirectionSection when ui_direction present | VERIFIED | Line 199: `<UIDirectionSection direction={c.ui_direction} />` inside conditional |
| `briefs/page.tsx` | `DataModelSection.tsx` | renders DataModelSection when data_model_hints present | VERIFIED | Line 210: `<DataModelSection hints={c.data_model_hints} />` inside conditional |
| `query/page.tsx` | `UIDirectionSection.tsx` | renders UIDirectionSection in BriefPanel section 6 | VERIFIED | Lines 393-401: `<UIDirectionSection direction={brief.ui_direction} evidence={queryResult?.evidence} />` |
| `query/page.tsx` | `DataModelSection.tsx` | renders DataModelSection in BriefPanel section 7 | VERIFIED | Lines 413-419: `<DataModelSection hints={brief.data_model_hints} />` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BRIEF-01 | Plans 01 and 02 | User can generate a brief with UI Direction section showing screen-by-screen component changes grounded in customer evidence | SATISFIED | Prompt in `generate/route.ts` includes UI Direction JSON schema with evidence-grounding rules; `UIDirectionSection.tsx` renders screen cards with EvidenceChip per change; signal_count capped at evidence.length to prevent hallucination |
| BRIEF-02 | Plans 01 and 02 | User can generate a brief with Data Model Hints section showing typed table/field suggestions with rationale | SATISFIED | Prompt includes DDL format with inline comment rationale; `DataModelSection.tsx` renders syntax-highlighted DDL; `DataModelHint` type exported |
| BRIEF-03 | Plan 02 | User can view existing v1 briefs without errors after the v2 upgrade | SATISFIED (code) | `briefs/page.tsx` lines 197-216 guard both v2 sections with null checks; "Not available — generated before v2" shown for missing fields; `BriefContent` uses optional fields so v1 JSON parses without error. Requires human verification with real stored v1 data |
| BRIEF-04 | Plan 01 | Brief generation handles token limits gracefully — returns structured error instead of truncated JSON | SATISFIED | `generate/route.ts` lines 157-165: stop_reason check before JSON.parse returns `{ error_code: 'TOKEN_LIMIT', partial_text }` with 422 status; `query/page.tsx` lines 537-539 handle the error_code with specific user message |

**Note on BRIEF-03:** `REQUIREMENTS.md` still shows BRIEF-03 as `[ ]` unchecked. The implementation satisfies the requirement — this is a tracking document inconsistency, not a code gap. The requirement text says "without errors after the v2 upgrade" which is implemented via optional fields on BriefContent and explicit null guards in both pages. Human browser verification with actual v1 stored briefs will confirm this definitively.

---

## Anti-Patterns Found

No blockers or warnings found in phase files.

| File | Pattern Checked | Result |
|------|----------------|--------|
| `generate/route.ts` | TODO/FIXME, return null, empty handlers | Clean |
| `regenerate-section/route.ts` | TODO/FIXME, return null, any types | Clean |
| `UIDirectionSection.tsx` | placeholder returns, any types, missing client directive | Clean — `'use client'` present, types specific |
| `DataModelSection.tsx` | placeholder returns, any types, missing client directive | Clean — `'use client'` present, no `any` |
| `EvidenceChip.tsx` | placeholder returns, any types, missing client directive | Clean — `'use client'` present, fully typed |
| `query/page.tsx` | empty handlers, fetch without response handling | Clean — handleRegenerate handles success and silently fails on error (by design per PLAN) |
| `briefs/page.tsx` | conditional rendering, any types | Clean |

**Pre-existing TypeScript errors (not from this phase):**
- `src/app/(dashboard)/sources/page.tsx:301` — type comparison error (pre-existing, documented in both SUMMARYs)
- `src/app/api/sources/upload/route.ts:121` — argument count error (pre-existing, documented in both SUMMARYs)

These are out of scope and do not affect phase 01 functionality.

---

## Data Flow Detail: Regenerate Section

The regenerate-section round-trip is wired correctly but worth documenting precisely:

1. `regenerate-section/route.ts` line 154-155:
   ```typescript
   const parsed: { value: unknown } = JSON.parse(jsonStr)
   return NextResponse.json({ section, data: parsed.value })
   ```
   The endpoint unwraps the `{ "value": ... }` envelope from Claude's response, returning `data` as the direct section value.

2. `query/page.tsx` lines 209-211:
   ```typescript
   const { data } = await res.json()
   onBriefUpdate(prev => prev ? { ...prev, [section]: data } : prev)
   ```
   The page extracts `data` (which is already the unwrapped section value) and patches it directly into BriefContent. This is correct — no double-unwrapping.

---

## Human Verification Required

### 1. Brief generation visual inspection

**Test:** Navigate to `/query`, run a query, click "Generate Feature Brief", wait for generation to complete.
**Expected:** All 7 sections appear. UI Direction shows one or more screen cards. Each change row has an evidence chip `[N signals · HIGH/MED/LOW]` with confidence color (green/amber/red). Data Model Hints shows DDL in a code block with syntax coloring (blue SQL keywords, amber types, purple functions like `gen_random_uuid()`, grey italic inline comments).
**Why human:** Visual rendering of CSS colors and component layout requires browser verification.

### 2. Evidence chip hover popover

**Test:** Hover over an evidence chip on a UI Direction change row.
**Expected:** A popover appears above the chip (not below) showing up to 2 signal quote previews formatted as `"quote text..." — customer_name` in small italic text.
**Why human:** CSS `group-hover:block` behavior and popover positioning (bottom-full) require browser verification.

### 3. Per-section regeneration

**Test:** After generating a brief, click the refresh icon (RefreshCw, 11px) on the Problem Statement section.
**Expected:** The icon spins, the section shows a momentary loading state, then the Problem Statement text changes to a new version while all other sections remain unchanged.
**Why human:** State patching behavior and that exactly one field updates in the React state requires browser interaction.

### 4. v1 backward compatibility with real data

**Test:** Navigate to `/briefs` if there are any briefs saved before this phase (v1 briefs without ui_direction or data_model_hints).
**Expected:** The brief renders without JavaScript errors. Both "UI Direction" and "Data Model Hints" sections display with the message "Not available — generated before v2" in italic grey text. No broken layout or missing sections.
**Why human:** Requires actual v1 data in the database. TypeScript optional fields guarantee no parse error, but runtime rendering with real stored JSON needs verification.

### 5. Stagger reveal animation smoothness

**Test:** Observe a brief being generated and loading.
**Expected:** During generation, 7 skeleton pulse rows are visible. When generation completes, sections appear one by one with roughly 200ms between each, each fading and sliding up into view (not snapping in abruptly).
**Why human:** Animation timing and visual smoothness require human perception — code shows `200ms` setInterval and `0.35s ease-out fadeInUp` CSS but visual quality cannot be confirmed statically.

---

## Gaps Summary

No code gaps found. All must-have artifacts exist, are substantive (not stubs), and are fully wired. TypeScript compiles clean across all phase files.

The 5 human verification items above are quality checks on UX behavior (visual rendering, animation, hover states) that require live browser testing. They are not code gaps — the implementation is complete.

**BRIEF-03 tracking note:** `REQUIREMENTS.md` still marks BRIEF-03 as `[ ]`. The implementation is complete; the requirements document needs updating. This is not a code gap — it is a documentation tracking inconsistency.

---

_Verified: 2026-02-25T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
