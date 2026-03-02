# PRODUCT REQUIREMENTS DOCUMENT
## Sightline — AI-Native Product Discovery Platform
### "Cursor for Product Managers"

**Version:** 1.2  
**Status:** Ready for Engineering  
**Date:** February 2026  
**Author:** Founding Team  
**Confidentiality:** Internal / Seed Investors Only

> **v1.2 Update:** This version incorporates direct analysis of YC's Spring 2026 Request for Startups video on "Cursor for Product Managers." Three new capabilities have been added: UI/UX Proposals, Data Model Hints, and the Signal Loop Closer. Usage Data Ingestion has been elevated to a core MVP feature. The Coding Agent Export has been upgraded to a full implementation package.

---

## 1. Executive Summary

Sightline is an AI-native product discovery platform that closes the gap between user insight and engineering execution. While tools like Cursor and Claude Code have transformed how software is *written*, no system exists to support the full loop of product discovery — from customer signal to shipping decision to outcome measurement.

YC's Spring 2026 RFS describes this opportunity precisely: *"Imagine a tool where you upload customer interviews and product usage data, ask 'What should we build next?' and get the outline of a new feature, complete with an explanation based on customer feedback as to why this is a change worth making. The tool would also propose specific changes to your product's UI, data model, and workflows and would break down the development tasks so that they could be handled by your favorite coding agent."*

Sightline is that tool — and it goes further. It not only generates the implementation package for coding agents, it closes the loop after features ship by monitoring whether the customer pain that prompted the decision actually decreases.

> **Core Value Proposition**
> Upload your customer interviews and usage data. Ask "What should we build next?" Get a prioritized feature brief with customer evidence, UI component proposals, data model hints, and a coding agent export — ready for Cursor or Claude Code to implement. Then track whether it worked.

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

Software development has two phases: figuring out what to build, and building it. AI has dramatically accelerated the second phase. But the first phase — deciding what to build — remains entirely manual, fragmented, and slow. As YC puts it: *"There's no system that supports the full loop of product discovery."*

This is the discovery gap, and it's growing. As engineering velocity increases, product discovery becomes the rate-limiting step for every team.

### 2.2 The Current Workflow Is Broken

| Step | Current Tool(s) | Pain Point |
|---|---|---|
| User research | Gong, Zoom, Otter.ai, Notion | Manual review of hours of recordings |
| Usage analysis | Mixpanel, Amplitude, Looker | Disconnected from qualitative feedback |
| Feedback synthesis | Linear, Productboard, Notion | Subjective grouping, no signal weighting |
| Prioritization | Spreadsheets, gut feeling | No connection to business impact |
| Spec writing | Confluence, Notion, Google Docs | Blank page, hours of writing |
| UI proposal | Figma (manual) | Requires design resource availability |
| Data model design | Whiteboard, ad hoc | Disconnected from the feature rationale |
| Engineering handoff | Jira, Linear | Stripped of the research context |
| Outcome tracking | None | Nobody knows if the decision worked |

### 2.3 Quantified Pain

- PMs spend 12–15 hours per week on manual synthesis and documentation (ProductPlan 2024).
- Decision-to-spec cycles average 3–4 weeks at companies with 10–50 engineers.
- 70% of PMs report roadmap decisions are not traceable back to customer evidence.
- The average startup has 50–200 unreviewed customer calls in Gong at any given time.
- Coding agents (Cursor, Claude Code) are now capable of implementing features from a well-structured prompt — but most briefs lack the UI direction and data model context they need to do so without back-and-forth.

> **The Insight:** The artifact being replaced isn't a PRD — it's the entire discovery-to-implementation workflow. Sightline doesn't generate documents. It closes the loop between what customers say, what you decide to build, and whether it worked.

---

## 3. Target Users & Market

### 3.1 Primary User Personas

**Persona 1: The Founder-PM (Primary Buyer & User)**

