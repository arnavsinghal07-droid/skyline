# Phase 3: Stripe Billing - Research

**Researched:** 2026-02-25
**Domain:** Stripe Subscriptions + Next.js App Router + Supabase
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Billing Page Design**
- Side-by-side plan cards showing all three tiers: Free, Starter, Pro
- For subscribed users: show plan name + briefs used/remaining with a progress bar (e.g. "7/10 briefs used this month")
- "Manage subscription" link opens Stripe Customer Portal for invoice history, cancellation, and upgrades
- Billing page lives under Settings > Billing tab in the existing navigation

**Limit Gate Experience**
- Inline replacement: when a user hits their limit, replace the "Generate Brief" action area with an upgrade prompt — no modal, no separate page
- Always-visible brief count near the generate button (e.g. "3/10 briefs remaining") so users are never surprised
- Same gate pattern for both Free and Starter users, but different copy:
  - Free users: "Subscribe to unlock briefs"
  - Starter users: "Upgrade to Pro for unlimited briefs"
- Tone is helpful and direct: "You've used all 10 briefs this month. Upgrade to Pro for unlimited."

**Checkout & Confirmation Flow**
- After Stripe hosted checkout succeeds: redirect back to /settings/billing with a success banner ("Welcome to Starter!" or "Welcome to Pro!")
- If user cancels during Stripe checkout: return silently to billing page — no error message, no nudge
- Optimistic update: immediately show the new plan after Stripe redirect, webhook confirms in background. If webhook fails, revert and notify.
- Send a brief welcome email on subscription start (Stripe sends its own receipt separately)

**Plan Presentation**
- Brief limit is the headline differentiator: Starter = "10 briefs/month", Pro = "Unlimited briefs"
- Pro card visually highlighted as "Recommended" (colored border or badge)
- Free tier card de-emphasized — smaller or muted, labeled "Current" if user is on free plan
- Monthly pricing only for now — no annual toggle

### Claude's Discretion
- Exact visual styling of plan cards (shadows, borders, spacing)
- Progress bar design for usage display
- Welcome email template and copy details
- Webhook retry/failure notification UX
- Stripe Customer Portal theming (if any)

### Deferred Ideas (OUT OF SCOPE)
- Annual pricing toggle — future billing enhancement
- Feature-based plan differentiation beyond brief limits — future phase
- Team/organization billing with multiple seats — future phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 | User can subscribe to Starter plan ($79/mo) via Stripe hosted checkout | Checkout session creation with mode:'subscription', price ID, success_url/cancel_url patterns |
| BILL-02 | User can subscribe to Pro plan ($299/mo) via Stripe hosted checkout | Same pattern as BILL-01 — different price ID; both use the same API route |
| BILL-03 | Subscription events processed via webhook with idempotency (no double-processing) | `stripe.webhooks.constructEvent` + raw body with `request.text()` + event ID deduplication in Postgres |
| BILL-04 | User can manage subscription (cancel, upgrade, view invoices) via Stripe Customer Portal | `stripe.billingPortal.sessions.create({ customer, return_url })` + redirect |
| BILL-05 | Brief generation gated by plan — Starter: 10/month, Pro: unlimited | `briefs_used_this_period` counter in `organizations` table + atomic increment + gate check in generate route |
| BILL-06 | User sees current plan and usage on a billing page | `/settings/billing` page reading `plan`, `briefs_used_this_period`, and `briefs_period_start` from org row |
</phase_requirements>

---

## Summary

