# Sightline — Agent Instructions

You're building **Sightline**, an AI-native product discovery platform ("Cursor for Product Managers"). You operate inside the **WAT framework** (Workflows, Agents, Tools): probabilistic AI handles reasoning and orchestration, deterministic code handles execution. That separation is what makes this system reliable and maintainable.

---

## The WAT Architecture

**Layer 1: Workflows (The Instructions)**
- Markdown SOPs stored in `workflows/`
- Each workflow defines: objective, required inputs, which tools to invoke, expected outputs, error handling
- Examples: `workflows/ingest_gong_batch.md`, `workflows/run_discovery_query.md`, `workflows/generate_brief.md`, `workflows/competitive_scan.md`, `workflows/interview_guide.md`
- Written in plain language — the same way you'd brief a senior engineer on the team

**Layer 2: Agents (The Decision-Maker — Your Role)**
- You are responsible for intelligent orchestration across Sightline's modules
- Read the relevant workflow, execute tools in the correct sequence, handle failures gracefully, ask clarifying questions when inputs are ambiguous
- You connect product intent to code execution — you do not try to do everything yourself inline
- Example: If you need to chunk and embed a transcript, don't attempt it ad hoc. Read `workflows/ingest_transcript.md`, confirm the required inputs, then execute `tools/pipeline/chunk.py` → `tools/pipeline/enrich.py` → `tools/pipeline/embed.py` in sequence

**Layer 3: Tools (The Execution)**
- Python scripts in `tools/` that do the actual deterministic work
- API calls, vector upserts, database queries, file transforms, export formatting
- All credentials and API keys live in `.env` only — never hardcoded, never elsewhere
- These scripts are isolated, testable, and fast

**Why this matters:** The RAG pipeline has 6+ sequential steps. If each is 90% accurate and handled loosely, you're at ~53% end-to-end reliability. By isolating each step as a tested tool and orchestrating with clear workflows, the pipeline becomes auditable and fixable at the component level.

---

## Sightline Product Context

You must hold this context at all times. Refer back to it when making architectural or implementation decisions.

**What Sightline does:**
Ingests customer signals (call recordings, support tickets, usage data, NPS responses, competitor reviews) → maintains a living, queryable knowledge base → answers PM questions with evidence-backed recommendations → generates structured feature briefs → tracks decisions and their evidence rationale → exports to coding agents and project tools.

**The core loop:**
```
Customer signal → Ingest → Chunk → Enrich → Embed → Store
                                                        ↓
PM query → Retrieve → Rerank → Reason (Claude) → Response with citations
                                                        ↓
              Generate Brief → Decision Log → Export (Linear / Notion / Cursor / Claude Code)
```

**Six product modules:**
1. **Signal Ingestion Engine** — processes raw customer signals from all sources
2. **Discovery Query Interface** — conversational AI that answers PM questions with cited evidence
3. **Feature Brief Generator** — turns query answers into structured, exportable product specs
4. **Competitive Intelligence Module** — surfaces competitor mentions from your own customer calls + external signals
5. **Interview Guide Generator** — creates smart user research questions based on evidence gaps
6. **Decision Log** — institutional memory that tracks what was decided, why, and with what evidence

**Primary user:** A founder or PM at a Seed–Series A startup who is time-poor, evidence-hungry, and already using Cursor or Claude Code for engineering. They will not tolerate slow responses or hallucinated citations. Trust is the product.

---

## Monorepo Structure

```
sightline/
├── apps/
│   ├── web/                    # Next.js 15 frontend (TypeScript + Tailwind)
│   └── api/                    # Fastify + tRPC backend
├── packages/
│   ├── db/                     # Prisma schema + Supabase client + repositories
│   ├── ai/                     # RAG pipeline, LLM wrappers, prompts, evals
│   └── shared/                 # Zod schemas, types, constants shared across apps
├── tools/                      # Python scripts for deterministic execution
│   ├── pipeline/               # ingest, chunk, enrich, embed, retrieve scripts
│   ├── connectors/             # Gong, Zoom, Intercom, Zendesk, G2 API integrations
│   ├── competitive/            # Competitor signal extraction and scoring
│   ├── exports/                # Linear, Notion, Jira, agent prompt formatters
│   └── evals/                  # Evaluation harness for RAG quality scoring
├── workflows/                  # Markdown SOPs
│   ├── ingest_transcript.md
│   ├── run_discovery_query.md
│   ├── generate_brief.md
│   ├── competitive_scan.md
│   ├── generate_interview_guide.md
│   └── log_decision.md
├── .tmp/                       # Temporary processing files (disposable, not committed)
├── .env                        # API keys and secrets (NEVER committed)
├── CLAUDE.md                   # This file
└── docker-compose.yml          # Local dev: Postgres, Redis, Qdrant
```

**What goes where:**
- **Deliverables**: Final outputs (briefs, exports, interview guides) go to external services (Linear, Notion, Slack) or are served from the API
- **Intermediates**: Raw transcripts, chunked text, enrichment JSON → `.tmp/` only, disposable
- **Embeddings**: Qdrant only. Never store embedding vectors in Postgres.
- **Source documents**: Cloudflare R2 (or local `.tmp/` for dev)
- **Decision log**: Postgres only — this is structured relational data, not vector data

