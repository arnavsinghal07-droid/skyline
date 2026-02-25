# Architecture Research

**Domain:** AI-native product discovery platform — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page
**Researched:** 2026-02-25
**Confidence:** HIGH

## Context: What Already Exists

This is a subsequent milestone research doc. The existing app is a **Next.js 15 single-app** (not the multi-package monorepo described in CLAUDE.md — the codebase at time of research is `src/` rooted in the project root). All API routes live at `src/app/api/`. No tRPC, no BullMQ, no Qdrant — the app uses direct Anthropic SDK calls from route handlers and Supabase for storage.

This matters for integration: new features plug into this actual architecture, not the idealized CLAUDE.md architecture.

## Standard Architecture

### System Overview (Current + New)

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Next.js 15 App (src/)                            │
├──────────────────────────────────────────────────────────────────────┤
│  PAGES (app router)                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  /query  │ │ /briefs  │ │/decisions│ │/dashboard│ │ / (new)   │  │
│  │ (exists) │ │ (exists) │ │ (exists) │ │ (exists) │ │ landing   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  API ROUTES (src/app/api/)                                            │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │ briefs/        │ │ stripe/      │ │ waitlist/    │ │ query/   │  │
│  │ generate (mod) │ │ checkout(new)│ │ subscribe(nw)│ │ (exists) │  │
│  │ save (mod)     │ │ webhook (new)│ │              │ │          │  │
│  │ export (new)   │ │ portal (new) │ │              │ │          │  │
│  └────────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │  Supabase    │ │  Anthropic   │ │   Stripe     │ │   Resend   │  │
│  │  Auth + DB   │ │  claude-*    │ │  Billing     │ │  Email     │  │
│  │  (exists)    │ │  (exists)    │ │  (new)       │ │  (new)     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `/api/briefs/generate` | Calls Anthropic, returns BriefContent JSON | EXISTS — extend with UIDirection + DataModelHints |
| `/api/briefs/save` | Persists brief to `briefs.content_json` | EXISTS — no change needed (JSONB already flexible) |
| `/api/briefs/export` | Formats 7-section export, serves as text or triggers download | NEW |
| `/api/stripe/checkout` | Creates Stripe checkout session for given price ID | NEW |
| `/api/stripe/webhook` | Handles Stripe events, syncs plan to `organizations.plan` | NEW |
| `/api/stripe/portal` | Creates customer portal session for subscription management | NEW |
| `/api/waitlist/subscribe` | Saves email to `waitlist_emails` table, triggers Resend email | NEW |
| `/(dashboard)/briefs/page.tsx` | Renders brief detail with new UIDirection + DataModelHints panels | MODIFY |
| `/(dashboard)/query/page.tsx` | Renders BriefPanel — extend for new brief sections | MODIFY |
| `/page.tsx` | Currently Next.js default page — replace with Sightline landing page | REPLACE |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Login/signup — no change
│   ├── (dashboard)/                # All protected pages — no change to routing
│   │   ├── briefs/
│   │   │   └── page.tsx            # MODIFY: add UIDirectionPanel, DataModelPanel, ExportButton
│   │   ├── query/
│   │   │   └── page.tsx            # MODIFY: extend BriefPanel with new sections
│   │   └── layout.tsx              # FUTURE: add plan-gate check here for Pro features
│   ├── api/
│   │   ├── briefs/
│   │   │   ├── generate/
│   │   │   │   └── route.ts        # MODIFY: expand BriefContent type, extend prompt
│   │   │   ├── save/
│   │   │   │   └── route.ts        # NO CHANGE (JSONB absorbs new fields)
│   │   │   └── export/
│   │   │       └── route.ts        # NEW: formats 7-section coding agent package
│   │   ├── stripe/
│   │   │   ├── checkout/
│   │   │   │   └── route.ts        # NEW: POST — creates checkout session
│   │   │   ├── webhook/
│   │   │   │   └── route.ts        # NEW: POST — Stripe event handler
│   │   │   └── portal/
│   │   │       └── route.ts        # NEW: POST — creates billing portal session
│   │   └── waitlist/
│   │       └── subscribe/
│   │           └── route.ts        # NEW: POST — saves email, sends confirmation
│   ├── billing/                    # NEW: protected billing management page
│   │   └── page.tsx
│   ├── page.tsx                    # REPLACE: Sightline marketing landing page
│   └── layout.tsx                  # NO CHANGE
├── components/
│   ├── dashboard/
│   │   └── sidebar.tsx             # NO CHANGE
│   ├── briefs/                     # NEW: brief-specific sub-components
│   │   ├── UIDirectionPanel.tsx    # Renders screen-by-screen UI changes
│   │   ├── DataModelPanel.tsx      # Renders table/field hints as code blocks
│   │   └── ExportButton.tsx        # Clipboard + .md download trigger
│   └── landing/                   # NEW: landing page components
│       ├── Hero.tsx
│       ├── WaitlistForm.tsx        # Controlled inputs, calls /api/waitlist/subscribe
│       ├── FeatureGrid.tsx
│       └── PricingSection.tsx      # Shows Starter/Pro, links to Stripe checkout
├── lib/
│   ├── supabase/                   # NO CHANGE
│   ├── stripe.ts                   # NEW: Stripe singleton client
│   └── export-formatter.ts         # NEW: 7-section markdown formatter (pure function)
└── middleware.ts                   # MODIFY: add plan-gate redirect for Pro-only routes
```

### Structure Rationale

- **`components/briefs/`:** Isolated from the page so UIDirectionPanel and DataModelPanel can be reused in both `/query` (inline brief panel) and `/briefs` (detail view) without duplication.
- **`lib/export-formatter.ts`:** Pure function — takes BriefContent v2 + evidence + metadata, returns a markdown string. Testable independently of HTTP layer.
- **`lib/stripe.ts`:** Single Stripe client instance with the correct API version. Prevents version drift across route files.
- **`api/stripe/webhook/`:** Separate route from checkout — webhooks need raw body access and signature verification, which conflicts with standard JSON parsing.

## Architectural Patterns

### Pattern 1: Additive Type Extension for Brief v2

**What:** Extend `BriefContent` in `generate/route.ts` by adding `ui_direction` and `data_model_hints` fields to the existing interface. The `briefs.content_json` column is JSONB — it absorbs new fields without a schema migration.

**When to use:** When the DB column is already JSONB and downstream consumers (save route, briefs page) read from `content_json` generically. Zero migration risk.

**Trade-offs:** Old briefs in the DB have no `ui_direction` or `data_model_hints` — display components must handle `undefined` for these fields gracefully. This is correct behavior: old briefs are v1 and should render as before.

**Example:**
```typescript
// src/app/api/briefs/generate/route.ts — EXTENDED type
export interface UIDirectionScreen {
  screen_name: string
  changes: string[]
  new_components: string[]
  interactions: string[]
}

