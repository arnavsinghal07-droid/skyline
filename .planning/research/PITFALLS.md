# Pitfalls Research

**Domain:** AI SaaS — extending brief generation, coding agent export, Stripe billing, and landing page on Next.js 15 + Supabase + tRPC
**Researched:** 2026-02-25
**Confidence:** HIGH (critical pitfalls verified via official docs and codebase inspection; integration pitfalls verified via multiple sources)

---

## Critical Pitfalls

### Pitfall 1: Extending the Brief JSON Schema Breaks Existing Saved Briefs

**What goes wrong:**
The existing `BriefContent` TypeScript interface is exported from `src/app/api/briefs/generate/route.ts` and imported in three places: `briefs/save/route.ts`, `briefs/page.tsx`, and `api/briefs/route.ts`. When you add `ui_direction` and `data_model_hints` to the interface, all code reading `content_json` from the database expects those fields to exist. Briefs saved before the change have neither field — they contain only the five original sections stored as a raw JSONB blob in the `briefs.content_json` column. TypeScript will compile cleanly because the type says the fields exist, but at runtime the render code will attempt `content_json.ui_direction.screens.map(...)` and throw `Cannot read properties of undefined`.

**Why it happens:**
`briefs.content_json` is a Postgres `JSONB NOT NULL DEFAULT '{}'` column with no enforced shape — it is a bag of JSON. The database applies no schema validation. All 5-section briefs in production have the old shape. The TypeScript interface is added as a compile-time overlay, but the actual bytes stored predate the new sections. Developers often do not consider that "existing rows" still exist after a type change.

**How to avoid:**
1. Make `ui_direction` and `data_model_hints` optional in the TypeScript interface: `ui_direction?: UIDirection` and `data_model_hints?: DataModelHint[]`.
2. Add null-coalescing guards in every render path: `content_json.ui_direction?.screens ?? []`.
3. Do not change `NOT NULL` to required fields in the interface until a backfill migration has been run.
4. If you want to enforce the new shape on new saves, add Zod validation to `briefs/save/route.ts` that rejects briefs missing the new sections rather than silently storing broken data.

**Warning signs:**
- BriefDetail component crashes immediately when selecting any brief saved before the upgrade
- TypeScript reports `BriefContent` as valid but runtime throws on `undefined.screens`
- `briefs/page.tsx` shows a blank detail panel or React error boundary fallback after deploying

**Phase to address:** Brief v2 phase — first action before any prompt changes

---

### Pitfall 2: max_tokens Too Low Causes Silent JSON Truncation in Brief v2

**What goes wrong:**
The existing brief generator uses `max_tokens: 1500`. Adding two new sections (UI Direction with per-screen object arrays, and Data Model Hints with per-field objects) roughly doubles the output size. Claude will generate a valid JSON opening — `{ "problem_statement": ..., "ui_direction": { "screens": [` — then hit the token limit and stop mid-JSON. The API returns a message with `stop_reason: "max_tokens"` rather than `"end_turn"`. The current code does `JSON.parse(rawText)` directly: the parse will throw a SyntaxError. The catch block returns a generic 500, the frontend shows "Failed to generate brief", and the user has no idea why.

**Why it happens:**
Brief generation was budgeted for five text fields. Two new sections introduce nested arrays of structured objects. UI Direction alone can produce 400–600 tokens for a simple feature (three screens, each with 4–5 component names and 3–4 interactions). Data Model Hints add another 200–400 tokens per table operation. The existing 1500-token budget is now undersized by at least 2x.

**How to avoid:**
1. Raise `max_tokens` to at least `4000` for the Brief v2 prompt. Briefs are non-streaming so latency impact is acceptable.
2. Check `message.stop_reason` before parsing: if it equals `"max_tokens"`, return a structured error with `{ error: 'BRIEF_TRUNCATED', message: 'Brief too long — try a more specific query' }` rather than a JSON parse failure.
3. Use Anthropic's structured outputs (`output_config.format`) to guarantee schema-compliant JSON even when complex — this prevents malformed partial output from being returned at all.
4. Log token usage (`message.usage.output_tokens`) in production to detect approaching limits before they become user-facing failures.

**Warning signs:**
- `message.stop_reason` is `"max_tokens"` in server logs
- Error rate spikes for briefs with many user stories or complex product areas
- `JSON.parse` throws `SyntaxError: Unexpected end of JSON input`