| Attribute | Detail |
|---|---|
| Role | Founder or first PM at a 5–40 person startup |
| Company Stage | Seed to Series A ($1M–$15M ARR) |
| Top Jobs-to-Done | Decide what to build next, justify roadmap to investors, hand off to coding agents without long back-and-forth |
| Biggest Frustration | Can't synthesize all user feedback fast enough; coding agents need more context than a vague brief provides |
| Willingness to Pay | $800–$2,000/month for a tool that saves 10+ hours/week and removes ambiguity from agent handoffs |

**Persona 2: The Staff PM at a Growth-Stage Company**

| Attribute | Detail |
|---|---|
| Role | Senior/Staff PM at 50–500 person company |
| Company Stage | Series B+ ($10M–$100M ARR) |
| Top Jobs-to-Done | Run structured discovery programs, synthesize across multiple data sources, build org-wide roadmap alignment |
| Biggest Frustration | Productboard is expensive and shallow; briefs lack the technical depth engineers need |
| Willingness to Pay | $15K–$40K/year for team seat pricing |

**Persona 3: The Technical Founder Without a PM**
Engineers who build what they think is right, but lack a structured way to connect shipping decisions to user pain. They want Sightline to be the PM function they can't afford to hire — and they want its output to feed directly into the coding agents they already use.

### 3.2 Market Sizing

| Market Layer | Size | Basis |
|---|---|---|
| TAM | $28B | Global PM software + research tools + AI productivity |
| SAM | $4.2B | English-language SaaS startups + midmarket product teams |
| SOM (Yr 3) | $120M | ~6,000 companies × $20K ACV |

---

## 4. Product Overview

### 4.1 Core Concept

Sightline is a workspace that understands your product. It ingests every signal your customers generate — call recordings, support tickets, NPS responses, usage events — and maintains a living model of what users need. When a PM asks a question, Sightline doesn't search files. It reasons about your product, proposes exactly what to build and how, and hands it directly to your coding agent.

> **The Mental Model:** Think of Sightline as a senior PM who has read every customer call, analyzed your usage data, knows your product intimately, and can answer "Why should we build this, exactly how should it work, and what does the data model need?" — then hands a complete implementation brief to your engineering agent. And one who follows up 30 days later to tell you if it worked.

### 4.2 Key Differentiators vs. Existing Tools

| Capability | Sightline | Productboard | Dovetail | Notion AI |
|---|---|---|---|---|
| Multi-source ingestion | ✅ Native | ⚠ Partial | ⚠ Partial | ❌ Manual |
| Usage data + qualitative combined | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Evidence-backed recommendations | ✅ Yes | ❌ No | ❌ No | ❌ No |
| UI/UX proposals from evidence | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Data model hints | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Full coding agent export package | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Competitive intelligence | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Decision audit trail | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Signal loop closer (outcome tracking) | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Conversational queries | ✅ Native | ⚠ Limited | ⚠ Limited | ✅ Yes |

---

## 5. Feature Specifications — MVP

The MVP ships eight interconnected modules. Build them in the order listed.

---

### Feature 1: Signal Ingestion Engine

The foundation of Sightline. Processes qualitative customer signals into a structured, queryable knowledge base.

**Connectors (MVP)**
- Gong / Chorus — call recordings + transcripts (OAuth)
- Intercom / Zendesk / Front — support ticket threads
- Google Meet / Zoom — meeting recordings via transcript webhook
- CSV / JSON manual upload — for teams not on these tools

**Processing Pipeline**
1. Transcript received and chunked into semantic segments (400 tokens, 50-token overlap)
2. Each segment tagged: speaker role, sentiment, product area, urgency, feature mention, competitor mentions
3. Entity extraction: specific features, pain point type, use case, workaround behavior
4. Embedded (OpenAI text-embedding-3-large) and stored in Qdrant with full metadata
5. Frequency and recency scoring runs nightly to surface trending pain areas

**Acceptance Criteria**
- Ingests a 60-minute Gong call in under 90 seconds
- Extracts ≥85% of feature mentions (20-call benchmark set)
- Supports batch import of up to 500 historical calls at onboarding
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)

