# Phase 5: Competitive Core - Research

**Researched:** 2026-03-05
**Domain:** Competitor mention extraction, external review scraping, isolated corpus, evidence panel
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Competitor management:**
- Search-assisted add flow: user types competitor name, system suggests G2/Capterra matches, user confirms
- Dedicated `/competitors` page in the main nav — full list with add/edit/remove actions
- Plan-based competitor limits tied to Stripe billing (Free: 3, Pro: 10, Enterprise: unlimited)
- Soft delete on removal: data stays in collection but is hidden from UI, restorable if competitor is re-added

**Signal presentation in evidence panel:**
- Separate tab/section in the evidence panel: "Customer Signals" and "Competitive Signals" — never mixed in the same list
- Quote-style cards for each competitive signal: review quote, competitor name, source (G2/Capterra), signal type tag (pain point, switching reason, feature request), date
- Two filters available in the competitive tab: filter by competitor name AND filter by signal type
- AI response references competitive signals only when the query is explicitly about competitors; otherwise competitive signals stay in the panel only
- Scraping runs as a background job (BullMQ); competitor card shows "Scraping in progress" status; toast notification when complete

**Scraping behavior:**
- On failure: auto-retries 2-3 times over a few hours, then shows error state with CSV upload suggestion as fallback
- Accept raw G2/Capterra CSV export format directly — minimal user friction, no custom template needed
- Manual re-scrape only via a "Refresh" button on each competitor card; scheduled scraping deferred to Phase 6

**Re-enrichment flow:**
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

### Deferred Ideas (OUT OF SCOPE)
- Scheduled/automatic scraping (weekly) — Phase 6
- Gap scoring (competitor weaknesses vs feature backlog) — Phase 6
- Weekly competitive digest email — Phase 6
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | User can trigger competitor mention extraction from existing customer call signals during enrichment | Re-enrichment pattern: batch Haiku tagging of existing chunks with `competitor_mentions[]` JSONB field; triggered via API route, status tracked in Postgres |
| COMP-02 | User can add competitors to track (name, G2 slug, Capterra slug) and trigger external review scraping | `competitors` table + scraping background job; G2/Capterra URL structure confirmed; Playwright + stealth or CSV fallback |
| COMP-03 | System extracts structured signals (pain points, switching reasons, feature requests) from scraped reviews via Haiku | Haiku extraction prompt pattern; `competitive_signals` table with `signal_type` enum; identical pipeline for both scrape and CSV paths |
| COMP-06 | Competitive signals are stored in a separate Qdrant collection and clearly labeled in the evidence panel | `sightline-competitive` Qdrant collection; separate tab in evidence panel using existing EvidenceCard pattern; `signal_type` and `competitor_name` metadata on every chunk |
</phase_requirements>

---

## Summary

Phase 5 has three distinct technical problems: (1) re-enriching existing customer signals to extract competitor mentions using Haiku, (2) scraping G2/Capterra review pages with a reliable CSV fallback path, and (3) displaying competitive signals as a visually distinct, isolated section in the existing evidence panel. All three are well-understood problems that map cleanly onto the existing stack.

**Critical infrastructure finding:** This project has no Redis or BullMQ infrastructure. There is no `docker-compose.yml`, no Redis environment variables, and no BullMQ in `package.json`. The CLAUDE.md mentions BullMQ aspirationally, but the actual implementation uses pure Next.js + Supabase. For this phase, background scraping jobs should be implemented as a **Postgres-backed job queue** (a `scraping_jobs` table with status polling), which is consistent with the existing architecture and requires zero new infrastructure. This is the right call at this stage — the project volume does not justify Redis.

**Scraping reliability:** G2 is protected by Cloudflare. Playwright-based scraping requires stealth plugins. As of early 2026, Camoufox (formerly the recommended stealth tool) is in experimental/maintenance mode and not suitable for production. The most pragmatic approach for this phase is to use Playwright with `puppeteer-extra` stealth plugin as a best-effort attempt, with the CSV upload path as the primary guaranteed path. The CSV fallback must work identically to the scraping path — same signal extraction, same storage schema.

