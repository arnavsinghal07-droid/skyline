# Architecture Patterns

**Domain:** AI-native product discovery SaaS — Competitive Intelligence + Deck Generator (v2.0)
**Researched:** 2026-03-04
**Confidence:** MEDIUM — Based on direct codebase inspection (v1.0 research), CLAUDE.md specs, and established patterns. Web search unavailable; flag G2/Capterra ToS, Google Slides API quotas, and python-pptx placeholder API for verification before building.

---

## Critical Context: Actual Architecture vs. CLAUDE.md Vision

**The codebase is a Next.js 15 single-app rooted at `src/` — not the multi-package monorepo in CLAUDE.md.**

What actually exists after v1.0:
- `src/app/api/` — Next.js App Router route handlers (no tRPC)
- Supabase Postgres + RLS + Supabase Auth (magic link)
- Direct Anthropic SDK calls from route handlers
- No Zustand, no React Query — `useState` + raw `fetch` pattern
- No BullMQ, no Redis, no Qdrant, no Python tools
- Stripe, Resend, shiki added in v1.0

This milestone introduces major new infrastructure. The build order accounts for bootstrapping before building features on top.

---

## System Architecture: Current + New

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Next.js 15 App (src/)                                │
├──────────────────────────────────────────────────────────────────────────┤
│  PAGES                                                                    │
│  /query (exists) | /briefs (exists) | /decisions (exists)                │
│  /billing (exists) | /competitive (NEW) | /decks (NEW)                   │
│  /decks/[token] — public viewer, outside auth boundary (NEW)             │
├──────────────────────────────────────────────────────────────────────────┤
│  API ROUTES (src/app/api/)                                                │
│  briefs/ (mod) | query/ (exists) | stripe/ (exists)                      │
│  competitive/ (NEW) | decks/ (NEW) | chunks/public (NEW)                 │
│  integrations/google/ (NEW — Phase 6)                                    │
├──────────────────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                                        │
│  Supabase Auth+DB+Storage | Anthropic claude-* | Stripe | Resend         │
│  Python FastAPI Service (NEW) | Qdrant (NEW) | Google Slides API (NEW)   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure New This Milestone

### Python FastAPI Service

No Python tooling exists in the current codebase. The `tools/` structure in CLAUDE.md is aspirational. This milestone introduces a Python FastAPI microservice that handles:
- Web scraping (requests + BeautifulSoup — the right tool; Node.js headless browser is overkill for paginated review pages)
- Anthropic extraction calls (Haiku)
- OpenAI embeddings + Qdrant upserts
- PPTX generation (python-pptx)
- PDF conversion (LibreOffice headless)
- Google Slides export (Phase 6)

**Location:** `python-service/` at project root. Dockerfile included. Added to docker-compose.yml.

**Communication:** Next.js API routes call Python service via `fetch()` to `PYTHON_SERVICE_URL` (internal network). Python service requires `X-Internal-Secret` header matching env var to reject external calls.

### Qdrant Vector DB

No vector DB exists. Introduced this milestone for competitive signal embeddings. Added to docker-compose.yml.

Collection: `sightline-competitive` (separate from any future `sightline-chunks` qualitative collection — never mixed).

Embedding model: OpenAI `text-embedding-3-large` for consistency with planned qualitative pipeline.

Hybrid search: dense (semantic) + sparse (BM25/BM42 for keyword matching on product names, feature terms).

### Zustand

Introduced this milestone for deck builder state management. Not retroactively applied to existing pages.

### Supabase Storage Buckets (New)

```
sightline-deck-assets/   (private)
  templates/clean.pptx
  templates/executive.pptx
  templates/brand.pptx
  charts/{deck_id}/{slide_id}.png    # matplotlib exports (temp)

sightline-exports/       (private, signed URLs)
  pptx/{org_id}/{deck_id}/{ts}.pptx
  pdf/{org_id}/{deck_id}/{ts}.pdf
```

Python service uploads using service role. Next.js generates signed URLs (1-hour expiry) for client download.

---

## Part 1: Competitive Intelligence

### New Postgres Tables

