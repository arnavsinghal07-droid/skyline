---
phase: 03-stripe-billing
plan: "01"
subsystem: billing
tags:
  - stripe
  - webhooks
  - idempotency
  - plan-gates
  - email
  - database-migration
dependency_graph:
  requires:
    - src/lib/supabase/admin.ts
    - src/lib/supabase/server.ts
    - supabase/migrations/001_initial_schema.sql
  provides:
    - src/lib/stripe.ts
    - src/lib/email.ts
    - supabase/migrations/002_billing.sql
    - src/app/api/billing/webhook/route.ts
    - src/app/api/billing/checkout/route.ts
    - src/app/api/billing/portal/route.ts
    - src/app/api/billing/status/route.ts
    - src/app/api/briefs/generate/route.ts (updated with plan gate)
  affects:
    - Brief generation (now plan-gated)
    - Organization billing state (managed by webhook)
tech_stack:
  added:
    - stripe@^20.3.1 (already installed — now used)
    - resend@^6.9.2 (already installed — now used)
  patterns:
    - Stripe hosted checkout (not Elements or embedded)
    - Webhook idempotency via DB UNIQUE constraint
    - Service role client for webhook DB writes
    - Plan gate before LLM call to prevent API credit waste
key_files:
  created:
    - src/lib/stripe.ts
    - src/lib/email.ts
    - supabase/migrations/002_billing.sql
    - src/app/api/billing/webhook/route.ts
    - src/app/api/billing/checkout/route.ts
    - src/app/api/billing/portal/route.ts
    - src/app/api/billing/status/route.ts
  modified:
    - src/app/api/briefs/generate/route.ts
decisions:
  - "Webhook uses await request.text() as first operation — preserves raw body for Stripe signature verification"
  - "Idempotency via INSERT into stripe_webhook_events BEFORE side effects — duplicate events silently return 200"
  - "Event handler errors return 200 (not 500) since event is already recorded — Stripe retry would hit idempotency check"
  - "sendWelcomeEmail catches all errors silently — email failure never blocks subscription activation"
  - "Plan gate runs before Claude API call — prevents wasting API credits on over-limit requests"
  - "Usage increment uses createAdminClient (service role) for consistency with webhook pattern"
  - "Usage increment is non-atomic (read-modify-write) — acceptable at design partner scale, noted for future Postgres function migration"
  - "Checkout maps plan name to price ID server-side — client cannot set arbitrary prices"
  - "from: onboarding@resend.dev used for development — production requires verified Resend domain"
metrics:
  duration_seconds: 225
  completed_date: "2026-02-26"
  tasks_completed: 4
  files_created: 7
  files_modified: 1
---

# Phase 3 Plan 1: Stripe Billing Backend Summary

**One-liner:** Complete Stripe billing backend with idempotent webhook handler, hosted checkout/portal/status routes, welcome email via Resend, and server-side plan gate in brief generation.

## What Was Built

This plan delivers the server-side foundation for the entire billing system — 8 files that together implement the full Stripe integration loop from subscription purchase to usage enforcement.

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe SDK singleton initialized with `STRIPE_SECRET_KEY` |
| `src/lib/email.ts` | `sendWelcomeEmail()` via Resend with silent error handling |
| `supabase/migrations/002_billing.sql` | Adds billing columns to organizations + idempotency table |
| `src/app/api/billing/webhook/route.ts` | Stripe webhook handler (idempotent, signature-verified) |
| `src/app/api/billing/checkout/route.ts` | Creates Stripe hosted checkout sessions |
| `src/app/api/billing/portal/route.ts` | Creates Stripe Customer Portal sessions |
| `src/app/api/billing/status/route.ts` | Billing status polling endpoint for optimistic updates |

### Files Modified

| File | Change |
|------|--------|
| `src/app/api/briefs/generate/route.ts` | Added plan gate (before Claude call) + usage increment (after success) |

## Key Implementation Details

### Webhook Handler Critical Pattern

The webhook handler follows the exact anti-pattern avoidance required:

