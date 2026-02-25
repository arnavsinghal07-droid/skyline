---
phase: 01-brief-v2
plan: 01
subsystem: api
tags: [anthropic, typescript, nextjs, brief-generation, rag]

# Dependency graph
requires: []
provides:
  - BriefContent v2 type with optional ui_direction and data_model_hints fields
  - UIDirectionScreen, UIDirection, DataModelHint exported TypeScript interfaces
  - max_tokens raised to 4000 in brief generation
  - TOKEN_LIMIT 422 error response with structured error_code
  - signal_count capping at evidence.length after JSON parse
  - Per-section brief regeneration endpoint at POST /api/briefs/regenerate-section
affects: [02-brief-v2-ui, phase-2-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "stop_reason === 'max_tokens' check before JSON.parse prevents silent truncation failures"
    - "Optional fields on BriefContent maintain backward compatibility with existing callers"
    - "signal_count capped at evidence.length to prevent hallucinated evidence counts"
    - "Section-specific JSON shape examples in prompts guide Claude output format per field"

key-files:
  created:
    - src/app/api/briefs/regenerate-section/route.ts
  modified:
    - src/app/api/briefs/generate/route.ts

key-decisions:
  - "Used optional fields (ui_direction?, data_model_hints?) on BriefContent so all existing callers compile without changes"
  - "Raised max_tokens from 1500 to 4000 — 1500 caused silent JSON truncation on v2 prompts"
  - "stop_reason check placed before JSON.parse so truncated JSON never reaches the parser"
  - "buildSectionPrompt uses section-specific JSON shape examples to constrain Claude output"
  - "Section regeneration returns { section, data } so callers can merge the result into the existing brief"

patterns-established:
  - "Error response pattern: { error, error_code, partial_text } with 422 status for token limit failures"
  - "signal_count validation: always cap at evidence.length after Claude response to prevent hallucination"

requirements-completed: [BRIEF-01, BRIEF-02, BRIEF-04]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 1 Plan 01: Brief v2 Backend Summary

**BriefContent v2 type with ui_direction + data_model_hints, expanded prompt with evidence-grounding rules, TOKEN_LIMIT 422 error handling, and per-section regeneration endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T20:12:32Z
- **Completed:** 2026-02-25T20:14:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Extended BriefContent with optional v2 fields (UIDirection, DataModelHint) maintaining backward compatibility with all existing callers
- Raised max_tokens from 1500 to 4000 and added TOKEN_LIMIT 422 error response — eliminates silent JSON truncation
- Created per-section regeneration endpoint with section-specific prompt templates and Claude calls for all 7 BriefContent fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend BriefContent type, raise max_tokens, expand prompt, add token limit handling** - `105ef62` (feat)
2. **Task 2: Create per-section regeneration endpoint** - `b7b58a9` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/app/api/briefs/generate/route.ts` - Extended BriefContent v2 type, expanded prompt with UI/data model sections, raised max_tokens to 4000, TOKEN_LIMIT error handling, signal_count capping
- `src/app/api/briefs/regenerate-section/route.ts` - New POST endpoint accepting section name + context, validates against VALID_SECTIONS, calls Claude with section-specific prompt shapes, returns { section, data }

## Decisions Made
- Used optional fields on BriefContent (not required) so existing code importing BriefContent compiles without changes — existing v1 callers are unaffected
- Raised max_tokens to 4000 per documented blocker in STATE.md — the v2 prompt with two new sections exceeds the old 1500 budget
- stop_reason check placed BEFORE JSON.parse so a truncated partial response never reaches the JSON parser and throws an unhelpful SyntaxError
- Section regeneration wraps result in `{ "value": ... }` shape so Claude always returns a consistent envelope, then we extract `parsed.value` and return `{ section, data }` to callers
- Kept claude-haiku-4-5-20251001 as specified in CLAUDE.md (brief generation uses Haiku, not Sonnet)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in `src/app/(dashboard)/sources/page.tsx` and `src/app/api/sources/upload/route.ts` — unrelated to this plan, out of scope per deviation rules, logged here for awareness.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BriefContent v2 type is ready for the frontend UI components (Plan 02)
- Regenerate-section endpoint is ready to be wired up in the brief panel
- The TOKEN_LIMIT error response (422 + error_code: 'TOKEN_LIMIT') needs to be handled in the frontend
- Pre-existing TypeScript errors in sources/ should be cleaned up before Phase 2 (not blocking)

## Self-Check: PASSED

- FOUND: src/app/api/briefs/generate/route.ts
- FOUND: src/app/api/briefs/regenerate-section/route.ts
- FOUND: .planning/phases/01-brief-v2/01-01-SUMMARY.md
- FOUND: commit 105ef62 (Task 1)
- FOUND: commit b7b58a9 (Task 2)

---
*Phase: 01-brief-v2*
*Completed: 2026-02-25*
