---
phase: 05-competitive-core
plan: 01
subsystem: api
tags: [competitive-intelligence, scraping, puppeteer, haiku, csv, supabase, next-api]

# Dependency graph
requires:
  - phase: 01-brief-v2
    provides: "Existing auth pattern, Supabase client, org/workspace schema"
provides:
  - "competitors table with CRUD + soft delete + plan-based limits"
  - "competitive_signals table for structured signal storage"
  - "scraping_jobs table for background job tracking"
  - "Haiku-based signal extraction shared by scrape and CSV paths"
  - "Puppeteer stealth scraping for G2/Capterra"
  - "CSV upload parsing for G2/Capterra review exports"
  - "Chunk re-scanning for competitor mention tagging"
  - "6 API route files covering full competitive backend"
affects: [05-02-competitive-frontend]

# Tech tracking
tech-stack:
  added: [puppeteer-extra, puppeteer-extra-plugin-stealth, papaparse]
  patterns: [postgres-backed-job-queue, fire-and-forget-via-after, shared-extraction-pipeline]

key-files:
  created:
    - supabase/migrations/004_competitive.sql
    - src/lib/competitive/types.ts
    - src/lib/competitive/extract-signals.ts
    - src/lib/competitive/scrape-reviews.ts
    - src/lib/competitive/parse-csv.ts
    - src/lib/competitive/scan-mentions.ts
    - src/app/api/competitors/route.ts
    - src/app/api/competitors/[id]/route.ts
    - src/app/api/competitors/[id]/scrape/route.ts
    - src/app/api/competitors/[id]/rescan/route.ts
    - src/app/api/competitors/upload/route.ts
    - src/app/api/competitors/[id]/job-status/route.ts
  modified: []

key-decisions:
  - "Used stable after() from Next.js 16 instead of unstable_after — API is stabilized in this version"
  - "Postgres-backed job queue via scraping_jobs table — no Redis/BullMQ infrastructure needed"
  - "Single extractCompetitiveSignals() function shared by scrape and CSV paths for identical extraction"

patterns-established:
  - "Postgres job queue: insert row with status, process via after(), poll for status"
  - "Plan-based limit enforcement: count existing rows, compare against COMPETITOR_LIMITS map, return 402"
  - "Soft delete pattern: deleted_at column, filter with .is('deleted_at', null)"

requirements-completed: [COMP-01, COMP-02, COMP-03, COMP-06]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 5 Plan 1: Competitive Backend Summary

**Complete competitive backend with Postgres schema, Haiku signal extraction, Puppeteer stealth scraping, CSV upload, and 6 API routes with plan-based limits**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T20:38:11Z
- **Completed:** 2026-03-06T20:42:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Database schema with 3 tables (competitors, scraping_jobs, competitive_signals), 2 enums, indexes, and RLS policies
- Shared Haiku extraction pipeline producing identical structured signals from both scraping and CSV paths
- Background scraping via after() with auto-retry (up to 3 attempts) and job status polling
- Plan-based competitor limits enforced server-side (Free: 3, Starter: 10, Pro: unlimited)

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration + shared types + extraction and scraping modules** - `ba8eee1` (feat)
2. **Task 2: Competitor API routes -- CRUD, scrape, CSV upload, rescan, job status** - `55dc04e` (feat)

## Files Created/Modified
- `supabase/migrations/004_competitive.sql` - 3 tables, 2 enums, indexes, RLS policies
- `src/lib/competitive/types.ts` - CompetitorRow, CompetitiveSignal, ScrapingJob, ExtractedSignal, COMPETITOR_LIMITS
- `src/lib/competitive/extract-signals.ts` - Haiku extraction shared by scrape and CSV
- `src/lib/competitive/scrape-reviews.ts` - Puppeteer stealth scraping for G2/Capterra
- `src/lib/competitive/parse-csv.ts` - PapaParse CSV parsing with G2/Capterra detection
- `src/lib/competitive/scan-mentions.ts` - Paginated chunk scanning for competitor mentions
- `src/app/api/competitors/route.ts` - GET list + POST add with plan limits
- `src/app/api/competitors/[id]/route.ts` - PATCH update + DELETE soft-delete
- `src/app/api/competitors/[id]/scrape/route.ts` - POST trigger background scraping
- `src/app/api/competitors/[id]/rescan/route.ts` - POST re-scan chunks for mentions
- `src/app/api/competitors/upload/route.ts` - POST CSV upload + extraction
- `src/app/api/competitors/[id]/job-status/route.ts` - GET latest job status

## Decisions Made
- Used stable `after()` from Next.js 16 instead of `unstable_after` -- the API has been stabilized
- Postgres-backed job queue via scraping_jobs table -- no Redis/BullMQ infrastructure needed, consistent with existing stack
- Single `extractCompetitiveSignals()` function shared by both scrape and CSV paths for identical extraction quality

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All API endpoints ready for frontend consumption in Plan 05-02
- Scraping background jobs tracked via scraping_jobs table for status polling
- CSV upload provides reliable fallback when scraping is blocked by Cloudflare

## Self-Check: PASSED

All 12 created files verified on disk. Both task commits (ba8eee1, 55dc04e) verified in git log.

---
*Phase: 05-competitive-core*
*Completed: 2026-03-06*
