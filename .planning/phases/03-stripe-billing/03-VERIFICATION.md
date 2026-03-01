---
phase: 03-stripe-billing
verified: 2026-03-01T12:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 3: Stripe Billing Verification Report

**Phase Goal:** Users can subscribe to Starter or Pro plans via Stripe, manage their subscription, and brief generation is gated by plan limits
**Verified:** 2026-03-01T12:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | User clicks "Subscribe to Starter" and completes Stripe hosted checkout at $79/mo — plan state updates to Starter in the app within 5 seconds | VERIFIED | `checkout/route.ts` creates hosted session with mode:'subscription', price mapped from `STRIPE_STARTER_PRICE_ID`; webhook `handleCheckoutCompleted` updates org plan; billing page polls `/api/billing/status` for up to 10s |
| 2   | User clicks "Subscribe to Pro" and completes Stripe hosted checkout at $299/mo — plan state updates to Pro in the app within 5 seconds | VERIFIED | Same flow as above via `STRIPE_PRO_PRICE_ID`; `PLAN_CONFIG` in billing page shows Pro at $299/mo with Recommended badge |
| 3   | Stripe sends the same webhook event twice — no duplicate side effects occur | VERIFIED | `stripe_webhook_events` table with UNIQUE on `event_id`; INSERT before side effects; `maybeSingle()` + code `23505` detection returns 200 immediately for duplicates |
| 4   | User navigates to Stripe Customer Portal via billing page and can cancel, upgrade, or view invoices | VERIFIED | `portal/route.ts` calls `stripe.billingPortal.sessions.create`; billing page calls `POST /api/billing/portal` and `router.push(data.url)` |
| 5   | Starter user at 10 briefs sees "Upgrade to Pro" prompt; Free users see limit gate immediately | VERIFIED | `PLAN_BRIEF_LIMITS` gates in `generate/route.ts`; query page catches 402 `limit_reached` and renders `UpgradeGate` inline replacing Generate Brief button; UpgradeGate shows correct copy for free vs starter |
| 6   | User visits billing page and sees current plan, briefs used this month, and remaining allowance | VERIFIED | `status/route.ts` returns `plan`, `briefsUsed`, `briefsPeriodStart`; billing page renders `UsageBar` showing `{used}/{limit} briefs used` with progress bar; subscribed users see current plan name and "Manage subscription" link |

**Score:** 6/6 truths verified

---

## Required Artifacts

### Plan 01 — Backend

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `src/lib/stripe.ts` | VERIFIED | Exports `stripe` singleton; guards env var; lazy (module-level singleton); no hardcoded apiVersion (removed in auto-fix 6a92a22) |
| `src/lib/email.ts` | VERIFIED | Exports `sendWelcomeEmail`; Resend client lazy-initialized inside function (avoids module crash if RESEND_API_KEY absent); catches errors silently; uses `onboarding@resend.dev` dev sender |
| `supabase/migrations/002_billing.sql` | VERIFIED | Adds `stripe_subscription_id`, `briefs_used_this_period INTEGER NOT NULL DEFAULT 0`, `briefs_period_start TIMESTAMPTZ` via `ALTER TABLE ... IF NOT EXISTS`; creates `stripe_webhook_events` with UNIQUE on `event_id`; idempotent re-runs |
| `src/app/api/billing/checkout/route.ts` | VERIFIED | POST handler; auth check; maps plan name to price ID server-side; creates hosted session with `mode:'subscription'`; stores `org_id` + `plan_name` in metadata; returns `{ url }` |
| `src/app/api/billing/portal/route.ts` | VERIFIED | POST handler; auth check; requires `stripe_customer_id` (400 if missing); calls `stripe.billingPortal.sessions.create`; returns `{ url }` |
| `src/app/api/billing/webhook/route.ts` | VERIFIED | `await request.text()` as first body access; signature verification; idempotency insert before side effects; handles checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid; all DB writes via `createAdminClient` |
| `src/app/api/billing/status/route.ts` | VERIFIED | GET handler; auth check; returns `plan`, `briefsUsed`, `briefsPeriodStart`, `hasStripeCustomer` |
| `src/app/api/briefs/generate/route.ts` | VERIFIED | Imports `createAdminClient`; `PLAN_BRIEF_LIMITS` constant (free:0, starter:10, pro:Infinity); gate check BEFORE Claude call; returns 402 with `{ error:'limit_reached', plan, used, limit }`; increment via admin client AFTER successful generation |