Stripe billing for this project requires four distinct integration surfaces: hosted checkout (creating sessions server-side and redirecting), webhooks (receiving lifecycle events with idempotency), the customer portal (redirecting to Stripe's hosted management UI), and usage gating (a counter in the `organizations` table checked before every brief generation).

The Stripe Node.js SDK (v20.3.1) is already installed. The project uses Next.js App Router, which means all server-side Stripe operations live in Route Handlers (`app/api/*/route.ts`). No Server Actions are used — the project uses `onClick` handlers + `fetch` calls per CLAUDE.md's no-form-tags rule. Webhooks require special handling: `await request.text()` must be called before any JSON parsing to preserve the raw body for signature verification.

The schema already has `stripe_customer_id TEXT` on the `organizations` table. Three new columns are needed: `stripe_subscription_id`, `briefs_used_this_period` (INTEGER), and `briefs_period_start` (TIMESTAMPTZ). A `stripe_webhook_events` table tracks processed event IDs for idempotency. The `plan` column already exists on `organizations` (TEXT DEFAULT 'free') — it gets updated by webhooks to `'starter'` or `'pro'`.

**Primary recommendation:** Use hosted checkout (not embedded) for simplicity — the project has no existing Stripe Elements setup and hosted checkout offloads all PCI scope. Idempotency via a `stripe_webhook_events` table in Postgres (INSERT ON CONFLICT DO NOTHING) is the correct pattern for Supabase-backed apps.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | ^20.3.1 | Node.js SDK — server-side session creation, webhook verification, portal sessions | Official SDK; already installed; v20 has TypeScript types built-in |
| Resend | ^6.9.2 | Transactional email — welcome email on subscription start | Already installed; used elsewhere in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.97.0 | Database updates after webhook events | Already installed — update org plan + subscription fields |
| Supabase admin client | existing `src/lib/supabase/admin.ts` | Service-role Postgres writes in webhook handler (bypasses RLS) | Webhook handler has no authenticated user context |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hosted checkout | Stripe Elements / Embedded checkout | Embedded keeps users on-domain but requires `@stripe/react-stripe-js` + iframe setup — unnecessary complexity for this scope |
| Postgres event dedup table | Redis idempotency keys | Redis not in current stack; Postgres is simpler and already present |
| Simple counter column | Stripe metered billing API | Metered billing is over-engineered (explicitly out of scope in REQUIREMENTS.md) |

**Installation:**
```bash
# Already installed — no new dependencies needed
# Confirm: stripe@20.3.1, resend@6.9.2 are in package.json
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── settings/
│   │       └── billing/
│   │           └── page.tsx         # Billing page — plan cards, usage bar, portal link
│   └── api/
│       ├── billing/
│       │   ├── checkout/
│       │   │   └── route.ts         # POST — creates Stripe checkout session
│       │   ├── portal/
│       │   │   └── route.ts         # POST — creates Stripe customer portal session
│       │   └── webhook/
│       │       └── route.ts         # POST — receives Stripe webhook events
│       └── briefs/
│           └── generate/
│               └── route.ts         # EXISTING — add plan gate check here
├── lib/
│   └── stripe.ts                    # Stripe client singleton
└── components/
    └── billing/
        ├── PlanCard.tsx             # Plan card component (Free/Starter/Pro)
        ├── UsageBar.tsx             # Brief usage progress bar
        └── UpgradeGate.tsx          # Inline upgrade prompt (replaces Generate Brief button)
```

### Pattern 1: Stripe Client Singleton

**What:** Initialize the Stripe SDK once, reuse across route handlers.
**When to use:** All server-side Stripe API calls.

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',  // Latest stable API version
  typescript: true,
})
```

### Pattern 2: Hosted Checkout Session Creation

**What:** Server-side Route Handler creates a checkout session and returns the URL; client redirects to it.
**When to use:** "Subscribe to Starter" / "Subscribe to Pro" button click.

```typescript
// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch org for stripe_customer_id
  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id')
    .eq('id', /* org_id from user profile */)
    .single()

  const { priceId } = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: org.stripe_customer_id ?? undefined,      // reuse if exists
    customer_email: org.stripe_customer_id ? undefined : user.email, // only if new customer
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing?success=true&plan=${planName}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
    metadata: {
      org_id: org.id,
      user_id: user.id,
    },
  })

  return NextResponse.json({ url: session.url })
}
```

Client side (billing page):
```typescript
const res = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priceId: STARTER_PRICE_ID }),
})
const { url } = await res.json()
router.push(url)  // NOT stripe.redirectToCheckout() — removed Sept 2025
```

### Pattern 3: Webhook Handler with Idempotency

**What:** Route handler that verifies Stripe signature, deduplicates via DB, and updates org plan.
**When to use:** `POST /api/billing/webhook` — called by Stripe on every subscription lifecycle event.

```typescript
// src/app/api/billing/webhook/route.ts
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // CRITICAL: use .text() not .json() — preserves raw body for signature verification
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotency: record event_id — DO NOTHING if already processed
  const { count } = await admin
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, event_type: event.type, processed_at: new Date().toISOString() })
    .select('id', { count: 'exact', head: true })
    .onConflict('event_id')
    .ignore()

  // count === 0 means a conflict occurred — event already processed
  if (count === 0) {
    return new Response('Already processed', { status: 200 })
  }

  // Dispatch to handler
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, admin)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, admin)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, admin)
      break
    case 'invoice.paid':
      // Reset monthly counter on renewal
      await handleInvoicePaid(event.data.object as Stripe.Invoice, admin)
      break
  }

  return new Response('OK', { status: 200 })
}
```

### Pattern 4: Customer Portal Session

**What:** Creates a short-lived Stripe Customer Portal session and redirects.
**When to use:** "Manage subscription" button click.

```typescript
// src/app/api/billing/portal/route.ts
export async function POST(request: NextRequest) {
  // ... auth check ...
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  })
  return NextResponse.json({ url: portalSession.url })
}
```

Client: `router.push(portalUrl)` after fetch.

### Pattern 5: Plan Gate in Brief Generation

**What:** Check brief count before allowing generation; return 402 if over limit.
**When to use:** Every call to `POST /api/briefs/generate`.

```typescript
// In existing src/app/api/briefs/generate/route.ts — add at top of handler
const { data: org } = await supabase
  .from('organizations')
  .select('plan, briefs_used_this_period, briefs_period_start')
  .eq('id', orgId)
  .single()

