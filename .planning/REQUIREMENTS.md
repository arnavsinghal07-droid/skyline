# Requirements: Sightline

**Defined:** 2026-02-25
**Core Value:** Every product recommendation must be traceable to customer evidence — trust is the product.

## v1.0 Requirements

Requirements for milestone v1.0 — Brief v2 + Ship Ready. Each maps to roadmap phases.

### Brief v2

- [x] **BRIEF-01**: User can generate a brief with UI Direction section showing screen-by-screen component changes grounded in customer evidence
- [x] **BRIEF-02**: User can generate a brief with Data Model Hints section showing typed table/field suggestions with rationale
- [ ] **BRIEF-03**: User can view existing v1 briefs without errors after the v2 upgrade (backward compatibility)
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
- [ ] **LAND-02**: Visitor can submit email to join the waitlist (saved to Supabase, confirmation via Resend)
- [ ] **LAND-03**: Landing page displays product screenshots of query interface and brief panel
- [ ] **LAND-04**: Landing page shows pricing section with Starter and Pro tier feature comparison

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Signal Loop

- **LOOP-01**: System monitors pain area signals 30/60/90 days after feature ships
- **LOOP-02**: Decision log entry auto-updated with signal loop check results

### Usage Data

- **USAGE-01**: User can ingest Mixpanel/Amplitude event data
- **USAGE-02**: Usage signals appear alongside qualitative evidence in queries

### Competitive Intelligence

- **COMP-01**: Competitor mentions extracted from customer calls during enrichment
- **COMP-02**: Weekly competitive digest generated from external review platforms

### Integrations

- **INTG-01**: User can export briefs to Linear as epics
- **INTG-02**: User can export briefs to Notion database
- **INTG-03**: User can connect Gong for automatic call ingestion

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Enterprise SSO (SAML) | Phase 3 — not needed for design partners |
| Signal heatmap dashboard | Deferred — not critical for v1.0 ship readiness |
| Stripe Elements (custom payment form) | PCI complexity not justified; hosted checkout sufficient |
| Stripe metered billing API | Over-engineered for design partner scale; simple counter in DB |
| Multi-seat / team billing | Requires invite flows, seat counting, proration — Phase 2 |
| Referral / viral waitlist | Only worthwhile at 200+ signups; design partners are direct outreach |
| Interactive demo on landing page | 2-4 weeks engineering; static screenshots achieve 80% of conversion lift |
| Landing page blog / SEO content | Long-term growth lever; not a launch requirement |
| GitHub Issues / JSON export | Clipboard + .md sufficient for design partners |
| Annual billing discount | Churn reduction lever; premature for design partner phase |
| Figma/Linear/Notion export integrations | Each is a 1-week integration; clipboard is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRIEF-01 | Phase 1 | Complete |
| BRIEF-02 | Phase 1 | Complete |
| BRIEF-03 | Phase 1 | Pending |
| BRIEF-04 | Phase 1 | Complete |
| EXPORT-01 | Phase 2 | Complete |
| EXPORT-02 | Phase 2 | Complete |
| EXPORT-03 | Phase 2 | Complete |
| BILL-01 | Phase 3 | Complete |
| BILL-02 | Phase 3 | Complete |
| BILL-03 | Phase 3 | Complete |
| BILL-04 | Phase 3 | Complete |
| BILL-05 | Phase 3 | Complete |
| BILL-06 | Phase 3 | Complete |
| LAND-01 | Phase 4 | Pending |
| LAND-02 | Phase 4 | Pending |
| LAND-03 | Phase 4 | Pending |
| LAND-04 | Phase 4 | Pending |

**Coverage:**
- v1.0 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation*