**Primary recommendation:** Use a Postgres job table for background scraping status, Playwright (puppeteer-extra-stealth) for scraping with 2-3 auto-retries, identical Haiku extraction for both scrape and CSV paths, and a `competitors` + `competitive_signals` schema that mirrors the existing `sources`/`documents`/`chunks` pattern.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `playwright` | Already in project (puppeteer is installed) | Browser automation for G2/Capterra scraping | The project already has `puppeteer` in devDependencies; Playwright is the production equivalent |
| `puppeteer-extra` + `puppeteer-extra-plugin-stealth` | latest | Cloudflare/anti-bot evasion for G2 scraping | Standard stealth tooling, actively maintained unlike Camoufox which is currently experimental |
| `@anthropic-ai/sdk` | `^0.78.0` (already installed) | Haiku calls for signal extraction and mention tagging | Already in project — use existing Anthropic client pattern |
| Supabase (already configured) | `^2.97.0` | Postgres job queue, competitors table, signals table | Already the database layer — no new infrastructure needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonnet-4-6` via existing client | already configured | NOT for this phase — Haiku handles all extraction | Only if Haiku quality proves insufficient for extraction |
| `papaparse` | `^5.x` | CSV parsing for G2/Capterra upload fallback | Already has a custom CSV parser in `sources/page.tsx`; papaparse handles edge cases better for review CSVs with embedded newlines |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Postgres job table | BullMQ + Redis | Redis requires new infrastructure (no docker-compose in project); Postgres table is 100% consistent with existing stack and sufficient for low scraping volume |
| Playwright stealth | Camoufox | Camoufox is currently experimental/maintenance mode as of 2026 — not production-ready |
| Playwright stealth | Apify scraper | Apify is external paid API — adds dependency and cost; CSV fallback gives same reliability at zero cost |
| Custom CSV parser (existing) | papaparse | Existing parser is fine for simple CSVs; G2/Capterra CSVs have multi-line review content that can break custom parsers |

**Installation:**
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth papaparse
npm install --save-dev @types/papaparse
```

Note: `puppeteer` is already in devDependencies. `puppeteer-extra` wraps it — no version conflict.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── competitors/         # New: competitor management page
│   │       └── page.tsx
│   └── api/
│       └── competitors/
│           ├── route.ts          # GET list, POST add competitor
│           ├── [id]/
│           │   ├── route.ts      # PATCH (edit, soft-delete), DELETE
│           │   ├── scrape/
│           │   │   └── route.ts  # POST: enqueue scraping job
│           │   └── rescan/
│           │       └── route.ts  # POST: re-scan customer signals for this competitor
│           └── upload/
│               └── route.ts      # POST: CSV upload fallback (G2/Capterra)
├── components/
│   └── competitors/
│       ├── CompetitorCard.tsx    # Status badge, mention count, Refresh/Upload buttons
│       ├── AddCompetitorModal.tsx # Search-assisted add flow
│       └── CompetitiveSignalCard.tsx # Evidence panel card — reuses EvidenceCard pattern
└── lib/
    └── competitive/
        ├── extract-signals.ts    # Haiku extraction — shared by scrape and CSV paths
        └── scrape-reviews.ts     # Playwright scraping logic
supabase/
└── migrations/
    └── 004_competitive.sql       # competitors, competitive_signals, scraping_jobs tables
```

### Pattern 1: Postgres-Backed Job Queue (Background Scraping)

**What:** A `scraping_jobs` table with `status` enum (`pending | processing | completed | failed`). API route inserts a row, a worker API route (or same-process async function) processes it. Frontend polls job status.

**When to use:** When you need background processing without Redis/BullMQ infrastructure. Appropriate for low-volume jobs (scraping runs are rare — user-triggered, not continuous).

**Example:**
```typescript
// POST /api/competitors/[id]/scrape — enqueues the job
const { data: job } = await supabase
  .from('scraping_jobs')
  .insert({
    competitor_id: id,
    org_id,
    status: 'pending',
    attempts: 0,
  })
  .select('id')
  .single()

