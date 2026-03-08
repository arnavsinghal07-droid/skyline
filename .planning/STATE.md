---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Competitive Intelligence + Deck Generator
status: in_progress
last_updated: "2026-03-08T19:30:00.000Z"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 4
  completed_plans: 2
---

# State: Sightline

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-08)

**Core value:** Every product recommendation must be traceable to customer evidence — trust is the product.
**Current focus:** Milestone v2.0 — Competitive Intelligence + Deck Generator

## Current Position

Phase: Phase 5 — Competitive Core (complete)
Plan: 05-01 complete, 05-02 complete
Status: Phase 5 complete — next phase is Phase 6 (Competitive Intelligence Layer)
Last activity: 2026-03-08 — Completed v1.0 milestone archival

Progress: ██░░░░░░░░ 25% (v2.0: 1/4 phases)

## Milestone History

- **v1.0 Brief v2 + Ship Ready** — SHIPPED 2026-03-08 (4 phases, 8 plans, 9 days)
  - See: .planning/MILESTONES.md

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

v2.0 Decisions:
- Competitive data in separate Qdrant collection (sightline-competitive) — never mixed with main corpus
- Deck generation runs as BullMQ background job — 6 pipeline steps are too slow for synchronous requests
- PPTX via python-pptx deterministic template engine — Claude writes content, code renders slides
- Prompts for deck generation in packages/ai/prompts/deck/ — never inline
- evidence_ids must propagate through all 6 deck pipeline steps
- G2/Capterra CSV upload fallback must be available Day 1 — scraping is unstable
- Postgres-backed job queue via scraping_jobs table — no Redis/BullMQ infrastructure needed
- Single extractCompetitiveSignals() function shared by scrape and CSV paths
- Dedicated /api/competitors/signals endpoint for evidence panel
- Competitive signals fetched non-blocking after query result completes

### Pending Todos

- Phase 4 landing page gaps (LAND-01/03/04) documented as known gaps in v1.0 — address in future milestone

### Blockers/Concerns

- G2/Capterra scraping requires headless browser (playwright + playwright-stealth) — may be blocked by Cloudflare; CSV fallback is mandatory
- python-pptx dependency needs to be added to tools/ — currently no PPTX tooling in monorepo
- Google Slides API requires OAuth consent screen and service account setup — needed for Phase 8
- Shareable web links require a public route with optional auth — security model needs design before Phase 8
- PII in evidence chunks must be sanitized for unauthenticated deck viewers (public share links)

## Session Continuity

Last session: 2026-03-08
Stopped at: Completed v1.0 milestone archival
Resume file: None
Next action: Plan Phase 6 (Competitive Intelligence Layer) or Phase 7 (Deck Generator v1)