export interface UIDirection {
  screens: UIDirectionScreen[]
}

export interface DataModelHint {
  table: string
  operation: 'add_field' | 'new_table' | 'modify_field'
  field_name: string
  field_type: string
  rationale: string
}

export interface BriefContent {
  problem_statement: string
  proposed_solution: string
  user_stories: Array<{ role: string; action: string; outcome: string }>
  ui_direction?: UIDirection        // optional — absent on v1 briefs
  data_model_hints?: DataModelHint[] // optional — absent on v1 briefs
  success_metrics: string[]
  out_of_scope: string[]
}
```

### Pattern 2: Pure Formatter for Coding Agent Export

**What:** A pure function `formatCodingAgentExport(brief, queryResult, productContext)` returns a markdown string. The route handler calls this function and either returns it as `text/plain` for clipboard copy or wraps it with `Content-Disposition: attachment` headers for .md download.

**When to use:** Export logic should be testable without HTTP. Separating formatting from serving also makes it trivial to add new export targets later (e.g., Linear, Notion) without touching route code.

**Trade-offs:** Requires passing all context (brief + query recommendation + product name) to the formatter. The product name/context comes from the workspace — the export route must fetch it from Supabase.

**Example:**
```typescript
// src/lib/export-formatter.ts
export function formatCodingAgentExport(
  brief: BriefContent,
  query: string,
  recommendation: string,
  productName: string
): string {
  return `# Feature Brief: ${brief.problem_statement.slice(0, 60)}...

## 1. Context Block
Product: ${productName}
Query that generated this brief: "${query}"

## 2. Feature Description
${brief.proposed_solution}

## 3. Acceptance Criteria
${brief.user_stories.map(s => `- As a ${s.role}, I want ${s.action} so that ${s.outcome}.`).join('\n')}

## 4. UI Direction
${formatUIDirection(brief.ui_direction)}

## 5. Data Model Hints
${formatDataModel(brief.data_model_hints)}

## 6. Success Metrics
${brief.success_metrics.map(m => `- ${m}`).join('\n')}

## 7. Out of Scope
${brief.out_of_scope.map(i => `- ${i}`).join('\n')}
`
}
```

### Pattern 3: Stripe Webhook — Raw Body + Signature Verification

**What:** The Stripe webhook route handler must receive the raw request body (not parsed JSON) to validate the Stripe-Signature header. Use `await request.text()` not `await request.json()`. After signature verification, parse the event and route to handlers.

**When to use:** Every Stripe webhook implementation. Non-negotiable — without signature verification the endpoint accepts forged events.

**Trade-offs:** Cannot use Next.js's automatic body parsing. Must set `export const config = { api: { bodyParser: false } }` — though in App Router this is the default for custom handling with `request.text()`.

**Example:**
```typescript
// src/app/api/stripe/webhook/route.ts
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const body = await request.text()  // raw body — critical for signature check
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
  }
  if (event.type === 'customer.subscription.deleted') {
    await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
  }

  return new Response('OK', { status: 200 })
}
```

### Pattern 4: Plan Storage in `organizations.plan`

**What:** The `organizations` table already has a `plan TEXT` column (default `'free'`). Stripe webhooks update this field to `'starter'` or `'pro'` on `checkout.session.completed` and back to `'free'` on `customer.subscription.deleted`. Feature gating reads this field via the existing `auth_user_org_id()` RLS function.

**When to use:** The simplest plan gating approach for two tiers. No separate `subscriptions` table needed for v1.0 — the plan field is a denormalized snapshot of the current Stripe state, which is sufficient.

**Trade-offs:** Losing subscription history (no `current_period_end`, no renewal date visible to user). For v1.0 with two tiers and design partners, this is acceptable. Add a `subscriptions` table if you need renewal dates, invoice history, or seat counting.

The `organizations` table also already has `stripe_customer_id TEXT` — populate this on first checkout to enable customer portal redirect.

**Example — webhook handler:**
```typescript
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()  // service role — bypasses RLS
  const { customer, metadata } = session
  const { org_id, plan } = metadata as { org_id: string; plan: string }

  await supabase
    .from('organizations')
    .update({
      plan,
      stripe_customer_id: customer as string,
    })
    .eq('id', org_id)
}
```

### Pattern 5: Landing Page Replaces `/page.tsx`

**What:** The root `page.tsx` currently renders the Next.js default template. Replace it entirely with the Sightline marketing landing page. The landing page is a Server Component (no `'use client'`) at the page level, with client components (`WaitlistForm`) nested inside it.

**When to use:** Root route is always the marketing surface. Keep it a Server Component for SEO/metadata control; push interactivity down to leaf components.

**Trade-offs:** The waitlist form requires client-side state for the submit flow. Use a nested `WaitlistForm` client component that calls `/api/waitlist/subscribe` via `fetch`. Do not use `<form>` with server actions — per CLAUDE.md constraint (no HTML form tags, controlled React components).

## Data Flow

### Brief v2 Generation Flow

```
User clicks "Generate Feature Brief" (query/page.tsx)
    ↓