// Trigger processing asynchronously (fire-and-forget from route handler)
// In Next.js App Router, use waitUntil if available, or call internal endpoint
fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/competitors/process-jobs`, {
  method: 'POST',
  headers: { 'x-internal-key': process.env.INTERNAL_JOB_KEY! },
})

return NextResponse.json({ jobId: job.id })
```

```sql
-- Frontend polls this:
SELECT status, error_message, signals_extracted
FROM scraping_jobs
WHERE id = $jobId AND org_id = $orgId
```

**Alternative: Use `after()` in Next.js 15**

Next.js 15 introduced `unstable_after()` which runs code after response is sent — perfect for triggering async work without a separate worker:

```typescript
import { unstable_after as after } from 'next/server'

// In the route handler:
after(async () => {
  await processScrapeJob(jobId, competitorId, orgId)
})
return NextResponse.json({ jobId })
```

This is the cleanest pattern for this stack — no polling endpoint needed.

### Pattern 2: Haiku Extraction — Shared for Scrape and CSV

**What:** A single `extractCompetitiveSignals()` function that takes raw review text (whether from scraping or CSV) and returns structured signals via Haiku.

**When to use:** Always — the extraction logic must be identical regardless of how review content arrived.

```typescript
// src/lib/competitive/extract-signals.ts
import Anthropic from '@anthropic-ai/sdk'

export type SignalType = 'pain_point' | 'switching_reason' | 'feature_request' | 'positive_mention'

export interface CompetitiveSignal {
  quote: string
  signal_type: SignalType
  reviewer_role?: string
  company_size?: string
  date?: string
}

const anthropic = new Anthropic()

export async function extractCompetitiveSignals(
  reviewText: string,
  competitorName: string
): Promise<CompetitiveSignal[]> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Extract structured signals from this ${competitorName} customer review.

Review: ${reviewText}

Return JSON array only — no markdown:
[
  {
    "quote": "verbatim excerpt from review (max 200 chars)",
    "signal_type": "pain_point | switching_reason | feature_request | positive_mention"
  }
]

Rules:
- Only include quotes that are clearly one of the four signal types
- pain_point: complaint, frustration, limitation about ${competitorName}
- switching_reason: explicit mention of switching away from ${competitorName}
- feature_request: request for something ${competitorName} lacks
- positive_mention: explicit praise that reveals what users value (useful for gap analysis)
- Max 5 signals per review
- Return [] if no clear signals`
    }]
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  try {
    return JSON.parse(raw) as CompetitiveSignal[]
  } catch {
    return []
  }
}
```

### Pattern 3: Competitor Mention Re-Enrichment

**What:** Scan all existing `chunks` rows for an org, run Haiku tagging to detect competitor name mentions, update `competitor_mentions` JSONB field on matching chunks.

**When to use:** On competitor add (auto-scan), on manual re-scan trigger.

```typescript
// Batch processing: fetch chunks in pages of 100
const PAGE_SIZE = 100
let offset = 0