```sql
CREATE TABLE competitors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL,
  workspace_id UUID        NOT NULL,
  name         TEXT        NOT NULL,
  g2_url       TEXT,
  capterra_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE TABLE competitive_signals (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID        NOT NULL,
  workspace_id           UUID        NOT NULL,
  competitor_id          UUID        REFERENCES competitors(id) ON DELETE CASCADE,
  source_type            TEXT        NOT NULL
                         CHECK (source_type IN ('g2','capterra','internal_call')),
  raw_text               TEXT        NOT NULL,
  extracted_pain_points  JSONB,
  extracted_feature_reqs JSONB,
  switching_reasons      JSONB,
  sentiment              TEXT        CHECK (sentiment IN ('positive','neutral','negative','mixed')),
  review_date            TIMESTAMPTZ,
  qdrant_chunk_id        TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE competitive_signals ENABLE ROW LEVEL SECURITY;

CREATE TABLE competitive_digests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL,
  workspace_id UUID        NOT NULL,
  week_of      DATE        NOT NULL,
  summary      JSONB       NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE competitive_digests ENABLE ROW LEVEL SECURITY;

CREATE TABLE competitive_gap_scores (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID        NOT NULL,
  workspace_id       UUID        NOT NULL,
  competitor_id      UUID        REFERENCES competitors(id) ON DELETE CASCADE,
  backlog_item_label TEXT        NOT NULL,
  gap_score          NUMERIC(3,2) NOT NULL,
  rationale          TEXT,
  scored_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE competitive_gap_scores ENABLE ROW LEVEL SECURITY;
```

All tables: RLS policies scoped to `org_id`.

### Qdrant Collection Metadata Schema

```json
{
  "org_id": "string",
  "workspace_id": "string",
  "competitor_id": "string",
  "competitor_name": "string",
  "source_type": "g2 | capterra | internal_call",
  "signal_type": "competitive",
  "pain_points": ["string"],
  "switching_reasons": ["string"],
  "feature_requests": ["string"],
  "sentiment": "positive | neutral | negative | mixed",
  "review_date": "ISO8601",
  "confidence": 0.0
}
```

### Python Service Endpoints (Competitive)

```
POST /scrape
  Body: { competitor_id, g2_url, capterra_url, org_id, workspace_id }
  Async: scrape → extract (Haiku) → embed → Qdrant upsert → Postgres write
  Returns: { job_id }

GET  /scrape/status/{job_id}
  Returns: { status: queued|running|complete|failed, progress, error? }

POST /extract-from-transcript
  Body: { text, org_id, workspace_id, competitor_name }
  Sync: extract mentions → embed → Qdrant upsert
  Returns: { chunk_ids: string[] }

POST /gap-score
  Body: { competitor_id, backlog_items: string[], org_id, workspace_id }
  Sync: query Qdrant → Sonnet score → return results
  Returns: { scores: [{ item, gap_score, rationale }] }

POST /generate-digest
  Body: { workspace_id, org_id, week_of }
  Sync: aggregate competitive signals → Sonnet digest
  Returns: { summary: DigestJSON }
```

**Job status tracking:** Python service writes to a `python_jobs` Postgres table (status: queued/running/complete/failed). Next.js polls via the status endpoint. No Redis needed at design-partner scale — Postgres polling at 2s is sufficient.

### Next.js API Routes (Competitive)

```
src/app/api/competitive/
├── competitors/route.ts           GET (list), POST (add)
├── competitors/[id]/route.ts      DELETE
├── scrape/route.ts                POST → call Python svc /scrape, return job_id
├── scrape/status/route.ts         GET → poll job status from Postgres
├── signals/route.ts               GET paginated competitive_signals
├── gap-score/route.ts             POST → call Python svc /gap-score
└── digest/route.ts                GET latest competitive_digest for workspace
```

### Data Flow: Competitive Intelligence

```
[PM adds competitor + URLs]
  POST /api/competitive/competitors → INSERT competitors
  POST /api/competitive/scrape → Python svc /scrape (async)
                                            │
                        [Python svc — runs async]
                        scrape_reviews.py: fetch G2/Capterra HTML
                        extract_signals.py: Haiku → pain_points, switching_reasons, feature_reqs
                        embed_competitive.py: OpenAI embeddings → Qdrant sightline-competitive
                        INSERT competitive_signals (with qdrant_chunk_id)
                        UPDATE python_jobs (status=complete)
                                            │
                    [Frontend polls /api/competitive/scrape/status]
                    When complete: fetch /api/competitive/signals → display

[Internal call ingestion — existing pipeline modified]
  Existing enrichment already tags competitor_mentions
  NEW: if competitor_mentions found → POST Python svc /extract-from-transcript
  Python svc embeds mention text → Qdrant sightline-competitive
  (Original chunk stays in existing storage unchanged)

[Weekly cron — trigger manually or via Next.js cron route]
  POST /api/competitive/digest → Python svc /generate-digest (Sonnet)
  INSERT competitive_digests → display in /competitive/digest
```

