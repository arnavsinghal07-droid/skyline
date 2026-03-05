# Feature Research: v2.0 — Competitive Intelligence + Deck Generator

**Researched:** 2026-03-04

## Table Stakes

### Competitive Intelligence
- Competitor mention extraction from customer calls (extend enrichment)
- External review scraping (G2/Capterra) with structured signal extraction
- Gap scoring (competitor weaknesses vs your backlog)
- Weekly competitive digest (scheduled, evidence-traced)

### Deck Generator
- One-click generation from any Sightline artifact (brief, query, decision, digest)
- PPTX export with evidence tracing per slide
- PDF export (LibreOffice headless conversion)
- Slide type variety (title, insight, data_viz, comparison, competitive_matrix, timeline, decision, freeform)
- Theme system (Clean, Executive, Brand)

## Differentiators

### Competitive Intelligence
- **Internal + external corpus fusion** — only tool combining call evidence AND review evidence in one view
- **Evidence-grounded gap scoring** — every gap score traceable to specific reviews/calls (unlike editorial battlecards)
- **Competitive intel as brief input** — pre-populate brief competitive context with evidence

### Deck Generator
- **Custom builder with evidence library** — drag in specific briefs, queries, decisions as slides
- **Shareable web link with evidence drill-down** — click any claim to see source chunk/signal
- **Google Slides export** — default format for startup PMs
- **One-click from competitive digest** — natural "present this week's findings" flow

## Anti-Features (Do NOT Build)
- Real-time competitive monitoring (full product category, not a feature)
- Custom branded templates (3 built-in themes sufficient)
- AI-generated speaker notes (generic, worse than writing from scratch)
- In-browser presentation mode (PPTX is the present mode)
- Competitive battlecards (sales enablement, different JTBD)
- AI slide images/DALL-E (generic, can't evidence-trace)

## Dependencies
```
Comp Intel: Internal extraction → External scraping → Signal extraction → Gap scoring → Weekly digest
Deck v1: Intent → Select → Compose → Layout → Link evidence → Export (PPTX/PDF)
Deck v2: Web viewer, Custom builder, Google Slides (all depend on v1 pipeline)
Cross: Deck from competitive digest requires both comp intel + deck v1
```

## Priority Matrix
- **P1 (must have):** Internal extraction, G2/Capterra scraping, signal extraction, weekly digest, one-click deck, PPTX export, evidence tracing, themes
- **P2 (after validation):** Gap scoring, custom builder, shareable web link, PDF export
- **P3 (future):** Google Slides export

---
*Feature research for: Sightline v2.0*