POST /api/briefs/generate
    { queryResult, query }
    ↓
Anthropic claude-haiku-4-5-20251001
    Prompt now asks for ui_direction + data_model_hints in addition to existing fields
    ↓
BriefContent v2 (7 fields) returned
    ↓
BriefPanel renders in query/page.tsx
    Shows new UIDirectionPanel + DataModelPanel sections
    ↓
User clicks "Save Brief"
    ↓
POST /api/briefs/save
    { brief: BriefContent v2, queryId }
    Saves to briefs.content_json (JSONB absorbs new fields — no migration)
```

### Coding Agent Export Flow

```
User clicks "Export for Cursor / Claude Code" (briefs/page.tsx or query/page.tsx)
    ↓
POST /api/briefs/export
    { briefId }
    ↓
Fetch brief from DB (includes content_json with ui_direction + data_model_hints)
    Fetch associated query from queries table (for recommendation + original question)
    Fetch workspace (for product name/context)
    ↓
formatCodingAgentExport() — pure function, returns markdown string
    ↓
User intent:
  "Copy" → response with text/plain + clipboard copy on client
  "Download" → response with Content-Disposition: attachment; filename="brief-export.md"
```

### Stripe Billing Flow

```
User on landing page or /billing → clicks "Start Starter / Pro"
    ↓