---

## Part 2: Deck Generator

### New Postgres Tables

```sql
CREATE TABLE decks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL,
  workspace_id     UUID        NOT NULL,
  user_id          UUID        NOT NULL,
  title            TEXT        NOT NULL,
  source_type      TEXT        NOT NULL
                   CHECK (source_type IN ('brief','query','decision','competitive','signal_loop','custom')),
  source_id        UUID,
  theme            TEXT        NOT NULL DEFAULT 'clean'
                   CHECK (theme IN ('clean','executive','brand')),
  status           TEXT        NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','generating','ready','failed','published')),
  share_token      TEXT        UNIQUE,
  share_expires_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE TABLE deck_slides (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID        NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  position     INTEGER     NOT NULL,
  slide_type   TEXT        NOT NULL
               CHECK (slide_type IN ('title','insight','data_viz','comparison','proposal',
                                     'competitive_matrix','persona','timeline','decision','freeform')),
  content_json JSONB       NOT NULL,
  evidence_ids TEXT[],
  layout       TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE deck_slides ENABLE ROW LEVEL SECURITY;

-- For Google Slides OAuth (Phase 6)
CREATE TABLE user_integrations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL UNIQUE,
  google_access_token  TEXT,        -- store encrypted
  google_refresh_token TEXT,        -- store encrypted, long-lived
  google_token_expiry  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
-- user_integrations RLS: scoped to user_id (not org_id)
```

Token encryption for `user_integrations`: use `pgcrypto` `pgp_sym_encrypt()` / `pgp_sym_decrypt()` with `DATABASE_ENCRYPTION_KEY` env var. Never store Google OAuth tokens in plaintext.

### Python Service Endpoints (Deck)

```
POST /deck/generate
  Body: { deck_id, source_type, source_id, theme, org_id, workspace_id }
  Async: 5-step pipeline (analyze_intent → select_content → compose_slides
         → apply_layout → link_evidence) → INSERT deck_slides → UPDATE decks status=ready
  Returns: { job_id }

GET /deck/generate/status/{job_id}
  Returns: { status, step, error? }

POST /deck/export/pptx
  Body: { deck_id, org_id }
  Sync: load template → fill placeholders → generate charts → upload to Supabase Storage
  Returns: { signed_url }

POST /deck/export/pdf
  Body: { deck_id, org_id }
  Sync: generate PPTX first → LibreOffice headless → upload to Supabase Storage
  Returns: { signed_url }

POST /deck/export/google-slides  (Phase 6)
  Body: { deck_id, org_id, user_id }
  Sync: fetch user tokens → Google Slides API → create presentation → batch slides
  Returns: { google_slides_url }
```

### Deck Generation Pipeline (5 Steps in Python)

```
Step 1: analyze_intent.py
  - Fetch source artifact from Postgres (brief/query/decision/competitive digest)
  - Sonnet: determine audience (exec/eng/board), goal, section order, slide count
  - Output: intent_json written to .tmp/{deck_id}/intent.json

Step 2: select_content.py
  - If source has evidence_ids: fetch chunk text from storage
  - If source_type == 'competitive': query sightline-competitive Qdrant collection
  - Build content manifest: {text, evidence_id} pairs per intended slide
  - Output: content_manifest.json

Step 3: compose_slides.py (Sonnet)
  - For each slide in intent: generate {headline, bullets[], speaker_notes}
  - Each bullet/stat must be tagged with an evidence_id from content_manifest
  - Output: slides_draft.json (evidence_ids set per slide)

Step 4: apply_layout.py (Haiku)
  - For each slide: select layout template name based on slide_type + content
  - Output: slides_final.json (layout field populated)

Step 5: link_evidence.py
  - Validate every evidence_id in slides_final resolves to a real chunk/signal in DB
  - Hard fail if any non-freeform slide has empty evidence_ids or unresolvable IDs
  - If valid: INSERT deck_slides rows, UPDATE decks SET status='ready'
  - If invalid: UPDATE decks SET status='failed', log which slide failed
```

**Why async/Python:** Deck generation involves 2 Sonnet calls + 1 Haiku call + Qdrant queries. Wall-clock time: 30-90 seconds. Next.js route handlers on Vercel time out at 60 seconds (default), 300 seconds (Pro). A persistent Python service sidesteps timeouts entirely.

### PPTX Export