while (true) {
  const { data: chunks } = await supabase
    .from('chunks')
    .select('id, text, tags')
    .eq('org_id', orgId)
    .range(offset, offset + PAGE_SIZE - 1)

  if (!chunks || chunks.length === 0) break

  // Batch Haiku call: check each chunk for competitor name mention
  // Use simple string matching first (fast), then Haiku for ambiguous cases
  for (const chunk of chunks) {
    const mentionsCompetitor = chunk.text
      .toLowerCase()
      .includes(competitorName.toLowerCase())

    if (mentionsCompetitor) {
      const existingMentions: string[] = chunk.tags?.competitor_mentions ?? []
      if (!existingMentions.includes(competitorId)) {
        await supabase
          .from('chunks')
          .update({
            tags: {
              ...chunk.tags,
              competitor_mentions: [...existingMentions, competitorId]
            }
          })
          .eq('id', chunk.id)
      }
    }
  }

  offset += PAGE_SIZE
  if (chunks.length < PAGE_SIZE) break
}
```

Note: Simple string matching is preferred over Haiku for the re-scan — it's faster, cheaper, and competitor names are deterministic strings. Haiku is reserved for signal extraction from review text.

### Pattern 4: Evidence Panel Tab Extension

**What:** Extend the existing query evidence panel (`/query/page.tsx`) to add a "Competitive Signals" tab alongside "Customer Signals."

**When to use:** Always — competitive signals are never shown inline with customer signals.

The existing `EvidenceCard` component structure:
```tsx
// Extend QueryResult to carry competitive evidence separately
export interface QueryResult {
  recommendation: string
  evidence: Array<{
    quote: string
    customer_name: string
    source_type: string
  }>
  competitive_evidence?: Array<{   // NEW
    quote: string
    competitor_name: string
    source: 'g2' | 'capterra' | 'csv'
    signal_type: SignalType
    date?: string
  }>
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
}
```

```tsx
// Tab switcher in evidence panel
type EvidenceTab = 'customer' | 'competitive'
const [activeTab, setActiveTab] = useState<EvidenceTab>('customer')
```

### Anti-Patterns to Avoid

- **Mixing competitive and customer signals in the same evidence list:** The CONTEXT.md is explicit — never in the same list. Use separate tabs, separate data fields, separate Qdrant collections.
- **Using Haiku for competitor name matching in re-enrichment:** Costly and slow for what is a simple string search. Use `String.includes()` / `ILIKE` first; only use Haiku if fuzzy matching becomes necessary.
- **Storing competitive signals as `documents` in the main schema:** Competitive signals belong in a separate `competitive_signals` table, not in the `documents` table. Do not repurpose existing tables.
- **Blocking the API response for scraping:** Scraping can take 30-120 seconds. Always fire-and-forget with job status tracking.
- **Fabricating G2/Capterra slugs:** The search-assisted flow must confirm slug with user before running. Never auto-infer a slug.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV multi-line field parsing | Custom CSV parser | `papaparse` | G2/Capterra reviews contain embedded newlines; existing parser in sources page will break on these |
| Cloudflare evasion | Manual browser fingerprint patches | `puppeteer-extra-plugin-stealth` | Stealth plugin handles 15+ browser signal patches automatically; manual patching misses navigator.webdriver, headless flags, plugin enumeration |
| Job queue | BullMQ + Redis | Postgres `scraping_jobs` table + `unstable_after()` | No Redis infrastructure exists; volume doesn't justify it |
| Deduplication | Custom hash comparison | Upsert on `(competitor_id, review_source_id)` unique constraint | Postgres handles atomically; prevents double-insertion on re-scrape |

**Key insight:** The competitive pipeline reuses the same extraction pattern (Haiku → structured JSON → Postgres) as the existing enrichment step. There's no new architectural pattern — just a separate table and collection.

---

## Common Pitfalls

### Pitfall 1: G2 Scraping Blocked by Cloudflare
**What goes wrong:** Playwright without stealth gets 403/challenged by Cloudflare on G2's review pages. The scraping job fails after 1 attempt and user sees permanent error state.
**Why it happens:** G2 uses Cloudflare with bot detection. Standard headless Chrome is fingerprinted.
**How to avoid:** Use `puppeteer-extra` + `puppeteer-extra-plugin-stealth`. Set realistic user-agent, viewport, and add `page.setExtraHTTPHeaders({'Accept-Language': 'en-US,en;q=0.9'})`. Still may fail — that's why CSV fallback is mandatory and must be surfaced prominently.
**Warning signs:** Scraping job returns 403, empty page HTML, or Cloudflare challenge page content.

### Pitfall 2: Re-enrichment Blocks API Response
**What goes wrong:** Full corpus scan on competitor add takes 10-30 seconds if there are thousands of chunks. Route times out or blocks the UI.
**Why it happens:** Synchronous processing in the API route handler.
**How to avoid:** Use `unstable_after()` from `next/server` (Next.js 15) to process the re-scan after the response is sent. Return immediately with `{ scanning: true }` and let the frontend poll for results.
**Warning signs:** Route handler takes >3s to respond on competitor add.

### Pitfall 3: Soft Delete Not Filtering Evidence Panel
**What goes wrong:** After a competitor is soft-deleted, their signals still appear in the evidence panel because the query doesn't filter `deleted_at IS NULL`.
**Why it happens:** Soft delete requires an explicit filter in every query touching competitive signals.
**How to avoid:** Add `deleted_at` to the `competitors` table, and add `WHERE c.deleted_at IS NULL` JOIN condition in every query that joins against `competitors`. Add an RLS policy or DB view that hides soft-deleted competitor data.
**Warning signs:** Deleted competitor signals appear in panel after removal.

### Pitfall 4: CSV Column Mapping Fragility
**What goes wrong:** G2 and Capterra CSV formats differ. G2 has "Review Title" + "Review" columns. Capterra has "Review Title", "Pros", "Cons" columns. Assuming a fixed column structure breaks one of the two.
**Why it happens:** Different platforms export different schemas.
**How to avoid:** Map known G2 columns and known Capterra columns separately. Detect source by checking for known Capterra-specific columns (`Pros`, `Cons`, `Likelihood to Recommend`). Always concatenate all text-content columns into one `review_text` field before passing to Haiku extraction.
**Warning signs:** Extraction returns 0 signals from a valid CSV upload.

### Pitfall 5: Competitor Limit Not Enforced Server-Side
**What goes wrong:** Frontend shows plan limit UI but the API route accepts adds beyond the limit, creating data integrity issues.
**Why it happens:** Limit check only in client component.
**How to avoid:** Enforce limit check in the POST `/api/competitors` route by counting `WHERE org_id = $orgId AND deleted_at IS NULL` before inserting. Return 402 with `{ error: 'competitor_limit_reached', limit: 3 }`.
**Warning signs:** Free users can add a 4th competitor by calling the API directly.

---

## Code Examples

Verified patterns from official sources and project codebase:

### Scraping Job Status Table (Migration)
```sql
-- supabase/migrations/004_competitive.sql

