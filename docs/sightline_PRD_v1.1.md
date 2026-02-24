# PRODUCT REQUIREMENTS DOCUMENT
## Sightline — AI-Native Product Discovery Platform
### "Cursor for Product Managers"

**Version:** 1.1  
**Status:** Ready for Engineering  
**Date:** February 2026  
**Author:** Founding Team  
**Confidentiality:** Internal / Seed Investors Only

---

## 1. Executive Summary

Sightline is an AI-native product discovery platform that closes the gap between user insight and engineering execution. While tools like Cursor and Claude Code have transformed how software is *written*, no system exists to help teams decide *what to build* in the first place. Sightline fills that gap.

Product managers, founders, and engineers spend 30–40% of their time on discovery work — user interviews, feedback synthesis, roadmap decisions, spec writing, competitive monitoring — yet every step is fragmented across Notion, Gong, Figma, Loom, and Linear. Sightline consolidates this entire workflow into one AI-native platform that ingests raw customer signals, synthesizes them into prioritized feature recommendations, tracks the evidence trail behind every decision, and exports tasks directly to your coding agent.

> **Core Value Proposition**
> Upload your customer interviews, usage data, and support tickets. Ask "What should we build next?" Get a prioritized feature brief with customer evidence, competitive context, and development tasks — ready for your engineering agents to execute.

**Key Metrics at a Glance**

| Metric | Target (Month 6) | Target (Month 18) |
|---|---|---|
| ARR | $180K | $2.4M |
| Paying Customers | 15 | 120+ |
| Avg ACV | $12,000 | $20,000 |
| NPS | >50 | >65 |

---

## 2. Problem Statement

### 2.1 The Discovery Gap

Software development has two phases: figuring out what to build, and building it. AI has dramatically accelerated the second phase. Cursor, GitHub Copilot, and Claude Code now write production-quality code from a short description. Build cycles that took weeks now take days. But the first phase — deciding what to build — remains entirely manual, fragmented, and slow.

This is the discovery gap, and it's growing. As engineering velocity increases, product discovery becomes the rate-limiting step for every team.

### 2.2 The Current Workflow Is Broken

| Step | Current Tool(s) | Pain Point |
|---|---|---|
| User research | Gong, Zoom, Otter.ai, Notion | Manual review of hours of recordings |
| Feedback synthesis | Linear, Productboard, Notion | Subjective grouping, no signal weighting |
| Prioritization | Spreadsheets, gut feeling | No connection to business impact |
| Spec writing | Confluence, Notion, Google Docs | Blank page, hours of writing |
| Competitive monitoring | Manual G2 checks, Twitter | No connection to your own customer signals |
| Decision audit trail | None | Nobody can remember why something was built |
| Engineering handoff | Jira, Linear | Disconnected from research that prompted it |

### 2.3 Quantified Pain

- Product managers spend an average of 12–15 hours per week on manual synthesis and documentation tasks (ProductPlan 2024).
- Decision-to-spec cycles average 3–4 weeks at companies with 10–50 engineers.
- 70% of PMs report their roadmap decisions are not directly traceable back to customer evidence.
- The average startup has 50–200 unreviewed customer calls sitting in Gong at any given time.
- 60% of PMs have no systematic process for tracking competitive intelligence from their own customer conversations.

> **The Insight:** The real product is not a PRD — it's a decision. Sightline doesn't just generate documents; it closes the loop between what customers say, what competitors are doing, and what engineers build.

---

## 3. Target Users & Market

### 3.1 Primary User Personas

**Persona 1: The Founder-PM (Primary Buyer & User)**

| Attribute | Detail |
|---|---|
| Role | Founder or first PM at a 5–40 person startup |
| Company Stage | Seed to Series A ($1M–$15M ARR) |
| Top Jobs-to-Done | Decide what to build next, justify roadmap to investors, onboard engineers without long specs |
| Biggest Frustration | Can't synthesize all user feedback fast enough; roadmap debates without evidence |
| Willingness to Pay | $800–$2,000/month for a tool that saves 10+ hours/week |

**Persona 2: The Staff PM at a Growth-Stage Company**