```python
# python-service/exporters/pptx_exporter.py
#
# 1. Fetch deck + deck_slides from Postgres
# 2. Load base template from Supabase Storage: /templates/{theme}.pptx
# 3. For each slide: prs.slide_layouts[layout_index] → add_slide()
# 4. Fill text placeholders from content_json.headline, content_json.bullets
# 5. Speaker notes: slide.notes_slide.notes_text_frame.text = content_json.speaker_notes
# 6. Data viz slides: matplotlib → PNG → slide.shapes.add_picture(img_path, ...)
# 7. Write to .tmp/{deck_id}.pptx → upload to Supabase Storage sightline-exports/
# 8. Return signed URL (1 hour expiry)
#
# IMPORTANT: Build a simple test template first and verify placeholder fill
# behavior before implementing the full exporter. python-pptx placeholder API
# behavior varies by template design. Confidence: MEDIUM — verify docs.
```

### PDF Export

```python
# python-service/exporters/pdf_exporter.py
#
# Generate PPTX first (reuse pptx_exporter), then:
# subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf',
#                 '--outdir', '/tmp/', pptx_path])
#
# LibreOffice must be installed in the Python service Docker image:
# RUN apt-get install -y libreoffice
#
# Production note: Vercel serverless functions cannot run LibreOffice.
# Python service MUST run as a persistent container (Fly.io, Railway, Render, VM).
# Plan infrastructure before committing to this approach.
```

### Google Slides Export (Phase 6)

```python
# python-service/exporters/google_slides_exporter.py
#
# 1. Fetch user's Google tokens from user_integrations (decrypt refresh token)
# 2. google-auth-library: refresh access token if expired
# 3. googleapiclient.discovery.build('slides', 'v1', credentials=creds)
# 4. Create presentation: service.presentations().create(body={title}).execute()
# 5. For each slide batch (max ~50 ops per batchUpdate request):
#    - insertSlide, insertTextBox, insertImage operations
#    - updateSpeakerNotesProperties
# 6. Return presentation URL
#
# VERIFY: Google Slides API v1 rate limits before building
# (training data says 100 req/100s per user — may have changed)
# VERIFY: OAuth consent screen app verification timeline for production
```

### Shareable Web Viewer

```typescript
// src/app/decks/[token]/page.tsx
// PUBLIC route — outside (dashboard) layout, no auth required
// Fetches: GET /api/decks/public?token={token}
// Uses Supabase service role to query by share_token
// Returns ONLY: { title, theme, slides: [{ content_json, evidence_ids }] }
// Does NOT expose: org_id, workspace_id, user_id, source_id

// Share token generation (server-side):
// import { randomBytes, createHash } from 'crypto'
// const rawToken = randomBytes(32).toString('hex')
// const hashedToken = createHash('sha256').update(rawToken).digest('hex')
// Store: hashedToken in DB; send rawToken in URL

// Evidence drill-down:
// GET /api/chunks/public?id={chunk_id}&deck_token={token}
// Validates chunk_id is in the deck's evidence_ids (prevents traversal)
// Returns ONLY: { text, source_type, date }

// Middleware: add /decks/* to exclusion list before building public viewer
```

### Next.js API Routes (Decks)

```
src/app/api/decks/
├── route.ts                      GET (list), POST (create empty)
├── generate/route.ts             POST → async trigger Python /deck/generate
├── [id]/route.ts                 GET (deck + slides)
├── [id]/status/route.ts          GET → poll generation status
├── [id]/slides/route.ts          POST (add slide)
├── [id]/slides/[slideId]/route.ts  PATCH (update content), DELETE
├── [id]/slides/reorder/route.ts  POST (drag-drop reorder)
├── [id]/export/pptx/route.ts     POST → trigger Python /deck/export/pptx
├── [id]/export/pdf/route.ts      POST → trigger Python /deck/export/pdf
├── [id]/export/google/route.ts   POST → trigger Python /deck/export/google-slides
├── [id]/share/route.ts           POST (create token), DELETE (revoke)
└── public/route.ts               GET by share_token (no auth, service role)

src/app/api/chunks/
└── public/route.ts               GET chunk for evidence drill-down in public viewer
```

### Deck Builder Frontend State