---

### Feature 2: Usage Data Ingestion *(New — elevated from Phase 2)*

Quantitative signals are as important as qualitative ones. A feature request mentioned by 3 customers AND showing 40% drop-off in usage data is a much stronger signal than either alone. Sightline combines both.

**Signal Sources**
- Mixpanel — event streams, funnel data, retention cohorts (OAuth)
- Amplitude — same (OAuth)
- CSV export — for teams not on these tools (columns: event_name, user_id, timestamp, properties)
- Custom webhook — for teams with bespoke analytics

**Processing Pipeline**
1. Usage events normalized into a standard schema: `{event_name, user_segment, count, date, funnel_step}`
2. Drop-off points identified: steps where >20% of users exit a flow
3. Feature adoption rates calculated: % of users who've used a feature at least once in 30 days
4. Stored in `usage_signals` Postgres table (not vector store — this is structured data)
5. Joined with qualitative signals at query time to produce combined evidence

**Response format for usage signals:**
- Displayed separately from quote evidence: "40% of users drop off at the integration setup step"
- Labeled as USAGE DATA to distinguish from customer quotes
- Combined confidence score accounts for both signal types

**Acceptance Criteria**
- Mixpanel CSV import processes 10,000 events in under 30 seconds
- Drop-off points identified automatically for any funnel with ≥3 steps
- Usage signals appear in query responses alongside qualitative evidence
- PM can filter queries to qualitative-only, quantitative-only, or combined

---

### Feature 3: Discovery Query Interface

The primary conversational UI. PMs type natural-language questions and receive structured, evidence-backed answers citing both qualitative and quantitative sources.

**Query Types (MVP)**

| Query Type | Example |
|---|---|
| Discovery | "What should we build next for our enterprise customers?" |
| Pain Analysis | "What are the top 3 reasons users churn in their first 30 days?" |
| Usage + Qualitative | "Where are users dropping off AND complaining about in onboarding?" |
| Validation | "How much evidence do we have for building a Slack integration?" |
| Competitive | "What do users say they wish we did that competitors do better?" |
| Roadmap Check | "Which items on our current roadmap have the most combined evidence?" |

**Response Format — Every answer includes:**
- **Recommendation** — the concrete output
- **Qualitative evidence panel** — 3–5 verbatim source quotes with customer names and timestamps
- **Usage evidence** — relevant drop-off or adoption data (if available)
- **Confidence score** — HIGH / MEDIUM / LOW
- **Dissenting signals** — minority viewpoints that contradict the recommendation
- **Competitive context** — competitor mentions if relevant
- **Suggested follow-up questions**

**Acceptance Criteria**
- Response latency ≤ 8 seconds for queries against a corpus of 500 processed calls
- Evidence citations are traceable — clicking a quote opens the source at the timestamp
- Query history saved and searchable per workspace
- Supports multi-turn conversation context (up to 12 turns per session)

---

### Feature 4: Feature Brief Generator v2

Converts a discovery query answer into a complete implementation package — not just a spec, but everything a coding agent needs to implement the feature without asking clarifying questions.

**Brief Structure (v2 — Full)**

**1. Problem Statement**
User pain in plain language with source evidence (qualitative + usage combined)

**2. Proposed Solution**
High-level description of the feature or change

**3. User Stories**
Auto-generated in "As a [role], I want [action] so that [outcome]" format

**4. UI Direction** *(New in v2)*
Screen-by-screen, component-by-component description of required changes. Example:
```
Onboarding Screen:
- Add a 3-step progress indicator at the top (steps: Connect Source, Ask First Question, Review Insights)
- New component: <OnboardingProgress currentStep={number} />
- Replace the current blank canvas with a guided prompt: "What product are you building?"
- Add a "Skip for now" link that logs the skip event and advances to step 2
```

