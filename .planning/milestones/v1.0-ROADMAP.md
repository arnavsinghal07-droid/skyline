# Roadmap: Sightline

## Milestones

- ✅ **v1.0 Brief v2 + Ship Ready** — Phases 1-4 (complete 2026-03-04)
- 🚧 **v2.0 Competitive Intelligence + Deck Generator** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Brief v2 + Ship Ready (Phases 1-4) — COMPLETE 2026-03-04</summary>

### Phase 1: Brief v2
**Goal**: Users can generate briefs that include evidence-grounded UI Direction and Data Model Hints, completing the full brief structure required for the coding agent handoff
**Depends on**: Nothing (first phase)
**Requirements**: BRIEF-01, BRIEF-02, BRIEF-03, BRIEF-04
**Success Criteria** (what must be TRUE):
  1. User generates a new brief and sees a UI Direction section with named screens, component changes, and interactions — each change traceable to a customer signal
  2. User generates a new brief and sees a Data Model Hints section with typed table/field suggestions and a rationale per hint, rendered with syntax highlighting
  3. User opens an existing v1 brief and it renders without errors — all existing fields display, new sections are absent without crashing
  4. When brief generation hits token limits, user receives a clear structured error instead of a truncated JSON crash
**Plans**: 2 plans

Plans:
- [x] 01-01: Backend — extend BriefContent v2 type, expand prompt, raise max_tokens, token limit error handling, per-section regeneration endpoint
- [x] 01-02: Frontend — UIDirectionSection, DataModelSection, EvidenceChip components + wire into query and briefs pages + v1 backward compat + stagger reveal + per-section regenerate UX

### Phase 2: Coding Agent Export
**Goal**: Users can export any v2 brief as a complete 7-section coding agent handoff package, delivered via clipboard copy or .md file download
**Depends on**: Phase 1
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03
**Success Criteria** (what must be TRUE):
  1. User opens any v2 brief and sees an Export button that generates a 7-section package (Context, Feature Description, Acceptance Criteria, UI Direction, Data Model Hints, Edge Cases, Suggested File Paths)
  2. User clicks "Copy to Clipboard" and the full markdown package is copied — confirmed by browser feedback — ready to paste directly into Cursor or Claude Code
  3. User clicks "Download .md" and receives a named markdown file containing the full export package
**Plans**: 2 plans

Plans:
- [x] 02-01: Backend — export formatter, tRPC endpoint, 7-section assembly from brief
- [x] 02-02: Frontend — ExportPanel component, clipboard copy, .md download

### Phase 3: Stripe Billing
**Goal**: Users can subscribe to Starter or Pro plans via Stripe, manage their subscription, and brief generation is gated by plan limits
**Depends on**: Phase 1
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06
**Success Criteria** (what must be TRUE):
  1. User clicks "Subscribe to Starter" and completes Stripe hosted checkout at $79/mo — plan state updates to Starter in the app within 5 seconds of payment confirmation
  2. User clicks "Subscribe to Pro" and completes Stripe hosted checkout at $299/mo — plan state updates to Pro in the app within 5 seconds of payment confirmation
  3. Stripe sends the same webhook event twice (retry simulation) and no duplicate side effects occur — plan state and confirmation email are applied exactly once
  4. User navigates to the Stripe Customer Portal via the billing page and can cancel, upgrade, or view past invoices
  5. Starter user who has generated 10 briefs this month sees a clear "Upgrade to Pro" prompt instead of a brief generation
  6. User visits the billing page and sees their current plan, briefs used this month, and remaining allowance
**Plans**: 2 plans

Plans:
- [x] 03-01: Backend — Stripe checkout, webhook handler, customer portal, plan enforcement
- [x] 03-02: Frontend — billing page, plan gates, usage display

### Phase 4: Landing Page
**Goal**: Visitors can discover Sightline, understand its value proposition, and join the waitlist
**Depends on**: Phase 3
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04
**Success Criteria** (what must be TRUE):
  1. Unauthenticated visitor navigates to the root URL and sees the marketing landing page (hero section, value proposition, primary CTA) — not redirected to the login page
  2. Visitor enters their email and submits the waitlist form — receives a confirmation email via Resend and the address is saved in Supabase
  3. Landing page displays at least two product screenshots showing the query interface and brief panel with UI Direction and Data Model Hints sections visible
  4. Landing page shows a pricing section with Starter and Pro tier feature comparison — each tier has a CTA that links to the corresponding Stripe checkout flow
**Plans**: 2 plans

Plans:
- [x] 04-01: Backend — waitlist table migration, POST /api/waitlist endpoint, sendWaitlistConfirmationEmail
- [ ] 04-02: Frontend — marketing landing page, WaitlistForm + ScreenshotTabs client islands, placeholder screenshots, pricing section

</details>

---

### 🚧 v2.0 Competitive Intelligence + Deck Generator (In Progress)

