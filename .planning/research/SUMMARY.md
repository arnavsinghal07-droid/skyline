# Project Research Summary

**Project:** Sightline v1.0 — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page
**Domain:** AI-native product discovery SaaS (PM tool)
**Researched:** 2026-02-25
**Confidence:** HIGH

## Executive Summary

Sightline v1.0 is a milestone that closes the gap between "product discovery" and "coding agent handoff" — the core YC thesis. The research confirms that the work is incremental: the existing Next.js 15 app with Supabase, Anthropic SDK, and a working brief generator provides a solid foundation. Only three new npm packages are needed (`shiki`, `@stripe/stripe-js`, `@stripe/react-stripe-js`). The critical path runs through Brief v2 — the `BriefContent` type extension and prompt expansion unlock every downstream feature: export, plan gating, and the agent handoff package. Nothing else can be completed or meaningfully tested until Brief v2 exists.

The recommended build order is: Brief v2 first (highest leverage, everything depends on it), then Coding Agent Export (depends on v2 types), then Stripe Billing (independent but required before outreach), then Landing Page (independent, lowest risk, ship last). The architecture calls for additive changes to existing files, not new infrastructure: the JSONB `content_json` column absorbs new brief fields without a migration, the existing `organizations.plan` column handles plan state, and the export formatter is a pure TypeScript function with no new dependencies. This is a deliberate, low-risk milestone.

The dominant risk category is **integration correctness**, not architectural complexity. Three failure modes stand out: (1) Stripe webhook handlers processed multiple times without idempotency, leading to corrupted plan state; (2) the Stripe-to-DB plan update racing with the checkout redirect, causing users to see "Free" after paying; and (3) Brief v2's JSON output being silently truncated by an undersized `max_tokens` budget. All three are preventable with explicit, well-documented countermeasures. The security surface is tight: plan enforcement must live in API route handlers (not middleware), the Stripe webhook secret must never be a `NEXT_PUBLIC_` variable, and the waitlist table RLS must grant `INSERT` to `anon` but no `SELECT`.

## Key Findings

### Recommended Stack

The existing stack handles everything. The stack additions for v1.0 are minimal by design: `shiki` for server-side syntax highlighting of Data Model Hints (renders at request time with zero client bundle cost), and `@stripe/stripe-js` for client-side Stripe.js initialization required for PCI-compliant checkout. The server-side Stripe SDK (`stripe` v20.3.1) is already installed. Clipboard copy uses native `navigator.clipboard` API; `.md` download uses native `Blob` + anchor pattern — no packages needed.

**Core technologies (new):**
- `shiki` 3.23.0 — syntax highlighting for SQL/TypeScript code blocks in briefs — zero client-side JS, renders as Server Component, VS Code grammar quality
- `@stripe/stripe-js` 8.8.0 — loads Stripe.js from CDN for PCI-compliant checkout initiation — required for `loadStripe()` even in redirect (non-embedded) flow
- `@stripe/react-stripe-js` 5.6.0 — React bindings for Stripe — only needed if switching to EmbeddedCheckout; include for optionality but use redirect flow for v1.0

**Critical notes:**
- `stripe.redirectToCheckout()` was removed in September 2025 — use `router.push(session.url)` after server-side session creation
- Stripe webhook handler must use `await request.text()` not `await request.json()` — JSON parsing breaks signature verification
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is the only Stripe key safe for client-side use

### Expected Features

The existing app ships 6 modules: signal ingestion, discovery query interface, brief generator (v1), briefs page, decision log, and onboarding. This milestone adds 4 capabilities that complete the core loop.

**Must have (table stakes for this milestone):**
- Brief v2: UI Direction section — evidence-grounded, screen-by-screen; the "Cursor for PMs" claim is hollow without it
- Brief v2: Data Model Hints section — typed table/field hints with rationale; required for the coding agent handoff
- Coding Agent Export: 7-section markdown package with clipboard copy — the entire point of Brief v2 is the handoff
- Stripe Checkout + webhooks + Customer Portal — required before any money changes hands
- Stripe plan-gated brief access (Starter: 10/mo, Pro: unlimited) — without enforcement, tiers are meaningless
- Landing page: hero + email capture form — required before any outreach; nowhere to send prospective users otherwise

