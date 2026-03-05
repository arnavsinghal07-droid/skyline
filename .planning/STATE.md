---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Competitive Intelligence + Deck Generator
status: defining_requirements
last_updated: "2026-03-04T00:00:00Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# State: Sightline

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** Every product recommendation must be traceable to customer evidence — trust is the product.
**Current focus:** Milestone v2.0 — Competitive Intelligence + Deck Generator

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-04 — Milestone v2.0 started

Progress: ░░░░░░░░░░ 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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
- Deck generation: Sonnet for narrative/structure, Haiku for layout decisions
- PPTX via python-pptx deterministic template engine — Claude writes content, code renders slides
- Prompts for deck generation in packages/ai/prompts/deck/ — never inline

### Pending Todos

None yet.

### Blockers/Concerns

- G2/Capterra scraping may require API access or headless browser — research during Phase 1
- python-pptx dependency needs to be added — currently no Python tooling in the monorepo beyond tools/
- Google Slides API requires OAuth consent screen and service account setup
- Shareable web links require a public route with optional auth — security model needs design

## Session Continuity

Last session: 2026-03-04
Stopped at: Milestone v2.0 initialization — defining requirements
Resume file: None