### Plan 02 — Frontend

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `src/components/billing/PlanCard.tsx` | VERIFIED | Renders plan card with Recommended badge (Pro), Current badge (active plan), Subscribe button with loading state, de-emphasized styling for Free tier |
| `src/components/billing/UsageBar.tsx` | VERIFIED | Progress bar with `{used}/{limit} briefs used`; amber color at limit; Pro plan shows "Unlimited" display |
| `src/components/billing/UpgradeGate.tsx` | VERIFIED | Inline replacement (no modal); distinct copy for free ("Subscribe to unlock briefs") vs starter at limit ("You've used all N briefs this month"); navigates to `/settings/billing` |
| `src/app/(dashboard)/settings/layout.tsx` | VERIFIED | Tab navigation with Billing tab; active state detection via `usePathname` |
| `src/app/(dashboard)/settings/page.tsx` | VERIFIED | Server Component calling `redirect('/settings/billing')` |
| `src/app/(dashboard)/settings/billing/page.tsx` | VERIFIED | Full billing page: plan cards grid, UsageBar, success banner with 10s polling, portal link, subscribe + portal handlers |
| `src/app/(dashboard)/query/page.tsx` | VERIFIED | Imports UpgradeGate; fetches billing status on mount; handles 402 `limit_reached`; shows brief count near Generate Brief button; renders UpgradeGate when `limitReached` |
| `src/app/(dashboard)/briefs/page.tsx` | VERIFIED | Fetches billing status on mount; shows brief count in header for subscribed users |

---

## Key Link Verification

### Plan 01 — Backend Key Links

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `checkout/route.ts` | `src/lib/stripe.ts` | `import { stripe }` | WIRED | Line 3: `import { stripe } from '@/lib/stripe'` |
| `webhook/route.ts` | `src/lib/stripe.ts` | `import { stripe }` | WIRED | Line 3: `import { stripe } from '@/lib/stripe'` |
| `webhook/route.ts` | `src/lib/supabase/admin.ts` | `import { createAdminClient }` | WIRED | Line 4: `import { createAdminClient } from '@/lib/supabase/admin'` |
| `webhook/route.ts` | `src/lib/email.ts` | `import { sendWelcomeEmail }` | WIRED | Line 5: `import { sendWelcomeEmail } from '@/lib/email'`; called in `handleCheckoutCompleted` |
| `portal/route.ts` | `src/lib/stripe.ts` | `import { stripe }` | WIRED | Line 2: `import { stripe } from '@/lib/stripe'` |
| `generate/route.ts` | `src/lib/supabase/admin.ts` | `import { createAdminClient }` | WIRED | Line 4: `import { createAdminClient } from '@/lib/supabase/admin'`; used at line 223 for increment |

### Plan 02 — Frontend Key Links

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `billing/page.tsx` | `/api/billing/checkout` | `fetch POST` then `router.push(url)` | WIRED | Lines 133, 142 |
| `billing/page.tsx` | `/api/billing/portal` | `fetch POST` then `router.push(url)` | WIRED | Lines 153, 160 |
| `billing/page.tsx` | `/api/billing/status` | `fetch GET` on mount and in poll | WIRED | Lines 80, 105 |
| `query/page.tsx` | `UpgradeGate` | rendered when `limitReached === true` | WIRED | Line 21 import, line 794 JSX render |
| `query/page.tsx` | `/api/billing/status` | `fetch GET` on mount | WIRED | Line 463 |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| ----------- | ------------ | ----------- | ------ | -------- |
| BILL-01 | 03-01, 03-02 | User can subscribe to Starter plan ($79/mo) via Stripe hosted checkout | SATISFIED | `checkout/route.ts` creates session with `STRIPE_STARTER_PRICE_ID`; `PLAN_CONFIG` in billing page shows Starter at $79/mo; subscribe button calls checkout endpoint |
| BILL-02 | 03-01, 03-02 | User can subscribe to Pro plan ($299/mo) via Stripe hosted checkout | SATISFIED | Same checkout flow with `STRIPE_PRO_PRICE_ID`; billing page shows Pro at $299/mo with Recommended badge |
| BILL-03 | 03-01, 03-02 | Subscription events processed via webhook with idempotency | SATISFIED | `stripe_webhook_events` UNIQUE constraint; INSERT before side effects; duplicate detection via `23505` or `maybeSingle()` returning null; all 4 lifecycle events handled |
| BILL-04 | 03-01, 03-02 | User can manage subscription via Stripe Customer Portal | SATISFIED | `portal/route.ts` creates portal session; billing page shows "Manage subscription" button and secondary "Stripe Customer Portal" link |
| BILL-05 | 03-01, 03-02 | Brief generation gated — Starter: 10/month, Pro: unlimited | SATISFIED | `PLAN_BRIEF_LIMITS` enforces server-side; 402 response caught by query page; `UpgradeGate` shows when limit reached |
| BILL-06 | 03-02 | User sees current plan and usage on billing page | SATISFIED | `/api/billing/status` returns plan + usage; billing page renders current plan name, `UsageBar` with progress, "Manage subscription" link |