**5. Data Model Hints** *(New in v2)*
Specific table and field suggestions with types and rationale. Example:
```sql
-- Add to users table
onboarding_step INTEGER DEFAULT 0,           -- Tracks current step (0=not started, 3=complete)
onboarding_completed_at TIMESTAMP,           -- NULL until onboarding finished
onboarding_skipped BOOLEAN DEFAULT FALSE     -- Whether user skipped any steps
```

**6. Success Metrics**
Suggested KPIs tied to the stated problem

**7. Out of Scope**
Explicitly states what this brief does NOT include

**Export Options**
- Notion — direct API push into connected Notion database
- Linear / Jira — create epic with user stories as child issues
- Markdown — raw export for any tool
- **Coding Agent Export** — full implementation package (see Feature 5)

**Acceptance Criteria**
- UI Direction generated for ≥90% of briefs without requiring manual input
- Data Model Hints generated for ≥80% of briefs
- UI Direction references specific component names, not vague descriptions
- Data Model Hints include field types and rationale for every suggested field
- PM can edit any section inline before exporting

---

### Feature 5: Coding Agent Export — Full Implementation Package *(Upgraded)*

The final mile. Packages the complete brief into a structured prompt that a coding agent (Cursor, Claude Code) can implement without asking clarifying questions. This is the feature that makes Sightline indispensable to technical founders.

**Export Package Contents**

```
1. CONTEXT BLOCK
   - Product background and existing relevant components
   - Tech stack and constraints
   - Related existing features to be aware of

2. FEATURE DESCRIPTION
   - From the brief's proposed solution

3. ACCEPTANCE CRITERIA
   - Converted to testable, specific requirements

4. UI DIRECTION
   - Screen-by-screen component changes
   - New components to create with suggested props
   - User interactions and state transitions

5. DATA MODEL HINTS
   - Exact SQL for new fields/tables
   - Rationale for each change
   - Migration considerations

6. EDGE CASES
   - From Open Questions and dissenting signals
   - Error states and empty states

7. SUGGESTED FILE PATHS
   - Where new components/routes should live
   - Based on the project's existing structure
```

**Supported Targets**
- Cursor (paste into composer, or via Cursor Rules export)
- Claude Code (formatted as a CLAUDE.md task with all sections)
- GitHub Issues (structured issue with full context)
- Generic JSON — for any agentic pipeline

**Acceptance Criteria**
- Export generated in under 5 seconds
- Exported prompt, when used in Cursor on a test codebase, produces a working stub implementation (benchmark: 5 predefined test scenarios)
- UI Direction in export is specific enough that a coding agent doesn't need to ask "what should this look like?"
- Data Model Hints in export are copy-pasteable SQL, not descriptions

---

### Feature 6: Competitive Intelligence Module

Surfaces competitive signals from two sources: your own customer calls (organic) and external review platforms (scheduled).

**Signal Sources**
- **Organic:** Competitor mentions extracted from customer calls during the enrich step
- **External:** Weekly scrapes of G2, Capterra, and App Store reviews for a defined competitor list

**Query Types**
- "What do our customers say about [Competitor X]?"
- "What features do churned customers say [Competitor X] does better?"
- "What's the weekly competitive digest?"

**Acceptance Criteria**
- Competitor mentions extracted with ≥80% precision
- Weekly external scan completes in under 10 minutes for up to 10 competitors
- Competitive context appears automatically in relevant Discovery Query responses

---

### Feature 7: Interview Guide Generator

Closes the research loop. Identifies evidence gaps and generates targeted interview guides to fill them.

**How it works**
1. Sightline identifies: topics with LOW confidence, contradictory signals, product areas with no coverage in 90 days
2. PM selects a target segment
3. Claude generates a structured guide with opening questions, deep-dive probes, and hypothesis-testing questions

**Interview Guide Structure**
- Context brief — what Sightline already knows and the gaps
- Opening questions (3–4)
- Core discovery questions (5–7) — targeted to evidence gaps
- Hypothesis-testing questions (3–4)
- Closing questions — usage patterns, willingness to pay signals

---

