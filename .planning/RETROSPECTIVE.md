# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Brief v2 + Ship Ready

**Shipped:** 2026-03-08
**Phases:** 4 | **Plans:** 8 | **Timeline:** 9 days

### What Was Built
- Brief v2 with evidence-grounded UI Direction and Data Model Hints sections
- 7-section coding agent export (clipboard + .md download)
- Stripe billing with checkout, webhooks, customer portal, plan-gated generation
- Per-section brief regeneration with live state patching
- Waitlist backend with Resend email confirmation
- Landing page (partial — waitlist form + screenshot tabs, missing full marketing page)

### What Worked
- Phase-by-phase execution kept scope tight — each phase had clear success criteria
- Defense-in-depth pattern (v2 guards on both client and server) prevented integration bugs
- Clipboard copy via `.then()` (not async/await) preserved user gesture context across browsers
- Manual SQL syntax highlighting avoided a library dependency while covering all DDL token types
- Idempotent webhook handling (Stripe event dedup) worked correctly from first implementation

### What Was Inefficient
- Phase 4 (Landing Page) was not fully executed — 04-02 frontend plan left incomplete, creating known gaps
- BRIEF-03 checkbox in REQUIREMENTS.md was stale (code was complete but tracking lagged)
- Some pre-existing TypeScript errors in `sources/` were never addressed and carried through
- Anthropic SDK direct usage from `apps/` (architectural deviation from CLAUDE.md) was not corrected

### Patterns Established
- `isV2Brief()` guard pattern for backward compatibility across brief versions
- Panel replacement pattern (state machine swaps content in same container)
- Fire-and-forget email pattern (async send without await, errors caught internally)
- Admin client for unauthenticated-visitor writes (service-role bypasses RLS)
- Inline gate pattern (UpgradeGate replaces button, no modal/dialog)

### Key Lessons
1. **Complete all plans before moving to next milestone** — Phase 4 incomplete created tech debt that persists
2. **Keep requirements checkboxes in sync with implementation** — stale tracking creates confusion during audits
3. **Token limit handling must be explicit** — stop_reason check before JSON.parse prevents silent truncation failures
4. **Evidence count must be grounded** — signal_count capped at evidence.length prevents hallucinated counts

### Cost Observations
- Model mix: ~70% sonnet (reasoning/briefs), ~30% haiku (enrichment/tagging/export)
- Sessions: Multiple across 9 days
- Notable: Per-section regeneration uses haiku for enrichment, keeping costs low for iterative refinement

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 9 days | 4 | First milestone with GSD planning — established phase/plan/summary workflow |

### Cumulative Quality

| Milestone | Files Changed | Lines Added | Known Gaps |
|-----------|---------------|-------------|------------|
| v1.0 | 86 | +14,852 | 3 (LAND-01/03/04) |

### Top Lessons (Verified Across Milestones)

1. Phase-by-phase execution with clear success criteria keeps scope manageable
2. Defense-in-depth (client + server guards) prevents integration bugs at boundaries