**Milestone Goal:** Add competitive intelligence (internal signal extraction + external review scraping) and a full deck generation system (one-click from artifacts + custom builder with shareable links) — expanding Sightline from discovery tool to PM command center.

## Phase Details

### Phase 5: Competitive Core
**Goal**: Users can extract competitor mentions from their existing customer signals and scrape external reviews — with all competitive data isolated in its own corpus, labeled clearly in the evidence panel
**Depends on**: Phase 4
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-06
**Success Criteria** (what must be TRUE):
  1. User triggers enrichment re-processing on existing customer call signals and sees extracted competitor mentions appear as labeled evidence in the discovery query panel — each tagged with the source chunk it came from
  2. User adds a competitor by name and G2/Capterra slug — scraping runs and structured signals (pain points, switching reasons, feature requests) appear in the app within a reasonable wait
  3. Competitive signals display in the evidence panel with a distinct "Competitive" label and are never mixed with qualitative customer chunks from the main corpus
  4. CSV upload fallback is available for G2/Capterra review data when scraping is blocked — user can upload a CSV and signals are extracted identically
**Plans**: 2 plans

Plans:
- [x] 05-01: Backend — database migration, competitor CRUD API, Haiku signal extraction, G2/Capterra scraping, CSV upload, re-enrichment scanning
- [x] 05-02: Frontend — /competitors page with add/edit/delete/refresh/upload/rescan, evidence panel competitive tab with filters

### Phase 6: Competitive Intelligence Layer
**Goal**: Users can see how competitors are weak relative to their own feature backlog and receive a weekly competitive digest — making competitive data actionable, not just stored
**Depends on**: Phase 5
**Requirements**: COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. User opens the gap scoring view and sees a ranked list of their backlog items cross-referenced against competitor weaknesses — each gap shows which competitor signals support it
  2. User receives a weekly email digest summarizing new competitive signals added since the last digest and the top emerging gaps — email is generated from the sightline-competitive corpus, not fabricated
**Plans**: TBD

### Phase 7: Deck Generator v1
**Goal**: Users can generate a complete, evidence-traced deck from any Sightline artifact with one click — and export it as PPTX or PDF with every data claim linked to a source
**Depends on**: Phase 5
**Requirements**: DECK-01, DECK-02, DECK-03, DECK-04, DECK-05, DECK-06
**Success Criteria** (what must be TRUE):
  1. User clicks "Generate Deck" from any brief, query result, decision, or competitive digest — a deck is generated asynchronously and the user is notified when it is ready (no page hang, no timeout)
  2. Generated deck contains multiple named slide types (title, insight, data_viz, comparison, competitive_matrix, timeline, decision) appropriate to the source artifact
  3. Every data claim on every slide is linked to a source chunk or signal — user can see the evidence_id beside each claim and there are no orphaned statistics
  4. User downloads the deck as a .pptx file — file opens in PowerPoint/Keynote and renders correctly with the chosen theme applied
  5. User downloads the deck as a PDF — file renders all slides with correct layout, no missing content
  6. User selects a theme (Clean, Executive, or Brand) before generating — the deck reflects the chosen theme in typography and color
**Plans**: TBD

### Phase 8: Deck Generator v2
**Goal**: Users can share decks publicly via web link, build custom decks from any Sightline content, and export to Google Slides — making Sightline the PM's presentation layer
**Depends on**: Phase 7
**Requirements**: DECK-07, DECK-08, DECK-09, DECK-10, DECK-11
**Success Criteria** (what must be TRUE):
  1. User clicks "Share" on any deck and receives a URL — when a stakeholder opens that URL in a browser, they can view all slides and click any claim to see its source chunk
  2. Deck owner can toggle the link between public (anyone with link) and authenticated (must sign in) — unauthenticated viewers of public decks see sanitized evidence summaries, not raw PII
  3. User opens the custom deck builder, selects content from briefs, query results, decisions, and competitive digests, and assembles a deck by adding slides — the result is a coherent presentation with evidence tracing intact
  4. User reorders slides via drag-and-drop and edits slide content inline — changes persist without a full page reload
  5. User exports a deck to Google Slides — the resulting Google Slides presentation contains all slides with correct content and retains the theme
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Brief v2 | v1.0 | 2/2 | Complete | 2026-02-25 |
| 2. Coding Agent Export | v1.0 | 2/2 | Complete | 2026-02-26 |
| 3. Stripe Billing | v1.0 | 2/2 | Complete | 2026-03-01 |
| 4. Landing Page | v1.0 | 1/2 | In Progress | - |
| 5. Competitive Core | v2.0 | 2/2 | Complete | 2026-03-06 |
| 6. Competitive Intelligence Layer | v2.0 | 0/TBD | Not started | - |
| 7. Deck Generator v1 | v2.0 | 0/TBD | Not started | - |
| 8. Deck Generator v2 | v2.0 | 0/TBD | Not started | - |
