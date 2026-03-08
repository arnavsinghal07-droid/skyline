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
- ✓ Brief v2 — UI Direction section with evidence-grounded screen/component changes — v1.0
- ✓ Brief v2 — Data Model Hints section with typed field suggestions and rationale — v1.0
- ✓ Brief v2 — backward compatibility with v1 briefs — v1.0
- ✓ Brief v2 — token limit error handling (structured error instead of truncated JSON) — v1.0
- ✓ Coding agent export — 7-section package (Context, Feature, Criteria, UI, Data Model, Edge Cases, File Paths) — v1.0
- ✓ Coding agent export — clipboard copy and .md download — v1.0
- ✓ Stripe billing — Starter ($79/mo) and Pro ($299/mo) via hosted checkout — v1.0
- ✓ Stripe billing — webhook idempotency, customer portal, plan-gated brief generation — v1.0
- ✓ Stripe billing — billing page with plan and usage display — v1.0
- ✓ Waitlist — email capture with Resend confirmation — v1.0
- ✓ Competitive Core — competitor mention extraction from customer signals — v2.0 (Phase 5)
- ✓ Competitive Core — G2/Capterra scraping + CSV fallback with Haiku signal extraction — v2.0 (Phase 5)
- ✓ Competitive Core — separate competitive corpus, labeled in evidence panel — v2.0 (Phase 5)

### Active

<!-- Current scope. Building toward these. -->

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

- Enterprise SSO (SAML) — not needed for design partners
- Signal heatmap dashboard — deferred, not critical for current milestones
- Usage data ingestion (Mixpanel/Amplitude) — deferred to future milestone
- Interview guide generator — deferred to future milestone
- Signal loop closer — deferred to future milestone
- Weekly PM digest email — deferred to future milestone
- GitHub Issues / JSON export targets — clipboard + .md sufficient for now

## Context

- Next.js 15 monorepo with Route Handlers, Supabase (Postgres + Auth), Qdrant vector DB
- RAG pipeline: receive → transcribe → chunk → enrich → embed → index; query: retrieve → rerank → reason → format
- Brief generator produces full 7-section v2 briefs: Problem Statement, Proposed Solution, User Stories, UI Direction, Data Model Hints, Success Metrics, Out of Scope
- Coding agent export generates complete implementation packages from v2 briefs
- Stripe billing live with Starter ($79/mo, 10 briefs) and Pro ($299/mo, unlimited) plans
- Competitive intelligence core shipped: competitor tracking, G2/Capterra scraping, CSV fallback, evidence panel integration
- ~15,000 LOC TypeScript across 86+ files
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
| Starter + Pro tiers only for v1.0 | Enterprise is contact sales — simplifies billing implementation | ✓ Good |
| Clipboard + .md for agent export | Sufficient for design partners; avoid over-engineering export targets | ✓ Good |
| Waitlist landing page (not full conversion) | Get signups flowing before billing is battle-tested | ✓ Good |
| Postgres-backed job queue for scraping | No Redis/BullMQ infrastructure needed at this scale | ✓ Good |
| Separate Qdrant collection for competitive data | Clean corpus isolation, labeled evidence | ✓ Good |
| CSV fallback for G2/Capterra | Scraping unstable behind Cloudflare — CSV gives same extraction | ✓ Good |

---
*Last updated: 2026-03-08 after v1.0 milestone completion*