| Attribute | Detail |
|---|---|
| Role | Senior/Staff PM at 50–500 person company |
| Company Stage | Series B+ ($10M–$100M ARR) |
| Top Jobs-to-Done | Run structured discovery programs, synthesize across multiple data sources, build org-wide roadmap alignment |
| Biggest Frustration | Productboard is expensive and shallow; research stays siloed in individual PMs |
| Willingness to Pay | $15K–$40K/year for team seat pricing with cross-functional visibility |

**Persona 3: The Technical Founder Without a PM**
Engineers who build what they think is right, but lack a structured way to connect shipping decisions to user pain. They want Sightline to be the PM function they can't afford to hire yet.

### 3.2 Market Sizing

| Market Layer | Size | Basis |
|---|---|---|
| TAM | $28B | Global PM software + research tools + AI productivity |
| SAM | $4.2B | English-language SaaS startups + midmarket product teams |
| SOM (Yr 3) | $120M | ~6,000 companies × $20K ACV |

### 3.3 Go-to-Market Beachhead

Initial focus: YC-backed startups and Seed-stage companies using Cursor or Claude Code. This cohort is actively seeking the missing upstream link and has the shortest sales cycle. The YC network alone represents 5,000+ portfolio companies globally.

---

## 4. Product Overview

### 4.1 Core Concept

Sightline is a workspace that understands your product. It ingests every signal your customers generate — call recordings, support tickets, NPS responses, usage events, reviews — and maintains a living model of what users need. When a PM asks a question, Sightline doesn't search files. It reasons about your product.

> **The Mental Model:** Think of Sightline as a senior PM who has read every customer call, tracks what your competitors are doing, knows your product intimately, and can always answer "Why should we build this?" with actual evidence — not guesses. And one who remembers every decision that was ever made and why.

### 4.2 Key Differentiators vs. Existing Tools

| Capability | Sightline | Productboard | Dovetail | Notion AI |
|---|---|---|---|---|
| Multi-source ingestion | ✅ Native | ⚠ Partial | ⚠ Partial | ❌ Manual |
| Evidence-backed recommendations | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Competitive intelligence from your calls | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Interview guide generator | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Decision audit trail | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Coding agent export | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Conversational queries | ✅ Native | ⚠ Limited | ⚠ Limited | ✅ Yes |
| PM-specific prompting | ✅ Purpose-built | ❌ No | ❌ No | ❌ No |

---

## 5. Feature Specifications — MVP

The MVP ships six interconnected modules. Build them in the order listed below — each one is a prerequisite for the next.

---

### Feature 1: Signal Ingestion Engine

The foundation of Sightline. Connects to every source of customer truth and processes them into a structured, queryable knowledge base.

**Connectors (MVP)**
- Gong / Chorus — call recordings + transcripts (OAuth)
- Intercom / Zendesk / Front — support ticket threads
- Google Meet / Zoom — meeting recordings via transcript webhook
- CSV / JSON manual upload — for teams not on these tools
- Loom — async video with transcript extraction

**Processing Pipeline**
1. Transcript is received and chunked into semantic segments (400 tokens, 50-token overlap).
2. Each segment is tagged with: speaker role, sentiment, product area, urgency signal, feature mention, and competitor mentions.
3. Entity extraction identifies: specific features mentioned, pain point type, use case, workaround behavior.
4. Each insight is embedded (OpenAI text-embedding-3-large) and stored in Qdrant with full metadata.
5. Aggregated frequency and recency scoring runs nightly to surface "trending" pain areas.

**Acceptance Criteria**
- Ingests a 60-minute Gong call and completes processing in under 90 seconds.
- Extracts ≥85% of feature mentions as validated by spot-check QA (20-call benchmark set).
- Supports batch import of up to 500 historical calls at onboarding.
- All customer data encrypted at rest (AES-256) and in transit (TLS 1.3).

---

### Feature 2: Discovery Query Interface

The primary conversational UI. PMs type natural-language questions and receive structured, evidence-backed answers that cite source materials.

**Query Types (MVP)**

| Query Type | Example |
|---|---|
| Discovery | "What should we build next for our enterprise customers?" |
| Pain Analysis | "What are the top 3 reasons users churn in their first 30 days?" |
| Segment Comparison | "How do SMB vs. enterprise users describe onboarding friction differently?" |
| Validation | "How much evidence do we have for building a Slack integration?" |
| Competitive | "What do users say they wish we did that competitors do better?" |
| Roadmap Check | "Which items on our current roadmap have the most customer evidence?" |