```typescript
// src/stores/deckBuilderStore.ts (Zustand — new this milestone)
interface DeckBuilderState {
  deckId: string | null
  slides: DeckSlide[]
  selectedSlideId: string | null
  isDirty: boolean
  isSyncing: boolean

  selectSlide: (id: string) => void
  updateSlideContent: (id: string, content: Partial<SlideContentJson>) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  addSlide: (type: SlideType, position: number) => void
  deleteSlide: (id: string) => void
  syncToServer: () => Promise<void>  // debounced 1.5s; PATCH /api/decks/[id]/slides/[slideId]
}
```

**Drag-and-drop:** `@dnd-kit/core @dnd-kit/sortable` — install new. Standard for Next.js App Router (no SSR incompatibility).

### Data Flow: Deck Generation

```
[PM clicks "Generate Deck" on brief/query/decision/digest]
  POST /api/decks/generate → INSERT decks (status=generating) → POST Python /deck/generate
  Returns { deck_id } immediately

[Python svc — async]
  analyze_intent → select_content → compose_slides → apply_layout → link_evidence
  → INSERT deck_slides → UPDATE decks (status=ready)

[Frontend polls /api/decks/[id]/status every 2s]
  status=ready → load deck detail page → show slides in viewer/builder

[PM selects export format]
  POST /api/decks/[id]/export/pptx → Python /deck/export/pptx
  → signed URL → client downloads file

[PM creates share link]
  POST /api/decks/[id]/share → generate rawToken + hashedToken
  → update decks SET share_token=hashedToken, share_expires_at=+30days
  → return rawToken to client → PM shares /decks/{rawToken}

[Public viewer]
  GET /decks/{rawToken} → page.tsx server renders
  GET /api/decks/public?token={rawToken} → hash → lookup by share_token → return slides
  Evidence click → GET /api/chunks/public?id={chunk_id}&deck_token={rawToken}
```

---

## Component Boundaries: New vs. Modified

| Component | Status | Location |
|-----------|--------|----------|
| Python FastAPI service | NEW | `python-service/` |
| `python-service/routers/competitive.py` | NEW | competitive endpoints |
| `python-service/routers/decks.py` | NEW | deck generation + export endpoints |
| `python-service/tools/scrape_reviews.py` | NEW | G2/Capterra scraping |
| `python-service/tools/extract_signals.py` | NEW | Haiku extraction |
| `python-service/tools/embed_competitive.py` | NEW | OpenAI + Qdrant upsert |
| `python-service/tools/gap_score.py` | NEW | Sonnet gap scoring |
| `python-service/tools/generate_digest.py` | NEW | Sonnet weekly digest |
| `python-service/tools/analyze_intent.py` | NEW | Deck intent analysis (Sonnet) |
| `python-service/tools/select_content.py` | NEW | Evidence selection per slide |
| `python-service/tools/compose_slides.py` | NEW | Slide content generation (Sonnet) |
| `python-service/tools/apply_layout.py` | NEW | Layout selection (Haiku) |
| `python-service/tools/link_evidence.py` | NEW | Evidence validation (hard fail) |
| `python-service/exporters/pptx_exporter.py` | NEW | python-pptx |
| `python-service/exporters/pdf_exporter.py` | NEW | LibreOffice headless |
| `python-service/exporters/google_slides_exporter.py` | NEW | Google Slides API (Phase 6) |
| `docker-compose.yml` | NEW | Add Qdrant + Python service containers |
| `python-service/Dockerfile` | NEW | Includes LibreOffice |
| Supabase migrations | NEW | competitors, competitive_signals, competitive_digests, competitive_gap_scores, decks, deck_slides, user_integrations, python_jobs |
| `src/app/api/competitive/` | NEW | 7 route handlers |
| `src/app/api/decks/` | NEW | 14 route handlers |
| `src/app/api/chunks/public/route.ts` | NEW | Public evidence lookup |
| `src/app/api/integrations/google/` | NEW | OAuth connect + callback (Phase 6) |
| `src/app/(dashboard)/competitive/` | NEW | Competitive pages |
| `src/app/(dashboard)/decks/` | NEW | Deck list + builder pages |
| `src/app/(dashboard)/settings/integrations/` | NEW | Google OAuth settings (Phase 6) |
| `src/app/decks/[token]/page.tsx` | NEW | Public viewer (outside auth boundary) |
| `src/components/competitive/` | NEW | AddCompetitorForm, SignalList, DigestView, GapScoreCard |
| `src/components/decks/` | NEW | DeckBuilder, SlidePreview, SlideEditor, EvidenceDrillDown, ExportPanel |
| `src/stores/deckBuilderStore.ts` | NEW | Zustand (first Zustand use in project) |
| `src/middleware.ts` | MODIFIED | Add `/decks/*` to public exclusion list |
| Existing query ingestion route | POSSIBLY MODIFIED | Route competitor_mentions to Python /extract-from-transcript |