**Phase to address:** Brief v2 phase — update max_tokens and stop_reason handling before prompting for the new sections

---

### Pitfall 3: Stripe Webhook Events Arrive After the User Redirects Back — Access State Race Condition

**What goes wrong:**
After a user completes Stripe Checkout, they are redirected to your success URL (`/dashboard?upgrade=success`). At that moment, you want to show them their new plan. But the Stripe webhook for `checkout.session.completed` (which is where you should update `organizations.plan` in your database) has not yet arrived — webhooks are asynchronous and typically lag 1–5 seconds behind the redirect. The user lands on the dashboard, your code reads `organizations.plan` from the database, and it still shows `'free'`. They see no upgrade confirmation. Worse, if you enforce feature gates on plan status, the user cannot access features they just paid for.

**Why it happens:**
Many developers check `?upgrade=success` in the URL and immediately re-fetch the user's org, expecting the webhook to have already fired. In reality, Stripe fires the webhook asynchronously. The Checkout redirect and the webhook are two independent, non-synchronized events. Your database is only updated by your webhook handler — the checkout redirect itself tells you nothing you can safely act on.

**How to avoid:**
1. On the success redirect, do NOT use the URL parameter as proof of payment. Instead, immediately call your own API endpoint that polls Stripe directly for the session status via `stripe.checkout.sessions.retrieve(sessionId)` and returns the current subscription state. This is safe because Stripe's API reflects the completed payment before the webhook fires.
2. Store `stripe_customer_id` and `stripe_subscription_id` on the `organizations` table — write them in the `checkout.session.completed` webhook handler.
3. Implement a webhook idempotency table: store `stripe_event_id` and check before processing to prevent duplicate updates when Stripe retries deliveries.
4. Show a "Processing your upgrade..." UI with a polling loader if the plan hasn't updated within 5 seconds, rather than assuming success or failure.

**Warning signs:**
- Users reporting they were charged but still see "Free" plan after checkout
- Test mode: plan status does not update immediately after completing test checkout
- Race-triggered double-updates appear in logs when Stripe retries a webhook your handler already processed

**Phase to address:** Stripe billing phase — webhook handler must be the first thing built, before checkout flows

---

### Pitfall 4: Stripe Webhook Handler Processes Events Multiple Times (Missing Idempotency)

**What goes wrong:**
Stripe retries webhooks when your endpoint returns a non-200 status or times out. If your handler throws an error halfway through processing `customer.subscription.updated` — after updating `organizations.plan` but before writing the `stripe_subscription_id` — Stripe retries the event. Your handler runs again, finds the plan already updated, and writes the subscription ID again. This creates duplicate side effects: double emails, double feature grants, corrupted subscription state.

**Why it happens:**
Webhook handlers are not inherently idempotent. A single database write is not atomic with sending an email, updating a second table, and returning 200. If anything in the middle of the handler throws, the work is partially complete and Stripe will send the event again.

**How to avoid:**
1. Create a `webhook_events` table: `(id UUID PK, stripe_event_id TEXT UNIQUE, processed_at TIMESTAMPTZ)`.
2. At the start of every webhook handler, check if `stripe_event_id` already exists. If it does, return 200 immediately without doing any work.
3. After processing, insert the `stripe_event_id` into the table.
4. Verify webhook signatures using `stripe.webhooks.constructEvent(body, sig, secret)` before doing any processing — reject requests without a valid signature with 400, not 200.
5. Return 200 as quickly as possible; do heavy work (emails, external calls) via BullMQ jobs, not synchronously in the webhook handler.

**Warning signs:**
- Duplicate rows appearing in database after a Stripe retry storm (test by returning 500 deliberately from your webhook)
- Users getting multiple "Welcome to Pro" emails
- `stripe_subscription_id` column getting overwritten with same value multiple times

**Phase to address:** Stripe billing phase — implement before going live with any paid plan

---

### Pitfall 5: Plan Gates Enforced Only in Middleware — Bypassable

**What goes wrong:**
If you enforce "Pro feature" access in Next.js middleware by checking a cookie or session property, attackers can bypass it entirely. CVE-2025-29927 (CVSS 9.1, disclosed March 2025) demonstrated that the `x-middleware-subrequest` header can be spoofed to make Next.js skip middleware execution on self-hosted deployments. Even without this CVE, middleware is the wrong layer for feature gating: it runs on the edge and does not have access to your real-time database state.