**Response Format — Every answer includes:**
- **Recommendation** — the concrete output (feature, decision, priority)
- **Evidence panel** — 3–5 verbatim source quotes with call/ticket reference + timestamp
- **Confidence score** — HIGH / MEDIUM / LOW based on evidence volume and recency
- **Dissenting signals** — minority viewpoints that contradict the recommendation
- **Competitive context** — if relevant competitor mentions exist in the corpus, they surface automatically
- **Suggested follow-up questions** to deepen the analysis

**Acceptance Criteria**
- Response latency ≤ 8 seconds for queries against a corpus of 500 processed calls.
- Evidence citations are traceable — clicking a quote opens the source recording at the timestamp.
- Query history is saved and searchable per project workspace.
- Supports multi-turn conversation context (up to 12 turns per session).

---

### Feature 3: Feature Brief Generator

Converts a discovery query answer into a structured product spec, ready for stakeholder review and engineering handoff.

**Brief Structure (Auto-Generated)**
- **Problem Statement** — user pain in plain language with source evidence
- **Proposed Solution** — high-level description of the feature or change
- **User Stories** — auto-generated in standard "As a [role], I want [action] so that [outcome]" format
- **Out of Scope** — explicitly states what this brief does NOT include
- **Success Metrics** — suggested KPIs tied to the stated problem
- **Open Questions** — unresolved dependencies or decisions flagged by the AI
- **Competitive Context** — what competitors do in this area (if data exists)
- **Supporting Evidence** — full evidence panel with customer quotes

**Export Options**
- Notion — direct API push into a connected Notion database
- Confluence — publish to a specified Confluence space
- Linear / Jira — create epic with user stories as child issues
- Markdown — raw export for any tool
- Coding Agent Prompt — special export format (see Feature 5)

**Acceptance Criteria**
- Brief can be generated from any Discovery Query answer in one click.
- User stories auto-generated for ≥80% of feature briefs without manual editing required.
- Notion and Linear exports work end-to-end in under 10 seconds.
- PM can edit any section inline before exporting; edits are saved to brief history.

---

### Feature 4: Competitive Intelligence Module

Surfaces competitive signals from two sources: your own customer calls (organic) and external review platforms (scheduled). This is distinct from a generic competitive research tool — Sightline's competitive data is grounded in what *your* customers say about competitors, not just public review noise.

**Signal Sources**
- **Organic (from your calls):** Competitor mentions are extracted during the standard enrichment step. Every call where a competitor is mentioned is tagged and queryable.
- **External (scheduled):** Weekly scrapes of G2, Capterra, and App Store reviews for a defined competitor list. Structured extraction pulls: feature-specific complaints, switching reasons, pricing friction, and praise.

**Query Types**
- "What do our customers say about [Competitor X]?"
- "What features do churned customers say [Competitor X] does better?"
- "Are there patterns in customers who mention [Competitor X] positively?"
- "What's the weekly competitive digest?" — auto-generated summary of new signals

**Competitive Data Rules**
- Competitor signals are stored in a separate Qdrant collection (`sightline-competitive`). They are never mixed into the customer signal corpus.
- Queries that combine both sources are explicitly labeled as cross-corpus and noted in the response.
- No competitor data is ever shown to other organizations.

**Acceptance Criteria**
- Competitor mentions in calls are extracted with ≥80% precision (benchmark set of 15 tagged calls).
- Weekly external scan completes in under 10 minutes for a competitor list of up to 10 companies.
- Competitive context appears automatically in relevant Discovery Query responses without requiring an explicit competitive query.

---

### Feature 5: Interview Guide Generator

Closes the research loop. After reviewing evidence in Sightline, a PM can identify gaps in their knowledge — areas where evidence is thin or contradictory — and generate a targeted interview guide to fill them.

**How it works**
1. PM opens a workspace or reviews a Discovery Query response.
2. Sightline automatically identifies: topics with LOW confidence, areas with contradictory signals, product areas with no coverage in the last 90 days.
3. PM clicks "Generate Interview Guide" — selecting a target segment (enterprise, SMB, churned, etc.).
4. Claude generates a structured guide with: opening questions, deep-dive probes specific to the evidence gaps, and hypothesis-testing questions based on tentative conclusions.