**Should have (add after core is validated):**
- Landing page: product screenshots — take during Brief v2 build; add to landing page then
- Landing page: pricing transparency section — add once billing is live and tiers are confirmed
- Landing page: social proof quotes — add after first 2-3 design partners provide testimonials
- Brief count limit enforcement — add once usage warrants it
- Coding Agent Export: `.md` file download — trivial, do alongside clipboard if time permits

**Defer to v2+:**
- Annual billing discount — churn-reduction lever, premature for design partner phase
- Multi-seat / team billing — requires invite flows, seat counting, per-seat proration
- Figma / Linear / Notion export integrations — each is a 1-week integration; clipboard is sufficient for design partners
- Stripe metered usage billing — over-engineered for design partner scale
- Waitlist referral / viral mechanics — only worthwhile at 200+ waitlist signups
- Landing page blog / SEO content — long-term growth lever, not a launch requirement

**Anti-features to avoid:**
- Stripe Elements (custom payment form) — PCI complexity not justified for SaaS with 2 tiers and design partners
- `<form>` tags — violates CLAUDE.md; use controlled React components
- Pricing as a separate route — friction before product is seen; inline on landing page

### Architecture Approach

The actual codebase is a Next.js 15 single app rooted at `src/` — not the multi-package monorepo described in the CLAUDE.md vision. New features plug into this actual architecture. All new work is additive: extend existing route handlers, add new route handlers, add new components in named subdirectories, and add a pure utility function for the export formatter. No new infrastructure (no BullMQ, no Qdrant, no tRPC) is introduced in this milestone.

**Major components:**
1. `src/app/api/briefs/generate/route.ts` (MODIFY) — extend `BriefContent` type; expand prompt to request `ui_direction` and `data_model_hints`; raise `max_tokens` to 4000; check `stop_reason`
2. `src/lib/export-formatter.ts` (NEW) — pure function that takes `BriefContent` v2 and returns 7-section markdown string; testable independently of HTTP
3. `src/app/api/stripe/` (NEW) — three route handlers: `checkout/`, `webhook/`, `portal/`; webhook uses `request.text()` and idempotency check
4. `src/components/briefs/` (NEW) — `UIDirectionPanel.tsx`, `DataModelPanel.tsx`, `ExportButton.tsx`; reused in both `/query` and `/briefs` pages
5. `src/components/landing/` (NEW) — `Hero.tsx`, `WaitlistForm.tsx`, `FeatureGrid.tsx`, `PricingSection.tsx`; `WaitlistForm` is the only client component
6. `src/app/page.tsx` (REPLACE) — marketing landing page replacing Next.js default; Server Component with nested client `WaitlistForm`
7. `supabase/migrations/002_billing.sql` (NEW) — adds `stripe_subscription_id` to `organizations`, creates `waitlist_emails` table with correct RLS

**Key patterns:**
- Additive type extension: `ui_direction?` and `data_model_hints?` are optional on `BriefContent` — old briefs render as before; new sections guarded with `?.` optional chaining everywhere
- Plan storage in `organizations.plan` (already exists as `TEXT` column) — denormalized snapshot updated by webhook; no separate `subscriptions` table needed for v1.0
- Stripe plan enforcement in API route handlers, not middleware — middleware is auth-only

### Critical Pitfalls

1. **BriefContent backward compatibility break** — Making `ui_direction` required on `BriefContent` causes runtime crashes on all existing briefs in the database (they have no such field in their JSONB). Prevent by marking fields optional (`ui_direction?: UIDirection`) and adding `?.` guards everywhere that accesses them. Test by selecting and rendering an existing brief immediately after the type change.

2. **max_tokens truncation causes silent JSON corruption** — The existing `max_tokens: 1500` budget is insufficient for Brief v2 output (two new structured sections add 600–1000 tokens). Claude returns truncated JSON mid-object; `JSON.parse` throws; users see a generic 500. Prevent by raising `max_tokens` to 4000 and explicitly checking `message.stop_reason === 'max_tokens'` before parsing — return a structured error, not a crash.