### Feature 8: Signal Loop Closer *(New — directly from YC vision)*

The most defensible long-term feature. After a decision is logged and a feature ships, Sightline monitors whether the underlying customer pain actually decreases. This closes the full product loop and creates the learning flywheel that no competitor can replicate quickly.

**How it works**
1. When a decision is logged, Sightline records the pain area tags from the supporting evidence
2. PM marks the feature as shipped (or Sightline detects it via Linear/Jira webhook)
3. At 30, 60, and 90 days post-ship, Sightline re-queries the corpus for signals about that pain area
4. It compares signal volume and sentiment before vs. after the ship date
5. It surfaces: "Since shipping [feature], signals about [pain area] decreased by X% / sentiment improved by Y points"
6. This outcome is automatically attached to the decision log entry and feeds back into confidence scoring for future similar decisions

**Why this matters for YC:**
This is the feature that turns Sightline from a productivity tool into a learning system. Every decision logged, every outcome tracked, every signal pattern recorded — over time Sightline learns which evidence patterns actually predict good product outcomes. That data asset is impossible to replicate.

**Acceptance Criteria**
- Signal loop check runs automatically 30 days after a feature is marked shipped
- PM receives in-app notification with the loop check results
- Loop check data is displayed on the Decision Log entry
- Over time, Sightline surfaces patterns: "Features with 5+ qualitative signals and >30% drop-off data have historically resolved the pain 78% of the time"

---

### Feature 9: Decision Log

Institutional memory for product decisions. Every brief that gets exported creates a Decision Log entry automatically.

**Decision Entry**
- Title and decision made
- Rationale with evidence IDs
- Confidence level at time of decision
- Who made it and when
- Link to original brief
- Outcome (added later by PM or auto-populated by Signal Loop Closer)
- Signal Loop Check results (auto-populated 30/60/90 days post-ship)

**Query Interface**
- "Why did we build [feature]?" — returns the decision entry with evidence
- "Which past decisions had LOW confidence that we should revisit?"
- "Which of our decisions have been validated by the signal loop?"

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | SSR for SEO, RSC for performance |
| State Management | Zustand + React Query | Lightweight client state + server cache sync |
| Backend API | Node.js + Fastify + tRPC | Type-safe end-to-end, high throughput |
| AI / LLM | Anthropic Claude API (claude-sonnet-4-6) | Best reasoning, long context (200K tokens) |
| Embeddings | OpenAI text-embedding-3-large | Best retrieval quality at scale |
| Vector DB | Qdrant | High-performance ANN search, metadata filtering |
| Primary Database | PostgreSQL (Supabase) | Relational structure, auth, realtime |
| Background Jobs | BullMQ + Redis | Async ingestion pipeline, retry handling |
| File Storage | Cloudflare R2 | Zero egress cost, S3-compatible |
| Auth | Supabase Auth + WorkOS (SSO) | Social login for PLG, enterprise SSO later |
| Deployment | Vercel (frontend) + Fly.io (backend) | Zero-ops, global edge |
| Observability | Sentry + PostHog + Datadog | Error tracking, product analytics, infra |

### 6.2 Data Model (Core Entities)

| Entity | Key Fields | Notes |
|---|---|---|
| Organization | id, name, plan, settings | Top-level tenant |
| User | id, org_id, role, email | Roles: Admin, PM, Viewer |
| Workspace | id, org_id, name, product_context | Scopes signals + queries |
| Source | id, type, status, connector_config | Gong, Zendesk, Mixpanel, CSV, etc. |
| Document | id, source_id, type, metadata, raw_url | Each call/ticket/export |
| Chunk | id, doc_id, embedding_id, text, tags, sentiment | Unit of retrieval |
| UsageSignal | id, org_id, event_name, count, date, funnel_step | Quantitative signals |
| Query | id, workspace_id, user_id, text, response_json | Full conversation history |
| Brief | id, query_id, content_json, ui_direction_json, data_model_hints_json, exports[] | Full brief v2 |
| CompetitorSignal | id, org_id, competitor, source, content, date | Competitive data |
| Decision | id, brief_id, workspace_id, user_id, title, evidence_ids[], confidence, outcome, signal_loop_check_json | Decision log |