**Interview Guide Structure**
- **Context brief** — what Sightline already knows about this segment, what the gaps are
- **Opening questions** (3–4) — rapport building, confirms segment fit
- **Core discovery questions** (5–7) — targeted to the specific evidence gaps
- **Hypothesis-testing questions** (3–4) — probes tentative conclusions from existing data
- **Closing questions** — usage patterns, willingness to pay signals

**Export Options**
- Notion — pushed to an interview prep template
- Markdown — for any note-taking tool
- PDF — for sharing with non-Sightline users

**Acceptance Criteria**
- Guide can be generated in under 15 seconds.
- Evidence gap identification surfaces at least 3 specific areas to probe per workspace.
- PM can add custom context before generation ("This is a churned enterprise customer who mentioned pricing").

---

### Feature 6: Decision Log

Institutional memory for product decisions. Every brief that gets exported or acted on creates a Decision Log entry. Over time, this becomes Sightline's most defensible asset — a structured record of what was decided, why, with what evidence, and eventually, what happened.

**Why this matters:** Most companies cannot answer "why did we build this?" six months later. Sightline makes this automatic.

**Decision Entry (Auto-Populated from Brief)**
- Title and decision made
- Rationale (from brief reasoning)
- Evidence IDs that supported the decision
- Dissenting signals that were considered
- Confidence level at time of decision
- Who made it and when
- Link to the original brief

**Decision Entry (Manual)**
- PMs can also log decisions made outside of Sightline (e.g., "We decided to deprioritize X because of Y") to keep the log complete.

**Outcome Tracking**
- After 30/60/90 days, Sightline prompts the PM: "You decided to ship [X]. What happened?"
- PM adds a short outcome note.
- Over time this creates a feedback loop between evidence quality and decision quality.

**Query Interface**
- "Why did we build [feature]?" — returns the decision entry with evidence
- "What decisions did we make in Q1 that haven't been shipped yet?"
- "Which of our past decisions had LOW confidence that we should revisit?"

**Acceptance Criteria**
- Decision entry is auto-created when a brief is exported to Linear, Jira, or Notion.
- Decision log is searchable and filterable by date, confidence, status, and product area.
- Outcome prompts are sent via in-app notification 30 days after a decision is logged.

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | SSR for SEO, RSC for performance, type safety |
| State Management | Zustand + React Query | Lightweight client state + server cache sync |
| Backend API | Node.js + Fastify + tRPC | Type-safe end-to-end, high throughput |
| AI / LLM | Anthropic Claude API (claude-sonnet-4-6) | Best-in-class reasoning, long context (200K tokens) |
| Embeddings | OpenAI text-embedding-3-large | Best retrieval quality at cost-effective scale |
| Vector DB | Qdrant (self-hosted → Qdrant Cloud) | High-performance ANN search, metadata filtering |
| Primary Database | PostgreSQL (Supabase) | Relational structure, realtime subscriptions, auth |
| Background Jobs | BullMQ + Redis | Async ingestion pipeline, retry handling |
| File Storage | Cloudflare R2 | Zero egress cost, S3-compatible |
| Auth | Supabase Auth + WorkOS (SSO) | Social login for PLG, enterprise SSO for mid-market |
| Deployment | Vercel (frontend) + Fly.io (backend) | Zero-ops deployment, global edge, predictable costs |
| Observability | Sentry + PostHog + Datadog | Error tracking, product analytics, infra metrics |

### 6.2 Data Model (Core Entities)

| Entity | Key Fields | Notes |
|---|---|---|
| Organization | id, name, plan, settings | Top-level tenant; all data is org-scoped |
| User | id, org_id, role, email | Roles: Admin, PM, Viewer |
| Workspace | id, org_id, name, product_context | Scopes signals + queries to a product area |
| Source | id, type, status, connector_config | Gong, Zendesk, CSV, etc. |
| Document | id, source_id, type, metadata, raw_url | Each call/ticket is a Document |
| Chunk | id, doc_id, embedding_id, text, tags, sentiment | The unit of retrieval; in both Postgres + Qdrant |
| Query | id, workspace_id, user_id, text, response_json | Full conversation history |
| Brief | id, query_id, content_json, exports[] | Generated feature brief, versioned |
| CompetitorSignal | id, org_id, competitor, source, content, date | External + organic competitive data |
| Decision | id, brief_id, workspace_id, user_id, title, evidence_ids[], confidence, outcome | Decision log entry |