---

## Suggested Build Order

### Phase 1: Infrastructure Bootstrap (dependency for everything)

1. `docker-compose.yml` — Add Qdrant and Python FastAPI service containers. Test both are reachable from Next.js.
2. `python-service/` scaffold — FastAPI app, health check endpoint, Dockerfile (with LibreOffice). No business logic yet.
3. Qdrant `sightline-competitive` collection — create with hybrid search config. Test upsert + query with a dummy vector.
4. Supabase migrations — all tables for v2.0 (competitors, competitive_signals, competitive_digests, competitive_gap_scores, decks, deck_slides, user_integrations, python_jobs).

*Why first: Everything downstream requires Qdrant to exist, Python service to be reachable, and DB schema to be in place.*

### Phase 2: Competitive — Data Ingestion

5. `scrape_reviews.py` — G2/Capterra scraper. Test with real URLs. Note ToS constraint (see Open Questions).
6. `extract_signals.py` — Haiku extraction. Prompt as typed constant. Test with sample review text.
7. `embed_competitive.py` — OpenAI embeddings + Qdrant upsert. Store `qdrant_chunk_id` in Postgres.
8. Python svc `/scrape` endpoint — orchestrates steps 5-7, writes job status to `python_jobs`.
9. `POST /api/competitive/competitors` + `GET` — Add competitor, list competitors.
10. `POST /api/competitive/scrape` + status polling endpoint.
11. Frontend: Add Competitor form + scrape trigger + status indicator.

### Phase 3: Competitive — Analysis

12. `gap_score.py` — Sonnet gap scoring. Query Qdrant, score backlog items.
13. `generate_digest.py` — Sonnet weekly digest from aggregated signals.
14. Remaining Next.js competitive routes: `/signals`, `/gap-score`, `/digest`.
15. Frontend: Competitive dashboard — signals list, gap score view, digest view.
16. Extend existing call ingestion: route `competitor_mentions` to Python `/extract-from-transcript`.

### Phase 4: Deck Generation Backend

17. `analyze_intent.py` (Sonnet) — Intent analysis from source artifact.
18. `select_content.py` — Evidence selection from Postgres + Qdrant.
19. `compose_slides.py` (Sonnet) — Slide content with evidence tagging.
20. `apply_layout.py` (Haiku) — Layout selection per slide type.
21. `link_evidence.py` — Hard-fail validation. Write to Postgres on success.
22. Python svc `/deck/generate` endpoint — orchestrates steps 17-21 async.
23. `POST /api/decks/generate` — Trigger async generation.
24. `GET /api/decks/[id]/status` — Poll status.
25. `GET /api/decks/[id]` — Fetch complete deck + slides.
26. Frontend: Deck list + read-only slide viewer with evidence panel (reuse EvidenceDrillDown pattern from query page).

### Phase 5: PPTX/PDF Export + Custom Builder + Share

27. PPTX base templates — Create `clean.pptx`, `executive.pptx`, `brand.pptx`. Upload to Supabase Storage.
28. `pptx_exporter.py` — python-pptx fill + matplotlib chart generation.
29. `pdf_exporter.py` — LibreOffice headless conversion from PPTX.
30. `POST /api/decks/[id]/export/pptx` + `/pdf` — Trigger export, return signed URL.
31. Frontend: Export panel with format picker + download button.
32. `deckBuilderStore.ts` (Zustand) — Slide state with debounced server sync.
33. Frontend: Slide editor (inline content editing) + PATCH endpoint.
34. `@dnd-kit/core @dnd-kit/sortable` — Drag-and-drop reordering.
35. Share token generation — `POST /api/decks/[id]/share`, `DELETE` (revoke).
36. `src/middleware.ts` modification — Add `/decks/*` to public exclusion list.
37. Public viewer page — `/app/decks/[token]/page.tsx`, server-rendered, og tags.
38. Public chunk endpoint — `/api/chunks/public` with evidence_id validation.

### Phase 6: Google Slides Export (defer if Phase 5 is sufficient)

39. Google OAuth flow — `/api/integrations/google/connect` + callback. Token encryption with pgcrypto.
40. Settings/integrations page.
41. `google_slides_exporter.py` — Google Slides API v1, batch operations, backoff.
42. `POST /api/decks/[id]/export/google`.

