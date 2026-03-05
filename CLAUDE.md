# Sightline — Agent Instructions v2.0

You're building **Sightline**, an AI-native product discovery platform ("Cursor for Product Managers"). You operate inside the **WAT framework** (Workflows, Agents, Tools): probabilistic AI handles reasoning and orchestration, deterministic code handles execution. That separation is what makes this system reliable and maintainable.

---

## The WAT Architecture

**Layer 1: Workflows (The Instructions)**
- Markdown SOPs stored in `workflows/`
- Each workflow defines: objective, required inputs, which tools to invoke, expected outputs, error handling
- Examples: `workflows/ingest_transcript.md`, `workflows/run_discovery_query.md`, `workflows/generate_brief.md`, `workflows/generate_ui_proposal.md`, `workflows/competitive_scan.md`, `workflows/generate_interview_guide.md`, `workflows/ingest_usage_data.md`, `workflows/generate_deck.md`
- Written in plain language — the same way you'd brief a senior engineer on the team

**Layer 2: Agents (The Decision-Maker — Your Role)**
- You are responsible for intelligent orchestration across Sightline's modules
- Read the relevant workflow, execute tools in the correct sequence, handle failures gracefully, ask clarifying questions when inputs are ambiguous
- You connect product intent to code execution — you do not try to do everything yourself inline

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
Ingests customer signals (call recordings, support tickets, usage data, NPS responses, competitor reviews) → maintains a living, queryable knowledge base → answers PM questions with evidence-backed recommendations → generates structured feature briefs with UI direction and data model hints → tracks decisions and their evidence rationale → exports complete implementation packages to coding agents and project tools → closes the full loop when features ship by monitoring whether customer pain decreases.

**The core loop (full — per YC vision):**
```
Customer signal + Usage data → Ingest → Chunk → Enrich → Embed → Store
                                                                     ↓
PM query → Retrieve → Rerank → Reason (Claude) → Response with citations
                                                                     ↓
        Generate Brief → UI Direction → Data Model Hints → Decision Log
                                                                     ↓
              Export (Linear / Notion / Cursor / Claude Code) → Ship
                                                                     ↓
                    Generate Deck → Present to Stakeholders → Align
                                                                     ↓
                    Monitor signal change → Loop closes → Sightline learns
```

**Nine product modules:**
1. **Signal Ingestion Engine** — processes qualitative signals (calls, tickets, NPS)
2. **Usage Data Ingestion** — processes quantitative signals (Mixpanel, Amplitude, product events)
3. **Discovery Query Interface** — conversational AI that answers PM questions with cited evidence
4. **Feature Brief Generator** — turns query answers into structured specs with UI direction and data model hints
5. **Competitive Intelligence Module** — surfaces competitor mentions from your calls + external signals
6. **Interview Guide Generator** — creates targeted research questions based on evidence gaps
7. **Decision Log** — institutional memory tracking what was decided, why, and what happened
8. **Signal Loop Closer** — monitors whether shipped features actually reduced the pain they were built to solve
9. **Deck Generator** — turns briefs, queries, decisions, and custom PM content into polished, evidence-traced presentations (PPTX, Google Slides, PDF, shareable web link)

**Primary user:** A founder or PM at a Seed–Series A startup who is time-poor, evidence-hungry, and already using Cursor or Claude Code for engineering. They will not tolerate slow responses or hallucinated citations. Trust is the product.

**The YC framing to always keep in mind:**
> "Imagine a tool where you upload customer interviews and product usage data, ask 'What should we build next?' and get the outline of a new feature, complete with an explanation based on customer feedback as to why this is a change worth making. The tool would also propose specific changes to your product's UI, data model, and workflows and would break down the development tasks so that they could be handled by your favorite coding agent."