1. `await request.text()` is called FIRST — never `request.json()` which destroys the raw body needed for signature verification
2. Event ID is inserted into `stripe_webhook_events` BEFORE any side effects
3. The UNIQUE constraint on `event_id` ensures duplicate inserts return null (`maybeSingle()`)
4. Handler errors return 200 (not 500) — event is already recorded, Stripe retries would hit idempotency

### Lifecycle Events Handled

- `checkout.session.completed` — updates org plan, stores `stripe_customer_id` + `stripe_subscription_id`, resets `briefs_used_this_period`, sends welcome email
- `customer.subscription.updated` — syncs plan from price ID when status is `active`
- `customer.subscription.deleted` — reverts org to `free` plan, clears `stripe_subscription_id`
- `invoice.paid` — resets `briefs_used_this_period` ONLY when `billing_reason === 'subscription_cycle'`

### Plan Gate in Brief Generation

```
free: 0 briefs/month
starter: 10 briefs/month
pro: unlimited (Infinity)
```

Gate runs BEFORE the Claude API call. Returns HTTP 402 with:
```json
{ "error": "limit_reached", "plan": "free", "used": 0, "limit": 0 }
```
`limit` is `null` for pro (Infinity is not valid JSON).

### Database Migration (002_billing.sql)

Adds to `organizations`:
- `stripe_subscription_id TEXT` — nullable, set after first subscription
- `briefs_used_this_period INTEGER NOT NULL DEFAULT 0` — reset on invoice.paid cycle
- `briefs_period_start TIMESTAMPTZ` — nullable, set when subscription starts/renews

Creates `stripe_webhook_events`:
- `event_id TEXT NOT NULL UNIQUE` — the idempotency mechanism
- `event_type TEXT NOT NULL`
- `processed_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Uses `IF NOT EXISTS` throughout for idempotent re-runs.

## Decisions Made

1. **Webhook error handling returns 200** — After recording the event ID, processing errors return 200 rather than 500. This prevents Stripe retry loops since the idempotency check would block reprocessing anyway. The error is logged for debugging.

2. **Email failure is silent** — `sendWelcomeEmail()` catches all errors internally. Email failure must never block subscription activation. The function returns `void` not a success boolean.

3. **Non-atomic usage increment** — The brief counter uses read-then-write (`briefs_used_this_period + 1`). At design partner scale this is acceptable. True atomicity requires `UPDATE ... SET briefs_used_this_period = briefs_used_this_period + 1` via Postgres function — deferred to Phase 4 if needed.

4. **Server-side price ID mapping** — Checkout accepts `{ plan: 'starter' | 'pro' }` from the client and maps to price IDs from env vars. The client never sees or sends raw Stripe price IDs.

5. **Development email sender** — `from: 'Sightline <onboarding@resend.dev>'` for development. Production requires a verified Resend domain — this is a known blocker documented in STATE.md.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist
- `src/lib/stripe.ts` — FOUND
- `src/lib/email.ts` — FOUND
- `supabase/migrations/002_billing.sql` — FOUND
- `src/app/api/billing/webhook/route.ts` — FOUND
- `src/app/api/billing/checkout/route.ts` — FOUND
- `src/app/api/billing/portal/route.ts` — FOUND
- `src/app/api/billing/status/route.ts` — FOUND
- `src/app/api/briefs/generate/route.ts` — FOUND (modified)

### Commits Exist
- dc8de34: feat(03-01): Stripe client singleton, email utility, and billing migration
- 776ec7e: feat(03-01): Stripe webhook handler with idempotency and lifecycle events
- 6137ca6: feat(03-01): checkout, portal, and billing status Route Handlers
- da34c95: feat(03-01): add plan gate and usage increment to brief generation

### TypeScript Status
New billing files compile without errors. Two pre-existing errors in `src/app/(dashboard)/sources/page.tsx` and `src/app/api/sources/upload/route.ts` are out-of-scope (existed before this plan).

## Self-Check: PASSED
