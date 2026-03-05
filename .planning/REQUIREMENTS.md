# Requirements: Sightline

**Defined:** 2026-02-25 (v1.0) | **Updated:** 2026-03-04 (v2.0)
**Core Value:** Every product recommendation must be traceable to customer evidence — trust is the product.

## v1.0 Requirements (Complete)

### Brief v2

- [x] **BRIEF-01**: User can generate a brief with UI Direction section showing screen-by-screen component changes grounded in customer evidence
- [x] **BRIEF-02**: User can generate a brief with Data Model Hints section showing typed table/field suggestions with rationale
- [x] **BRIEF-03**: User can view existing v1 briefs without errors after the v2 upgrade (backward compatibility)
- [x] **BRIEF-04**: Brief generation handles token limits gracefully — returns structured error instead of truncated JSON

### Coding Agent Export

- [x] **EXPORT-01**: User can generate a 7-section coding agent export package from any v2 brief (Context, Feature, Acceptance Criteria, UI Direction, Data Model, Edge Cases, Suggested File Paths)
- [x] **EXPORT-02**: User can copy the full export package to clipboard with one click
- [x] **EXPORT-03**: User can download the export package as a .md file

### Stripe Billing

- [x] **BILL-01**: User can subscribe to Starter plan ($79/mo) via Stripe hosted checkout
- [x] **BILL-02**: User can subscribe to Pro plan ($299/mo) via Stripe hosted checkout
- [x] **BILL-03**: Subscription events are processed via webhook with idempotency (no double-processing)
- [x] **BILL-04**: User can manage their subscription (cancel, upgrade, view invoices) via Stripe Customer Portal
- [x] **BILL-05**: Brief generation is gated by plan — Starter: 10 briefs/month, Pro: unlimited
- [x] **BILL-06**: User sees current plan and usage on a billing page

### Landing Page

- [ ] **LAND-01**: Visitor sees a marketing landing page with hero section, value proposition, and primary CTA
- [x] **LAND-02**: Visitor can submit email to join the waitlist (saved to Supabase, confirmation via Resend)
- [ ] **LAND-03**: Landing page displays product screenshots of query interface and brief panel
- [ ] **LAND-04**: Landing page shows pricing section with Starter and Pro tier feature comparison

## v2.0 Requirements

Requirements for milestone v2.0 — Competitive Intelligence + Deck Generator.

### Competitive Intelligence

- [ ] **COMP-01**: User can trigger competitor mention extraction from existing customer call signals during enrichment
- [ ] **COMP-02**: User can add competitors to track (name, G2 slug, Capterra slug) and trigger external review scraping
- [ ] **COMP-03**: System extracts structured signals (pain points, switching reasons, feature requests) from scraped reviews via Haiku
- [ ] **COMP-04**: User can view gap scoring that cross-references competitor weaknesses against their feature backlog
- [ ] **COMP-05**: User receives a weekly competitive digest email summarizing new competitive signals and gaps
- [ ] **COMP-06**: Competitive signals are stored in a separate Qdrant collection and clearly labeled in the evidence panel

### Deck Generator v1

- [ ] **DECK-01**: User can generate a deck from any Sightline artifact (brief, query result, decision, competitive digest) with one click
- [ ] **DECK-02**: Generated deck includes multiple slide types (title, insight, data_viz, comparison, competitive_matrix, timeline, decision)
- [ ] **DECK-03**: Every data claim on every slide is traceable to a source chunk or signal (evidence tracing)
- [ ] **DECK-04**: User can download the generated deck as PPTX
- [ ] **DECK-05**: User can download the generated deck as PDF
- [ ] **DECK-06**: User can choose from 3 deck themes (Clean, Executive, Brand)

### Deck Generator v2

- [ ] **DECK-07**: User can share a deck via web link with interactive evidence drill-down (clicking a claim shows the source)
- [ ] **DECK-08**: Deck owner can choose public or authenticated access when sharing
- [ ] **DECK-09**: User can build custom decks by composing slides from briefs, queries, decisions, and competitive digests
- [ ] **DECK-10**: User can reorder slides via drag-and-drop and edit slide content inline
- [ ] **DECK-11**: User can export a deck to Google Slides

## Future Requirements

Deferred to future milestones.

### Signal Loop
- **LOOP-01**: System monitors pain area signals 30/60/90 days after feature ships
- **LOOP-02**: Decision log entry auto-updated with signal loop check results

### Usage Data
- **USAGE-01**: User can ingest Mixpanel/Amplitude event data
- **USAGE-02**: Usage signals appear alongside qualitative evidence in queries

### Integrations
- **INTG-01**: User can export briefs to Linear as epics
- **INTG-02**: User can export briefs to Notion database
- **INTG-03**: User can connect Gong for automatic call ingestion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time competitive monitoring | Full product category, not a feature — weekly batch scraping gives 80% value |
| Custom branded deck templates | 3 built-in themes sufficient for design partners |
| AI-generated speaker notes | Generic output, worse than writing from scratch |
| In-browser presentation mode | PPTX export is the present mode |
| Competitive battlecards | Sales enablement JTBD, not PM research |
| AI slide images (DALL-E/SD) | Generic, can't evidence-trace, expensive |
| Enterprise SSO (SAML) | Not needed for design partners |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| COMP-05 | TBD | Pending |
| COMP-06 | TBD | Pending |
| DECK-01 | TBD | Pending |
| DECK-02 | TBD | Pending |
| DECK-03 | TBD | Pending |
| DECK-04 | TBD | Pending |
| DECK-05 | TBD | Pending |
| DECK-06 | TBD | Pending |
| DECK-07 | TBD | Pending |
| DECK-08 | TBD | Pending |
| DECK-09 | TBD | Pending |
| DECK-10 | TBD | Pending |
| DECK-11 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 17 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 17

---
*Requirements defined: 2026-02-25 (v1.0)*
*Last updated: 2026-03-04 after v2.0 milestone definition*
