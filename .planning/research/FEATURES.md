# Feature Research

**Domain:** AI PM tool — Brief v2, Coding Agent Export, Stripe Billing, Landing Page
**Researched:** 2026-02-25
**Confidence:** HIGH (stack-specific); MEDIUM (feature patterns); HIGH (Stripe/landing page standards)

---

## Context: What Already Exists

The following are already shipped and must be treated as dependencies, not features:

- CSV signal ingestion pipeline (upload, chunked, embedded to Qdrant)
- Discovery query interface (streaming RAG, evidence panel, confidence scores)
- Feature brief generator — saves to DB with: Problem Statement, Proposed Solution, User Stories, Success Metrics, Out of Scope
- Briefs page with full panel + Log Decision action
- Decision log with outcome tracking
- 3-step onboarding flow creating org/user/workspace

The current `BriefContent` type in `src/app/api/briefs/generate/route.ts` lacks `ui_direction` and `data_model_hints`. The brief prompt constructs from `QueryResult` evidence and returns JSON — the extension points are the prompt and the type.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unshippable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Brief v2: UI Direction section** | A brief without UI guidance is incomplete for a tool positioning itself as "Cursor for PMs" — the YC framing explicitly calls for screen-level UI proposals | HIGH | Must be evidence-grounded: only propose UI changes traceable to customer signals. Render as structured steps, not prose. Requires prompt engineering + new TypeScript type `UIDirection` per CLAUDE.md |
| **Brief v2: Data Model Hints section** | PMs using Claude Code need schema hints to pass to the coding agent — without this, the "handoff" is incomplete | MEDIUM | `DataModelHint[]` type already defined in CLAUDE.md. Each hint needs: table name, operation, field name, field type, rationale. Renders as syntax-highlighted code block per CLAUDE.md |
| **Coding Agent Export: Clipboard copy** | Every PM tool that generates specs must support one-click copy — discovered from ChatPRD, Notion AI, and standard PM tooling behavior | LOW | Copy full 7-section markdown to clipboard. Toast confirmation. Single button on brief panel |
| **Coding Agent Export: .md file download** | Secondary export format for users who want to version-control their briefs or pass to Claude Code via file | LOW | `Blob` download with filename `[brief-title]-[date].md`. Browser-native, no server round-trip needed |
| **Stripe Checkout: Hosted checkout session** | Any SaaS charging money must have a working payment flow before approaching design partners | MEDIUM | Use Stripe Checkout (hosted), not Elements — avoids PCI scope complexity. Create `checkout.session` via server action, redirect user |
| **Stripe webhooks: subscription lifecycle** | Webhooks are how you actually gate features — without them, users can pay without getting access | MEDIUM | Handle: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`. Verify signature with `STRIPE_WEBHOOK_SECRET` |
| **Stripe: Plan-gated feature access** | Starter vs Pro must have different limits — otherwise tiers are meaningless | MEDIUM | Read `subscription_plan` from Supabase profile on each request. Middleware or tRPC context check. Starter limit: e.g. 10 briefs/mo, Pro: unlimited |
| **Stripe Customer Portal** | Users must be able to cancel, upgrade, view invoices without contacting support | LOW | `stripe.billingPortal.sessions.create` → redirect. Standard Stripe-hosted UI. Required for self-serve PLG motion |
| **Landing page: hero + value prop** | Zero-to-landing is required before any outreach — without it, there's nowhere to send potential users | MEDIUM | Headline under 8 words, outcome-focused. Subheading explains the "Cursor for PMs" framing. Single primary CTA: "Join Waitlist" or "Get Early Access" |
| **Landing page: email capture form** | The entire point of the pre-launch landing page — collect design partner leads | LOW | Email only, no friction. POST to Supabase `waitlist` table or Resend audience. Show success state. No `<form>` tag per CLAUDE.md — controlled component |
| **Landing page: product demo/screenshots** | SaaS visitors need to see the product before converting — waitlist conversion drops significantly without visuals | MEDIUM | Static screenshots of query interface + brief panel sufficient for v1. Short demo video (under 90s) is differentiator, not required |

### Differentiators (Competitive Advantage)

Features that set Sightline apart from generic AI PRD tools. Not required for launch, but high leverage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **UI Direction grounded in evidence** | Unlike Notion AI or ChatPRD which hallucinate UI proposals, Sightline's UI direction cites the specific customer signal that motivated each screen change — builds trust | HIGH | This is the core differentiation: each screen change in `UIDirection` must map to an evidence chunk ID. If no relevant signals, say so explicitly. Not just "add a modal" but "Add modal here because 5 customers mentioned confusion at this step [source]" |
| **Data Model Hints with rationale** | Coding agents need schema guidance. ChatPRD generates prose; Sightline generates typed table/field hints with a `rationale` field explaining why each field exists | MEDIUM | Render as code blocks with syntax highlighting (per CLAUDE.md). Include operation type: `add_field`, `new_table`, `modify_field`. Each hint links back to a user story |
| **7-section coding agent export package** | Cursor/Claude Code users need a complete context package — not just a PRD but file path suggestions, edge cases from dissenting signals, and data model hints | HIGH | The AGENTS.md ecosystem standard (adopted by OpenAI Codex, Google Jules, Cursor, Copilot) shows structured agent context is a real pattern. Sightline's export is the PM-to-agent handoff format: Context Block + Feature Description + Acceptance Criteria + UI Direction + Data Model Hints + Edge Cases + Suggested File Paths |
| **Landing page: pricing transparency** | Industry data shows hiding pricing creates friction and suspicion. Showing Starter $79/Pro $299 anchors value and pre-qualifies visitors | LOW | Display both tiers with feature lists. Pro should anchor as "most popular." Call-to-action per tier: "Join Waitlist" keeps same CTA since billing isn't live yet |
| **Landing page: social proof section** | 83% of users trust peer recommendations. Even 2-3 design partner quotes (or "used by founders at X") significantly increases waitlist conversion | LOW | Even fabricated-feeling logos reduce trust. Authentic quotes from beta users are table stakes; company logos are differentiators. Defer until first 3 design partners are locked in |
| **Stripe: Usage-based limits (brief count)** | Enforcing monthly brief limits (Starter: 10, Pro: unlimited) creates natural upgrade pressure without requiring seat-based pricing complexity | MEDIUM | Simpler than metered billing: just a counter in Supabase incremented per brief generation. Check before allowing generation. Reset on billing cycle |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create complexity without proportional return at this stage.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Stripe Elements (custom payment form)** | Looks more premium, keeps user on-page | PCI compliance scope, higher implementation complexity, needs SSL everywhere, more error handling surface area — none of this is needed for design partners | Use Stripe Checkout (hosted). Redirect to Stripe, redirect back. Done. |
| **Usage-based metered billing via Stripe Meters API** | "Charge per brief generated" sounds clean | Stripe's metered billing requires real-time usage reporting, is complex to reconcile, and adds latency to the brief generation critical path. Over-engineered for v1.0 with 10-20 design partners | Simple counter in Supabase `profiles` table. Check before allowing generation. Reset on billing cycle. |
| **Referral/viral waitlist (points, leaderboard)** | GetWaitlist, Viral Loops show high conversion uplift | Referral mechanics require additional infrastructure (tracking links, attribution, email sequences) and delay time-to-launch. Design partner signups come from direct outreach, not virality | Plain email capture with a "We'll email you when we're ready" message. Add referral if waitlist exceeds 200 organically. |
| **Product tour / interactive demo on landing page** | Videos increase conversion by 86% | Building an interactive demo of an AI product takes 2-4 weeks of engineering. A static screenshot walkthrough of the query interface and brief panel achieves 80% of the conversion lift at 5% of the cost | 3-4 static screenshots with captions. Or a 60-second Loom-style screen recording embedded via iframe. |
| **Multi-seat team billing** | Teams use PM tools together | Seat counting, team management, invite flows, per-seat proration — this is a full feature set. Design partners are solo founders or solo PMs | Single user per account for v1.0. Pro plan is "for solo founders." Team features are Phase 2. |
| **Figma/Linear/Notion export integration** | PMs use these tools | OAuth flows, API integration, format mapping, token refresh — each integration is a 1-week project. Out of scope per PROJECT.md | Clipboard + .md file is sufficient for design partners. They can paste into any tool. |
| **Pricing page as a separate route** | Standard SaaS pattern | At pre-launch waitlist stage, sending users to a pricing page before they've seen the product creates friction. Pricing belongs on the landing page itself | Inline pricing section on landing page. No separate `/pricing` route for v1.0. |
| **Landing page blog / SEO content** | Long-term organic growth | SEO takes 6-12 months to compound. Design partners come from direct outreach, not search. Content is a post-PMF growth lever | Focus on conversion, not content. Single-page landing only. |

---

## Feature Dependencies

```
[Brief v2: UI Direction]
    └──requires──> [Existing Brief Generator] (extends prompt + type)
    └──requires──> [Evidence panel] (UI Direction must cite chunk IDs)

