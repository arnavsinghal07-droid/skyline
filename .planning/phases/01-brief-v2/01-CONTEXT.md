# Phase 1: Brief v2 - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the existing brief generator to include two new sections — UI Direction and Data Model Hints — completing the full 7-section brief structure required for the coding agent handoff. Existing v1 briefs must render without errors. Token limit failures must surface gracefully. The coding agent export (Phase 2) and other downstream features depend on this type existing.

</domain>

<decisions>
## Implementation Decisions

### UI Direction presentation
- Grouped cards layout — each screen gets its own card with three buckets: Changes, New Components, Interactions
- Summary + expand by default — show screen name, change count, and first 2 items; click to expand full detail
- Three-bucket categorization matches the existing UIDirection TypeScript type (changes, new_components, interactions)
- Always use cards, even when only 1 screen is affected — consistent presentation regardless of content volume

### Data Model rendering
- SQL DDL format with syntax highlighting — familiar to backend engineers, directly copy-pasteable
- Rationale as inline SQL comments (-- comments directly below each statement) — context travels with the code when copied
- Group related changes by feature, not by table — e.g., "Onboarding tracking" groups the new table + ALTER on users together
- Include obvious index suggestions (CREATE INDEX for foreign keys and commonly queried fields) alongside schema changes

### Evidence grounding UX
- Inline chip + hover for UI Direction — small numbered badge [3 signals · HIGH] next to each change
- Chip shows both signal count and confidence level (HIGH/MED/LOW) — quick read without hovering
- Hover reveals signal previews (customer quotes, usage stats); click expands to full evidence
- Low-evidence UI suggestions included with visible "Low evidence" warning badge — transparent about certainty, PM decides whether to keep
- Data Model Hints use rationale comments only (no evidence chips) — schema changes are derived from the already-grounded UI direction

### Generation experience
- Section-by-section streaming — each brief section streams in progressively (Problem Statement → Solution → User Stories → UI Direction → Data Model Hints → Success Metrics → Out of Scope)
- Token limit errors show partial brief + retry — completed sections displayed, failed section gets clear error banner with suggestions and retry button
- Per-section regenerate — each section gets a regenerate icon so users can re-roll just UI Direction without losing the rest
- v1 backward compatibility — existing v1 briefs render normally with a subtle "Not available — generated before v2" message where new sections would be; no upgrade prompt

### Claude's Discretion
- Loading skeleton design during section streaming
- Exact card styling (shadows, borders, spacing, typography)
- Hover popover positioning and animation
- Error banner copy and retry UX details
- How to detect "obvious" indexes for inclusion

</decisions>

<specifics>
## Specific Ideas

- Evidence chips should feel lightweight and informative — not cluttered. The [3 signals · HIGH] format was chosen for quick scannability
- SQL DDL was chosen over Prisma/TypeScript types because it's universally readable and directly usable by coding agents regardless of ORM
- Per-section regenerate is important because v2 briefs are significantly longer — regenerating the whole brief to fix one section wastes time and API credits
- Feature-grouped data model hints (vs table-grouped) because the PM cares about "why does this field exist?" not "what changed on the users table?"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-brief-v2*
*Context gathered: 2026-02-25*