3. **Stripe webhook race condition: redirect arrives before webhook** — User completes checkout and lands on the success URL before the `checkout.session.completed` webhook fires (webhooks lag 1-5 seconds). DB still shows `plan = 'free'`. Prevent by polling `stripe.checkout.sessions.retrieve(sessionId)` on the success page and showing a "Processing upgrade..." state until the plan updates, rather than trusting the URL parameter.

4. **Stripe webhook double-processing without idempotency** — Stripe retries on non-200 responses. A partially-completed webhook handler (plan updated but email not sent) will be retried, causing duplicate side effects (duplicate emails, duplicate plan writes). Prevent by creating a `webhook_events` table keyed on `stripe_event_id` and short-circuiting with `return 200` if the event is already processed.

5. **Plan enforcement in middleware only (CVE-2025-29927 risk)** — The `x-middleware-subrequest` header bypass (CVSS 9.1) lets attackers skip middleware on self-hosted Next.js. Plan enforcement must live in each API route handler, not middleware. Middleware should only check: does a valid Supabase session exist?

6. **Waitlist table RLS misconfiguration** — Enabling RLS without an explicit `anon` INSERT policy blocks all waitlist signups (403). Disabling RLS to fix it exposes all emails to anyone with the anon key. The correct policy: `FOR INSERT TO anon WITH CHECK (true)` with no SELECT policy for anon.

7. **Landing page visitors redirected to login by middleware** — The middleware calls `supabase.auth.getUser()` on all routes. Without excluding `/` and `/api/waitlist`, unauthenticated visitors hit the landing page and get redirected to `/login`. Prevent by updating the middleware matcher to exclude marketing routes before writing any landing page code.

## Implications for Roadmap

Based on combined research, the dependency graph is clear and maps to four sequential phases. The ordering is determined by two constraints: (1) Brief v2 is the dependency root for Export, and (2) Billing and Landing Page are fully independent of Brief v2 but depend on each other only for the Stripe CTA wiring in the pricing section.

### Phase 1: Brief v2 — UI Direction and Data Model Hints

**Rationale:** Every other feature in this milestone either depends on Brief v2 (Export) or benefits from it being complete (the landing page can show actual screenshots). This is the critical path. Nothing downstream is testable until `BriefContent` v2 exists with real data in both new sections.

**Delivers:** Evidence-grounded UI Direction and Data Model Hints in every new brief; full 7-field `BriefContent` type; prompt expanded to produce structured JSON for both sections; `UIDirectionPanel` and `DataModelPanel` components rendering in both `/query` and `/briefs` pages; `shiki` installed for code block syntax highlighting.

**Addresses features:** Brief v2 UI Direction (P1), Brief v2 Data Model Hints (P1), landing page screenshots (P2 — take screenshots during this phase).

**Avoids pitfalls:** BriefContent backward compatibility break (mark fields optional, add guards); max_tokens truncation (raise to 4000, add stop_reason check); stale export content (add `brief_version` field).

**First actions:**
- Mark `ui_direction` and `data_model_hints` as optional in `BriefContent` interface
- Raise `max_tokens` to 4000 and add `stop_reason` handling before touching the prompt
- Extend the prompt to produce both new sections with evidence-grounding constraints

### Phase 2: Coding Agent Export

**Rationale:** The 7-section export package is the product's primary differentiator — the "PM to coding agent handoff" that no competitor ships. It cannot be built until Brief v2 exists (sections 4 and 5 of the export come from `ui_direction` and `data_model_hints`). Building it immediately after Brief v2 is complete ensures the full value proposition is demonstrable before showing investors or design partners.

**Delivers:** `lib/export-formatter.ts` pure function producing 7-section markdown; `/api/briefs/export` route handler; `ExportButton` component with clipboard copy and `.md` download; export available from both `/briefs` detail view and `/query` brief panel.

**Addresses features:** Coding agent export clipboard (P1), coding agent export `.md` download (P1), 7-section structured package (P1 — differentiator).

**Avoids pitfalls:** Stale v1 brief export (check `brief_version` before compiling); missing file path suggestions (include `## Suggested File Paths` section); clipboard permission error (catch `DOMException`, show user-facing message).