*Note: Google OAuth consent screen requires app verification for production use. Start verification process early — it takes 1-7 days. If needed before Phase 6 is coded, initiate during Phase 4.*

---

## Patterns to Follow

### Pattern 1: Python Service as Internal API

```typescript
// Next.js route calling Python service (fire and return job_id)
// src/app/api/competitive/scrape/route.ts

export async function POST(request: Request) {
  const { org_id } = await getAuthContext(request)
  const { competitor_id } = await request.json()

  const competitor = await getCompetitor(competitor_id, org_id)
  if (!competitor) return new Response('Not found', { status: 404 })

  const res = await fetch(`${process.env.PYTHON_SERVICE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': process.env.INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      competitor_id,
      g2_url: competitor.g2_url,
      capterra_url: competitor.capterra_url,
      org_id,
      workspace_id: competitor.workspace_id,
    }),
  })

  const { job_id } = await res.json()
  return Response.json({ job_id })
}
```

### Pattern 2: Async Generation with Status Polling

```typescript
// Frontend polling for deck generation
// src/components/decks/DeckGenerating.tsx
'use client'
export function DeckGenerating({ deckId }: { deckId: string }) {
  const [status, setStatus] = useState<'generating' | 'ready' | 'failed'>('generating')

  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch(`/api/decks/${deckId}/status`)
      const { status: s } = await res.json()
      setStatus(s)
      if (s === 'ready' || s === 'failed') clearInterval(poll)
    }, 2000)
    return () => clearInterval(poll)
  }, [deckId])

  if (status === 'generating') return <ProgressIndicator />
  if (status === 'failed') return <ErrorState />
  // status === 'ready': router.push(`/decks/${deckId}`)
}
```

### Pattern 3: Evidence-Mandatory Slides

```python
# python-service/tools/link_evidence.py
def validate_and_link(slides: list[Slide], db) -> list[Slide]:
    for slide in slides:
        if slide.slide_type == 'freeform':
            continue  # freeform slides exempt; labeled "No source" in viewer
        if not slide.evidence_ids:
            raise ValueError(f"Slide type {slide.slide_type} has no evidence_ids — rejected")
        for eid in slide.evidence_ids:
            if not db.chunk_exists(eid):
                raise ValueError(f"evidence_id {eid} does not resolve — rejected")
    return slides
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mixing Competitive and Qualitative Corpora

**What:** Querying `sightline-competitive` and `sightline-chunks` in a single Qdrant batch, merging results into one list.
**Why bad:** G2 review language degrades PM discovery query quality. Evidence citations become ambiguous.
**Instead:** Route to the correct collection based on context. Label sources explicitly in evidence panels: "G2 review — [competitor]" vs. "Customer call — [date]".

### Anti-Pattern 2: Synchronous PPTX/PDF in Route Handler

**What:** Calling the Python PPTX exporter in a Next.js route handler and awaiting the result.
**Why bad:** PPTX + LibreOffice takes 15-60 seconds. Vercel serverless default timeout is 60 seconds. Large decks will fail silently.
**Instead:** Export triggered async, job status in Postgres, signed URL returned when complete. Frontend polls.

### Anti-Pattern 3: Orphaned Evidence in Deck Slides

**What:** Slide content with statistics that have no resolved `evidence_ids`.
**Why bad:** Core trust guarantee broken. PM cannot cite the source to stakeholders.
**Instead:** `link_evidence.py` hard-fails the entire generation if any non-freeform slide lacks valid evidence. In the custom builder, UI warns on slides with no evidence linked.

### Anti-Pattern 4: Plaintext Google OAuth Tokens

**What:** Storing `google_refresh_token` as plaintext in `user_integrations`.
**Why bad:** DB dump or compromised Supabase project exposes all users' Google accounts.
**Instead:** `pgp_sym_encrypt()` with `DATABASE_ENCRYPTION_KEY`. Decrypt only in the Python exporter at export time.

### Anti-Pattern 5: Building Google Slides Before Core PPTX Works

**What:** Starting Phase 6 before Phase 5 PPTX export is validated.
**Why bad:** Google OAuth setup takes days. Debugging two export paths simultaneously is expensive.
**Instead:** Validate PPTX export end-to-end with real decks, then add Google Slides as an incremental path.

### Anti-Pattern 6: Public Viewer Under Auth Layout

**What:** Placing `/decks/[token]/page.tsx` inside the `(dashboard)` layout.
**Why bad:** The auth boundary redirects unauthenticated visitors to login, breaking the shareable link UX.
**Instead:** Place the viewer at `src/app/decks/[token]/page.tsx` (outside `(dashboard)`). Update middleware to exclude `/decks/*` from auth redirect. Do this middleware change before writing any viewer code.