const LIMITS = { free: 0, starter: 10, pro: Infinity }
const limit = LIMITS[org.plan as keyof typeof LIMITS] ?? 0

if (org.briefs_used_this_period >= limit) {
  return NextResponse.json(
    { error: 'limit_reached', plan: org.plan },
    { status: 402 }
  )
}

// After successful generation, increment counter:
await admin
  .from('organizations')
  .update({ briefs_used_this_period: org.briefs_used_this_period + 1 })
  .eq('id', orgId)
```

### Anti-Patterns to Avoid

- **`stripe.redirectToCheckout()`**: Removed from Stripe.js in September 2025. Use `router.push(session.url)` after server-side session creation instead.
- **`await request.json()` in webhook handler**: Parses and re-serializes the body, breaking signature verification. Always use `await request.text()`.
- **Updating plan directly from `checkout.session.completed` without storing `stripe_customer_id`**: The customer ID is in `session.customer` — store it immediately to enable future portal sessions.
- **Checking brief limits only in the UI**: Always enforce on the server — the generate route must check and return 402.
- **Processing webhook side effects before inserting to idempotency table**: Insert first, check result, then process. Prevents race conditions on concurrent retries.
- **Using `supabase.auth` client in webhook handler**: Webhook has no authenticated user context. Use `createAdminClient()` for all DB writes in webhook.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC verification | `stripe.webhooks.constructEvent()` | Handles timing attacks, encoding, and all edge cases |
| Idempotency | In-memory deduplication | `stripe_webhook_events` table with UNIQUE constraint on `event_id` | Memory is lost on serverless restart; DB persists across invocations |
| Monthly counter reset | Cron job checking all orgs | Reset on `invoice.paid` webhook | `invoice.paid` fires on each subscription renewal cycle — free and correct |
| Customer portal UI | Custom subscription management page | `stripe.billingPortal.sessions.create()` | Stripe handles cancellation flow, proration, payment method updates, invoice PDFs |
| Plan pricing page | Custom pricing logic | Stripe Price objects with IDs in env vars | Price changes don't require code deploys; Stripe is the source of truth |

**Key insight:** Stripe's hosted surfaces (checkout + portal) handle every hard problem (PCI compliance, 3DS, payment failures, dunning, proration) — the only custom work is the glue between Stripe events and your database.

---

## Common Pitfalls

### Pitfall 1: Raw Body Destruction in Next.js Webhook Handler
**What goes wrong:** Calling `await request.json()` before or instead of `await request.text()` causes `stripe.webhooks.constructEvent` to throw "No signatures found matching the expected signature for payload."
**Why it happens:** JSON parse + re-serialize produces a body that differs character-by-character from what Stripe signed.
**How to avoid:** First line of webhook handler body: `const body = await request.text()`. Never call `request.json()` in the same handler.
**Warning signs:** Webhook signature errors in logs even though `STRIPE_WEBHOOK_SECRET` is correct.

### Pitfall 2: Duplicate Plan Updates from Webhook Retries
**What goes wrong:** Stripe retries webhooks for up to 3 days. Without idempotency, a `checkout.session.completed` event processed twice sets the plan twice, sends the welcome email twice, resets the brief counter twice.
**Why it happens:** Stripe retries on any non-2xx response, and on timeout. Serverless functions can timeout before responding.
**How to avoid:** Insert `event.id` to `stripe_webhook_events` table with a UNIQUE constraint before any side effects. Check if insert was a no-op (conflict = already processed).
**Warning signs:** Duplicate welcome emails, brief counter reset unexpectedly mid-month.

### Pitfall 3: Optimistic Update Without Rollback
**What goes wrong:** The billing page shows "Welcome to Starter!" immediately after Stripe redirect (reading `?success=true` from URL), but the webhook hasn't fired yet. If the webhook fails permanently (e.g., bad network, 5xx repeated), the plan never actually updates in DB.
**Why it happens:** Optimistic UI assumes eventual consistency but Stripe webhooks can fail.
**How to avoid:** On billing page load, if `?success=true` query param is present, also poll `/api/billing/status` for up to 10 seconds to confirm the DB plan matches the optimistic state. If it doesn't match after timeout, show a warning banner: "We're confirming your subscription — refresh in a moment."
**Warning signs:** User sees "Welcome to Pro!" but brief limit remains at 0 (free tier).

### Pitfall 4: Missing `stripe_customer_id` on Org
**What goes wrong:** First subscription sets `stripe_customer_id` on the org. If the webhook handler doesn't store it, a user who cancels and resubscribes creates a duplicate Stripe customer — breaking the portal.
**Why it happens:** `stripe_customer_id` is on the `checkout.session.completed` payload as `session.customer` — easy to miss.
**How to avoid:** Always update `organizations.stripe_customer_id` from `session.customer` in the `checkout.session.completed` handler. Also update it from `subscription.customer` in `customer.subscription.updated`.
**Warning signs:** Multiple Stripe customer records for the same email; portal sessions fail with "no customer found."

### Pitfall 5: Brief Counter Not Reset on Subscription Renewal
**What goes wrong:** Counter resets only on initial subscription but not on monthly renewal, so a Starter user runs out of briefs permanently after month 1.
**Why it happens:** `checkout.session.completed` fires once; monthly resets require responding to `invoice.paid`.
**How to avoid:** In `invoice.paid` handler, check if `invoice.billing_reason === 'subscription_cycle'` and reset `briefs_used_this_period = 0` and update `briefs_period_start = now()`.
**Warning signs:** Users complain they can't generate briefs in month 2+ despite being on Starter.

### Pitfall 6: Settings/Billing Route Missing from Navigation
**What goes wrong:** `/settings/billing` page exists but Settings isn't in the sidebar — user can't navigate there.
**Why it happens:** The current sidebar has a Settings item but no `/settings` page exists yet — it needs to be created as a parent route, or billing can live at `/billing` directly.
**How to avoid:** Either (a) create `/settings/billing` with a settings layout that includes a Billing tab, or (b) put billing directly at a dedicated `/billing` route and add it to the sidebar. The CONTEXT.md decision says "Settings > Billing tab" — so implement a settings layout with tab navigation.
**Warning signs:** 404 on `/settings/billing`.

---

## Code Examples

### Stripe Client Singleton

```typescript
// Source: Official Stripe docs pattern + stripe@20 TypeScript types
// src/lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('[Sightline] STRIPE_SECRET_KEY is not set. Add it to .env.local.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})
```

### Webhook Event Idempotency (Supabase pattern)

```typescript
// src/app/api/billing/webhook/route.ts
// After constructEvent succeeds:
const admin = createAdminClient()

