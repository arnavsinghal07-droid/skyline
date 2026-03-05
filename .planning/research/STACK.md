# Stack Research: v2.0 — Competitive Intelligence + Deck Generator

**Researched:** 2026-03-04
**Focus:** Stack additions needed for competitive intelligence and deck generation

## New Dependencies Required

### Python Layer (tools/)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| playwright | >=1.40.0 | G2/Capterra scraping (JS-rendered pages) | Headless browser required — static HTTP returns empty/CAPTCHA |
| playwright-stealth | >=1.0.6 | Bypass Cloudflare fingerprint challenges on G2 | Patches webdriver flags |
| beautifulsoup4 | >=4.12.0 | HTML parsing after Playwright loads DOM | Paired with lxml |
| lxml | >=5.0.0 | Fast HTML parser backend | Required by beautifulsoup4 |
| python-pptx | >=1.0.0 | PPTX generation (deterministic template engine) | v1.0.0 released 2024, stable API |
| google-api-python-client | >=2.100.0 | Google Slides API v1 | For programmatic deck creation |
| google-auth | >=2.25.0 | Google OAuth/service account auth | Required by google-api-python-client |
| google-auth-oauthlib | >=1.1.0 | OAuth flow for Google Slides | User consent for Drive access |

### Frontend (npm) — Minimal additions

- Drag-and-drop for custom builder: `@dnd-kit/core` + `@dnd-kit/sortable` (or use Framer Motion Reorder)
- Everything else uses existing stack (Next.js routes, Tailwind, Zustand)

### System Requirements

- **LibreOffice headless** in Docker container for PPTX → PDF conversion
  - `libreoffice --headless --convert-to pdf`
  - NOT needed for dev (PDF export can be deferred)

### New Environment Variables

```
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
```

### What NOT to Add

- `reveal.js` — over-engineered for slide rendering
- `reportlab` — can't read PPTX
- `scrapy` — overkill for targeted scraping
- Custom branding system — 3 built-in themes sufficient

## Integration Points

- **Existing enrichment pipeline**: Extend `enrich.py` with competitor_mentions[] extraction
- **Existing BullMQ + Redis**: Scheduled competitive scraping + weekly digest + deck generation jobs
- **Existing Resend**: Weekly competitive digest email
- **Supabase Storage**: PPTX/PDF file hosting
- **New Qdrant collection**: `sightline-competitive` — never mixed with `sightline-chunks`

---
*Stack research for: Sightline v2.0*