[Brief v2: Data Model Hints]
    └──requires──> [Existing Brief Generator] (extends prompt + type)
    └──requires──> [User Stories] (hints link back to stories)

[Coding Agent Export: 7-section package]
    └──requires──> [Brief v2: UI Direction] (section 4 of export)
    └──requires──> [Brief v2: Data Model Hints] (section 5 of export)
    └──requires──> [Existing Brief Generator] (sections 1-3, 6-7 from existing brief)

[Coding Agent Export: Clipboard + .md]
    └──requires──> [Coding Agent Export: 7-section package] (content to export)

[Stripe: Plan-gated feature access]
    └──requires──> [Stripe webhooks: subscription lifecycle] (sets plan in DB)
    └──requires──> [Stripe Checkout: Hosted checkout session] (initiates subscription)

[Stripe Customer Portal]
    └──requires──> [Stripe Checkout: Hosted checkout session] (customer must exist in Stripe first)

[Stripe: Usage-based limits (brief count)]
    └──requires──> [Stripe: Plan-gated feature access] (need to know which plan to enforce)

[Landing page: email capture form]
    └──requires──> [Landing page: hero + value prop] (page must exist)
    └──requires──> [Supabase waitlist table OR Resend audience] (storage destination)

[Landing page: pricing transparency]
    └──requires──> [Landing page: hero + value prop] (same page, below the fold)