**First actions:**
- Write and unit-test `export-formatter.ts` with a fixture `BriefContent` v2 object before touching HTTP layer
- Add `brief_version` field to `BriefContent` and the brief generation prompt

### Phase 3: Stripe Billing

**Rationale:** Billing is independent of Brief v2 and Export — it can technically run in parallel if two engineers are available. Placed third because design partners prioritize seeing the brief handoff work over paying, and because the webhook infrastructure (idempotency table, race condition handling) requires careful, sequential implementation. Rushing billing creates irreversible trust damage.

**Delivers:** `lib/stripe.ts` singleton; `/api/stripe/checkout`, `/api/stripe/webhook`, `/api/stripe/portal` route handlers; `supabase/migrations/002_billing.sql`; `/app/billing/page.tsx` with current plan display and upgrade/downgrade CTAs; plan-gated brief generation (check `organizations.plan` in generate route handler before calling Anthropic); sidebar billing link.

**Addresses features:** Stripe Checkout + webhooks (P1), Stripe Customer Portal (P1), Stripe plan-gated access (P1).

**Avoids pitfalls:** Webhook race condition (poll `sessions.retrieve` on success page, show loading state); double-processing (implement `webhook_events` idempotency table first, before any other webhook work); plan enforcement in middleware only (verify plan in generate route handler, never middleware); Stripe secret in `NEXT_PUBLIC_` (env var audit before first test checkout).

**First actions:**
- Build `/api/stripe/webhook` route handler with idempotency table before building the checkout flow — the webhook is the source of truth for plan state
- Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Phase 4: Landing Page

**Rationale:** The landing page is the lowest-risk, highest-visibility deliverable. It does not block anything — it only needs the waitlist email backend and (optionally) screenshots from Phase 1. Placed last because the landing page copy and design are only credible once the core product exists and works. Ship the product first, then surface it.

**Delivers:** Sightline marketing page at `/` replacing the Next.js default; `WaitlistForm` client component calling `/api/waitlist/subscribe`; `Hero`, `FeatureGrid`, `PricingSection` components; `supabase/migrations/003_waitlist.sql` with correct RLS; Resend confirmation email for waitlist signups; OG/SEO metadata.

**Addresses features:** Landing page hero + email capture (P1), landing page product screenshots (P2 — use Phase 1 screenshots), landing page pricing section (P2 — link to Stripe checkout from Phase 3).

**Avoids pitfalls:** Middleware blocking unauthenticated visitors (update matcher to exclude `/` and `/api/waitlist/*` before writing any landing page code); waitlist RLS misconfiguration (create migration with explicit anon INSERT policy, no SELECT policy, before building the form); no `<form>` tags (controlled `<input>` + `useState` + `onClick`).

**First actions:**
- Update middleware matcher to exclude marketing routes — this is the gate-check before any landing page work
- Create `003_waitlist.sql` migration with RLS configured correctly before building `WaitlistForm`

### Phase Ordering Rationale

- **Brief v2 first** because `BriefContent` v2 is the dependency root for the export package and the primary product claim of the milestone. The type must exist and be validated before anything downstream is built.
- **Export second** because it is the primary differentiator and immediately demonstrates the full loop: discovery → brief → agent handoff. Showing this to design partners (even without billing) validates the core thesis.
- **Billing third** because it is independent of the product features but required before outreach. Billing infrastructure (especially the webhook idempotency pattern) benefits from being built in isolation with full attention on correctness.
- **Landing page last** because it requires nothing except a working app to screenshot and a Resend API key. Building it last means the copy and visuals reflect the real product, not a prototype.

### Research Flags

Phases where deeper research is NOT needed (patterns are well-documented and straightforward):

- **Phase 1 (Brief v2):** Prompt engineering is the only uncertainty — the TypeScript patterns and rendering approach are fully specified. No external integrations, no new infrastructure.
- **Phase 2 (Export):** Pure function formatting and browser APIs. Fully deterministic, well-understood.
- **Phase 4 (Landing Page):** Standard Next.js Server Component + Tailwind patterns. No unknowns.