**Why it happens:**
Middleware is convenient — one place to check auth and plan. Developers conflate authentication checks (is the user logged in?) with authorization checks (does this user's plan allow this feature?). Authentication in middleware is acceptable; plan enforcement is not.

**How to avoid:**
1. Store the current plan in `organizations.plan` and verify it in every API route handler before returning restricted data, not in middleware.
2. Middleware should only check: is there a valid Supabase session cookie? If not, redirect to `/login`.
3. Feature gates belong in tRPC procedures or API route handlers: `if (org.plan !== 'pro') return { error: 'UPGRADE_REQUIRED' }`.
4. For the Brief v2 milestone specifically: if you gate "export to agent" on Pro plan, check `org.plan` in the export API route, not in middleware.
5. Upgrade Next.js to 15.2.3+ before going to production to patch CVE-2025-29927.

**Warning signs:**
- Plan check only exists in `middleware.ts`, not in API route handlers
- Running `next start` on a non-Vercel/Netlify host without the CVE patch applied
- A non-Pro user can access Pro API routes by hitting them directly via curl

**Phase to address:** Stripe billing phase — every new Pro feature route must gate in the route handler

---

### Pitfall 6: Landing Page Shares Middleware with the Authenticated App — Auth Loop Risk

**What goes wrong:**
The current `src/proxy.ts` middleware runs on all routes. When you add `/` as a public landing page and `/waitlist` for email capture, the middleware calls `supabase.auth.getUser()` on every request to those pages. For unauthenticated visitors, this is a no-op that still adds ~50–150ms latency from a Supabase network call. Worse, if the middleware redirects based on session state, unauthenticated visitors hitting the landing page get redirected to `/login`, making the public page invisible to prospective users.

**Why it happens:**
The middleware matcher does not exclude the public-facing routes. Developers forget that landing pages must be reachable by people who have never authenticated — the middleware must explicitly allow them through.

**How to avoid:**
1. Update the middleware matcher to exclude landing page routes: add `'/', '/waitlist', '/pricing'` to the negative pattern.
2. The current `src/proxy.ts` already excludes static assets — extend the same exclusion pattern to marketing routes.
3. Do not call `supabase.auth.getUser()` for routes that do not require auth. The session refresh call is only needed for authenticated routes.
4. Keep the landing page in the same Next.js app (no need for a separate deployment), but use a separate route group `(marketing)` in the App Router to visually separate it from `(dashboard)` routes.

**Warning signs:**
- Visiting `localhost:3000/` redirects to `/login` instead of showing the landing page
- Landing page adds ~150ms first byte time from unnecessary Supabase network call in middleware
- 401 errors in the browser console from anon Supabase requests on the landing page

**Phase to address:** Landing page phase — before writing any landing page copy, fix the middleware matcher

---

### Pitfall 7: Waitlist Email Capture Creates Unauthenticated Write — RLS Must Be Explicit

**What goes wrong:**
The landing page waitlist form needs to insert a row into a `waitlist_signups` table without the user being authenticated. If you create this table in Supabase without an explicit `anon` role INSERT policy, no one can write to it (RLS-enabled table with no policies defaults to denying all access). If you disable RLS on the table to "fix" the inserts, every row in the table is publicly readable — anyone with your anon key can read all waitlist emails. In January 2025, 170+ Lovable-built apps leaked data because of exactly this misconfiguration.

**Why it happens:**
All existing tables in this codebase follow the authenticated-only RLS pattern. A waitlist table is the first table that needs to accept unauthenticated inserts. The developer enables RLS (good) but forgets to write an INSERT policy for the `anon` role (bad) or disables RLS entirely to get it working quickly (worse).

**How to avoid:**
1. Create a new migration: `CREATE TABLE public.waitlist_signups (id UUID PK, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`.
2. Enable RLS: `ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY`.
3. Create only an INSERT policy for the anon role, no SELECT: `CREATE POLICY "waitlist: public insert" ON public.waitlist_signups FOR INSERT TO anon WITH CHECK (true)`.
4. This means unauthenticated users can insert but not read — no email scraping possible.
5. Add rate limiting at the API route level (e.g., 1 insert per IP per 60 seconds) to prevent spam submissions.
6. Alternatively, handle waitlist capture via a server action that calls Resend directly and never writes to a database table — simpler and avoids the RLS concern.

**Warning signs:**
- Supabase returns 403 when anon user tries to insert a waitlist email
- You disable RLS to "fix" the problem and inadvertently expose all emails
- No RLS policy on the `anon` role despite RLS being enabled

**Phase to address:** Landing page phase — create migration and RLS policy before building the waitlist form

---

### Pitfall 8: Coding Agent Export Assembles Stale Brief Content

**What goes wrong:**
The coding agent export endpoint will compile a 7-section markdown package from the brief stored in `briefs.content_json`. If the export is generated from a brief that was saved before the Brief v2 upgrade (no UI Direction or Data Model Hints), the exported package will be missing those sections. The coding agent receives a context block without UI direction and data model hints — exactly the sections that give it implementation guidance. The export looks complete (all 7 section headers are present) but several are empty or contain placeholder text.

**Why it happens:**
The export endpoint reads `content_json` as-is without checking whether the brief is v1 or v2. Developers write the export formatter assuming all briefs have all seven sections because the TypeScript type says so.

**How to avoid:**
1. Add a `brief_version: number` field to `content_json` (default 1 for existing briefs, 2 for new ones).
2. In the export formatter, check `brief_version` and either: a) refuse to export v1 briefs via the agent export path, returning `{ error: 'This brief was created before agent export was available. Regenerate to export.' }`, or b) generate the export with explicit "Not available — regenerate this brief" notices in the missing sections.
3. Make v2 brief sections required in the Zod schema for the export route specifically (different from the save route which must remain backward-compatible).

