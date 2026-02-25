# Stack Research

**Domain:** AI-native product discovery SaaS — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page
**Researched:** 2026-02-25
**Confidence:** HIGH (all version numbers verified against npm registry; integration patterns verified against official Stripe docs and multiple 2025 guides)

---

## Scope

This research covers ONLY what is NEW for milestone v1.0. The existing stack (Next.js 16.1.6, React 19, Tailwind 4, Supabase, Anthropic SDK, Zod, Resend, Lucide) is already installed and validated. Do not re-install or modify those packages.

---

## New Capabilities Required

| Capability | What's Needed | Already Installed? |
|------------|---------------|--------------------|
| Brief v2 — UI Direction | No new packages. Prompt engineering + TypeScript types only. | N/A |
| Brief v2 — Data Model Hints | `shiki` for syntax highlighting of SQL/TypeScript code blocks | No |
| Coding Agent Export — Clipboard | Native `navigator.clipboard` API — no package needed | N/A |
| Coding Agent Export — .md download | Native browser `Blob` + anchor click pattern — no package needed | N/A |
| Stripe Billing — Checkout + Webhooks | `@stripe/stripe-js`, `@stripe/react-stripe-js` (client-side); `stripe` already installed server-side | Partially |
| Stripe Billing — DB schema | Postgres migration for `subscriptions` table | No |
| Landing Page — Waitlist | `resend` already installed; Supabase already installed for storage | Yes |
| Landing Page — UI Components | Tailwind 4 already covers this; no new component library needed | Yes |

---

## Recommended Stack Additions

### Core Technologies (New)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `shiki` | 3.23.0 | Syntax highlighting for Data Model Hints (SQL, TypeScript) in briefs | Zero client-side JS — renders highlighted HTML at server time via React Server Components. VS Code grammar quality. 3.x API is stable and widely adopted. No runtime bundle cost. |
| `@stripe/stripe-js` | 8.8.0 | Client-side Stripe.js for redirecting to Stripe Checkout | Required to load Stripe.js from Stripe's CDN (PCI compliance). Handles `loadStripe()` initialization. |
| `@stripe/react-stripe-js` | 5.6.0 | React bindings for Stripe — only needed if using EmbeddedCheckout | Optional if using redirect-to-hosted-checkout flow. Include if embedded checkout is chosen. |

**Note on `stripe` (server SDK):** Already installed at v20.3.1 (current). No upgrade needed.

### Supporting Libraries (New)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None beyond above | — | Clipboard, .md download, waitlist form all use native browser/platform APIs | See patterns section below |

---

## Detailed Decisions by Feature

### 1. Data Model Hints — Syntax Highlighting

**Use `shiki` 3.23.0 as a React Server Component.**

Data Model Hints render as SQL/TypeScript code blocks in brief panels. These are static content rendered on the server — there is no need for a client-side highlighter.

```typescript
// src/components/CodeBlock.tsx  (Server Component — no "use client")
import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  code: string
  lang: 'sql' | 'typescript'
}

export async function CodeBlock({ code, lang }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: 'github-dark',
  })
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

**Why not `react-syntax-highlighter` (v16.1.0) or `prism-react-renderer` (v2.4.1)?**
Both ship large client-side bundles (Prism grammar files, highlight.js). For static code display in a Server Component context, they add unnecessary client weight. Shiki renders at build/request time — zero JS to the client.

**Why not rehype-pretty-code?**
That's for MDX pipelines. Overkill for rendering known-format code blocks in a React component.

### 2. Coding Agent Export — Clipboard

**Use native `navigator.clipboard.writeText()` — no package needed.**

```typescript
// Pattern: reusable hook
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-HTTPS or old browsers not needed for this user base
    }
  }

  return { copy, copied }
}
```

Requires `"use client"`. Works in all modern browsers. Stripe target users are developers using HTTPS — no special fallback needed.

### 3. Coding Agent Export — .md File Download

**Use native `Blob` + anchor element — no package needed.**

```typescript
// Pattern: client component utility
export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

This is a well-established browser pattern (verified in Next.js App Router discussions). No server route needed — the export content is already in client state.

### 4. Stripe Billing

**Install `@stripe/stripe-js` and `@stripe/react-stripe-js`.**

The `stripe` server SDK (v20.3.1) is already installed. What's missing is the client-side piece.

**Chosen approach: Stripe Hosted Checkout (redirect), NOT EmbeddedCheckout.**

Rationale:
- Simpler implementation — no iframe, no `@stripe/react-stripe-js` context wrapping required
- The target user (founder-PM at Seed-Series A) is not price-sensitive to a redirect UX
- Avoids PCI compliance complexity on the client
- `stripe.redirectToCheckout()` has been removed — use `router.push(session.url)` instead
- EmbeddedCheckout makes sense for e-commerce at scale; SaaS with 2 tiers does not justify it

**Key implementation decisions:**

1. **Checkout Session created via Next.js API route** (`/api/billing/checkout`) — receives `planId`, creates Stripe Customer if needed, creates Checkout Session, returns `session.url` for client redirect.