Phases that warrant careful pre-implementation review (not full research, but re-read official docs):

- **Phase 3 (Stripe Billing):** The idempotency table pattern and webhook handler are well-documented but have high-severity failure modes if implemented incorrectly. Re-read the Stripe webhook signature verification docs and test locally with the Stripe CLI before deploying to production. Pay special attention to the race condition between checkout redirect and webhook delivery.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All version numbers verified against npm registry; 3 new packages with stable APIs; everything else is already installed and working |
| Features | HIGH | Clear dependency graph; feature priorities match the YC thesis directly; competitive analysis confirms no overlapping products ship UI Direction or Data Model Hints |
| Architecture | HIGH | Based on direct inspection of the actual codebase; additive patterns with no new infrastructure; JSONB flexibility eliminates migration risk for brief extension |
| Pitfalls | HIGH | Critical pitfalls verified against official Stripe docs, Supabase docs, and CVE-2025-29927 disclosure; not inferred — specific failure modes with specific countermeasures |

**Overall confidence:** HIGH

### Gaps to Address

- **Anthropic structured outputs API vs. prompt-based JSON** — The pitfalls research flags that `JSON.parse(rawText)` with regex fence-stripping is fragile. The Anthropic structured outputs API (now GA) provides a more robust alternative. The implementation should decide between: (a) use the structured outputs `output_config.format` to guarantee schema-compliant JSON, or (b) keep the existing prompt-based JSON approach but add `stop_reason` checking. Both work; structured outputs is the more robust path. Decide at the start of Phase 1.

- **`@stripe/react-stripe-js` necessity** — Research recommends including it for optionality but notes it is only needed for EmbeddedCheckout. If the decision is firmly "redirect flow only," this package can be omitted. Low stakes — decide at Phase 3 start.

- **Brief count reset on billing cycle** — FEATURES.md specifies resetting `briefs_count_this_period` to 0 on each billing cycle via the `invoice.paid` webhook event. The database column (`briefs_count_this_period`) is not yet created; this requires either adding it to `profiles` (per FEATURES.md) or to `organizations` (where the plan lives). Reconcile this schema location at the start of Phase 3.

- **Resend domain verification** — The waitlist confirmation email requires a verified sender domain in Resend. If this is not already configured, Phase 4 will block on Resend setup. Verify `RESEND_API_KEY` and sender domain before starting Phase 4.

## Sources

### Primary (HIGH confidence)
- npm registry — `shiki` v3.23.0, `@stripe/stripe-js` v8.8.0, `@stripe/react-stripe-js` v5.6.0, `stripe` v20.3.1 — version verification
- Stripe Docs — Webhook signature verification, `checkout.session.completed` event handling, billing portal session creation
- Stripe Docs — `stripe.redirectToCheckout()` removal (September 2025 changelog)
- Supabase Docs — Row Level Security, anon role policies
- Anthropic Docs — Structured outputs API, token limits
- CVE-2025-29927 — Next.js middleware bypass, CVSS 9.1 — plan enforcement must be in route handlers
- Existing codebase inspection — `src/` structure, `organizations` table schema, existing `BriefContent` type, `briefs.content_json` JSONB column

### Secondary (MEDIUM confidence)
- Pedro Alonso — Stripe + Next.js 15 complete guide (2025) — integration patterns cross-verified with official docs
- DEV Community — Stripe + Next.js 15 App Router webhook pattern — cross-verified
- Tinloof — Waitlist + Supabase + Next.js guide — standard pattern, low complexity
- AGENTS.md — Coding agent export format standard — adopted by OpenAI Codex, Google Jules, Cursor
- vercel/nextjs-subscription-payments — Reference implementation for Stripe + Next.js + Supabase billing pattern
- KolbySisk/next-supabase-stripe-starter — Reference implementation for plan gating pattern

### Tertiary (LOW confidence — validate during implementation)
- Landing page conversion rate claims (hero section, pricing transparency, social proof) — industry averages from multiple SaaS marketing guides; directionally correct, not precise

---
*Research completed: 2026-02-25*
*Ready for roadmap: yes*