### 6.3 Security & Compliance

- Multi-tenant data isolation enforced at Postgres row-level security (RLS) — all queries auto-scoped to `org_id`.
- PII handling: Customer names/emails in transcripts are optionally pseudonymized at ingestion (toggleable per org).
- SOC 2 Type I audit in month 9; Type II in month 18.
- GDPR-compliant: right to deletion cascade from Document through all Chunks + embeddings.
- API keys encrypted with org-specific KMS keys; never stored in plaintext.

---

## 7. User Experience & Design Principles

### 7.1 Design Principles

| Principle | What It Means in Practice |
|---|---|
| Evidence First | Every AI output shows its sources. Users should never have to "trust" Sightline — they should be able to verify every claim. |
| Decisions, Not Documents | The UI guides users toward a decision or action, not just a summary. Every screen has a clear next step. |
| Speed as Respect | PMs are time-poor. Every interaction should complete in under 10 seconds. If it can't, use streaming to show progress. |
| Transparent Uncertainty | Confidence scores are always visible. "LOW confidence" is shown prominently, not hidden. Honest AI builds trust. |
| Collaborative by Default | Queries, briefs, and workspaces are shareable. Decisions should be visible to the whole team, not siloed in a PM's laptop. |
| Never Fabricate | If evidence doesn't exist, say so. An honest "I don't have enough data on this" is infinitely more valuable than a confident hallucination. |

### 7.2 Core User Flows

**Flow 1: First-Time Onboarding**
1. User signs up (Google OAuth or work email).
2. Guided workspace setup: "What product are you building?" — free text product context provided here.
3. Connect first source: Gong/Zoom recommended, CSV upload as fallback.
4. Sightline processes first batch (async) — estimated time shown.
5. "Your first insights are ready" email + in-app prompt with a suggested starter query.

**Flow 2: Weekly Discovery Session**
1. PM opens Sightline on Monday morning.
2. Dashboard shows: new signals this week, trending pain areas, evidence coverage gaps, competitive digest.
3. PM types or selects a query ("What are the top requests from enterprise customers this month?").
4. Response streams in with recommendation + evidence panel + competitive context.
5. PM clicks "Generate Brief" — brief auto-populates in a right-side panel.
6. PM edits, exports to Linear as an epic, and a Decision Log entry is automatically created. Done in under 10 minutes.

**Flow 3: Competitive Research Session**
1. PM asks: "What do our churned customers say about Productboard?"
2. Sightline retrieves organic mentions from customer calls + external review signals.
3. Response surfaces: specific feature comparisons, switching triggers, pricing mentions.
4. PM generates a "Competitive Brief" — a structured one-pager on a specific competitor.
5. Brief is exported to Notion as a shared competitive intel doc for the team.

**Flow 4: Interview Preparation**
1. PM is preparing for 5 user interviews next week.
2. Opens Interview Guide Generator, selects target segment.
3. Sightline identifies evidence gaps in that segment and generates a targeted guide.
4. PM exports to Notion or PDF, customizes, and walks into the interviews with a research-driven agenda.

**Flow 5: Roadmap Justification**
1. PM types: "How do I justify prioritizing the bulk export feature to my CEO?"
2. Sightline returns: evidence volume, quote density, estimated customer impact, competitive context.
3. PM exports a "Decision Brief" — a one-pager with evidence summary suitable for a leadership review.
4. Decision is logged automatically.

### 7.3 Key UI Components

- **Signal Heatmap** — visual calendar showing ingestion volume and new insight density over time
- **Evidence Drawer** — right-panel showing source quotes for any AI claim; click to play the audio clip
- **Query Bar** — persistent, always-accessible input with query history and suggested prompts
- **Brief Editor** — structured form view of the generated spec; fully editable before export
- **Competitive Panel** — sidebar showing competitor signals relevant to the current query
- **Evidence Coverage Map** — visual showing which product areas have strong vs. thin evidence
- **Decision Timeline** — chronological view of all product decisions with their evidence and outcomes
- **Workspace Switcher** — top-nav toggle for teams with multiple products
- **Confidence Badge** — color-coded indicator (green/yellow/red) on every recommendation

---

## 8. Product Roadmap

### 8.1 Phase Overview

