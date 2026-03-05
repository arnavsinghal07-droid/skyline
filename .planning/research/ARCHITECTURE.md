# Architecture Research: v2.0 — Competitive Intelligence + Deck Generator

**Researched:** 2026-03-04

## New Components

### Competitive Intelligence — Python Tools
```
tools/competitive/
├── scrape_reviews.py      # Playwright → G2/Capterra → raw reviews
├── extract_signals.py     # Raw reviews → structured JSON (Haiku)
├── score_gaps.py          # Cross-ref competitive signals with briefs
└── generate_summary.py    # Weekly digest JSON + email
```

### Enrichment Extension
- `tools/pipeline/enrich.py` — add competitor_mentions[] (additive)
- Backfill job needed for existing documents

### New Qdrant Collection
- `sightline-competitive` — separate from `sightline-chunks`
- Additional metadata: competitor_name, review_platform, rating

### Deck Generator — Python Tools
```
tools/decks/
├── analyze_intent.py      # Source → deck intent (Sonnet)
├── select_content.py      # Intent → evidence selection per slide
├── compose_slides.py      # Slide content JSON (Sonnet)
├── apply_layout.py        # Slide type + layout (Haiku)
├── link_evidence.py       # Verify evidence IDs resolve
└── export.py              # PPTX (python-pptx) + PDF (LibreOffice)
```

### New Database Tables
```sql
competitors (id, org_id, name, g2_slug, capterra_slug)
competitive_digests (id, org_id, workspace_id, week_start, week_end, content_json, status)
decks (id, workspace_id, user_id, title, source_type, source_id, theme, status, share_id, is_public)
deck_slides (id, deck_id, position, slide_type, content_json, evidence_ids, layout)
```

### New API Routes
- POST /api/competitive/scrape — trigger scraping job
- GET /api/competitive/digest — fetch latest digest
- POST /api/decks/generate — trigger deck generation (BullMQ job)
- GET /api/decks/[id] — fetch deck + slides
- GET /api/decks/[id]/export — download PPTX/PDF
- POST /api/decks/[id]/publish — set share_id, toggle is_public

### Web Viewer
- `/decks/[shareId]/view` — public or authenticated slide viewer with evidence drill-down

## Data Flows

**Competitive:**
```
Scrape G2/Capterra → Extract signals (Haiku) → Embed → sightline-competitive
BullMQ weekly cron → Aggregate signals → Generate digest → Supabase + Resend email
```

**Deck:**
```
Generate request → BullMQ job → analyze_intent → select_content → compose_slides → apply_layout → link_evidence → export.py → Supabase Storage
```

## Build Order
1. Competitive: Internal extraction (extend enrichment)
2. Competitive: External scraping + signal extraction
3. Competitive: Weekly digest
4. Competitive: Gap scoring
5. Deck v1: Pipeline + PPTX export
6. Deck v1: PDF export
7. Deck v2: Shareable web link
8. Deck v2: Custom builder
9. Deck v2: Google Slides export

## Security
- share_id: crypto-random UUID (not sequential)
- is_public defaults false — owner must explicitly publish
- Sanitize evidence summaries for unauthenticated viewers (no raw PII)
- Google OAuth: minimal scope, encrypted refresh tokens

---
*Architecture research for: Sightline v2.0*
