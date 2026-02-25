# Sightline

## What This Is

An AI-native product discovery platform ("Cursor for Product Managers") that ingests customer signals — call recordings, support tickets, NPS responses, usage data — and maintains a living, queryable knowledge base. PMs ask natural-language questions and receive evidence-backed recommendations, structured feature briefs with UI direction and data model hints, and complete implementation packages for coding agents.

## Core Value

Every product recommendation must be traceable to customer evidence — no fabricated citations, no unsupported claims. Trust is the product.

## Current Milestone: v1.0 Brief v2 + Ship Ready

**Goal:** Upgrade the brief generator with UI Direction and Data Model Hints, add coding agent export, integrate Stripe billing, and ship a marketing landing page — making Sightline ready for design partners.

**Target features:**
- Brief v2 (UI Direction + Data Model Hints sections)
- Coding Agent Export (full 7-section package, clipboard + .md download)
- Stripe billing (Starter $79/mo + Pro $299/mo)
- Landing page (marketing/waitlist with email capture)

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

- [ ] Brief v2 — UI Direction section
- [ ] Brief v2 — Data Model Hints section
- [ ] Coding agent export (7-section package, clipboard + .md)
- [ ] Stripe billing (Starter + Pro tiers)
- [ ] Landing page (marketing/waitlist, email capture)

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
*Last updated: 2026-02-25 after milestone v1.0 initialization*