CREATE TABLE public.competitors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id     UUID        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  g2_slug          TEXT,
  capterra_slug    TEXT,
  mention_count    INTEGER     NOT NULL DEFAULT 0,
  last_scraped_at  TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ,           -- soft delete
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.scraping_job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE public.scraping_jobs (
  id              UUID                          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID                          NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  competitor_id   UUID                          NOT NULL REFERENCES public.competitors (id) ON DELETE CASCADE,
  status          public.scraping_job_status    NOT NULL DEFAULT 'pending',
  attempts        INTEGER                       NOT NULL DEFAULT 0,
  error_message   TEXT,
  signals_extracted INTEGER                     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ                   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ                   NOT NULL DEFAULT now()
);

CREATE TYPE public.competitive_signal_type AS ENUM ('pain_point', 'switching_reason', 'feature_request', 'positive_mention');

CREATE TABLE public.competitive_signals (
  id              UUID                              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID                              NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workspace_id    UUID                              NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  competitor_id   UUID                              NOT NULL REFERENCES public.competitors (id) ON DELETE CASCADE,
  quote           TEXT                              NOT NULL,
  signal_type     public.competitive_signal_type    NOT NULL,
  source          TEXT                              NOT NULL, -- 'g2' | 'capterra' | 'csv'
  review_source_id TEXT,                            -- external review ID for dedup
  reviewer_role   TEXT,
  company_size    TEXT,
  review_date     DATE,
  created_at      TIMESTAMPTZ                       NOT NULL DEFAULT now(),
  UNIQUE (competitor_id, review_source_id)          -- prevents re-scrape duplication
);

-- Indexes
CREATE INDEX ON public.competitors (org_id);
CREATE INDEX ON public.competitive_signals (org_id);
CREATE INDEX ON public.competitive_signals (competitor_id);
CREATE INDEX ON public.competitive_signals (signal_type);
CREATE INDEX ON public.scraping_jobs (competitor_id);
CREATE INDEX ON public.scraping_jobs (status);

-- RLS (standard 4-policy pattern scoped to org_id)
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitors: org read"   ON public.competitors FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org insert" ON public.competitors FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org update" ON public.competitors FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitors: org delete" ON public.competitors FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