// Attempt to record event — UNIQUE constraint on event_id
const { data, error } = await admin
  .from('stripe_webhook_events')
  .insert({ event_id: event.id, event_type: event.type })
  .select('id')
  .maybeSingle()

if (error?.code === '23505' || data === null) {
  // Duplicate — already processed. Return 200 so Stripe stops retrying.
  return new Response('Already processed', { status: 200 })
}
```

### Checkout Session Completed Handler

```typescript
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  admin: ReturnType<typeof createAdminClient>
) {
  const orgId   = session.metadata?.org_id
  const planName = session.metadata?.plan_name  // 'starter' or 'pro'
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!orgId || !planName) return

  await admin
    .from('organizations')
    .update({
      plan: planName,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      briefs_used_this_period: 0,
      briefs_period_start: new Date().toISOString(),
    })
    .eq('id', orgId)

  // Send welcome email via Resend
  await sendWelcomeEmail(session.customer_email ?? '', planName)
}
```

### Invoice Paid Handler (monthly counter reset)

```typescript
async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>
) {
  // Only reset on subscription cycle renewals, not initial subscription
  if (invoice.billing_reason !== 'subscription_cycle') return

  const customerId = invoice.customer as string

  await admin
    .from('organizations')
    .update({
      briefs_used_this_period: 0,
      briefs_period_start: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}
```

### Subscription Deleted Handler (cancellation)

```typescript
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>
) {
  const customerId = subscription.customer as string

  await admin
    .from('organizations')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)
}
```

### Resend Welcome Email

```typescript
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, plan: string) {
  const planLabel = plan === 'starter' ? 'Starter' : 'Pro'
  const limit = plan === 'starter' ? '10' : 'unlimited'

  await resend.emails.send({
    from: 'Sightline <noreply@yourdomain.com>',
    to,
    subject: `Welcome to Sightline ${planLabel}`,
    html: `
      <h2>Welcome to Sightline ${planLabel}!</h2>
      <p>You now have access to ${limit} briefs per month.</p>
      <p>Head to your <a href="${process.env.NEXT_PUBLIC_URL}/briefs">Briefs</a> page to get started.</p>
    `,
  })
}
```

### Plan Gate Component (inline replacement)

```typescript
// src/components/billing/UpgradeGate.tsx
'use client'

