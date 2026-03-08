---
phase: 04-landing-page
plan: 01
subsystem: api
tags: [supabase, resend, email, waitlist, next.js, rls]

# Dependency graph
requires:
  - phase: 03-stripe-billing
    provides: "Established lazy-init Resend pattern in email.ts and createAdminClient in supabase/admin.ts"
provides:
  - "POST /api/waitlist endpoint — validates, inserts, deduplicates, and confirms waitlist signups"
  - "supabase/migrations/003_waitlist.sql — waitlist table with UNIQUE email, RLS enabled"
  - "sendWaitlistConfirmationEmail — Resend confirmation email for waitlist joiners"
affects: [04-landing-page-02, 04-landing-page-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin client (service-role) used for unauthenticated-visitor writes — RLS blocks anon, service role bypasses it"
    - "Idempotent waitlist INSERT: 23505 unique_violation treated as success (no duplicate emails, no errors)"
    - "Fire-and-forget email: sendWaitlistConfirmationEmail called without await in route, errors caught in function"

key-files:
  created:
    - supabase/migrations/003_waitlist.sql
    - src/app/api/waitlist/route.ts
  modified:
    - src/lib/email.ts

key-decisions:
  - "Admin client (service role) used for waitlist writes — anon client blocked by RLS, this is unauthenticated traffic"
  - "23505 unique_violation returns 200 success — idempotent by design, visitor should not see error for re-submitting"
  - "Email sent fire-and-forget — email failure must not block the 200 response back to the visitor"
  - "onboarding@resend.dev sender retained with TODO comment — custom domain not yet verified"

patterns-established:
  - "Unauthenticated API routes use createAdminClient() from @/lib/supabase/admin — same pattern as billing webhook"
  - "Email functions: lazy-init Resend, try/catch, console.error only, never throw"

requirements-completed: [LAND-02]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 04 Plan 01: Waitlist Backend Infrastructure Summary

**Waitlist table migration, POST /api/waitlist endpoint, and sendWaitlistConfirmationEmail — service-role admin client handles unauthenticated inserts with 23505 idempotency and fire-and-forget Resend confirmation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-02T19:26:34Z
- **Completed:** 2026-03-02T19:28:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `supabase/migrations/003_waitlist.sql` with UNIQUE email constraint, RLS enabled, no user-facing policies
- Created `POST /api/waitlist` route that validates email, inserts via admin client, handles duplicates with idempotent 200, sends confirmation email
- Added `sendWaitlistConfirmationEmail` to `src/lib/email.ts` following the lazy-init Resend pattern

## Task Commits

Each task was committed atomically:

1. **Task 2: Add sendWaitlistConfirmationEmail to email.ts** - `376c955` (feat)
2. **Task 1: Create waitlist table migration and API route** - `90911fc` (feat)

Note: Task 2 was committed first because the route imports `sendWaitlistConfirmationEmail` — logical order followed dependency, not plan numbering.

## Files Created/Modified

- `supabase/migrations/003_waitlist.sql` - Waitlist table with UUID PK, UNIQUE email, TIMESTAMPTZ created_at, RLS enabled, no anon/authenticated policies
- `src/app/api/waitlist/route.ts` - POST handler: validates email, inserts via admin client, 23505 → 200 idempotent, fire-and-forget confirmation email
- `src/lib/email.ts` - Added `sendWaitlistConfirmationEmail` below existing `sendWelcomeEmail`

## Decisions Made

- Admin client (service role) used for waitlist writes — anon Supabase client is blocked by RLS when no policies exist; waitlist traffic is unauthenticated so service role is the correct tool
- 23505 unique_violation returns `{ success: true }` with 200 — idempotent by design; visitor should not see an error if they re-submit the same email
- Email is fire-and-forget (`.catch()` wrapper in route, `try/catch` in function) — email failure must never block the visitor-facing 200 response
- `onboarding@resend.dev` retained as sender with TODO comment — matches Phase 3 pattern, custom domain verification is a deploy-time concern

## Deviations from Plan

None — plan executed exactly as written.

Task 2 was implemented before Task 1 was committed (since the route imports the email function), but both deliverables were produced as specified. No unplanned work was added.

## Issues Encountered

- `npx supabase db push` requires `supabase link` — not available in local dev environment. The migration file is the deliverable (as documented in the plan); user applies it at deploy time.
- Two pre-existing TypeScript errors in `src/app/(dashboard)/sources/page.tsx` and `src/app/api/sources/upload/route.ts` — out of scope, logged, not fixed.

## User Setup Required

Before applying the migration, run:
```bash
supabase db push
```
Or apply the SQL manually in the Supabase dashboard SQL editor.

## Next Phase Readiness

- Waitlist backend is complete and ready for the landing page frontend (Plan 02) to wire up the form
- `RESEND_API_KEY` must be present in `.env.local` for confirmation emails to send (no error is thrown if absent — emails silently skip)
- The `SUPABASE_SERVICE_ROLE_KEY` must be present for the admin client (an error IS thrown if absent)

---
*Phase: 04-landing-page*
*Completed: 2026-03-02*

## Self-Check: PASSED

- FOUND: supabase/migrations/003_waitlist.sql
- FOUND: src/app/api/waitlist/route.ts
- FOUND: src/lib/email.ts
- FOUND: .planning/phases/04-landing-page/04-01-SUMMARY.md
- FOUND commits: 376c955 (email), 90911fc (migration + route)
