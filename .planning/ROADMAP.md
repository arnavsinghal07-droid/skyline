# Roadmap: Sightline v1.0 — Brief v2 + Ship Ready

## Overview

This milestone closes the gap between "product discovery" and "coding agent handoff" — the core YC thesis. It upgrades the brief generator with UI Direction and Data Model Hints (making the agent handoff package possible), adds the 7-section coding agent export, integrates Stripe billing for design partner monetization, and ships a marketing landing page. Four phases, four natural delivery boundaries, derived directly from the four requirement categories. Brief v2 is the dependency root: the type must exist before export can be built, and the product must work before the landing page earns credibility.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Brief v2** - Upgrade brief generator with evidence-grounded UI Direction and Data Model Hints sections
- [ ] **Phase 2: Coding Agent Export** - Generate and deliver the 7-section agent handoff package from any v2 brief
- [ ] **Phase 3: Stripe Billing** - Integrate Stripe checkout, webhooks, customer portal, and plan-gated access
- [ ] **Phase 4: Landing Page** - Ship the marketing landing page with waitlist email capture and pricing

## Phase Details

### Phase 1: Brief v2
**Goal**: Users can generate briefs that include evidence-grounded UI Direction and Data Model Hints, completing the full brief structure required for the coding agent handoff
**Depends on**: Nothing (first phase)
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03, BRIEF-04
**Success Criteria** (what must be TRUE):
  1. User generates a new brief and sees a UI Direction section with named screens, component changes, and interactions — each change traceable to a customer signal
  2. User generates a new brief and sees a Data Model Hints section with typed table/field suggestions and a rationale per hint, rendered with syntax highlighting
  3. User opens an existing v1 brief and it renders without errors — all existing fields display, new sections are absent without crashing
  4. When brief generation hits token limits, user receives a clear structured error instead of a truncated JSON crash
**Plans**: TBD

### Phase 2: Coding Agent Export
**Goal**: Users can export any v2 brief as a complete 7-section coding agent handoff package, delivered via clipboard copy or .md file download
**Depends on**: Phase 1
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. User opens any v2 brief and sees an Export button that generates a 7-section package (Context, Feature Description, Acceptance Criteria, UI Direction, Data Model Hints, Edge Cases, Suggested File Paths)
  2. User clicks "Copy to Clipboard" and the full markdown package is copied — confirmed by browser feedback — ready to paste directly into Cursor or Claude Code
  3. User clicks "Download .md" and receives a named markdown file containing the full export package
**Plans**: TBD

### Phase 3: Stripe Billing
**Goal**: Users can subscribe to Starter or Pro plans via Stripe, manage their subscription, and brief generation is gated by plan limits
**Depends on**: Phase 1
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06
**Success Criteria** (what must be TRUE):
  1. User clicks "Subscribe to Starter" and completes Stripe hosted checkout at $79/mo — plan state updates to Starter in the app within 5 seconds of payment confirmation
  2. User clicks "Subscribe to Pro" and completes Stripe hosted checkout at $299/mo — plan state updates to Pro in the app within 5 seconds of payment confirmation
  3. Stripe sends the same webhook event twice (retry simulation) and no duplicate side effects occur — plan state and any confirmation email are applied exactly once
  4. User navigates to the Stripe Customer Portal via the billing page and can cancel, upgrade, or view past invoices
  5. Starter user who has generated 10 briefs this month sees a clear "Upgrade to Pro" prompt instead of a brief generation — Free users see the limit gate immediately
  6. User visits the billing page and sees their current plan, briefs used this month, and the remaining allowance
**Plans**: TBD

### Phase 4: Landing Page
**Goal**: Visitors can discover Sightline, understand its value proposition, and join the waitlist — giving design partners somewhere to send prospects
**Depends on**: Phase 3
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. Unauthenticated visitor navigates to the root URL and sees the marketing landing page (hero section, value proposition, primary CTA) — not redirected to the login page
  2. Visitor enters their email and submits the waitlist form — receives a confirmation email via Resend and the address is saved in Supabase
  3. Landing page displays at least two product screenshots showing the query interface and brief panel with UI Direction and Data Model Hints sections visible
  4. Landing page shows a pricing section with Starter and Pro tier feature comparison — each tier has a CTA that links to the corresponding Stripe checkout flow
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Brief v2 | 0/TBD | Not started | - |
| 2. Coding Agent Export | 0/TBD | Not started | - |
| 3. Stripe Billing | 0/TBD | Not started | - |
| 4. Landing Page | 0/TBD | Not started | - |