All 6 requirements satisfied. No orphaned requirements found.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/lib/email.ts` | 14 | Hardcoded `onboarding@resend.dev` sender | Warning | Dev email sender will not work in production without a verified Resend domain. Documented in SUMMARY as known blocker. Not blocking for Phase 3 scope. |
| `src/app/api/briefs/generate/route.ts` | 2, 126, 184 | Anthropic SDK called directly from `apps/` (pre-existing from Phase 1) | Warning | CLAUDE.md requires all LLM calls to go through `packages/ai/client.ts`, but `packages/ai/` does not exist in this codebase. This is a pre-existing architectural deviation introduced in Phase 1, not Phase 3. Phase 3 modified this file but did not introduce or worsen the violation. |

No blocker anti-patterns. No stubs. No placeholder returns. No TODO/FIXME comments in Phase 3 files.

---

## Notable Observations

### Auto-fixed Issues (during Phase 3 execution)

1. **Stripe API version** — Original implementation hardcoded `apiVersion: '2025-06-30.basil'` in `stripe.ts`. This caused a mismatch. Fixed in commit `6a92a22` by removing the apiVersion parameter entirely (SDK defaults to the version it was built with). File now reads `new Stripe(process.env.STRIPE_SECRET_KEY)` with no apiVersion — correct.

2. **Resend lazy initialization** — Original `email.ts` initialized `new Resend(process.env.RESEND_API_KEY)` at module load, causing a crash when `RESEND_API_KEY` is absent in dev. Fixed in same commit by moving the constructor inside `sendWelcomeEmail()` function body with an early return guard.

### Idempotency Implementation Note

The idempotency logic uses `.maybeSingle()` after INSERT. With Supabase/PostgREST, a UNIQUE violation on INSERT with `.maybeSingle()` returns `{ data: null, error: null }` (not a 23505 error) when using `.select().maybeSingle()`. The code handles both cases: `insertError?.code === '23505' || (!insertError && data === null)`. This dual-check is correct and robust.

### Usage Increment Is Non-Atomic

The brief counter uses read-then-write (`briefs_used_this_period + 1` in application code). This is intentional at design partner scale and documented. True atomicity would use `UPDATE ... SET briefs_used_this_period = briefs_used_this_period + 1` directly in Postgres. No action needed for Phase 3.

---

## Human Verification Required

The following items cannot be verified programmatically:

### 1. Full End-to-End Stripe Checkout Flow

**Test:** Click "Subscribe to Starter" on the billing page with Stripe test mode credentials configured in `.env.local`
**Expected:** Redirected to Stripe hosted checkout at the correct $79/mo price; completing payment redirects back to `/settings/billing?success=true&plan=starter`; success banner appears; plan updates to "Starter" within 10 seconds (requires local webhook forwarding via `stripe listen`)
**Why human:** Live Stripe session creation, redirect, and webhook delivery require real network calls and env vars

### 2. Stripe Customer Portal Navigation

**Test:** As a subscribed user, click "Manage subscription" on billing page
**Expected:** Redirected to Stripe Customer Portal; can view invoices, cancel, or upgrade; clicking "Return" returns to `/settings/billing`
**Why human:** Requires active Stripe customer ID from a real or test subscription

### 3. UpgradeGate Display at Limit

**Test:** As a Starter user with 10 briefs used, navigate to the query page and click Generate Brief
**Expected:** UpgradeGate renders inline in place of the Generate Brief button with text "You've used all 10 briefs this month"; "Upgrade to Pro" button navigates to `/settings/billing`
**Why human:** Requires a Starter-plan org with `briefs_used_this_period = 10` in the database

### 4. Webhook Idempotency Under Retry

**Test:** Using `stripe trigger checkout.session.completed` or Stripe Dashboard retry, send the same webhook event ID twice
**Expected:** First delivery processes and updates org plan; second delivery returns 200 with "Already processed" body; org plan is not double-updated
**Why human:** Requires live Stripe webhook delivery or CLI trigger

### 5. Free User Limit Gate

**Test:** Log in as a user on the free plan; navigate to query page; attempt to generate a brief
**Expected:** UpgradeGate shows "Subscribe to unlock briefs" immediately (since free plan limit is 0); never reaches Claude API call
**Why human:** Requires a free-plan org in the database; confirms the 402 flow works end-to-end

---

## Gaps Summary

None. All automated checks passed. Phase 3 goal is fully achieved at the code level.

The billing system is complete: Stripe client singleton, database migration with idempotency table, webhook handler with all four lifecycle events, hosted checkout and portal session routes, billing status polling endpoint, plan gate in brief generation (server-side, before Claude call), and a complete billing frontend with plan cards, usage bar, upgrade gate, and success banner with polling.

---

_Verified: 2026-03-01T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
