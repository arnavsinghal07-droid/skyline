# Milestones: Sightline

## Pre-GSD Work (Sprint 1-4)

Shipped before GSD planning was introduced. Captured as validated requirements in PROJECT.md.

**Capabilities shipped:**
- Monorepo scaffold (Next.js 15, Tailwind, Supabase SSR)
- Prisma schema + Supabase (9 tables, RLS)
- Auth (Supabase magic link)
- CSV ingestion pipeline
- Discovery query interface (streaming, evidence, confidence)
- Feature brief generator (saves to DB)
- Briefs page with Log Decision
- Decision log with outcome tracking
- Onboarding flow (3-step)

---

## v1.0 — Brief v2 + Ship Ready ✅ SHIPPED

**Shipped:** 2026-03-08
**Timeline:** 9 days (2026-02-24 → 2026-03-05)
**Phases:** 1-4 (4 phases, 8 plans)
**Files:** 86 files changed, +14,852 / -1,112 lines
**Git range:** `feat(01-01)` → `feat(04-02)` + polish commits

### Key Accomplishments

1. Brief v2 with evidence-grounded UI Direction and Data Model Hints sections
2. 7-section coding agent export package with clipboard copy and .md download
3. Stripe billing — checkout, webhooks, customer portal, plan-gated brief generation
4. Per-section brief regeneration with live state patching
5. Waitlist backend with Resend email confirmation
6. Landing page with waitlist form and screenshot tabs

### Known Gaps

- **LAND-01**: Marketing landing page with hero section, value proposition, and primary CTA — Phase 4 frontend not fully executed
- **LAND-03**: Product screenshots on landing page — not implemented
- **LAND-04**: Pricing section on landing page with tier comparison — not implemented

### Tech Debt

- BRIEF-03 checkbox was stale in REQUIREMENTS.md (tracking inconsistency, code is complete)
- Pre-existing TypeScript errors in `sources/page.tsx:301` and `api/sources/upload/route.ts:121`
- Hardcoded `onboarding@resend.dev` sender — needs verified Resend domain
- Anthropic SDK called directly from `apps/` instead of `packages/ai/client.ts` (pre-existing)
- Usage increment is non-atomic (read-then-write) — acceptable at design partner scale
- `briefs/page.tsx` fetches billing status but no UpgradeGate at limit (UX gap)

### Archives

- [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)
- [v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md)

---
*Last updated: 2026-03-08 after v1.0 milestone completion*