### 6.3 Security & Compliance

- Multi-tenant data isolation via Postgres RLS — all queries auto-scoped to `org_id`
- PII handling: customer names/emails optionally pseudonymized at ingestion
- SOC 2 Type I audit in month 9; Type II in month 18
- GDPR-compliant: right to deletion cascade from Document through all Chunks + embeddings
- API keys encrypted with org-specific KMS keys

---

## 7. User Experience & Design Principles

### 7.1 Design Principles

| Principle | What It Means in Practice |
|---|---|
| Evidence First | Every AI output shows its sources. Users should never have to "trust" Sightline. |
| Implementation-Ready | Every brief should be complete enough for a coding agent to implement without asking clarifying questions. |
| Speed as Respect | PMs are time-poor. Every interaction under 10 seconds. Use streaming for longer operations. |
| Transparent Uncertainty | Confidence scores always visible. "LOW confidence" shown prominently. |
| Close the Loop | Every decision should eventually have an outcome. Sightline prompts for this proactively. |
| Never Fabricate | If evidence doesn't exist, say so. Honest "I don't have enough data" beats confident hallucination. |

### 7.2 Core User Flows

**Flow 1: Discovery → Brief → Agent Export (The Core Loop)**
1. PM opens Sightline, types "What should we build next?"
2. Response streams in: recommendation + qualitative evidence + usage data + confidence score
3. PM clicks "Generate Brief" — full brief generates in right panel including UI Direction and Data Model Hints
4. PM reviews, edits if needed, clicks "Export to Claude Code"
5. Complete implementation package copied to clipboard, ready to paste into coding agent
6. Decision logged automatically

**Flow 2: Post-Ship Loop Check**
1. PM marks a decision as shipped in the Decision Log
2. 30 days later: Sightline sends in-app notification "Loop check ready for [feature]"
3. PM opens notification: "Signals about onboarding friction decreased 43% since shipping. Sentiment improved from -0.4 to +0.2."
4. Outcome auto-attached to decision log entry

**Flow 3: Usage + Qualitative Combined Query**
1. PM asks: "Where are users dropping off AND what are they saying about it?"
2. Sightline returns: drop-off funnel data + qualitative quotes about those exact steps
3. Combined confidence score accounts for both signal types
4. Brief generated with UI changes targeting the specific drop-off points

---

## 8. Product Roadmap

### 8.1 Phase Overview

| Phase | Timeline | Milestone | Revenue Goal |
|---|---|---|---|
| 0 — Build | Weeks 1–8 | MVP: ingestion + query + brief v2 + agent export | $0 (design partners) |
| 1 — Land | Weeks 9–16 | 10 paying customers; competitive + interview guide | $100K ARR |
| 2 — Expand | Months 5–9 | Usage data; signal loop closer; team features | $500K ARR |
| 3 — Scale | Months 10–18 | Enterprise; SOC2; SSO; signal quality analytics | $2.4M ARR |

### 8.2 Phase 0 — MVP Build (Weeks 1–8)

**Sprint 1–2: Foundation** ✅ Done
- Auth, org/user/workspace data model, Supabase
- CSV ingestion pipeline
- Basic vector storage in Qdrant

**Sprint 3–4: Core AI** ✅ Done
- Discovery query interface with streaming
- Evidence citation linking
- Feature brief generator

**Sprint 5–6: Brief v2 + Agent Export** ← Current
- UI Direction section in brief generator
- Data Model Hints section in brief generator
- Coding agent export full package (Cursor + Claude Code)
- Brief page and Decision Log

**Sprint 7–8: Polish & Design Partners**
- Onboarding flow ✅ Done
- Signal heatmap dashboard
- Stripe billing
- Landing page
- Recruit 3 design partners from YC network

