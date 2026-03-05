# Sightline

## What This Is

An AI-native product discovery platform ("Cursor for Product Managers") that ingests customer signals — call recordings, support tickets, NPS responses, usage data — and maintains a living, queryable knowledge base. PMs ask natural-language questions and receive evidence-backed recommendations, structured feature briefs with UI direction and data model hints, and complete implementation packages for coding agents.

## Core Value

Every product recommendation must be traceable to customer evidence — no fabricated citations, no unsupported claims. Trust is the product.

## Current Milestone: v2.0 Competitive Intelligence + Deck Generator

**Goal:** Add competitive intelligence (internal signal extraction + external review scraping) and a full deck generation system (one-click from artifacts + custom builder with shareable links) — expanding Sightline from discovery tool to PM command center.

**Target features:**
- Competitive Intelligence — extract competitor mentions from customer calls, scrape G2/Capterra reviews, gap scoring, weekly digest
- Deck Generator v1 — one-click from any Sightline artifact (brief, query, decision, competitive digest), PPTX + PDF export, evidence tracing
- Deck Generator v2 — custom builder, Google Slides export, shareable web link (public or authenticated), interactive evidence drill-down

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Monorepo scaffold (Next.js 15, Tailwind, Supabase SSR) — Sprint 1-2
- ✓ Prisma schema + Supabase (9 tables, RLS enabled) — Sprint 1-2
- ✓ Auth (Supabase magic link) — Sprint 1-2
- ✓ CSV ingestion pipeline (upload, signals saved to DB) — Sprint 1-2
- ✓ Discovery query interface (streaming, evidence panel, confidence score) — Sprint 3-4
- ✓ Feature brief generator (saves to DB) — Sprint 3-4
- ✓ Briefs page (full brief panel with Log Decision) — Sprint 3-4
- ✓ Decision log (timeline with outcome tracking) — Sprint 3-4
- ✓ Onboarding flow (3-step, creates org/user/workspace) — Sprint 7-8

### Active

<!-- Current scope. Building toward these. -->

- [ ] Competitive Intelligence — extract competitor mentions from customer calls during enrichment
- [ ] Competitive Intelligence — scrape G2/Capterra reviews, extract pain points and switching reasons
- [ ] Competitive Intelligence — gap scoring (competitor weaknesses vs feature backlog)
- [ ] Competitive Intelligence — weekly competitive digest
- [ ] Deck Generator v1 — one-click generation from any Sightline artifact
- [ ] Deck Generator v1 — PPTX + PDF export with evidence tracing
- [ ] Deck Generator v2 — custom builder with slide reordering and inline editing
- [ ] Deck Generator v2 — Google Slides export
- [ ] Deck Generator v2 — shareable web link (public or authenticated, owner chooses)
- [ ] Deck Generator v2 — interactive evidence drill-down on web viewer

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Enterprise SSO (SAML) — Phase 3, not needed for design partners
- Signal heatmap dashboard — Deferred, not critical for v1.0
- Usage data ingestion (Mixpanel/Amplitude) — Phase 2
- Competitive intelligence module — Phase 1
- Interview guide generator — Phase 1
- Signal loop closer — Phase 2
- Weekly PM digest email — Phase 1
- GitHub Issues / JSON export targets — Clipboard + .md sufficient for v1.0

## Context

- Existing codebase is a Next.js 15 monorepo with Fastify + tRPC backend, Supabase (Postgres + Auth), Qdrant vector DB
- RAG pipeline: receive → transcribe → chunk → enrich → embed → index; query: retrieve → rerank → reason → format
- Brief generator currently produces: Problem Statement, Proposed Solution, User Stories, Success Metrics, Out of Scope — missing UI Direction and Data Model Hints
- PRD v1.2 defines the full brief structure including UI Direction and Data Model Hints types
- Target user: Founder-PM at Seed–Series A startup, already using Cursor/Claude Code for engineering
- YC Spring 2026 RFS explicitly describes this product opportunity

## Constraints

- **Tech stack**: Next.js 15, tRPC, Supabase, Qdrant, Anthropic Claude — established, don't change
- **AI models**: claude-sonnet-4-6 for reasoning/briefs, claude-haiku-4-5-20251001 for enrichment — per CLAUDE.md
- **No inline prompts**: All prompts in packages/ai/prompts/ as typed constants
- **No direct Anthropic SDK in apps/**: Always through packages/ai/client.ts
- **RLS enforcement**: All queries scoped to org_id via Postgres RLS
- **No HTML forms**: Controlled React components with onClick/onChange handlers

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for auth + DB | PLG motion needs magic link + social login; Postgres for relational data | ✓ Good |
| Qdrant for vector search | High-performance ANN with metadata filtering | ✓ Good |
| tRPC for API layer | Type-safe end-to-end, good DX | ✓ Good |
| Starter + Pro tiers only for v1.0 | Enterprise is contact sales — simplifies billing implementation | — Pending |
| Clipboard + .md for agent export | Sufficient for design partners; avoid over-engineering export targets | — Pending |
| Waitlist landing page (not full conversion) | Get signups flowing before billing is battle-tested | — Pending |

---
*Last updated: 2026-03-04 after milestone v2.0 initialization*
