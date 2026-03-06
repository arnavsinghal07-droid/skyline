---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Competitive Intelligence + Deck Generator
status: unknown
last_updated: "2026-03-06T22:10:50.989Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 10
  completed_plans: 9
---

# State: Sightline

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** Every product recommendation must be traceable to customer evidence — trust is the product.
**Current focus:** Milestone v2.0 — Competitive Intelligence + Deck Generator

## Current Position

Phase: Phase 5 — Competitive Core (complete)
Plan: 05-01 complete, 05-02 complete
Status: Phase 5 complete — all plans executed
Last activity: 2026-03-06 — 05-02 competitive frontend complete (competitors page, evidence panel tabs, filters)

Progress: ██████████ 100% (Phase 5)

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 6min
- Total execution time: 12min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 05-competitive-core | 2 | 12min | 6min |

**Recent Trend (from v1.0):**
| Phase 01-brief-v2 P01 | 2 | 2 tasks | 2 files |
| Phase 01-brief-v2 P02 | 8 | 3 tasks | 6 files |
| Phase 02-coding-agent-export P01 | 1 | 1 task | 1 file |
| Phase 03-stripe-billing P01 | 225s | 4 tasks | 8 files |
| Phase 03-stripe-billing P02 | 309s | 3 tasks | 8 files |
| Phase 04-landing-page P01 | 123s | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Carried from v1.0:

- All LLM calls through packages/ai/client.ts — never direct Anthropic SDK from apps/
- claude-sonnet-4-6 for reasoning/briefs/deck narrative, claude-haiku-4-5-20251001 for enrichment/tagging/layout
- Competitive data in separate Qdrant collection (sightline-competitive) — never mixed with main corpus
- Deck generation runs as BullMQ background job — 6 pipeline steps are too slow for synchronous requests
- PPTX via python-pptx deterministic template engine — Claude writes content, code renders slides
- Prompts for deck generation in packages/ai/prompts/deck/ — never inline
- evidence_ids must propagate through all 6 deck pipeline steps (analyze_intent → select_content → compose_slides → apply_layout → link_evidence → export)
- G2/Capterra CSV upload fallback must be available Day 1 — scraping is unstable

v2.0 Phase 5:
- Used stable after() from Next.js 16 instead of unstable_after — API stabilized in this version
- Postgres-backed job queue via scraping_jobs table — no Redis/BullMQ infrastructure needed
- Single extractCompetitiveSignals() function shared by scrape and CSV paths for identical extraction
- Dedicated /api/competitors/signals endpoint for evidence panel rather than extending existing GET route
- Competitive signals fetched non-blocking after query result completes

### Pending Todos

- Phase 4 (Landing Page) plan 04-02 still in progress from v1.0 — complete before starting Phase 5

### Blockers/Concerns

- G2/Capterra scraping requires headless browser (playwright + playwright-stealth) — may be blocked by Cloudflare; CSV fallback is mandatory
- python-pptx dependency needs to be added to tools/ — currently no PPTX tooling in monorepo
- Google Slides API requires OAuth consent screen and service account setup — needed for Phase 8
- Shareable web links require a public route with optional auth — security model needs design before Phase 8
- PII in evidence chunks must be sanitized for unauthenticated deck viewers (public share links)

## Session Continuity

Last session: 2026-03-06
Stopped at: Completed 05-02-PLAN.md (competitive frontend)
Resume file: None
Next action: Phase 5 complete — proceed to next phase (deck generator or other modules)
