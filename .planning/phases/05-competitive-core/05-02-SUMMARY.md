---
phase: 05-competitive-core
plan: 02
subsystem: ui
tags: [competitive-intelligence, react, next-js, evidence-panel, filters, competitive-signals]

# Dependency graph
requires:
  - phase: 05-competitive-core
    plan: 01
    provides: "Competitor API routes, competitive_signals table, CompetitorRow/CompetitiveSignal types"
provides:
  - "/competitors page with full competitor management UI"
  - "CompetitiveSignalCard component for evidence panel display"
  - "Query page evidence panel extended with Competitive Signals tab and filters"
  - "AI-powered competitor discovery via Haiku"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [evidence-panel-tabs, competitive-signal-filters, polling-pattern-for-background-jobs]

key-files:
  created:
    - src/app/(dashboard)/competitors/page.tsx
    - src/components/competitors/AddCompetitorModal.tsx
    - src/components/competitors/CompetitorCard.tsx
    - src/components/competitors/CompetitiveSignalCard.tsx
    - src/components/competitors/CsvUploadButton.tsx
    - src/app/api/competitors/signals/route.ts
  modified:
    - src/components/dashboard/sidebar.tsx
    - src/app/(dashboard)/query/page.tsx

key-decisions:
  - "Created /api/competitors/signals endpoint for evidence panel rather than extending existing GET /api/competitors"
  - "Light-themed CompetitiveSignalCard to match existing EvidenceCard styling on query page"
  - "Competitive signals fetched after query result completes (non-blocking)"

patterns-established:
  - "Evidence panel tab pattern: tab state + conditional rendering for extensible evidence types"
  - "Filter dropdowns for competitive signals: derived unique values from signal data"

requirements-completed: [COMP-01, COMP-02, COMP-06]

# Metrics
duration: 8min
completed: 2026-03-06
---

# Phase 5 Plan 2: Competitive Frontend Summary

**Competitors management page with add/scrape/upload/rescan/delete, AI discovery, and query page evidence panel with competitive signals tab and filters**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-06T21:54:38Z
- **Completed:** 2026-03-06T22:03:00Z
- **Tasks:** 3 (1 auto + 1 checkpoint + 1 auto)
- **Files modified:** 9

## Accomplishments
- Full /competitors page with competitor grid, add modal (with AI discovery mode), scraping status polling, CSV upload, re-scan, and soft delete
- CompetitiveSignalCard component displaying quote, competitor name badge, source, color-coded signal type, and date
- Query page evidence panel extended with Customer/Competitive tab switcher (hidden when no competitive signals)
- Two filters on competitive tab: competitor name and signal type
- Sidebar updated with Competitors navigation entry

## Task Commits

Each task was committed atomically:

1. **Task 1: Competitors page + sidebar nav + AddCompetitorModal + CompetitorCard + CsvUploadButton** - `190946a` (feat)
2. **Task 2: Verify competitors page and evidence panel extension** - checkpoint, approved by user
3. **Task 3: Evidence panel competitive tab + CompetitiveSignalCard + filters on query page** - `cf92ef2` (feat)

Additional commit between checkpoint and Task 3:
- **AI competitor discovery with Haiku** - `20669ad` (feat)

## Files Created/Modified
- `src/app/(dashboard)/competitors/page.tsx` - Full competitors management page with add, list, actions
- `src/components/competitors/AddCompetitorModal.tsx` - Modal with manual and AI discover modes
- `src/components/competitors/CompetitorCard.tsx` - Card with scraping status polling, upload, rescan, delete
- `src/components/competitors/CompetitiveSignalCard.tsx` - Evidence card for competitive signals with color-coded type tags
- `src/components/competitors/CsvUploadButton.tsx` - CSV upload with processing state
- `src/app/api/competitors/signals/route.ts` - GET endpoint returning signals with competitor names for evidence panel
- `src/components/dashboard/sidebar.tsx` - Added Competitors nav entry with Swords icon
- `src/app/(dashboard)/query/page.tsx` - Extended evidence panel with Customer/Competitive tabs and filters

## Decisions Made
- Created dedicated `/api/competitors/signals` endpoint rather than adding `?include_signals=true` to existing route -- cleaner separation of concerns
- CompetitiveSignalCard uses light theme (bg-[#fafafa]) to match existing EvidenceCard styling on the query page
- Competitive signals are fetched non-blocking after query result completes -- failure doesn't affect query results

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Created /api/competitors/signals endpoint**
- **Found during:** Task 3 (Evidence panel extension)
- **Issue:** Plan suggested fetching signals via `?include_signals=true` on existing route, but that route wasn't designed for it
- **Fix:** Created dedicated GET `/api/competitors/signals` endpoint that joins signals with competitor names
- **Files modified:** `src/app/api/competitors/signals/route.ts`
- **Verification:** TypeScript compiles without errors
- **Committed in:** cf92ef2 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Clean API design. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `sources/page.tsx` and `sources/upload/route.ts` confirmed unrelated to changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Competitive intelligence module fully functional end-to-end (backend + frontend)
- Ready for phase 06+ (deck generator or other modules)

---
*Phase: 05-competitive-core*
*Completed: 2026-03-06*