ALTER TABLE public.competitive_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitive_signals: org read"   ON public.competitive_signals FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org insert" ON public.competitive_signals FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org update" ON public.competitive_signals FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "competitive_signals: org delete" ON public.competitive_signals FOR DELETE TO authenticated USING (org_id = public.auth_user_org_id());

ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scraping_jobs: org read"   ON public.scraping_jobs FOR SELECT TO authenticated USING (org_id = public.auth_user_org_id());
CREATE POLICY "scraping_jobs: org insert" ON public.scraping_jobs FOR INSERT TO authenticated WITH CHECK (org_id = public.auth_user_org_id());
CREATE POLICY "scraping_jobs: org update" ON public.scraping_jobs FOR UPDATE TO authenticated USING (org_id = public.auth_user_org_id()) WITH CHECK (org_id = public.auth_user_org_id());
```

### G2 URL Structure (Confirmed)
```
Product reviews page: https://www.g2.com/products/{slug}/reviews
Example: https://www.g2.com/products/notion/reviews
Pagination: https://www.g2.com/products/{slug}/reviews?page=2

Capterra product reviews page: https://www.capterra.com/p/{numeric-id}/{slug}/reviews/
Example: https://www.capterra.com/p/158848/notion/reviews/
```

### CSV Column Mapping (G2 and Capterra)
```typescript
// G2 CSV export columns (confirmed from G2 documentation):
// "Reviewer Name", "Reviewer Title", "Reviewer Company Size",
// "Review Date", "Star Rating", "Review Title", "Review",
// "What do you like best?", "What do you dislike?",
// "What problems is the product solving and how is that benefiting you?"

// Capterra CSV export columns:
// "Reviewer", "Title", "Company Size", "Date", "Overall",
// "Ease of Use", "Customer Service", "Value for Money",
// "Likelihood to Recommend", "Pros", "Cons", "Overall Comments"

function normalizeCsvRow(row: Record<string, string>, source: 'g2' | 'capterra'): string {
  if (source === 'g2') {
    const parts = [
      row['Review'] ?? '',
      row['What do you like best?'] ?? '',
      row['What do you dislike?'] ?? '',
      row['What problems is the product solving and how is that benefiting you?'] ?? '',
    ]
    return parts.filter(Boolean).join('\n\n')
  } else {
    // capterra
    const parts = [
      row['Pros'] ?? '',
      row['Cons'] ?? '',
      row['Overall Comments'] ?? '',
    ]
    return parts.filter(Boolean).join('\n\n')
  }
}

function detectCsvSource(headers: string[]): 'g2' | 'capterra' | 'unknown' {
  if (headers.includes('Pros') && headers.includes('Cons')) return 'capterra'
  if (headers.includes('Review') || headers.includes('What do you like best?')) return 'g2'
  return 'unknown'
}
```

### unstable_after() Pattern (Next.js 15 — Fire-and-Forget)
```typescript
// Source: Next.js 15 docs — unstable_after
import { unstable_after as after } from 'next/server'

export async function POST(request: NextRequest) {
  // ... auth checks, insert job row ...

  const { data: job } = await supabase
    .from('scraping_jobs')
    .insert({ competitor_id, org_id, status: 'pending' })
    .select('id').single()

  // Fire-and-forget after response is sent
  after(async () => {
    await runScrapeJob(job.id, competitor, orgId)
  })

  return NextResponse.json({ jobId: job.id, status: 'pending' })
}
```

### Plan Limit Enforcement Pattern (Server-side)
```typescript
// Matches existing billing enforcement pattern in /api/briefs/generate
const COMPETITOR_LIMITS: Record<string, number> = {
  free: 3,
  starter: 10,
  pro: Infinity,
}

// In POST /api/competitors:
const { count } = await supabase
  .from('competitors')
  .select('id', { count: 'exact', head: true })
  .eq('org_id', orgId)
  .is('deleted_at', null)