| Phase | Timeline | Milestone | Revenue Goal |
|---|---|---|---|
| 0 — Build | Weeks 1–8 | MVP live: ingestion + query + brief gen | $0 (design partners) |
| 1 — Land | Weeks 9–16 | 10 paying customers; competitive module + interview guide | $100K ARR |
| 2 — Expand | Months 5–9 | Team features; integrations; decision log | $500K ARR |
| 3 — Scale | Months 10–18 | Enterprise tier; SOC2; SSO; advanced analytics | $2.4M ARR |

### 8.2 Phase 0 — MVP Build (Weeks 1–8)

**Sprint 1–2: Foundation**
- Auth, org/user/workspace data model, Supabase setup
- Ingestion pipeline for CSV upload and Zoom transcript webhook
- Basic vector storage in Qdrant

**Sprint 3–4: Core AI**
- Discovery query interface with streaming response
- Evidence citation linking
- Gong OAuth connector

**Sprint 5–6: Brief Generator + Decision Log**
- Feature brief auto-generation from query response
- Brief editor (inline editing)
- Markdown export
- Decision log (basic — auto-create on export)

**Sprint 7–8: Polish & Design Partners**
- Signal heatmap dashboard
- Confidence scoring UI
- Onboarding flow
- Recruit and onboard 3 design partners from YC network

### 8.3 Phase 1 — Land (Weeks 9–16)

- Competitive intelligence module (organic + external signals)
- Interview guide generator
- Coding agent export (Cursor + Claude Code formats)
- Linear integration (epic + issue creation)
- Notion integration (database push)
- Intercom + Zendesk connectors
- Billing integration (Stripe) — launch Starter and Pro tiers

### 8.4 Phase 2 — Expand (Months 5–9)

