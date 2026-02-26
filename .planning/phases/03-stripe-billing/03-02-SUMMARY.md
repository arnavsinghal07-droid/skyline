---
phase: 03-stripe-billing
plan: 02
subsystem: payments
tags: [stripe, billing, react, nextjs, tailwind]

# Dependency graph
requires:
  - phase: 03-01
    provides: Stripe billing backend — checkout, portal, webhook, status API, plan gate on /api/briefs/generate
provides:
  - Settings layout at /settings with Billing tab navigation
  - Billing page at /settings/billing with 3-column plan cards (Free/Starter/Pro)
  - PlanCard, UsageBar, UpgradeGate billing components
  - Query page integrated with billing status, brief count display, and 402 UpgradeGate
  - Briefs page with brief count in header for subscribed users
affects: [query-page, briefs-page, billing-flow, user-upgrade-journey]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Billing-aware pages: fetch /api/billing/status on mount, display count, show UpgradeGate on limit"
    - "Inline gate pattern: UpgradeGate replaces Generate Brief button, no modal/dialog"
    - "Optimistic checkout: success banner shown immediately, polls for webhook confirmation for 10s"
    - "Silent cancel: no error/nudge shown when user returns from Stripe without success param"

key-files:
  created:
    - src/components/billing/PlanCard.tsx
    - src/components/billing/UsageBar.tsx
    - src/components/billing/UpgradeGate.tsx
    - src/app/(dashboard)/settings/layout.tsx
    - src/app/(dashboard)/settings/page.tsx
    - src/app/(dashboard)/settings/billing/page.tsx
  modified:
    - src/app/(dashboard)/query/page.tsx
    - src/app/(dashboard)/briefs/page.tsx

key-decisions:
  - "UpgradeGate is inline replacement (not modal/drawer) — plan gate replaces the Generate Brief button in-place"
  - "Billing status fetched on mount in query and briefs pages — silent failure does not block usage"
  - "Brief counter increments locally after successful generation without refetching /api/billing/status"
  - "Polling stops after 10s regardless of webhook confirmation — user sees banner, plan updates async"
  - "URL params cleaned 500ms after reading (?success=true&plan=) to avoid stale state on refresh"

patterns-established:
  - "Billing gate pattern: fetch status on mount, compare used vs limit, show UpgradeGate when limitReached"
  - "Plan card grid: 3-column, Free de-emphasized, Starter, Pro with Recommended badge and bright CTA"

requirements-completed: [BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06]

# Metrics
duration: 5min
completed: 2026-02-26
---

# Phase 03 Plan 02: Stripe Billing Frontend Summary

**Billing UI with settings layout, 3-column plan cards, UsageBar, UpgradeGate gate replacing Generate Brief button on limit hit**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-26T04:22:13Z
- **Completed:** 2026-02-26T04:27:22Z
- **Tasks:** 3 auto tasks complete, 1 checkpoint:human-verify pending
- **Files modified:** 8

## Accomplishments
- Created PlanCard, UsageBar, UpgradeGate components for billing UI
- Built settings layout at /settings with Billing tab (redirects /settings to /settings/billing)
- Billing page shows Free/Starter/Pro plan cards, usage bar, success banner with polling, portal link
- Query page now shows brief count near Generate Brief button and UpgradeGate when limit reached
- Briefs page header shows brief usage count for subscribed users

## Task Commits

Each task was committed atomically:

1. **Task 1: Create billing components** - `147f69c` (feat)
2. **Task 2: Create settings layout and billing page** - `6b716b2` (feat)
3. **Task 3: Integrate UpgradeGate and brief count into query and briefs pages** - `7b91ebd` (feat)

## Files Created/Modified
- `src/components/billing/PlanCard.tsx` - Plan card with Recommended/Current badges, subscribe button, loading state
- `src/components/billing/UsageBar.tsx` - Progress bar with used/limit count, amber color at limit, Pro unlimited display
- `src/components/billing/UpgradeGate.tsx` - Inline upgrade prompt with different copy for Free vs Starter; navigates to /settings/billing
- `src/app/(dashboard)/settings/layout.tsx` - Settings shell with tab navigation, Billing tab active
- `src/app/(dashboard)/settings/page.tsx` - Server Component redirecting /settings to /settings/billing
- `src/app/(dashboard)/settings/billing/page.tsx` - Full billing page: plan cards, usage bar, success banner + 10s polling, portal link
- `src/app/(dashboard)/query/page.tsx` - Added billing state, 402 limit_reached handling, UpgradeGate integration, brief count display
- `src/app/(dashboard)/briefs/page.tsx` - Added billing state fetch, brief count in header for subscribed users

## Decisions Made
- UpgradeGate is inline replacement (not modal/drawer) — follows CONTEXT.md inline gate pattern
- Brief counter increments locally after successful generation — avoids redundant network call
- Polling stops after 10s regardless — banner stays visible even if webhook hasn't fired yet
- 2 pre-existing TypeScript errors in unrelated files (sources/page.tsx, sources/upload/route.ts) left as-is per scope boundary rules

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- 2 pre-existing TypeScript errors in sources/page.tsx and sources/upload/route.ts — unrelated to billing, deferred per scope boundary rule

## User Setup Required

External services require manual configuration before the checkpoint verification can proceed:
1. Create Stripe products (Starter $79/mo, Pro $299/mo) in Stripe Dashboard
2. Add to `.env.local`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
3. Apply migration: `supabase/migrations/002_billing.sql`
4. For local webhooks: `stripe listen --forward-to localhost:3000/api/billing/webhook`

## Next Phase Readiness
- All billing code is complete — awaiting human verification of end-to-end Stripe flow (Task 4)
- After verification, Phase 3 is complete and Phase 4 (landing page) can begin

---
*Phase: 03-stripe-billing*
*Completed: 2026-02-26*