2. **Webhook handler at `/api/billing/webhook`** — must read raw body via `await req.text()` (NOT `req.json()`) to preserve signature for `stripe.webhooks.constructEvent()`. Import `headers` from `next/headers` to get `stripe-signature`.

3. **Customer Portal at `/api/billing/portal`** — creates a Stripe Billing Portal session; redirects to Stripe-hosted management UI. This gives users subscription management without building custom UI.

4. **Critical webhook events to handle:**
   - `checkout.session.completed` — activate subscription in DB
   - `customer.subscription.updated` — update plan tier in DB
   - `customer.subscription.deleted` — downgrade/cancel in DB
   - `invoice.payment_failed` — flag payment issue, send email via Resend

5. **Idempotency** — store `stripe_event_id` and check before processing to prevent double-processing from Stripe retries.

**New Postgres migration required (`subscriptions` table):**

```sql
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan            TEXT NOT NULL DEFAULT 'free'  -- 'free' | 'starter' | 'pro'
                  CHECK (plan IN ('free', 'starter', 'pro')),
  status          TEXT NOT NULL DEFAULT 'inactive'
                  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: org members can read their subscription; only service role writes via webhook handler
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );
```

**Plan tier mapping:**
- `free` — no Stripe subscription (default new accounts)
- `starter` — $79/mo — Stripe Price ID from env (`STRIPE_STARTER_PRICE_ID`)
- `pro` — $299/mo — Stripe Price ID from env (`STRIPE_PRO_PRICE_ID`)

**New environment variables needed:**
```
STRIPE_SECRET_KEY          (already present in codebase, may not be set in .env.local)
STRIPE_WEBHOOK_SECRET      (new — from Stripe dashboard after creating webhook)
STRIPE_STARTER_PRICE_ID    (new — from Stripe dashboard)
STRIPE_PRO_PRICE_ID        (new — from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (new — needed for @stripe/stripe-js loadStripe())
```

### 5. Landing Page — Waitlist

**No new packages needed.** The required tools are already installed:

- **Supabase** — store waitlist emails in a `waitlist_signups` table (or a simple `email` field in an existing table). Simple `INSERT` with no RLS required on a public-facing endpoint.
- **Resend** — send confirmation email after signup. SDK already installed at v6.9.2. Add `RESEND_API_KEY` to `.env.local` if not already set.
- **Tailwind 4 + Lucide React** — all UI components. No shadcn/ui needed — the existing project doesn't use it and adding it now for one page is over-engineering.
- **Next.js App Router** — landing page as a public route (`/` or `/landing`), Server Component with a Client Component for the email input.

**Rate limiting for waitlist form:**
The target user base is small (design partners). A simple Supabase unique constraint on `email` is sufficient to prevent duplicates. Do not add Upstash Redis for rate limiting at this stage — premature optimization.

**Minimal waitlist table:**
```sql
CREATE TABLE waitlist_signups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Public insert, no RLS needed (or use service role key in API route)
```

---

## Installation

```bash
# New packages needed
npm install shiki @stripe/stripe-js @stripe/react-stripe-js
```

That is the complete addition. Three packages. Everything else uses existing stack or native browser APIs.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `shiki` 3.23.0 | `react-syntax-highlighter` 16.1.0 | Ships client-side Prism/highlight.js bundle. Unnecessary for Server Component usage. |
| `shiki` 3.23.0 | `prism-react-renderer` 2.4.1 | Client-side only. Would require `"use client"` and adds bundle weight for static content. |
| `shiki` 3.23.0 | `rehype-pretty-code` | Built for MDX pipelines. Adds remark/rehype dependency chain for a use case that doesn't need it. |
| Stripe Hosted Checkout (redirect) | EmbeddedCheckout | iframe adds complexity, requires React context, and the UX benefit is marginal for a 2-tier SaaS. |
| Stripe Hosted Checkout (redirect) | Custom Payment Element | Would require building custom payment form UI — Stripe Checkout already handles PCI compliance, error states, card UI. Not worth building for v1.0. |
| Native `navigator.clipboard` | `react-copy-to-clipboard` npm package | Unnecessary wrapper. The native API is simpler, synchronous in modern browsers, and avoids a dependency. |
| Native `Blob` download | Server-side API route for .md export | The brief content is already in client state. No round-trip to server needed. Client-side Blob is simpler. |
| No shadcn/ui for landing page | shadcn/ui | Not in existing codebase — adding for one page creates component system inconsistency. Tailwind 4 is sufficient. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-syntax-highlighter` | Adds 300KB+ to client bundle for static code display | `shiki` as Server Component |
| `stripe.redirectToCheckout()` | Removed from Stripe.js as of September 2025 changelog | `router.push(session.url)` after creating Checkout Session server-side |
| `req.json()` in webhook handler | Consumes request stream, breaks signature verification | `await req.text()` then pass string to `stripe.webhooks.constructEvent()` |
| Embedding raw Stripe secret key in client components | Security — exposes billing access | Only use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` client-side; all Stripe API calls server-only |
| Upstash Redis for waitlist rate limiting | Premature optimization — design partner scale doesn't justify it | Postgres UNIQUE constraint on email |
| `shadcn/ui` for landing page components | Not in existing codebase; inconsistent component system for one page | Tailwind 4 utility classes directly |