- Team workspaces — shared queries, collaborative briefs
- Role-based access control (Admin / PM / Viewer)
- Slack connector (extract signals from #feedback and #support channels)
- Product analytics ingestion (Mixpanel / Amplitude events as signals)
- Decision log outcome tracking + prompts
- Roadmap evidence scorer — paste your roadmap, get evidence scores per item
- Weekly digest email — auto-surfaced insights every Monday

### 8.5 Phase 3 — Scale (Months 10–18)

- Enterprise SSO (SAML via WorkOS)
- SOC 2 Type I certification
- Custom AI personas — train Sightline on a company's specific terminology
- Multi-product workspaces with cross-product insight synthesis
- API access — let engineering teams query Sightline programmatically
- Figma plugin — push UI direction from briefs into Figma frames
- Decision quality analytics — which evidence patterns led to good vs. bad outcomes

---

## 9. Pricing & Business Model

### 9.1 Pricing Tiers

| | Starter | Pro | Enterprise |
|---|---|---|---|
| Price | $79/mo (annual) | $299/mo (annual) | Custom ($1,500–$5,000+/mo) |
| Seats | 1 | 5 | Unlimited |
| Signals/mo | 50 calls or docs | 500 calls or docs | Unlimited |
| Connectors | CSV + 1 native | All native connectors | All + custom webhooks |
| Brief exports | Markdown only | Notion + Linear + Jira | All + API access |
| Competitive module | ❌ | ✅ | ✅ |
| Interview guide | ❌ | ✅ | ✅ |
| Decision log | Basic | Full + outcomes | Full + team analytics |
| Agent export | ❌ | ✅ | ✅ + custom format |
| SSO / Audit logs | ❌ | ❌ | ✅ |

### 9.2 Unit Economics (Target State)

| Metric | Target |
|---|---|
| Blended ACV | $8,000 (mix of Starter/Pro/Enterprise) |
| Gross Margin | 78–82% (AI API costs as primary COGS) |
| CAC (PLG channel) | $600–$900 (content + word of mouth) |
| CAC (Outbound) | $2,500–$4,000 |
| Target CAC Payback | < 8 months |
| Target NRR | 115%+ (expansion via seats + signal volume) |
| Target LTV:CAC | > 4:1 at 24 months |

### 9.3 PLG Motion

Sightline is built for a product-led growth entry. The free trial (14 days, all features, one connected source) lets PMs experience the value before involving procurement. The Starter tier acts as a wedge — once a PM gets value, they advocate internally to expand to a team Pro plan.

---

## 10. Success Metrics & Analytics

### 10.1 North Star Metric

**Weekly Active Discovery Sessions** — the number of unique users completing a full query-to-brief cycle in a given week. This metric captures both activation and retention in one number.

### 10.2 Metric Framework

| Layer | Metric | Target (Month 6) | Measurement |
|---|---|---|---|
| Acquisition | Trial signups/week | 50+ | PostHog |
| Activation | Completed first query with evidence | >60% of trials | PostHog funnel |
| Engagement | Queries per active user/week | >5 | PostHog |
| Retention | Week-4 retention (paid) | >75% | Stripe + PostHog |
| Revenue | MRR growth | 20% MoM | Stripe |
| Expansion | Seat expansion rate | >30% of Pro accts within 90 days | Stripe |
| Satisfaction | NPS | >50 | In-app survey |

### 10.3 AI Quality Metrics

- **Evidence precision** — % of cited quotes rated "relevant" by PM in post-query survey (target >85%)
- **Recommendation acceptance rate** — % of briefs where PM keeps the core recommendation unchanged (target >60%)
- **Mean evidence count per query** — average number of unique source citations per response (target >4)
- **Hallucination rate** — quotes that cannot be found in source material (target <1%)
- **Interview guide utilization** — % of generated guides that result in at least one new signal ingested (target >50% at 90 days)
- **Decision outcome rate** — % of logged decisions that receive an outcome note within 90 days (target >40%)

---

## 11. Risks & Mitigations

| Risk | Severity | Description | Mitigation |
|---|---|---|---|
| LLM output quality | HIGH | Hallucinated quotes or poor recommendations erode trust rapidly | Citation grounding (RAG-only responses); confidence scores; user verification UI |
| Data privacy / enterprise blockers | HIGH | Enterprise buyers may block Gong/CRM data leaving their environment | Self-hosted / VPC deployment option in Phase 3; SOC 2 fast-tracked |
| Incumbent competition | MED | Productboard or Notion adds AI synthesis features | Speed + full-stack depth (agent export, competitive module, decision log) creates defensibility |
| AI API cost at scale | MED | LLM costs compress margins if usage explodes | Usage-based signal limits per tier; caching frequent query patterns; Haiku for enrichment |
| Connector dependency | MED | Gong API changes break core ingestion | Multi-connector strategy; CSV fallback always available |
| PLG conversion rate | LOW | Free trials don't convert to paid | Deliberate trial design with "aha moment" within first session; human follow-up for high-intent users |

---

## 12. Launch & GTM Strategy

### 12.1 Pre-Launch (Weeks 1–8)

- Recruit 5 design partners from the YC network. Offer free access for 6 months in exchange for weekly feedback sessions and a willingness to be a public reference.
- Build in public: Weekly Twitter/X threads documenting what you learn from design partners.
- Publish a definitive guide: "The Product Discovery Playbook for AI-First Teams" — SEO-optimized, distributed via PM newsletters (Lenny's Newsletter, Product Hunt Ship).

### 12.2 Launch (Week 9)

- Product Hunt launch — coordinate design partners for early votes and comments.
- Hacker News Show HN post — technical founders respond to every comment live.
- Lenny's Newsletter / The Product Craft — sponsored or earned placement.
- YC company Slack / Bookface — direct outreach to PMs at current and recent YC portfolio companies.

### 12.3 Growth Channels (Priority Order)

| Channel | Priority | Tactics |
|---|---|---|
| Word of mouth / referral | P0 — Critical | PMs talk to each other. Build a referral program: 1 month free per referral that converts. |
| Content / SEO | P0 — Critical | Own "product discovery AI", "AI product manager", "user research synthesis" keywords. 2 posts/week. |
| PM Community presence | P1 — Important | Lenny's community, Mind the Product, SVPG forums. Answer questions genuinely; no spam. |
| Outbound to YC cos. | P1 — Important | Personal email to PMs/founders at YC W23–S25 companies. Highly targeted; 3–5 emails/day. |
| Partnerships | P2 — Later | Cursor, Linear, Notion ecosystem. Co-marketing when product is proven. |

> **YC Application Angle:** Sightline is explicitly in YC's Spring 2026 RFS ("Cursor for Product Managers"). Apply with 3 design partner letters of intent, 2 weeks of usage data showing evidence of value, and a clear "what should we build next?" demo that wows in 2 minutes.

---

*Sightline — AI-Native Product Discovery Platform — PRD v1.1*  
*Internal Use Only*