```

### Dependency Notes

- **Coding Agent Export requires UI Direction + Data Model Hints**: The export format defined in CLAUDE.md specifies all 7 sections including these two. A partial export (5 sections) would be confusing and inconsistent. Ship these together.
- **Stripe webhooks are required before plan gating**: You cannot check `subscription_plan` in the DB until webhooks write it there on successful checkout. The webhook handler is the critical path for billing.
- **Brief v2 sections are additive to existing brief**: The existing `BriefContent` type is extended, not replaced. Existing saved briefs without these fields will still render — the UI must gracefully handle missing sections.
- **Landing page is independent of all other features**: Can be shipped in any order. No dependency on billing or brief features. Only dependency is Supabase (for email capture) which already exists.

---

## MVP Definition

### Launch With (This Milestone)

Minimum required to call this milestone complete and show design partners.

- [ ] **Brief v2: UI Direction** — Without it, the "Cursor for PMs" claim is hollow. This is the headline feature of the milestone.
- [ ] **Brief v2: Data Model Hints** — Ships with UI Direction. Together they complete the brief. Do not ship one without the other.
- [ ] **Coding Agent Export: 7-section package with clipboard copy** — The reason for Brief v2 is the coding agent handoff. Clipboard is sufficient. .md download is a nice-to-have same-day addition (trivial complexity).
- [ ] **Stripe Checkout + webhooks** — Required before any money changes hands. Needed to call Sightline "billing-ready."
- [ ] **Stripe Customer Portal** — Required for self-serve PLG. Users must be able to manage their own subscriptions.
- [ ] **Stripe plan-gated access (brief count limit)** — Without enforcement, the plan distinction is meaningless.
- [ ] **Landing page: hero + value prop + email capture** — Required before outreach. Even a single-section page with a form beats nothing.

### Add After Validation (v1.x)

Features to add once design partners are using the product and providing feedback.

- [ ] **Landing page: product screenshots** — Add once there's UI to screenshot. Take during brief v2 build.
- [ ] **Landing page: social proof** — Add after first 2-3 design partners provide testimonials.
- [ ] **Landing page: pricing section** — Add once billing is live and plan terms are confirmed.
- [ ] **Usage-based brief count limit enforcement** — Add once there are enough users to warrant limits.
- [ ] **Coding Agent Export: .md file download** — Trivial to add, do it alongside clipboard if time permits.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Annual billing discount** — Adds churn reduction but complex to implement (prorations, upgrades). Phase 2.
- [ ] **Team/multi-seat billing** — Requires invite flows, seat counting, per-seat proration. Phase 2.
- [ ] **Figma/Linear/Notion export integrations** — Each is a 1-week integration. Post-PMF growth lever.
- [ ] **Waitlist referral / viral mechanics** — Only worthwhile with 200+ waitlist signups.
- [ ] **Stripe metered usage billing** — Complex, over-engineered for current scale.
- [ ] **Landing page blog / SEO content** — Long-term growth lever, not a launch requirement.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Brief v2: UI Direction | HIGH | HIGH | P1 |
| Brief v2: Data Model Hints | HIGH | MEDIUM | P1 |
| Coding Agent Export (clipboard) | HIGH | LOW | P1 |
| Coding Agent Export (.md download) | MEDIUM | LOW | P1 |
| Stripe Checkout + webhooks | HIGH | MEDIUM | P1 |
| Stripe Customer Portal | MEDIUM | LOW | P1 |
| Stripe plan-gated access | HIGH | MEDIUM | P1 |
| Landing page hero + email capture | HIGH | MEDIUM | P1 |
| Landing page product screenshots | MEDIUM | LOW | P2 |
| Landing page pricing section | MEDIUM | LOW | P2 |
| Landing page social proof | HIGH | LOW | P2 (needs external input) |
| Usage-based brief count limit | MEDIUM | LOW | P2 |
| Stripe annual billing | LOW | HIGH | P3 |
| Multi-seat billing | MEDIUM | HIGH | P3 |
| Referral / viral waitlist | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible / when dependency met
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | ChatPRD | Notion AI | Linear AI | Sightline Approach |
|---------|---------|-----------|-----------|-------------------|
| Brief generation | Yes (prose) | Yes (prose) | Yes (issue format) | Structured JSON with evidence citations |
| UI Direction in brief | No | No | No | Yes — evidence-grounded, screen-by-screen |
| Data Model Hints | No | No | No | Yes — typed table/field hints with rationale |
| Coding agent export | No | Copy to clipboard | No | 7-section structured package (Context + AC + UI + Schema + Edge Cases) |
| Evidence grounding | No | No | No | Yes — every claim traceable to a chunk ID |
| Stripe billing | Yes (multiple tiers) | N/A (Notion billing) | Yes | Starter $79/mo + Pro $299/mo, hosted checkout |
| Landing page pattern | Full marketing site | N/A | Full marketing site | Single-page waitlist + email capture for v1.0 |

**Sightline's moat:** The combination of evidence grounding + UI Direction + Data Model Hints is unique. No competitor generates a brief where every UI proposal cites the customer signal that motivated it, then provides the schema hint a coding agent needs to implement it. This is the "Cursor for PMs" claim made real.

---

## Implementation Notes by Feature

### Brief v2: UI Direction + Data Model Hints

The existing prompt in `src/app/api/briefs/generate/route.ts` returns a 5-key JSON object. Extension approach:

1. Add `ui_direction: UIDirection` and `data_model_hints: DataModelHint[]` to the `BriefContent` interface
2. Extend the prompt to instruct Claude to generate these sections — provide the TypeScript types as JSON Schema in the prompt so Claude understands the exact format
3. Include a constraint: "Only propose UI changes that are directly supported by evidence in the Supporting Evidence section. If no evidence supports a UI change for a given screen, omit that screen."
4. The prompt must instruct Claude to populate `data_model_hints[].rationale` with a reference to a specific user story (e.g., "Required for User Story 2: As a PM, I want to track brief status")
5. Render `UIDirection.screens[]` as an expandable accordion — one card per screen
6. Render `DataModelHint[]` as syntax-highlighted SQL/TypeScript code blocks (as per CLAUDE.md)
7. Existing briefs without these fields: UI must check for field presence and render a "Upgrade brief" CTA or simply hide the section gracefully

**Confidence level for implementation:** HIGH — the pattern is straightforward prompt extension + type addition + new React render components.

### Coding Agent Export

The 7-section format from CLAUDE.md:

```
1. CONTEXT BLOCK          — Product background, existing relevant components, constraints
2. FEATURE DESCRIPTION    — From brief.proposed_solution
3. ACCEPTANCE CRITERIA    — brief.user_stories converted to "Given/When/Then" or checklist format
4. UI DIRECTION           — brief.ui_direction.screens[] (screen-by-screen)
5. DATA MODEL HINTS       — brief.data_model_hints[] as SQL/TypeScript
6. EDGE CASES             — From brief.out_of_scope + dissenting signals from query evidence
7. SUGGESTED FILE PATHS   — Inferred from brief content + project conventions
```

Implementation: A pure TypeScript function that takes a `BriefContent` object and returns a formatted Markdown string. No server call needed. `navigator.clipboard.writeText()` for clipboard. `Blob` + `URL.createObjectURL` for .md download.

**Confidence level for implementation:** HIGH — this is string formatting, browser APIs, no new infrastructure.

### Stripe Billing

Required DB additions to Supabase (per standard Next.js + Supabase + Stripe pattern from vercel/nextjs-subscription-payments):

```sql
-- Add to profiles table (already exists)
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN briefs_count_this_period INTEGER DEFAULT 0;
```

Webhook events to handle in `/api/stripe/webhook`:
- `checkout.session.completed` — set `subscription_plan`, `subscription_status = 'active'`
- `invoice.paid` — reset `briefs_count_this_period = 0` on each billing cycle
- `invoice.payment_failed` — set `subscription_status = 'past_due'`
- `customer.subscription.deleted` — set `subscription_plan = 'free'`, `subscription_status = 'canceled'`

Plan limits:
- Free: 3 briefs/month (to allow evaluation), no export
- Starter ($79/mo): 10 briefs/month, clipboard export, .md export
- Pro ($299/mo): Unlimited briefs, all export formats

Feature gating: Check `profiles.subscription_plan` and `profiles.briefs_count_this_period` before allowing brief generation. Return a 402 with upgrade CTA if limit reached.

**Confidence level for implementation:** HIGH — well-documented pattern with multiple reference implementations (vercel/nextjs-subscription-payments, KolbySisk/next-supabase-stripe-starter).

### Landing Page

Single-page structure (top to bottom):
1. **Nav**: Logo + "Sign In" link (right-aligned)
2. **Hero**: Headline (outcome-focused, 8 words max), subheading (the YC framing in plain language), single CTA ("Join the Waitlist")
3. **Pain section**: "Sound familiar?" — 3 pain points of the target user (time-poor founder-PM, no time to synthesize calls, guesses on what to build)
4. **How it works**: 3-step visual (Upload signals → Ask questions → Get evidence-backed briefs with UI direction)
5. **Product screenshots**: 2-3 screenshots of query interface + brief panel with UI Direction section
6. **Pricing**: Starter $79/mo + Pro $299/mo cards with feature lists. Both CTA to "Join Waitlist" (not checkout — billing not live yet for waitlist users)
7. **Email capture**: Centered form, email only, "Join Waitlist" button, success state
8. **Footer**: Minimal — link to privacy policy, Twitter/X, "Made for founder-PMs"

No `<form>` tags per CLAUDE.md. Controlled component: `useState` for email, `onClick` handler that POSTs to Supabase `waitlist` table.

Waitlist table: `CREATE TABLE waitlist (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());`

**Confidence level for implementation:** HIGH — standard Next.js page with Tailwind. No new architectural decisions.

---

## Sources

- [Stripe SaaS billing best practices](https://stripe.com/resources/more/best-practices-for-saas-billing)
- [Stripe + Next.js 15 complete guide 2025](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/)
- [Stripe integration guide for Next.js 15 with Supabase](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5)
- [vercel/nextjs-subscription-payments reference implementation](https://github.com/vercel/nextjs-subscription-payments)
- [KolbySisk/next-supabase-stripe-starter reference implementation](https://github.com/KolbySisk/next-supabase-stripe-starter)
- [AGENTS.md format standard](https://agents.md/)
- [Claude Code sub-agents and handoff patterns](https://code.claude.com/docs/en/sub-agents)
- [Waitlist landing page best practices](https://moosend.com/blog/waitlist-landing-page/)
- [SaaS landing page hero section best practices](https://www.alfdesigngroup.com/post/saas-hero-section-best-practices)
- [51 high-converting SaaS landing pages analysis](https://www.klientboost.com/landing-pages/saas-landing-page/)
- [Stripe usage-based billing documentation](https://docs.stripe.com/billing/subscriptions/usage-based)

---

*Feature research for: Sightline — Brief v2, Coding Agent Export, Stripe Billing, Landing Page*
*Researched: 2026-02-25*