type Props = {
  plan: 'free' | 'starter' | 'pro'
  used: number
  limit: number
}

export function UpgradeGate({ plan, used, limit }: Props) {
  const isPro = plan === 'pro'
  if (isPro) return null  // no gate for Pro

  const atLimit = used >= limit

  return (
    <div className="...">
      {/* Always-visible counter */}
      <span>{isPro ? 'Unlimited' : `${limit - used}/${limit} briefs remaining`}</span>

      {/* Only shown when limit reached */}
      {atLimit && (
        <div>
          <p>
            {plan === 'free'
              ? 'Subscribe to unlock briefs'
              : `You've used all ${limit} briefs this month. Upgrade to Pro for unlimited.`}
          </p>
          <button onClick={/* navigate to billing */}>
            {plan === 'free' ? 'Subscribe' : 'Upgrade to Pro'}
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Database Schema Changes

Three new columns on `organizations` + one new table needed:

```sql
-- Migration: Add billing fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN briefs_used_this_period INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN briefs_period_start TIMESTAMPTZ;

-- Migration: Webhook idempotency table
CREATE TABLE public.stripe_webhook_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    TEXT        NOT NULL UNIQUE,  -- Stripe event.id
  event_type  TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — only written/read by service role in webhook handler
-- Index for fast dedup lookups
CREATE INDEX ON public.stripe_webhook_events (event_id);
```

Note: `stripe_customer_id` and `plan` columns already exist on `organizations` from migration 001.

---

## Environment Variables Required

```bash
# .env.local — add these for Phase 3
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_URL=http://localhost:3000  # or production domain
RESEND_API_KEY=re_...                  # already present per STATE.md
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `stripe.redirectToCheckout({ sessionId })` | `router.push(session.url)` after server-side session creation | September 2025 | `redirectToCheckout()` removed from Stripe.js — any tutorial using it is outdated |
| Pages Router: `req.body` as Buffer | App Router: `await request.text()` | Next.js 13+ (App Router) | Raw body pattern changed entirely — old guides don't apply |
| Stripe `apiVersion: '2023-10-16'` | `apiVersion: '2025-06-30.basil'` | 2025 | Latest stable; flexible billing requires this version |
| Server Actions for checkout | Route Handlers for checkout | N/A for this project | CLAUDE.md specifies no Server Actions — use fetch + Route Handlers |

**Deprecated/outdated:**
- `stripe.redirectToCheckout()`: Removed Sept 2025 — use server-side session creation + `router.push(url)`
- Pages Router webhook patterns: `req.on('data')` buffer accumulation — App Router uses `request.text()` directly

---

## Open Questions

1. **Stripe Price IDs**
   - What we know: Plans are Starter ($79/mo) and Pro ($299/mo) — monthly only
   - What's unclear: Price IDs don't exist until created in Stripe Dashboard
   - Recommendation: Create Products + Prices in Stripe Dashboard as Wave 0 task; store IDs in env vars as `STRIPE_STARTER_PRICE_ID` and `STRIPE_PRO_PRICE_ID`

2. **Resend sender domain**
   - What we know: `RESEND_API_KEY` likely exists (STATE.md mentions it); `resend@6.9.2` is installed
   - What's unclear: Whether a verified sending domain is configured in Resend dashboard
   - Recommendation: Verify domain setup before running welcome email in production; use `onboarding@resend.dev` for development

3. **`stripe_customer_id` on org vs user**
   - What we know: The `organizations` table has `stripe_customer_id TEXT` already
   - What's unclear: STATE.md notes "Brief count reset column lives in organizations or profiles — reconcile at Phase 3 start"
   - Recommendation: Keep it on `organizations` — the billing relationship is org-level, not user-level. Confirmed by existing schema design.

4. **Settings navigation structure**
   - What we know: Sidebar has a "Settings" nav item pointing to `/settings` — but no `/settings` page exists
   - What's unclear: Should billing be at `/settings/billing` with a settings layout, or at `/billing` directly?
   - Recommendation: Create a minimal `src/app/(dashboard)/settings/` layout with a single "Billing" tab for now, with `/settings/billing` as the only child. Matches CONTEXT.md decision exactly. Future tabs (Account, Team) can be added without restructuring.

5. **Webhook endpoint registration**
   - What we know: Local dev needs Stripe CLI forwarding; production needs a registered endpoint
   - What's unclear: Whether the Stripe account/webhook endpoint is already created
   - Recommendation: Register `https://yourdomain.com/api/billing/webhook` in Stripe Dashboard during deployment; add `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` to the subscribed events list

---

## Sources

### Primary (HIGH confidence)
- Stripe official docs — `docs.stripe.com/api/checkout/sessions/create` — session creation parameters
- Stripe official docs — `docs.stripe.com/billing/subscriptions/webhooks` — subscription lifecycle events
- Stripe official docs — `docs.stripe.com/api/customer_portal/sessions/create` — billing portal session API
- Resend official docs — `resend.com/docs/send-with-nextjs` — email send pattern, API signature
- Verified in `package.json` — `stripe@20.3.1`, `resend@6.9.2` already installed
- Verified in `supabase/migrations/001_initial_schema.sql` — `stripe_customer_id` and `plan` columns exist

### Secondary (MEDIUM confidence)
- DEV Community "The Ultimate Guide to Stripe + Next.js (2026 Edition)" — webhook handler with `request.text()`, constructEvent pattern
- Pedro Alonso "Stripe + Next.js 15: The Complete 2025 Guide" — idempotency pattern (session ID check), portal session creation
- HookRelay "Complete Stripe Webhook Guide for Next.js" — production-ready webhook handler structure
- Supabase docs — `supabase.com/docs/guides/functions/examples/stripe-webhooks` — raw body `.text()` confirmed

### Tertiary (LOW confidence)
- STATE.md note about `stripe.redirectToCheckout()` removal (September 2025) — mentioned as a known concern, not independently verified in Stripe changelog

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK already installed, official docs consulted
- Architecture patterns: HIGH — verified against official Stripe docs and multiple current guides
- Pitfalls: HIGH — raw body pitfall confirmed across multiple sources; `redirectToCheckout` removal noted in STATE.md
- Database schema: HIGH — existing migration reviewed, column names verified

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (Stripe API patterns are stable; check for Stripe Node SDK major version bump)