---

## Architecture Decisions — Never Deviate Without Asking

These are locked decisions. Do not refactor, replace, or work around them without explicit instruction.

**Backend**
- All API routes use **tRPC**. Never create a raw Fastify endpoint unless there is an explicit reason documented in the relevant workflow.
- All database access goes through the **repository pattern** in `packages/db/repositories/`. No raw Prisma calls in app code.
- Background jobs use **BullMQ + Redis**. The ingestion pipeline always runs as a BullMQ job — never synchronously in a request handler.
- Multi-tenant data isolation is enforced via **Postgres RLS** scoped to `org_id`. Every query must respect this. Never use the service role key in frontend or user-facing code.

**AI / RAG**
- All LLM calls go through **`packages/ai/client.ts`**. Never call the Anthropic SDK directly from `apps/` code.
- The primary model is **`claude-sonnet-4-6`** for reasoning and brief generation. Use **`claude-haiku-4-5-20251001`** for enrichment tagging and competitive mention extraction (cost-sensitive, high-volume).
- Prompts are typed constants in **`packages/ai/prompts/`**. No inline prompt strings in business logic — ever.
- Retrieval uses **Qdrant hybrid search** (dense + sparse). The collection schema is defined in `packages/ai/qdrant/schema.ts` and must not be changed without migrating existing data.
- Reranking always runs before the final LLM call. Top-40 retrieve → rerank → top-12 to Claude.
- **Hallucination prevention is a first-class concern.** Every AI response must be grounded in retrieved chunks. If no relevant chunks are found, the system must say so explicitly — never fabricate a response.

**Frontend**
- **No HTML `<form>` tags.** Use controlled React components with `onClick`/`onChange` handlers throughout.
- State management: **Zustand** for client state, **React Query** for server state. Do not mix them up.
- All user-facing loading states must show a streaming/progress indicator. No blank screens during AI calls.
- Confidence scores (HIGH / MEDIUM / LOW) must always be visible on AI responses. Never hide uncertainty from the user.
- Evidence panels are non-negotiable UI — every AI claim must be dismissable to a source quote. This is a core trust mechanic, not an optional feature.

**Auth**
- **Supabase Auth** for social login and magic link (PLG motion).
- **WorkOS** for enterprise SSO (SAML) — Phase 3 only. Do not build this early.

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `EvidenceDrawer.tsx` |
| tRPC routers | camelCase | `queryRouter.ts` |
| Database tables | snake_case | `org_workspaces` |
| Zod schemas | suffixed `Schema` | `createBriefSchema` |
| BullMQ jobs | suffixed `Job` | `ingestDocumentJob` |
| Qdrant collections | kebab-case | `sightline-chunks` |
| Env variables | SCREAMING_SNAKE | `ANTHROPIC_API_KEY` |
| Python tools | snake_case | `embed_chunks.py` |
| Workflow files | kebab-case | `ingest-transcript.md` |

---

## The RAG Pipeline — Step by Step

This is the most critical part of the system. Each step is a separate tool. Run them in order.

```
1. RECEIVE      tools/pipeline/receive.py       # Accepts source payload, validates, writes to .tmp/
2. TRANSCRIBE   tools/pipeline/transcribe.py    # Whisper API if audio; pass-through if already text
3. CHUNK        tools/pipeline/chunk.py         # 400-token chunks, 50-token overlap, semantic boundaries
4. ENRICH       tools/pipeline/enrich.py        # Tags: speaker, sentiment, product_area, entity, competitor_mention — uses Haiku
5. EMBED        tools/pipeline/embed.py         # OpenAI text-embedding-3-large; upsert to Qdrant with metadata
6. INDEX        tools/pipeline/index.py         # Record document + chunk metadata in Postgres; update status
```

**At query time:**
```
1. RETRIEVE     tools/pipeline/retrieve.py      # Hybrid search in Qdrant; filter by org_id, date, segment
2. RERANK       tools/pipeline/rerank.py        # Cross-encoder rerank; top-40 → top-12
3. REASON       packages/ai/query.ts            # Claude claude-sonnet-4-6 with PM system prompt; structured JSON output
4. FORMAT       apps/api/src/routers/query.ts   # Render response with citations, confidence, dissenting signals; stream to frontend
```

**Metadata schema on every Qdrant chunk:**
```json
{
  "org_id": "string",
  "workspace_id": "string",
  "document_id": "string",
  "source_type": "gong | zoom | intercom | zendesk | csv | g2 | capterra",
  "speaker_role": "customer | internal | unknown",
  "sentiment": "positive | neutral | negative | mixed",
  "product_area": "string[]",
  "entities": "string[]",
  "competitor_mentions": "string[]",
  "date": "ISO8601",
  "confidence": 0.0–1.0
}
```

---

## The Competitive Intelligence Pipeline

Competitor signals come from two sources:
1. **Organic** — competitor mentions extracted from your own customer calls during the enrich step (already in the RAG pipeline)
2. **External** — scheduled scrapes of G2, Capterra, and App Store reviews for specified competitors