---

## Scalability Considerations

| Concern | At 10 workspaces | At 1K workspaces | Notes |
|---------|-----------------|-----------------|-------|
| G2/Capterra scraping | Direct HTTP; 1-2 req/s fine | Add proxy rotation; may be blocked | Verify ToS first |
| Qdrant sightline-competitive | Single collection with org_id filter | Add index on org_id; shard by tier | Qdrant Cloud free tier sufficient for v2.0 |
| Python service | Single FastAPI process; Postgres job polling | Celery + Redis for true async queue | Postgres polling at design-partner scale is fine |
| PPTX generation | ~10-30s per deck | Gunicorn multi-worker; not per-deck parallelizable | LibreOffice is the bottleneck |
| Deck generation AI cost | Sonnet ~$0.10-0.30 per deck | Monitor; cache digest-sourced decks | Sonnet is appropriate; don't over-optimize early |
| Shareable viewer | SSR per request | Vercel ISR with 60s revalidation | Public decks change only on token revocation |
| Google Slides API | 100 req/100s per user (verify) | Exponential backoff + queue | Per-user limit, not per-app |

---

## Open Questions / Needing Verification Before Building

1. **G2/Capterra scraping legality** — Both platforms have ToS restricting automated scraping. G2 has a partner API; Capterra may have a data feed. Verify ToS before building the scraper. If scraping is prohibited: fallback options are (a) G2 official partner API, (b) user-pastes review text manually, (c) licensed data provider. This is the highest-risk unknown for Phase 2 and must be resolved before writing `scrape_reviews.py`.

2. **LibreOffice in production** — If deploying to Vercel serverless functions, LibreOffice cannot run (binary too large, disk restrictions). The Python service MUST run as a persistent container (Fly.io, Railway, Render, or VM). Confirm production deployment target before committing to LibreOffice PDF.

3. **python-pptx placeholder API** — Placeholder text fill behavior in python-pptx varies by template design. Build and test a simple `.pptx` template with placeholder shapes before writing the full exporter. Confidence: MEDIUM — verify against https://python-pptx.readthedocs.io.

4. **Google Slides API rate limits** — Training data cites 100 req/100s per user, but this may have changed. Verify at developers.google.com/slides/api/limits before building the exporter. Also verify: Google OAuth consent screen app verification timeline (1-7 days). Initiate early.

5. **Qdrant hosting** — Qdrant Cloud free tier (1GB, 1M vectors) vs. self-hosted. At design-partner scale, Cloud free tier is likely sufficient. Confirm storage estimates for competitive signals (each review chunk ~768 dims × 4 bytes × N reviews).

6. **`INTERNAL_SECRET` / Python service auth** — The header-based internal secret is a minimal safeguard. For production, ensure Python service is not publicly addressable (private network, VPC, or firewall rules). Plan infrastructure accordingly.

---

## Sources

| Source | Confidence | Used For |
|--------|------------|---------|
| CLAUDE.md (project spec) | HIGH | Feature requirements, data types, module descriptions |
| Milestone context (prompt) | HIGH | Feature scope and integration requirements |
| v1.0 ARCHITECTURE.md | HIGH | Actual codebase structure (Next.js single-app, no tRPC/BullMQ) |
| v1.0 STACK.md | HIGH | Existing packages and versions |
| python-pptx docs | MEDIUM | PPTX generation; placeholder API needs verification |
| Google Slides API v1 | MEDIUM | Batch operations pattern; quota limits need verification |
| @dnd-kit/core @dnd-kit/sortable | HIGH | Dominant drag-and-drop library for Next.js App Router |
| LibreOffice headless PPTX→PDF | MEDIUM | Established approach; container setup needs verification |
| Qdrant hybrid search | MEDIUM | Collection config; verify sparse encoder choice |
| G2/Capterra scraping | LOW | ToS compliance uncertain; verify official API options |
| Node.js `crypto.randomBytes` for share tokens | HIGH | Standard secure token generation pattern |
| Supabase Storage signed URLs | HIGH | Standard pattern; used by existing Supabase integration |

---

*Architecture research for: Sightline v2.0 — Competitive Intelligence + Deck Generator*
*Researched: 2026-03-04*
*Supersedes: v1.0 ARCHITECTURE.md (Brief v2 + Stripe + Landing scope)*