**Warning signs:**
- Export markdown contains empty `## UI Direction` and `## Data Model Hints` sections
- Users report that the exported package "doesn't include the component specs"
- TypeScript shows no type errors but exported content is empty strings

**Phase to address:** Coding agent export phase — check brief version before compiling export package

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline BriefContent type in `generate/route.ts` | No separate types file needed | Type is re-imported from a route file; circular dependency risk when adding export route | Acceptable now; move to `src/types/index.ts` in Brief v2 |
| `JSON.parse(rawText)` with regex markdown-fence stripping | Simple, works for current model | Fragile when Claude adds preamble text; breaks on any non-JSON prefix | Never acceptable for production — use structured outputs API |
| Storing full brief in single `content_json` JSONB column | Simple schema, no migrations needed | Cannot query into brief sections (e.g., "find all briefs with data model hints for table X") | Acceptable for v1.0 since no cross-brief queries are required yet |
| No `webhook_events` idempotency table | Faster to build | Stripe retries cause duplicate charges, double emails, corrupted plan state | Never acceptable for Stripe integration |
| Plan check in cookie/session only | No DB query on every request | Bypassable client-side; stale after plan changes | Never acceptable; always verify from DB in API routes |
| Landing page in same Next.js app, public routes not excluded from middleware | Avoids multi-repo complexity | Auth middleware runs on public pages, adding latency and risking redirect loops | Acceptable if middleware matcher is updated correctly |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Checkout | Reading plan from URL `?success=true` param to update access | Call `stripe.checkout.sessions.retrieve(sessionId)` server-side on return; only trust webhook for permanent DB update |
| Stripe Webhooks | Using `request.text()` or `request.json()` then trying to verify signature | Must use raw body bytes for `stripe.webhooks.constructEvent()` — Next.js route handler: `const body = await request.text()`, then verify, then parse |
| Stripe Customer Portal | Creating portal session without `stripe_customer_id` — creates duplicate customers | Always retrieve or create the customer first; store `stripe_customer_id` on org record at checkout creation time, not at first payment |
| Anthropic SDK | Current code: `const anthropic = new Anthropic()` at module scope in Next.js | If `ANTHROPIC_API_KEY` is missing, module-scope instantiation causes a build-time crash, not a runtime error. Move instantiation inside the handler or use a singleton in `src/lib/ai/client.ts` |
| Anthropic Structured Outputs | Using `max_tokens: 1500` with the new beta `output_config.format` | The structured outputs API is now GA — use `output_config: { format: { type: 'json_schema', schema: {...} } }` and raise `max_tokens` to 4000 for Brief v2 |
| Supabase anon key on landing page | Using the service role key in any public-facing route or client component | The anon key is the only safe key for public-facing inserts; service role bypasses RLS entirely |
| Clipboard API | Calling `navigator.clipboard.writeText(...)` in a Server Component or without `'use client'` | Always add `'use client'` to the export component; wrap in `if (typeof navigator !== 'undefined')` guard |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Brief export builds the entire markdown string synchronously in a Next.js API route | Fine at low volume; blocks event loop for large briefs with many sections | Stream the export as a plain text response; use `Response` with a `ReadableStream` | At 50+ concurrent exports |
| Stripe API called synchronously during webhook handler to fetch customer details | Slow webhook response → Stripe retries → cascade of retries | Store all needed data (plan, subscription ID) in the webhook payload itself; only call Stripe API when data is missing | At any scale — Stripe times out webhooks after 30s |
| Landing page static assets served through Next.js dynamic rendering | Slow TTFB, re-renders on every request | Mark landing page with `export const dynamic = 'force-static'` to enable static generation | At any real traffic volume |
| `briefs.content_json` queried without selecting specific fields | Entire JSONB blob transmitted on every list fetch | Select only `id, created_at, content_json->>'problem_statement'` for the list view; full brief only in detail view | At 100+ briefs per org |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Relying solely on Next.js middleware for plan enforcement (CVE-2025-29927 context) | Self-hosted deployments: any unauthenticated user can access Pro routes by sending `x-middleware-subrequest` header | Verify plan in every API route handler; upgrade to Next.js 15.2.3+ |
| Storing Stripe webhook secret in `NEXT_PUBLIC_` env var | Secret exposed in client bundle; attackers can forge webhook events | Stripe secret key and webhook secret must ONLY be in server-side env vars (no `NEXT_PUBLIC_` prefix) |
| Allowing `anon` role to SELECT from waitlist table | Email scraping — anyone with your anon key can dump all waitlist emails | Grant `INSERT` only to `anon`; no `SELECT` policy on the anon role |
| Accepting webhook payloads without signature verification | Attacker can send fake `customer.subscription.updated` events granting Pro access for free | Always call `stripe.webhooks.constructEvent(rawBody, stripeSignatureHeader, webhookSecret)` before processing |
| Using service role key to handle plan checks | RLS is bypassed; multi-tenant isolation breaks; a bug in plan logic reads other orgs' data | Plan checks must use the user-scoped Supabase client, never the service role client |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Brief v2 renders `ui_direction.screens` as a single prose block | PM reads it as marketing copy, not implementation spec | Render each screen as a header, each change as a numbered list item, each new component as an inline code block |
| "Copy to clipboard" button has no feedback state | User clicks once, doubts it worked, clicks again, pastes duplicate content | Show "Copied!" text for 2 seconds after successful write; handle `DOMException` if clipboard permission denied |
| Export button present on v1 briefs (no UI Direction / Data Model Hints) | User exports package to Claude Code; Claude Code asks clarifying questions because the guidance is missing | Disable or hide the export button on v1 briefs; show "Regenerate to export" tooltip |
| Stripe checkout redirects to a blank success page | User has no confirmation that the upgrade worked or what they now have access to | Success page shows current plan, new features unlocked, and a "Start using Pro features" CTA |
| Waitlist form accepts any string in the email field | Bot submissions, typos, non-emails; pollutes the list | Validate email format client-side with a regex and server-side with Zod before inserting |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Brief v2 prompt:** Often missing — verify that the prompt instructs Claude to produce UI Direction grounded in specific customer quotes from the evidence, not generic UX advice.
- [ ] **Brief v2 rendering:** Often missing — verify that `ui_direction?.screens` null-check is in place for existing v1 briefs; confirm data model hints render in a `<pre><code>` block with syntax highlighting.
- [ ] **Coding agent export:** Often missing — verify the export includes the `CONTEXT BLOCK` (product background, existing file paths from the codebase) not just the brief content; the export is only useful if it tells the agent where to put files.
- [ ] **Stripe webhook handler:** Often missing — verify `stripe.webhooks.constructEvent()` signature check is present, and that `stripe_event_id` idempotency check runs before any writes.
- [ ] **Stripe subscription state:** Often missing — verify `organizations.plan` is updated via webhook, not via checkout success redirect; verify it is set back to `'free'` on `customer.subscription.deleted` event.
- [ ] **Stripe billing portal:** Often missing — verify that the billing portal session is created with `return_url` pointing to your app, and that the customer can only see their own subscription, not others'.
- [ ] **Landing page middleware:** Often missing — verify that the middleware matcher excludes `/`, `/waitlist`, and any `/api/waitlist` route; confirm unauthenticated users can reach the landing page without being redirected to `/login`.
- [ ] **Waitlist RLS:** Often missing — verify that the `waitlist_signups` table has RLS enabled AND that the `anon` INSERT policy exists AND that there is no `anon` SELECT policy.
- [ ] **Clipboard export:** Often missing — verify that the copy function is inside a `'use client'` component and that the browser permission error is caught and shown to the user.
- [ ] **Max tokens on Brief v2:** Often missing — verify `max_tokens` is raised to at least 4000 and `stop_reason: 'max_tokens'` is detected and returned as a structured error.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Existing briefs crash on render after BriefContent type change | LOW | Add `?.` optional chaining to all `ui_direction` and `data_model_hints` accesses; no migration needed |
| JSON truncation causes 500 errors on Brief v2 generation | LOW | Increase `max_tokens`, add `stop_reason` check; no data loss since nothing was saved |
| Stripe webhook fires twice, plan updated twice (non-destructive) | LOW | Add idempotency table; review logs to confirm no duplicate charges; no refunds needed |
| Stripe webhook fires twice, email sent twice | MEDIUM | Add idempotency table; manually reach out to affected users; implement email deduplication |
| Stripe webhook not verified — fake event grants Pro access to free user | HIGH | Immediately add signature verification; audit `organizations.plan` vs actual Stripe subscriptions via Stripe dashboard; revoke unauthorized upgrades |
| Waitlist table has no RLS SELECT restriction — emails scraped | HIGH | Add RLS policy immediately; rotate Supabase anon key if scraping confirmed; notify affected users per GDPR/CCPA if required |
| Landing page redirects all visitors to login due to middleware | LOW | Update middleware matcher in `src/proxy.ts` to exclude marketing routes; redeploy |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| BriefContent backward compatibility break | Brief v2 | Existing brief renders correctly after type extension (test with pre-v2 fixture) |
| max_tokens truncation of Brief v2 JSON | Brief v2 | Generate 10 briefs with complex evidence; verify 0 `stop_reason: 'max_tokens'` in logs |
| Stripe checkout → redirect race condition | Stripe Billing | Verify plan updates after test checkout before webhook handler is deployed |
| Stripe webhook double-processing | Stripe Billing | Test by returning 500 from handler once; verify second delivery does not duplicate writes |
| Plan enforcement in middleware only | Stripe Billing | Hit Pro API route directly via curl with anon session; verify 403 returned |
| Middleware blocks landing page visitors | Landing Page | Verify `curl localhost:3000/` returns 200 without auth cookies |
| Waitlist table RLS misconfiguration | Landing Page | Verify anon user can INSERT but cannot SELECT from waitlist table |
| Export uses stale v1 brief content | Coding Agent Export | Test export on a brief saved before Brief v2 upgrade; verify graceful error or regen prompt |
| Coding agent export missing file path suggestions | Coding Agent Export | Verify export includes `## Suggested File Paths` section with paths derived from existing `src/` structure |