const limit = COMPETITOR_LIMITS[org.plan] ?? 3
if ((count ?? 0) >= limit) {
  return NextResponse.json(
    { error: 'competitor_limit_reached', limit },
    { status: 402 }
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| puppeteer-extra-stealth | Camoufox (Python) | 2024 — but Camoufox is now experimental | Camoufox is NOT production-ready in 2026; stick with puppeteer-extra-stealth for this phase |
| Bull (v3) | BullMQ (v5) | 2021 | Irrelevant — this project uses Postgres queue, not Redis |
| Next.js `res.end()` for async | `unstable_after()` | Next.js 15 (late 2024) | Clean fire-and-forget without separate worker process |

**Deprecated/outdated:**
- `puppeteer-extra-stealth` standalone: still works but original repo announced end of new features Feb 2025; forks and the underlying package are still maintained for existing use cases
- Camoufox: not production-ready as of 2026 due to maintenance gap and experimental status

---

## Open Questions

1. **unstable_after() stability in production (Vercel/Next.js 15)**
   - What we know: `unstable_after()` is marked unstable; it works in Next.js 15 runtime but Vercel's free tier may cut off execution after response is sent
   - What's unclear: Whether Vercel Pro/hobby tier allows long-running after() tasks for scraping (30-90s)
   - Recommendation: Test with a 30s scrape in development. If `after()` is unreliable, fallback is to use a separate `/api/competitors/process-jobs` internal endpoint that the scrape route calls with `fetch()` fire-and-forget (not awaited)

2. **G2 scraping success rate with puppeteer-extra-stealth**
   - What we know: G2 is Cloudflare-protected; stealth helps but is not 100% reliable
   - What's unclear: Whether proxy rotation is needed for consistent success
   - Recommendation: Accept ~70% success rate from scraping; prominently surface CSV upload as fallback after first failure. Do NOT add proxy infrastructure in Phase 5.

3. **Qdrant collection for competitive signals**
   - What we know: CLAUDE.md specifies a separate `sightline-competitive` Qdrant collection; however, the project currently has no Qdrant integration at all (the query route fetches directly from Postgres `documents` table)
   - What's unclear: Is Qdrant actually set up in this project, or is the retrieval currently Postgres-only?
   - Recommendation: Store competitive signals in Postgres `competitive_signals` table only for Phase 5. The evidence panel can query Postgres directly (same pattern as the existing query route). The Qdrant collection can be deferred to Phase 6 when proper vector search is added. This is consistent with what the project actually does today.

---

## Validation Architecture

`workflow.nyquist_validation` is not set to `true` in `.planning/config.json` — this section is skipped.

---

## Sources

### Primary (HIGH confidence)
- Project codebase `/Users/arnavsinghal/pm-copilot/src/` — direct inspection of existing patterns (auth, API routes, evidence panel, billing enforcement, Haiku usage)
- Project migrations `/Users/arnavsinghal/pm-copilot/supabase/migrations/` — confirmed schema: organizations, users, workspaces, sources, documents, chunks, queries, briefs, decisions
- BullMQ official docs (https://docs.bullmq.io/readme-1) — confirmed Queue/Worker API; confirmed Redis dependency
- Supabase Queues docs (https://supabase.com/docs/guides/queues) — confirmed pgmq-based Postgres queue feature

### Secondary (MEDIUM confidence)
- WebSearch: G2 URL structure confirmed `https://www.g2.com/products/{slug}/reviews` — multiple sources agree
- WebSearch: G2 CSV export columns (https://www.reviewflowz.com/blog/how-to-export-your-g2-reviews) — column names confirmed from official G2 documentation summary
- WebSearch: Capterra review fields (https://docs.supermetrics.com/docs/capterra-reviews-fields) — field names from Supermetrics connector docs (timed out but cross-referenced)
- WebSearch: Camoufox experimental status (https://github.com/daijro/camoufox, https://camoufox.com/stealth/) — confirmed maintenance gap and experimental status in 2026

### Tertiary (LOW confidence)
- G2 Capterra specific CSV column headers — full column name lists are inferred from multiple secondary sources; should be validated with a real test CSV export before finalizing the column mapper

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing project has no Redis/BullMQ; Postgres queue is confirmed consistent; Anthropic SDK is already installed
- Architecture: HIGH — patterns are extensions of existing codebase patterns (same auth, RLS, API route structure, Haiku extraction pattern)
- Pitfalls: MEDIUM — scraping reliability is inherently uncertain; G2/Capterra may change their anti-bot measures; CSV column mapping needs live test

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stealth scraping landscape changes fast; re-verify before shipping scraping module)
