# Research Summary: v2.0 — Competitive Intelligence + Deck Generator

**Synthesized:** 2026-03-04

## Stack Additions
- **Python**: playwright, playwright-stealth, beautifulsoup4, lxml (scraping); python-pptx (PPTX); google-api-python-client + google-auth (Slides API)
- **Frontend**: @dnd-kit/core + @dnd-kit/sortable (custom builder drag-drop)
- **System**: LibreOffice headless for PDF conversion (Docker)
- **No new npm AI packages** — existing Anthropic SDK sufficient

## Feature Table Stakes
- Competitor mention extraction from calls + G2/Capterra external scraping
- Structured signal extraction (pain points, switching reasons, feature requests)
- Gap scoring + weekly competitive digest
- One-click deck from any artifact with PPTX/PDF export
- Evidence tracing on every slide (Sightline's core differentiator)

## Watch Out For
1. **G2/Capterra scraping instability** — JS-rendered, Cloudflare protected. Build CSV upload fallback Day 1.
2. **Corpus contamination** — Competitive signals MUST stay in separate Qdrant collection. Never merge.
3. **Evidence ID dropout** — 6-step deck pipeline must preserve evidence_ids at every step.
4. **Deck generation timeouts** — Must be async (BullMQ) from Day 1, not synchronous.
5. **Shareable viewer PII exposure** — Sanitize evidence summaries for unauthenticated viewers.

## Key Architecture Decisions
- Competitive data in `sightline-competitive` Qdrant collection (separate from main corpus)
- Deck generation runs as BullMQ background job (6 pipeline steps too slow for sync)
- Sonnet for deck narrative/composition, Haiku for layout decisions and signal extraction
- PPTX via python-pptx deterministic templates — Claude writes content, code renders slides
- Shareable links use crypto-random share_id with is_public toggle

## Suggested Build Order
1. Competitive: Internal extraction (extend enrichment pipeline)
2. Competitive: External scraping + signal extraction + new Qdrant collection
3. Competitive: Weekly digest (BullMQ cron + Resend)
4. Competitive: Gap scoring
5. Deck v1: Full pipeline + PPTX export + evidence tracing
6. Deck v1: PDF export
7. Deck v2: Shareable web link with evidence drill-down
8. Deck v2: Custom builder
9. Deck v2: Google Slides export

## New DB Tables Needed
- `competitors` — tracked competitor list
- `competitive_digests` — weekly digest records
- `decks` — deck metadata with share_id, is_public, theme
- `deck_slides` — slide content + evidence links

---
*Research summary for: Sightline v2.0*