---

## Sources

- Stripe webhooks race condition guide: [Stripe Webhooks: Solving Race Conditions](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/)
- Stripe integration best practices (official): [Building rock-solid Stripe integrations](https://stripe.dev/blog/building-solid-stripe-integrations-developers-guide-success)
- Stripe idempotency (official): [Idempotent requests — Stripe API Reference](https://docs.stripe.com/api/idempotent_requests)
- Anthropic Structured Outputs (official): [Structured outputs — Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Supabase RLS (official): [Row Level Security — Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Supabase RLS misconfigurations: [Fixing RLS Misconfigurations in Supabase](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/)
- CVE-2025-29927 Next.js middleware bypass: [ProjectDiscovery Analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)
- Stripe subscription management: [Mastering Subscription Management](https://moldstud.com/articles/p-mastering-subscription-management-a-developers-guide-to-using-stripe-webhooks)
- Clerk Next.js auth guide: [Complete Authentication Guide for Next.js App Router in 2025](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- Stripe plan enforcement best practices: [Build a subscriptions integration — Stripe Documentation](https://docs.stripe.com/billing/subscriptions/build-subscriptions)
- AGENTS.md format for coding agent exports: [AGENTS.md — Simple, open format for coding agents](https://agents.md/)
- Existing codebase analysis: `/Users/arnavsinghal/pm-copilot/.planning/codebase/CONCERNS.md` (2026-02-25)

---

*Pitfalls research for: Sightline v1.0 — Brief v2 + Coding Agent Export + Stripe Billing + Landing Page*
*Researched: 2026-02-25*
