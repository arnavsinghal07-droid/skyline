# Pitfalls Research: v2.0 — Competitive Intelligence + Deck Generator

**Researched:** 2026-03-04

## Critical Pitfalls

### P1: G2/Capterra Scraping Instability
G2/Capterra use JS rendering + Cloudflare. Static HTTP returns empty HTML.
**Fix:** Playwright + playwright-stealth. Rate-limit 1 req/5s. Build CSV upload as Day 1 fallback. Consider SerpAPI for production.

### P2: Competitive Corpus Contamination
Competitive signals leak into discovery queries — PM cites competitor's customer as their own.
**Fix:** Strict separate Qdrant collections. Label source type in evidence panel. Never merge collections. Discovery query includes competitive only when explicitly requested.

### P3: Evidence ID Dropout in Deck Pipeline
evidence_ids present on source artifact but lost during 6-step pipeline. Web viewer shows "No sources."
**Fix:** evidence_ids is required (not optional) on every DeckSlide. link_evidence.py validates. Test every pipeline step preserves IDs.

### P4: Competitor Extraction in Ingestion Hot Path
Deep extraction adds 300ms/chunk × 150 chunks/call = 45s extra per ingestion.
**Fix:** Keep basic tagging in-pipeline. Move deep extraction to separate async BullMQ job.

### P5: python-pptx Placeholder Index Mismatch
`slide.placeholders[0]` is not always the title. Wrong idx = titles in body position.
**Fix:** Enumerate all placeholder indices from template before writing generation code. Test every slide type.

### P6: Untraced Claims in PPTX/PDF Export
PPTX/PDF has no native affordance for evidence references. Claims appear unsourced.
**Fix:** Speaker notes with source attribution + footer text boxes + pre-export validation that every statistic has evidence_id.

### P7: Google Slides Service Account vs User OAuth
Service accounts can't create files in user's Drive (only their own).
**Fix:** User-delegated OAuth 2.0 with drive.file scope. Defer Slides to v2 — PPTX + web viewer first.

### P8: Shareable Viewer Exposes Raw Evidence to Unauthenticated Users
Customer PII (call transcripts, NPS verbatims) accessible via drill-down.
**Fix:** Pre-compute sanitized evidence summaries at publish time. Never return raw chunks to unauthenticated sessions.

## Medium Pitfalls

### P9: Gap Scoring Dominated by Review Volume
Competitor with 500 reviews always tops gap list regardless of relevance.
**Fix:** Normalize by total signal count, weight switching-intent signals 3x, apply recency decay.

### P10: Deck Generation Timeouts
6-step pipeline with multiple Claude calls exceeds 30-60s.
**Fix:** Run as BullMQ background job from Day 1. Return deck ID immediately, poll for completion.

### P11: Enrichment Backfill Missed
Adding competitor_mentions[] only affects new ingestions. Existing chunks have no tags.
**Fix:** Idempotent backfill BullMQ job. Queue chunks in batches. Track progress.

### P12: Silent Digest Job Failures
Weekly cron runs but fails silently — PM never knows.
**Fix:** Log job status. Alert on failure. Show "Last digest: [date]" in UI.

### P13: Claude Markdown in PPTX
Claude outputs markdown (bold, bullets) that renders as literal asterisks in PPTX text.
**Fix:** Strip markdown formatting before passing to python-pptx. Or parse and apply PPTX text formatting.

---
*Pitfalls research for: Sightline v2.0*