POST /api/stripe/checkout
    { priceId, orgId }   (priceId = Stripe price ID for Starter or Pro)
    ↓
stripe.checkout.sessions.create({
    customer: org.stripe_customer_id ?? undefined,  // reuse if exists
    metadata: { org_id, plan: 'starter' | 'pro' },
    success_url, cancel_url
})
    ↓
Redirect to Stripe Checkout (hosted page)
    ↓
Payment success → Stripe fires checkout.session.completed
    ↓
POST /api/stripe/webhook (raw body, signature verified)
    handleCheckoutComplete → UPDATE organizations SET plan = 'starter' WHERE id = org_id
    ↓
User lands on success_url (/dashboard)
    Plan now = 'starter' in DB — feature gates unlock immediately
```

### Waitlist Email Capture Flow

```
Visitor on / (landing page) enters email in WaitlistForm
    ↓
POST /api/waitlist/subscribe
    { email }
    ↓
INSERT INTO waitlist_emails (email, created_at)  [dedup: ON CONFLICT DO NOTHING]
    ↓
Resend.emails.send({
    from: 'Sightline <noreply@yourdomain.com>',
    to: email,
    subject: "You're on the Sightline waitlist",
    html: confirmationTemplate
})
    ↓
Return { success: true } or { error: 'already on list' }
    ↓
WaitlistForm shows confirmation state
```

### State Management

No Zustand or React Query is used in the existing codebase — state is managed with `useState` + `useEffect` + raw `fetch` calls directly in page components. New features follow the same pattern for consistency. Do not introduce Zustand or React Query as dependencies for this milestone.

## New vs. Modified — Explicit Breakdown

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/briefs/export/route.ts` | Coding agent export endpoint |
| `src/app/api/stripe/checkout/route.ts` | Creates Stripe checkout session |
| `src/app/api/stripe/webhook/route.ts` | Handles Stripe events, updates plan |
| `src/app/api/stripe/portal/route.ts` | Creates billing portal session for plan management |
| `src/app/api/waitlist/subscribe/route.ts` | Saves email to DB, sends Resend confirmation |
| `src/app/billing/page.tsx` | Dashboard billing management page (protected route) |
| `src/components/briefs/UIDirectionPanel.tsx` | Renders UI direction sections with screen steps |
| `src/components/briefs/DataModelPanel.tsx` | Renders data model hints as code blocks |
| `src/components/briefs/ExportButton.tsx` | Clipboard + download trigger, handles both actions |
| `src/components/landing/Hero.tsx` | Landing page hero with headline + CTA |
| `src/components/landing/WaitlistForm.tsx` | Email input + submit, controlled component |
| `src/components/landing/FeatureGrid.tsx` | Feature showcase grid |
| `src/components/landing/PricingSection.tsx` | Starter/Pro pricing cards with checkout CTA |
| `src/lib/stripe.ts` | Stripe singleton client |
| `src/lib/export-formatter.ts` | Pure markdown formatter for coding agent export |
| `supabase/migrations/002_billing.sql` | Adds `waitlist_emails` table + RLS |

### Modified Files

| File | What Changes |
|------|-------------|
| `src/app/api/briefs/generate/route.ts` | Extend `BriefContent` type; expand prompt to request `ui_direction` and `data_model_hints` |
| `src/app/(dashboard)/briefs/page.tsx` | Add `UIDirectionPanel`, `DataModelPanel`, `ExportButton` to `BriefDetail` component |
| `src/app/(dashboard)/query/page.tsx` | Add `UIDirectionPanel`, `DataModelPanel` to `BriefPanel` component |
| `src/app/page.tsx` | Replace Next.js default with Sightline landing page |
| `src/middleware.ts` | Add plan-gate redirect (Pro features → /billing if plan = 'free') |
| `src/app/layout.tsx` | Add Stripe.js script if using Embedded Checkout (optional for v1.0) |

### Database Changes

```sql
-- Migration 002_billing.sql

-- Add stripe_subscription_id for optional future use (nullable)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Waitlist table (not org-scoped — public signup before auth)
CREATE TABLE public.waitlist_emails (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  source     TEXT        NOT NULL DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Waitlist is public writes but service-role reads only
-- No RLS needed if only written by anon (waitlist) and read by admin queries
-- OR: enable RLS and allow insert for anon role
ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist: anyone can insert"
  ON public.waitlist_emails FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role reads waitlist (for admin/export)
```