---

## Stack Patterns by Variant

**If using EmbeddedCheckout instead of redirect:**
- Keep `@stripe/react-stripe-js` (already included in recommended install)
- Wrap billing page in `<Elements>` provider
- Use `<EmbeddedCheckout clientSecret={clientSecret} />` component
- Requires `ui_mode: 'embedded'` in Checkout Session creation and returning `client_secret`

**If landing page needs A/B testing later:**
- Add Vercel Edge Config + Analytics — not needed for v1.0
- For now: single variant, measure with Supabase queries on `waitlist_signups`

**If syntax highlighting needs dark/light mode switching:**
- Use Shiki's dual-theme API: `themes: { light: 'github-light', dark: 'github-dark' }`
- Pair with Tailwind dark mode CSS variables for automatic switching
- Not required for v1.0 — pick one theme (recommend `github-dark` to match Cursor aesthetic)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `shiki` 3.23.0 | React 19, Next.js 16, Node.js 18+ | `codeToHtml()` is async — must be used in `async` Server Components. Works in RSC without client bundle. |
| `@stripe/stripe-js` 8.8.0 | Next.js 16 App Router | Use `loadStripe()` with publishable key. Initialize once, outside component. Stripe.js now versioned (v6.0.0 of Stripe.js SDK maps to API version). |
| `@stripe/react-stripe-js` 5.6.0 | React 19, `@stripe/stripe-js` 8.8.0 | Required only for EmbeddedCheckout. Peer dependency on `@stripe/stripe-js`. |
| `stripe` 20.3.1 (existing) | Node.js 18+, Next.js 16 API routes | Already installed. Used server-side only. Never import in `"use client"` components. |

---

## Integration Points

### How new stack pieces connect to existing code

**shiki → Brief display component:**
- `BriefPanel.tsx` (or equivalent) renders brief sections
- Add `<CodeBlock code={hint.field_type_sql} lang="sql" />` in the Data Model Hints section
- `CodeBlock` is a Server Component — must live outside any `"use client"` boundary
- If `BriefPanel` is a client component, extract `DataModelSection` as a separate server-rendered island

**@stripe/stripe-js → Billing page:**
- Create `/app/billing/page.tsx` with pricing cards
- On "Upgrade" click: `POST /api/billing/checkout` → receive `{ url }` → `window.location.href = url`
- No React context, no `<Elements>` wrapper needed for redirect flow

**Webhook → subscriptions table:**
- `/api/billing/webhook/route.ts` handles incoming Stripe events
- Updates `subscriptions` table via Supabase admin client (bypasses RLS intentionally — webhook runs with service role)
- Downstream: any auth-gated route checks `subscriptions.plan` and `subscriptions.status` to enforce limits

**Resend → Waitlist confirmation:**
- `/api/waitlist/route.ts` inserts email into `waitlist_signups`, then calls Resend
- `RESEND_API_KEY` must be set in `.env.local`
- Template: simple "You're on the waitlist" transactional email

---

## Sources

- [npm registry — shiki v3.23.0](https://www.npmjs.com/package/shiki) — version confirmed via `npm show shiki version`
- [Shiki official docs — Next.js integration](https://shiki.style/packages/next) — Server Component pattern verified
- [npm registry — @stripe/stripe-js v8.8.0](https://www.npmjs.com/package/@stripe/stripe-js) — version confirmed via `npm show`
- [npm registry — @stripe/react-stripe-js v5.6.0](https://www.npmjs.com/package/@stripe/react-stripe-js) — version confirmed via `npm show`
- [npm registry — stripe v20.3.1](https://www.npmjs.com/package/stripe) — existing package, version confirmed
- [Stripe Docs — Webhook signature verification](https://docs.stripe.com/webhooks/signature) — `req.text()` pattern verified
- [Stripe Docs — Build subscriptions integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions) — webhook events list
- [Stripe Docs — Webhook subscription events](https://docs.stripe.com/billing/subscriptions/webhooks) — event types confirmed
- [Stripe Docs — redirectToCheckout removal](https://docs.stripe.com/changelog/clover/2025-09-30/remove-redirect-to-checkout) — deprecation confirmed
- [Stripe + Next.js 15 Complete Guide 2025 — Pedro Alonso](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) — MEDIUM confidence (community guide, patterns cross-verified with official docs)
- [Next.js App Router webhook raw body discussion](https://github.com/vercel/next.js/discussions/48885) — `req.text()` pattern for webhook handlers
- [Supabase + Next.js waitlist pattern](https://tinloof.com/blog/how-to-build-a-waitlist-with-supabase-and-next-js) — MEDIUM confidence (community guide, no fundamental complexity here)

---

*Stack research for: Sightline v1.0 — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page*
*Researched: 2026-02-25*