```
tools/competitive/scrape_reviews.py     # Fetches G2/Capterra reviews for competitor list
tools/competitive/extract_signals.py    # Extracts pain points, feature requests, switching reasons using Haiku
tools/competitive/score_gaps.py         # Compares competitor weaknesses against your feature backlog
tools/competitive/generate_summary.py  # Produces weekly competitive digest
```

**Competitive data is never mixed into the main RAG corpus.** It lives in its own Qdrant collection (`sightline-competitive`) and Postgres table (`competitive_signals`). Queries that span both corpora must be explicit.

---

## The Decision Log

Every brief that gets exported or acted on should generate a Decision Log entry. This creates institutional memory and is a key differentiator — no other PM tool does this.

**Decision Log entry schema:**
```typescript
{
  decision_id: string,
  workspace_id: string,
  title: string,                    // "Ship bulk export feature — Q2"
  decision: string,                 // The actual decision made
  rationale: string,                // Why this decision was made
  evidence_ids: string[],           // Chunks that supported this decision
  dissenting_signals: string[],     // Counter-evidence that was considered
  confidence: "HIGH" | "MEDIUM" | "LOW",
  made_by: string,                  // user_id
  made_at: ISO8601,
  brief_id?: string,                // Link to the brief if one was generated
  outcome?: string,                 // Filled in later: what actually happened
  outcome_date?: ISO8601
}
```

The outcome field is critical — it allows Sightline to eventually learn which evidence patterns led to good vs. bad decisions. This is the long-term flywheel.

---

## How to Operate

**1. Check for existing tools before building anything new**
Before writing a new script, check `tools/` for what the current workflow requires. If a tool exists, use it. If it needs modification, modify it and update the relevant workflow.

**2. Learn and adapt when things fail**
When you hit an error:
- Read the full error message and trace — do not guess
- Fix the script and retest
- If the fix involves a paid API call (Anthropic, OpenAI, Qdrant cloud), check with me before re-running
- Document what you learned in the workflow file (rate limits, unexpected response shapes, edge cases in transcript formatting)

**3. Keep workflows current — but ask before overwriting**
When you discover a better method, encounter a constraint, or fix a recurring issue, update the relevant workflow. Do not create or overwrite workflow files without asking unless explicitly told to.

**4. Eval before you ship any pipeline change**
Any change to chunking, enrichment, embedding, or prompt logic must be run against the eval harness before it's considered done:
```bash
python tools/evals/run_eval.py --suite full
```
A change that improves one metric but degrades another is not done — surface the tradeoff and ask.

---

## The Self-Improvement Loop

Every failure is a chance to make Sightline stronger:
1. Identify what broke and at which pipeline step
2. Fix the tool or prompt
3. Verify the fix against the eval suite
4. Update the workflow with the new approach + what you learned
5. Move on with a more robust system

---

## What to Never Do

- **Never call the Anthropic SDK directly from `apps/`** — always go through `packages/ai/client.ts`
- **Never store embedding vectors in Postgres** — Qdrant only
- **Never bypass RLS** with the service role key in user-facing code
- **Never use `any` in TypeScript** — use `unknown` and narrow, or define the type
- **Never inline prompt strings** in business logic — prompts are constants in `packages/ai/prompts/`
- **Never fabricate citations** — if retrieval returns nothing relevant, say so. Hallucinated evidence destroys user trust and is the #1 failure mode for this product
- **Never mix competitive corpus with customer corpus** — keep them in separate Qdrant collections
- **Never commit secrets** — `.env` only, always gitignored
- **Never make paid API calls to fix a speculative bug** without checking first

---

## Current Build State

> **Update this section at the end of every session. This is the first thing to read at the start of any new session.**

| Module | Status | Notes |
|---|---|---|
| Monorepo scaffold        | ✅ Done | Next.js 15, Tailwind, Supabase SSR |
| Prisma schema + Supabase | ✅ Done | 9 tables, RLS enabled |
| Auth (Supabase)          | ✅ Done | Magic link working |
| Ingestion pipeline (CSV) | ✅ Done | 20 signals imported and saved | |
| Qdrant setup + schema | 🔲 Not started | |
| Discovery query interface | 🔲 Not started | |
| Feature brief generator | 🔲 Not started | |
| Competitive intelligence module | 🔲 Not started | |
| Interview guide generator | 🔲 Not started | |
| Decision log | 🔲 Not started | |
| Coding agent export | 🔲 Not started | |
| Eval harness | 🔲 Not started | |
| Linear integration | 🔲 Not started | |
| Notion integration | 🔲 Not started | |
| Billing (Stripe) | 🔲 Not started | |

---

## Bottom Line

You're building a product where **trust is the core feature**. Every recommendation Sightline makes is only as good as the evidence it surfaces. If the citations are wrong, the brief is wrong, and the roadmap decision is wrong. That chain of accountability is why the RAG pipeline gets the most care, why the eval harness ships before the UI is polished, and why "I don't know" is always a valid and correct response.

Stay evidence-driven. Stay reliable. Keep the pipeline honest.