## Integration Points

### External Services

| Service | Integration Pattern | Route / File | Notes |
|---------|---------------------|--------------|-------|
| Stripe | Server-side SDK, checkout session creation | `/api/stripe/checkout` | Never call Stripe from client — secret key exposure risk |
| Stripe Webhooks | Raw body + HMAC signature verify | `/api/stripe/webhook` | `request.text()` not `.json()` — mandatory |
| Stripe Customer Portal | Server-side session creation, redirect | `/api/stripe/portal` | Requires `stripe_customer_id` to exist on org |
| Resend | REST SDK, transactional email | `/api/waitlist/subscribe` | Already in `package.json`, zero new deps |
| Anthropic | Extend existing prompt — no new integration | `/api/briefs/generate` | Keep haiku for brief gen per CLAUDE.md |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `generate/route.ts` ↔ `briefs/page.tsx` | `BriefContent` TypeScript type (imported) | Extending the type is the only coupling — no breaking changes if fields are optional |
| `export/route.ts` ↔ `lib/export-formatter.ts` | Direct function import | Formatter is pure — test it separately from HTTP layer |
| `stripe/webhook` ↔ `organizations` table | Supabase admin client (service role) | Webhook runs outside user session — must use `createAdminClient()` not `createClient()`. Admin client already exists at `src/lib/supabase/admin.ts` |
| `WaitlistForm` ↔ `/api/waitlist/subscribe` | `fetch` POST with `{ email }` | Must use anon Supabase key or unauthenticated route — visitor has no session |
| `PricingSection` ↔ `/api/stripe/checkout` | `fetch` POST with `{ priceId }` | Checkout requires auth — user must be logged in to buy |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (design partners) | Current flat route-handler architecture is fine. No queue needed for export or email. |
| 100-1k users | Monitor brief generation latency — Anthropic calls in route handlers block. Add timeout handling. Consider streaming for large briefs. |
| 1k+ users | Move brief generation to background job (BullMQ). Current sync pattern will cause timeouts at scale. Webhook handler may need idempotency keys to prevent duplicate plan updates. |

### Scaling Priorities

1. **First bottleneck — Brief generation latency:** Anthropic calls take 3-8s. At >10 concurrent users this causes timeout errors. Fix: stream the brief (like query already does) or move to background job.
2. **Second bottleneck — Stripe webhook reliability:** If the webhook handler throws, Stripe retries for 72 hours. Ensure all DB operations in the handler are idempotent (use `ON CONFLICT DO UPDATE`).

## Anti-Patterns

### Anti-Pattern 1: Stripe Calls from Client Components

**What people do:** Import Stripe publishable key on the client and try to create checkout sessions or confirm payments there.
**Why it's wrong:** Requires exposing enough context to reconstruct session state client-side; invites misuse. Also violates CLAUDE.md rule against calling external APIs from `apps/`.
**Do this instead:** Client component posts to `/api/stripe/checkout`, which creates the session server-side and returns a `url` for redirect.

### Anti-Pattern 2: JSON Body Parsing in Webhook Handler

**What people do:** Use `await request.json()` in the Stripe webhook route, then try to call `stripe.webhooks.constructEvent()`.
**Why it's wrong:** Stripe signature verification requires the exact raw bytes of the body. JSON parsing re-serializes the body, changing whitespace and potentially field ordering, causing signature mismatch.
**Do this instead:** `const body = await request.text()` — always, in every Stripe webhook handler.

### Anti-Pattern 3: Schema Migration for Brief v2

**What people do:** Add `ui_direction JSONB` and `data_model_hints JSONB` columns to the `briefs` table.
**Why it's wrong:** The `briefs.content_json` column is already JSONB and already stores the full brief object. Adding columns duplicates storage and creates a split between new fields (columns) and old fields (content_json). Queries must join both places.
**Do this instead:** Extend the TypeScript `BriefContent` interface. The new fields land inside `content_json` automatically. Old briefs just have `undefined` for those keys — handle in display components.

### Anti-Pattern 4: HTML Form Tag on Waitlist

**What people do:** `<form action="/api/waitlist/subscribe" method="POST">` with a submit button.
**Why it's wrong:** Violates CLAUDE.md architecture constraint (no HTML form tags). Also loses control over loading/success/error states.
**Do this instead:** Controlled `<input>` with `value`/`onChange`, `<button onClick={handleSubmit}>`. Manage state with `useState`.

