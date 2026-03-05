# Phase 5: Competitive Core - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract competitor mentions from existing customer signals and scrape external reviews (G2/Capterra). Store all competitive data in a separate Qdrant collection (`sightline-competitive`), display with distinct labeling in the evidence panel, and provide CSV upload fallback when scraping is blocked. Gap scoring, weekly digests, and scheduled scraping are out of scope (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Competitor management
- Search-assisted add flow: user types competitor name, system suggests G2/Capterra matches, user confirms
- Dedicated `/competitors` page in the main nav — full list with add/edit/remove actions
- Plan-based competitor limits tied to Stripe billing (Free: 3, Pro: 10, Enterprise: unlimited)
- Soft delete on removal: data stays in collection but is hidden from UI, restorable if competitor is re-added

### Signal presentation in evidence panel
- Separate tab/section in the evidence panel: "Customer Signals" and "Competitive Signals" — never mixed in the same list
- Quote-style cards for each competitive signal: review quote, competitor name, source (G2/Capterra), signal type tag (pain point, switching reason, feature request), date
- Two filters available in the competitive tab: filter by competitor name AND filter by signal type
- AI response references competitive signals only when the query is explicitly about competitors; otherwise competitive signals stay in the panel only

### Scraping behavior
- Scraping runs as a background job (BullMQ); competitor card shows "Scraping in progress" status; toast notification when complete
- On failure: auto-retries 2-3 times over a few hours, then shows error state with CSV upload suggestion as fallback
- Accept raw G2/Capterra CSV export format directly — minimal user friction, no custom template needed
- Manual re-scrape only via a "Refresh" button on each competitor card; scheduled scraping deferred to Phase 6

### Re-enrichment flow
- Auto-scan on competitor add: when a user adds a new competitor, system automatically scans all existing signals for mentions
- Manual "Re-scan" button available on the competitors page for subsequent runs
- Full corpus scan — no date range scoping, always scans all existing signals
- Results surfaced via toast notification ("Found 12 mentions of [Competitor] across 8 signals") plus mention count badge on the competitor card
- New signals ingested after competitors are added are always automatically checked for competitor mentions during the enrichment step — no user toggle needed

### Claude's Discretion
- Exact search-assisted matching implementation for G2/Capterra slug discovery
- Background job retry timing and backoff strategy
- Competitor card visual design and status indicators
- Toast notification styling and placement
- Internal deduplication logic for re-scraped reviews

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Scheduled/automatic scraping (weekly) — Phase 6
- Gap scoring (competitor weaknesses vs feature backlog) — Phase 6
- Weekly competitive digest email — Phase 6

</deferred>

---

*Phase: 05-competitive-core*
*Context gathered: 2026-03-05*
