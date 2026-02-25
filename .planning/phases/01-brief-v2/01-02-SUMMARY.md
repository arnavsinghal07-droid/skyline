---
phase: 01-brief-v2
plan: 02
subsystem: ui
tags: [react, typescript, nextjs, brief-ui, evidence-chips, syntax-highlighting]

# Dependency graph
requires: [01-brief-v2-01]
provides:
  - UIDirectionSection component with expand/collapse screen cards and three-bucket layout
  - DataModelSection component with manual SQL DDL syntax highlighting
  - EvidenceChip component with signal count badge and hover popover
  - Stagger reveal animation (200ms fadeInUp) for brief sections
  - Per-section regeneration UX wired to /api/briefs/regenerate-section
  - v1 backward compatibility guards on both query and briefs pages
affects: [phase-2-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual CSS token coloring for SQL DDL — 8 token types, no library dependency"
    - "Stagger reveal via CSS keyframe animation (fadeInUp) triggered by setInterval counter"
    - "Evidence chip popover opens upward (bottom-full) to avoid scroll container clipping"
    - "Per-section regenerate patches local state via onBriefUpdate callback prop"

key-files:
  created:
    - src/components/briefs/UIDirectionSection.tsx
    - src/components/briefs/DataModelSection.tsx
    - src/components/briefs/EvidenceChip.tsx
  modified:
    - src/app/(dashboard)/query/page.tsx
    - src/app/(dashboard)/briefs/page.tsx
    - src/app/globals.css

key-decisions:
  - "Popover opens upward (bottom-full) not downward — avoids clipping by BriefPanel scroll container"
  - "Stagger interval 200ms with fadeInUp 0.35s ease-out — smoother than instant 100ms pop-in"
  - "Brief panel width 540px (up from 440px) — DDL blocks need horizontal room"
  - "Per-section regenerate scoped to query page only — saved briefs page has no regenerate buttons"
  - "v1 backward compat: 'Not available — generated before v2' message, not hidden sections"

patterns-established:
  - "animate-fade-in-up CSS class for stagger reveal pattern"
  - "SectionWithRegen wrapper for brief sections with regenerate icon"

requirements-completed: [BRIEF-01, BRIEF-02, BRIEF-03]

# Metrics
duration: 8min
completed: 2026-02-25
---

# Phase 1 Plan 02: Brief v2 Frontend Summary

**Three new brief components (UIDirectionSection, DataModelSection, EvidenceChip) wired into query and briefs pages with stagger reveal, per-section regeneration, and v1 backward compatibility**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-25T20:16:00Z
- **Completed:** 2026-02-25T20:24:00Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments
- Built UIDirectionSection with expand/collapse screen cards, three-bucket layout (Changes with evidence chips, New Components pills, Interactions bullets)
- Built DataModelSection with manual SQL DDL syntax highlighting (blue keywords, amber types, purple functions, italic comments) — no library dependency
- Built EvidenceChip with [N signals / CONFIDENCE] badge, low-evidence warning variant, and upward-opening hover popover with signal quote previews
- Wired all three components into BriefPanel (query page) with 200ms stagger fadeInUp reveal and 7-row skeleton loading
- Added per-section regenerate icons calling /api/briefs/regenerate-section and patching local state
- Added v2 sections to BriefDetail (briefs page) with v1 backward compatibility guards
- TOKEN_LIMIT error shows specific truncation message in BriefPanel

## Task Commits

1. **Task 1: Create UIDirectionSection, DataModelSection, and EvidenceChip components** - `9b8557b` (feat)
2. **Task 2: Wire v2 sections into BriefPanel and BriefDetail** - `4f62e3f` (feat)
3. **Task 3: Human verification** - `f16763a` (fix: fade-in + popover), `98c4937` (fix: wider panel)

## Files Created/Modified
- `src/components/briefs/UIDirectionSection.tsx` - Screen cards with expand/collapse, evidence chips per change, New Components pills, Interactions bullets
- `src/components/briefs/DataModelSection.tsx` - SQL DDL syntax highlighting with feature group headers
- `src/components/briefs/EvidenceChip.tsx` - Signal count badge with hover popover, low-evidence warning variant
- `src/app/(dashboard)/query/page.tsx` - BriefPanel with 7 v2 sections, stagger reveal, skeleton loading, per-section regenerate, TOKEN_LIMIT error handling
- `src/app/(dashboard)/briefs/page.tsx` - BriefDetail with v2 sections and v1 backward compatibility guards
- `src/app/globals.css` - fadeInUp keyframe animation

## Decisions Made
- Evidence chip popover opens upward to avoid scroll container clipping (user feedback fix)
- Stagger reveal uses 200ms interval + 0.35s CSS fadeInUp for smooth appearance (user feedback fix)
- Brief panel widened from 440px to 540px for DDL readability (user feedback)
- Per-section regenerate on query page only — saved briefs are read-only
- v1 briefs show "Not available — generated before v2" message for new sections

## Deviations from Plan

- Stagger interval changed from 100ms to 200ms with CSS fade animation (user feedback — 100ms was "blippy")
- Evidence chip popover changed from top-full to bottom-full positioning (user feedback — popover was clipped)
- Brief panel widened from 440px to 540px (user feedback — DDL sections needed more horizontal room)

## Issues Encountered
- Evidence chip popover was clipped by BriefPanel's overflow-hidden and overflow-y-auto containers — fixed by opening upward and adding max-h-32 overflow-y-auto
- Pre-existing TypeScript errors in sources/ pages — unrelated, out of scope

## Self-Check: PASSED

- FOUND: src/components/briefs/UIDirectionSection.tsx
- FOUND: src/components/briefs/DataModelSection.tsx
- FOUND: src/components/briefs/EvidenceChip.tsx
- FOUND: src/app/(dashboard)/query/page.tsx (modified)
- FOUND: src/app/(dashboard)/briefs/page.tsx (modified)
- FOUND: .planning/phases/01-brief-v2/01-02-SUMMARY.md
- FOUND: commit 9b8557b (Task 1)
- FOUND: commit 4f62e3f (Task 2)

---
*Phase: 01-brief-v2*
*Completed: 2026-02-25*