### Anti-Pattern 5: Rendering UIDirection as Prose

**What people do:** Take the `ui_direction.screens` array and join it into a paragraph with commas.
**Why it's wrong:** UI direction is structured step-by-step information. Prose obscures the screen-by-screen structure that coding agents need to parse.
**Do this instead:** `UIDirectionPanel` renders each screen as a named section with a bulleted list of changes, new components, and interactions. Coding agents should be able to map this to file paths and component names directly.

## Build Order

The following order minimizes blocked work and respects dependencies:

### Step 1: Brief v2 (Unblocks everything downstream)

1. Extend `BriefContent` type in `generate/route.ts` — add `UIDirection`, `DataModelHint` interfaces.
2. Expand the brief generation prompt to request `ui_direction` and `data_model_hints` sections.
3. Build `UIDirectionPanel.tsx` — renders screens with changes/components/interactions lists.
4. Build `DataModelPanel.tsx` — renders data model hints as syntax-highlighted code blocks.
5. Add both panels to `BriefPanel` in `query/page.tsx` (inline brief after query).
6. Add both panels to `BriefDetail` in `briefs/page.tsx` (saved briefs view).
7. Test end-to-end: generate query, generate brief, verify new sections appear and save correctly.

**Why first:** Everything downstream depends on `BriefContent` v2 existing. Export needs the new fields. The type extension is the critical path for the whole milestone.

### Step 2: Coding Agent Export (Depends on Brief v2)

1. Write `lib/export-formatter.ts` — pure function, test it with a sample brief object.
2. Build `api/briefs/export/route.ts` — fetches brief + query + workspace, calls formatter, returns text or triggers download.
3. Build `ExportButton.tsx` — two actions (Copy to clipboard / Download .md), handles loading state.
4. Add `ExportButton` to `briefs/page.tsx` detail panel (next to Log Decision button).
5. Add `ExportButton` to `query/page.tsx` brief panel (after Save Brief button).

**Why second:** Can be built and tested independently once Brief v2 is done. No dependency on billing.

### Step 3: Stripe Billing (Independent of Brief v2/Export)

1. Write `lib/stripe.ts` singleton.
2. Build `api/stripe/checkout/route.ts` — creates session with `org_id` + `plan` in metadata.
3. Build `api/stripe/webhook/route.ts` — handles `checkout.session.completed` and `customer.subscription.deleted`.
4. Run migration `002_billing.sql` (add `stripe_subscription_id` to `organizations`).
5. Build `api/stripe/portal/route.ts` — for subscription management from /billing page.
6. Build `app/billing/page.tsx` — shows current plan, upgrade/downgrade CTAs.
7. Add billing link to sidebar.
8. Test webhook locally with Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).

**Why third:** Independent of Brief v2 — can proceed in parallel if two engineers available. Placed third because design partners need briefs more than billing.

### Step 4: Landing Page (Independent, lowest risk)

1. Replace `src/app/page.tsx` with Sightline marketing page (Server Component shell).
2. Run migration for `waitlist_emails` table (included in `002_billing.sql` or separate `003_waitlist.sql`).
3. Build `api/waitlist/subscribe/route.ts` — insert email, send Resend confirmation.
4. Build landing components: `Hero.tsx`, `WaitlistForm.tsx`, `FeatureGrid.tsx`, `PricingSection.tsx`.
5. Wire `PricingSection` CTAs to login + checkout flow.
6. Set up metadata/OG tags in `layout.tsx` for SEO.

**Why last:** Lowest technical risk, highest visual effort. Does not block anything. Ship it last to avoid spending time on copy/design before the core product is solid.

## Sources

- Stripe + Next.js 15 App Router webhook pattern: [DEV Community guide](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) — MEDIUM confidence (community post, verified against Stripe official docs pattern)
- Stripe raw body requirement: [Stripe Docs — Webhook signatures](https://stripe.com/docs/webhooks/signatures) — HIGH confidence (official)
- Waitlist + Supabase + Next.js: [Tinloof guide](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) — MEDIUM confidence (community, pattern is standard)
- Clipboard API in Next.js: [EfficientUser](https://efficientuser.com/2024/03/07/copy-to-clipboard-in-next-js-embrace-the-clipboard-api/) — HIGH confidence (browser API, well-established)
- Existing codebase: Direct inspection of `src/` — HIGH confidence

---
*Architecture research for: Sightline — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page*
*Researched: 2026-02-25*