Every feature decision should be evaluated against this framing. If it doesn't support the full loop from discovery → brief → UI direction → data model → coding agent → outcome, it's not core.

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
│   ├── connectors/             # Gong, Zoom, Intercom, Zendesk, Mixpanel, Amplitude
│   ├── competitive/            # Competitor signal extraction and scoring
│   ├── usage/                  # Usage data normalization and signal extraction
│   ├── decks/                  # Deck generation pipeline (intent, compose, layout, export)
│   ├── exports/                # Linear, Notion, Jira, Cursor, Claude Code formatters
│   └── evals/                  # Evaluation harness for RAG quality scoring
├── workflows/                  # Markdown SOPs
│   ├── ingest_transcript.md
│   ├── ingest_usage_data.md
│   ├── run_discovery_query.md
│   ├── generate_brief.md
│   ├── generate_ui_proposal.md
│   ├── competitive_scan.md
│   ├── generate_interview_guide.md
│   ├── generate_deck.md
│   └── log_decision.md
├── .tmp/                       # Temporary processing files (disposable, not committed)
├── .env                        # API keys and secrets (NEVER committed)
├── CLAUDE.md                   # This file
└── docker-compose.yml          # Local dev: Postgres, Redis, Qdrant
```

---

## Architecture Decisions — Never Deviate Without Asking

**Backend**
- All API routes use **tRPC**. Never create a raw Fastify endpoint unless explicitly documented.
- All database access goes through the **repository pattern** in `packages/db/repositories/`.
- Background jobs use **BullMQ + Redis**. The ingestion pipeline always runs as a BullMQ job — never synchronously in a request handler.
- Multi-tenant data isolation is enforced via **Postgres RLS** scoped to `org_id`. Never use the service role key in user-facing code.

**AI / RAG**
- All LLM calls go through **`packages/ai/client.ts`**. Never call the Anthropic SDK directly from `apps/`.
- The primary model is **`claude-sonnet-4-6`** for reasoning, brief generation, and deck narrative/structure. Use **`claude-haiku-4-5-20251001`** for enrichment tagging, UI proposal generation, competitive mention extraction, and deck layout decisions.
- Prompts are typed constants in **`packages/ai/prompts/`**. No inline prompt strings in business logic.
- Retrieval uses **Qdrant hybrid search** (dense + sparse).
- Reranking always runs before the final LLM call. Top-40 retrieve → rerank → top-12 to Claude.
- **Hallucination prevention is a first-class concern.** Every AI response must be grounded in retrieved chunks. If no relevant chunks found, say so explicitly.
- **UI proposals must be grounded in evidence.** Never propose a UI change that isn't traceable back to a customer signal or usage pattern.

**Brief Generation — New Sections (v2)**
- Every brief now includes five sections: Problem Statement, Proposed Solution, User Stories, UI Direction, Data Model Hints, Success Metrics, Out of Scope
- **UI Direction** must describe changes screen-by-screen and component-by-component in plain language
- **Data Model Hints** must suggest specific table names, field names, and data types
- Both new sections are included in the coding agent export automatically
- The coding agent export format is: Context Block + Feature Description + Acceptance Criteria + **UI Direction** + **Data Model Hints** + Edge Cases

**Usage Data Pipeline**
- Usage events (Mixpanel, Amplitude, CSV) are stored in a separate Postgres table `usage_signals` — not in the vector store
- Usage signals are joined with qualitative signals at query time to produce combined evidence
- Never mix usage signal IDs with qualitative chunk IDs in the evidence panel — label them separately
- Usage signals display as "X% of users drop off at this step" not as quotes

**Frontend**
- **No HTML `<form>` tags.** Use controlled React components with `onClick`/`onChange` handlers.
- State management: **Zustand** for client state, **React Query** for server state.
- All user-facing loading states must show a streaming/progress indicator.
- Confidence scores (HIGH / MEDIUM / LOW) must always be visible on AI responses.
- Evidence panels are non-negotiable — every AI claim must be dismissable to a source.
- UI Direction sections in briefs render as structured step-by-step flows, not prose.
- Data Model Hints render as code blocks with syntax highlighting.

**Auth**
- **Supabase Auth** for social login and magic link (PLG motion).
- **WorkOS** for enterprise SSO (SAML) — Phase 3 only.

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| React components | PascalCase | `UIDirectionPanel.tsx` |
| tRPC routers | camelCase | `briefRouter.ts` |
| Database tables | snake_case | `usage_signals` |
| Zod schemas | suffixed `Schema` | `generateBriefSchema` |
| BullMQ jobs | suffixed `Job` | `ingestUsageDataJob` |
| Qdrant collections | kebab-case | `sightline-chunks` |
| Env variables | SCREAMING_SNAKE | `ANTHROPIC_API_KEY` |
| Python tools | snake_case | `ingest_usage_events.py` |

---

## The RAG Pipeline — Step by Step

```
1. RECEIVE      tools/pipeline/receive.py       # Accepts source payload, validates
2. TRANSCRIBE   tools/pipeline/transcribe.py    # Whisper API if audio; pass-through if text
3. CHUNK        tools/pipeline/chunk.py         # 400-token chunks, 50-token overlap
4. ENRICH       tools/pipeline/enrich.py        # Tags: speaker, sentiment, product_area, entity, competitor_mention — Haiku
5. EMBED        tools/pipeline/embed.py         # OpenAI text-embedding-3-large; upsert to Qdrant
6. INDEX        tools/pipeline/index.py         # Record in Postgres; update status
```

**At query time:**
```
1. RETRIEVE     tools/pipeline/retrieve.py      # Hybrid search; filter by org_id, date, segment
2. RERANK       tools/pipeline/rerank.py        # Cross-encoder rerank; top-40 → top-12
3. REASON       packages/ai/query.ts            # Claude with PM system prompt; structured JSON
4. FORMAT       apps/api/src/routers/query.ts   # Render with citations, confidence, dissenting signals
```

**Metadata schema on every Qdrant chunk:**
```json
{
  "org_id": "string",
  "workspace_id": "string",
  "document_id": "string",
  "source_type": "gong | zoom | intercom | zendesk | csv | g2 | capterra | mixpanel | amplitude",
  "signal_type": "qualitative | quantitative",
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

## The Feature Brief — Full Structure (v2)

Every generated brief must include all seven sections:

```typescript
{
  problem_statement: string,        // User pain in plain language with source evidence
  proposed_solution: string,        // High-level description of the feature or change
  user_stories: UserStory[],        // "As a [role], I want [action] so that [outcome]"
  ui_direction: UIDirection,        // Screen-by-screen, component-by-component changes
  data_model_hints: DataModelHint[], // Suggested table/field changes with types
  success_metrics: string[],        // KPIs tied to the stated problem
  out_of_scope: string[]            // Explicitly what this brief does NOT include
}

type UIDirection = {
  screens: {
    screen_name: string,
    changes: string[],              // e.g. "Add progress stepper with 3 steps: ..."
    new_components: string[],       // e.g. "OnboardingProgress, StepIndicator"
    interactions: string[]          // e.g. "Clicking Next validates current step before advancing"
  }[]
}

type DataModelHint = {
  table: string,                    // e.g. "users"
  operation: "add_field" | "new_table" | "modify_field",
  field_name: string,               // e.g. "onboarding_step"
  field_type: string,               // e.g. "INTEGER DEFAULT 0"
  rationale: string                 // Why this field is needed
}
```

---

## The Coding Agent Export — Full Package (v2)

The export package sent to Cursor/Claude Code must include all of:

```
1. CONTEXT BLOCK          — Product background, existing relevant components, constraints
2. FEATURE DESCRIPTION    — From the brief's proposed solution
3. ACCEPTANCE CRITERIA    — Converted to testable requirements
4. UI DIRECTION           — Screen-by-screen component changes (from brief)
5. DATA MODEL HINTS       — Exact field names, types, and table operations (from brief)
6. EDGE CASES             — From Open Questions and dissenting signals
7. SUGGESTED FILE PATHS   — Where new components/routes should live based on project structure
```

This is the full package a coding agent needs to implement something without asking clarifying questions.

---

## The Signal Loop Closer (v2 — New Module)

After a decision is logged and a feature ships, Sightline monitors whether the underlying customer pain decreases. This closes the full product loop and creates the learning flywheel.

**How it works:**
1. When a decision is logged, Sightline records the `pain_area` tags from the evidence chunks
2. After 30/60/90 days, Sightline re-queries the corpus for signals about that pain area
3. It compares signal volume and sentiment before vs. after the ship date
4. It reports: "Since shipping [feature], signals about [pain area] decreased by X% / increased by X% / stayed flat"
5. This outcome is automatically attached to the decision log entry

**Why this matters:** It's the only way to know if your evidence-based decisions are actually working. Over time it trains Sightline to weight certain evidence patterns more heavily because they've historically predicted good outcomes.

```typescript
type SignalLoopCheck = {
  decision_id: string,
  pain_area_tags: string[],
  baseline_signal_count: number,
  baseline_sentiment_score: number,
  check_date: ISO8601,
  current_signal_count: number,
  current_sentiment_score: number,
  delta_signal_count: number,
  delta_sentiment: "improved" | "worsened" | "unchanged",
  summary: string
}
```

---

## The Competitive Intelligence Pipeline

```
tools/competitive/scrape_reviews.py     # G2/Capterra reviews for competitor list
tools/competitive/extract_signals.py    # Pain points, switching reasons, feature requests — Haiku
tools/competitive/score_gaps.py         # Competitor weaknesses vs. your feature backlog
tools/competitive/generate_summary.py  # Weekly competitive digest
```

Competitive data lives in its own Qdrant collection (`sightline-competitive`). Never mixed into main corpus.

---

## The Deck Generator

Turns Sightline outputs into polished, evidence-traced presentations. Two modes: one-click generation from any Sightline artifact (brief, query, decision, competitive digest, signal loop check), and a custom deck builder where PMs compose presentations for their own projects using Sightline's evidence library.

**Deck Generation Pipeline:**
```
1. INTENT       tools/decks/analyze_intent.py     # Determines audience, goal, structure from source
2. SELECT       tools/decks/select_content.py     # Pulls relevant evidence, metrics, visuals
3. COMPOSE      tools/decks/compose_slides.py     # Generates slide content with headlines + sources — Sonnet
4. LAYOUT       tools/decks/apply_layout.py       # Applies theme, typography, data viz
5. LINK         tools/decks/link_evidence.py      # Traces every claim to its source
6. EXPORT       tools/decks/export.py             # PPTX, Google Slides API, PDF, web link
```

**Key types:**
```typescript
type Deck = {
  id: string,
  workspace_id: string,
  user_id: string,
  title: string,
  source_type: "brief" | "query" | "decision" | "competitive" | "signal_loop" | "custom",
  source_id?: string,
  theme: "clean" | "executive" | "brand",
  slides: DeckSlide[],
  status: "draft" | "published"
}

type DeckSlide = {
  id: string,
  deck_id: string,
  position: number,
  slide_type: "title" | "insight" | "data_viz" | "comparison" | "proposal" | "competitive_matrix" | "persona" | "timeline" | "decision" | "freeform",
  content_json: Record<string, unknown>,
  evidence_ids: string[],
  layout: string
}
```

**Rules:**
- Every data claim on every slide must be traceable to a source — no orphaned statistics
- Deck generation uses **`claude-sonnet-4-6`** for narrative and structure, **`claude-haiku-4-5-20251001`** for layout decisions
- Prompts for deck generation live in `packages/ai/prompts/deck/` — never inline
- PPTX generation uses a deterministic template engine (python-pptx) — Claude writes the content, code renders the slides
- The shareable web link export renders slides with interactive evidence drill-down — clicking a claim shows the source chunk/signal
- Custom deck builder state managed with Zustand (slide reordering, inline editing)

---

## The Decision Log

```typescript
{
  decision_id: string,
  workspace_id: string,
  title: string,
  decision: string,
  rationale: string,
  evidence_ids: string[],
  dissenting_signals: string[],
  confidence: "HIGH" | "MEDIUM" | "LOW",
  made_by: string,
  made_at: ISO8601,
  brief_id?: string,
  outcome?: string,
  outcome_date?: ISO8601,
  signal_loop_check?: SignalLoopCheck  // Auto-populated after 30/60/90 days
}
```

---

## How to Operate

1. **Check for existing tools before building anything new**
2. **Learn and adapt when things fail** — read the full error, fix, retest, document
3. **Keep workflows current** — ask before overwriting
4. **Eval before shipping any pipeline change** — `python tools/evals/run_eval.py --suite full`

---

## What to Never Do

- **Never call the Anthropic SDK directly from `apps/`** — always through `packages/ai/client.ts`
- **Never store embedding vectors in Postgres** — Qdrant only
- **Never bypass RLS** with the service role key in user-facing code
- **Never use `any` in TypeScript** — use `unknown` and narrow
- **Never inline prompt strings** in business logic — constants in `packages/ai/prompts/`
- **Never fabricate citations** — if retrieval returns nothing, say so
- **Never mix competitive corpus with customer corpus**
- **Never generate UI direction that isn't grounded in a customer signal or usage pattern**
- **Never generate data model hints without explaining the rationale**
- **Never commit secrets** — `.env` only
- **Never generate a deck slide with an untraced claim** — every data point must link to a source
- **Never make paid API calls to fix a speculative bug** without checking first

---

## Current Build State

> **Update this section at the end of every session.**

| Module | Status | Notes |
|---|---|---|
| Monorepo scaffold | ✅ Done | Next.js 15, Tailwind, Supabase SSR |
| Prisma schema + Supabase | ✅ Done | 9 tables, RLS enabled |
| Auth (Supabase) | ✅ Done | Magic link working |
| Ingestion pipeline (CSV) | ✅ Done | CSV upload, signals saved to DB |
| Discovery query interface | ✅ Done | Streaming, evidence panel, confidence score |
| Feature brief generator | ✅ Done | Saves to DB — needs UI Direction + Data Model Hints |
| Briefs page | ✅ Done | Full brief panel with Log Decision |
| Decision log | ✅ Done | Timeline with outcome tracking |
| Onboarding flow | ✅ Done | 3-step, creates org/user/workspace |
| Brief v2 — UI Direction | 🔲 Not started | Add to brief generator — highest priority |
| Brief v2 — Data Model Hints | 🔲 Not started | Add to brief generator |
| Coding agent export v2 | 🔲 Not started | Include UI direction + data model in export |
| Usage data ingestion | 🔲 Not started | Mixpanel/Amplitude/CSV events |
| Signal loop closer | 🔲 Not started | Post-ship pain area monitoring |
| Competitive intelligence | 🔲 Not started | |
| Interview guide generator | 🔲 Not started | |
| Deck generator v1 | 🔲 Not started | One-click from briefs/queries/decisions; PPTX + PDF export |
| Deck generator v2 | 🔲 Not started | Custom builder, templates, Google Slides, web link |
| Weekly PM digest email | 🔲 Not started | |
| Roadmap evidence scorer | 🔲 Not started | |
| Stripe billing | 🔲 Not started | Next session priority |
| Landing page | 🔲 Not started | |

---

## Bottom Line

You're building the product YC explicitly asked for. Their framing is the north star: *"propose specific changes to your product's UI, data model, and workflows and break down the development tasks so that they could be handled by your favorite coding agent."*

Every feature closes more of that loop. Trust is the core feature — every recommendation must be traceable to evidence, every UI proposal must be grounded in customer pain, every data model hint must be explainable, and every stakeholder deck must carry the same evidence traceability as the analysis behind it. The system that earns trust at each step becomes indispensable.

Stay evidence-driven. Stay reliable. Close the loop.