### 8.3 Phase 1 — Land (Weeks 9–16)

- Competitive intelligence module
- Interview guide generator
- Linear + Notion integrations
- Intercom + Zendesk connectors
- Gong OAuth connector
- Weekly PM digest email
- Roadmap evidence scorer

### 8.4 Phase 2 — Expand (Months 5–9)

- Usage data ingestion (Mixpanel / Amplitude)
- Signal loop closer (post-ship monitoring)
- Team workspaces — shared queries, collaborative briefs
- Slack connector (signals from #feedback and #support)
- Decision quality analytics — which evidence patterns led to good outcomes
- Role-based access control

### 8.5 Phase 3 — Scale (Months 10–18)

- Enterprise SSO (SAML via WorkOS)
- SOC 2 Type I certification
- Signal quality scoring — Sightline learns which evidence patterns predict good decisions
- Multi-product workspaces
- API access for engineering teams
- Figma plugin — push UI direction from briefs into Figma frames

---

## 9. Pricing & Business Model

### 9.1 Pricing Tiers

| | Starter | Pro | Enterprise |
|---|---|---|---|
| Price | $79/mo (annual) | $299/mo (annual) | Custom ($1,500–$5,000+/mo) |
| Seats | 1 | 5 | Unlimited |
| Signals/mo | 50 calls or docs | 500 calls or docs | Unlimited |
| Usage data ingestion | ❌ | ✅ | ✅ |
| UI Direction in briefs | ✅ | ✅ | ✅ |
| Data Model Hints | ✅ | ✅ | ✅ |
| Agent export | ❌ | ✅ | ✅ + custom format |
| Competitive module | ❌ | ✅ | ✅ |
| Signal loop closer | ❌ | ✅ | ✅ |
| Decision log | Basic | Full + outcomes | Full + team analytics |
| SSO / Audit logs | ❌ | ❌ | ✅ |

---

## 10. Success Metrics

### 10.1 North Star Metric

**Weekly Active Discovery Sessions** — unique users completing a full query-to-brief cycle per week.

### 10.2 Metric Framework

| Layer | Metric | Target (Month 6) |
|---|---|---|
| Acquisition | Trial signups/week | 50+ |
| Activation | Completed first query with evidence | >60% of trials |
| Engagement | Queries per active user/week | >5 |
| Retention | Week-4 retention (paid) | >75% |
| Revenue | MRR growth | 20% MoM |
| Loop Closure | Decisions with outcomes logged | >40% within 90 days |

### 10.3 AI Quality Metrics

- **Evidence precision** — % of cited quotes rated relevant by PM (target >85%)
- **Recommendation acceptance rate** — % of briefs where PM keeps core recommendation (target >60%)
- **UI Direction usability** — % of exports used in coding agents without modification (target >50%)
- **Hallucination rate** — quotes that can't be found in source material (target <1%)
- **Signal loop accuracy** — % of loop checks where PM agrees with Sightline's outcome assessment (target >70%)

---

## 11. The YC Pitch — Two Minutes

The demo that wins a YC interview:

1. **Upload** — drag in a CSV of 20 customer feedback entries (30 seconds)
2. **Ask** — type "What should we build next?" (8 seconds to response)
3. **Show** — recommendation with 3 customer quotes, HIGH confidence badge, usage drop-off data
4. **Generate** — click "Generate Brief" — UI Direction and Data Model Hints appear alongside the spec
5. **Export** — click "Export to Claude Code" — show the complete implementation package
6. **Paste** — open Cursor, paste the export, watch it start implementing

Total demo time: under 2 minutes. Every step is something competitors can't do. The UI Direction and Data Model Hints are the moments that make engineers in the room lean forward — because they immediately understand that this closes the loop between discovery and implementation.

**The line that wins the room:**
*"Every other PM tool stops at the brief. We go all the way to the coding agent — and then we come back 30 days later to tell you if it worked."*

---

*Sightline — AI-Native Product Discovery Platform — PRD v1.2*
*Internal Use Only*
