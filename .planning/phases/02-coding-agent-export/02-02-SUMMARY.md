---
phase: 02-coding-agent-export
plan: 02
subsystem: ui
tags: [react, nextjs, lucide-react, clipboard-api, file-download, markdown-renderer, state-machine]

# Dependency graph
requires:
  - phase: 02-coding-agent-export
    provides: POST /api/briefs/export returning { markdown, title } from Plan 01
  - phase: 01-brief-v2
    provides: BriefContent v2 type with ui_direction and data_model_hints fields
provides:
  - "ExportPreview component — renders 7-section markdown as structured React components with Copy + Download actions"
  - "Export state machine in briefs/page.tsx — idle/generating/done/error with panel replacement on done"
  - "Floating action bar with Export button — v2 briefs only (isV2Brief guard)"
  - "Copy to Clipboard via navigator.clipboard.writeText().then() with toast"
  - "Download .md via Blob + createObjectURL + anchor.click() with slugified filename"
affects: [coding-agent-export, checkpoint-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Clipboard copy via .then() (not async/await) to preserve user gesture context — critical for mobile/Firefox"
    - "File download via Blob + createObjectURL + anchor.click() + revokeObjectURL — no new tab opened"
    - "Toast via local CopyState enum + conditional render — no react-hot-toast or sonner dependency"
    - "Markdown rendering via custom line-by-line parser — no dangerouslySetInnerHTML or react-markdown"
    - "Panel replacement pattern: exportPhase === done swaps BriefDetail for ExportPreview in same container"
    - "isV2Brief guard on both client (hides button) and server (400 response) — defense in depth"

key-files:
  created:
    - src/components/briefs/ExportPreview.tsx
  modified:
    - src/app/(dashboard)/briefs/page.tsx

key-decisions:
  - "Rendered markdown with custom React components — RESEARCH.md explicitly forbids dangerouslySetInnerHTML and react-markdown install"
  - "Toast notification is local state (CopyState enum) — not a library dependency"
  - "Panel replacement (not modal/drawer) per CONTEXT.md decision — ExportPreview replaces BriefDetail in same card"
  - "Export button only on v2 briefs — isV2Brief checks ui_direction.screens.length > 0 AND data_model_hints.length > 0"
  - "handleSelectBrief resets all 4 export state vars when switching briefs — prevents stale export preview from appearing on new brief"

patterns-established:
  - "Export preview pattern: generate server-side, return markdown string, render client-side with structured React components"
  - "State machine pattern: ExportPhase type (idle/generating/done/error) with separate state vars for markdown/title/error"

requirements-completed: [EXPORT-02, EXPORT-03]

# Metrics
duration: 7min
completed: 2026-02-26
---

# Phase 2 Plan 02: Frontend Export UI Summary

**ExportPreview component and briefs page state machine delivering 7-section coding agent package via panel-replacement flow with clipboard copy and .md file download**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-26T00:35:07Z
- **Completed:** 2026-02-26T00:42:04Z
- **Tasks:** 2 (of 3 — Task 3 is human-verify checkpoint)
- **Files modified:** 2

## Accomplishments
- Created ExportPreview component that renders assembled markdown as structured React (headings, code blocks, checklist lists, bold lines) — no raw text output
- Clipboard copy uses navigator.clipboard.writeText().then() to preserve user gesture context; toast shows "Copied to clipboard — paste into Cursor or Claude Code" for 3 seconds
- File download produces slugified filename ({title}-export.md) via Blob + createObjectURL pattern — no new tab
- Briefs page gains ExportPhase state machine: Export button shown only on v2 briefs (isV2Brief guard), button shows spinner during generation, panel swaps to ExportPreview on done

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ExportPreview component** - `0f3c24f` (feat)
2. **Task 2: Add export state machine, floating action bar, and ExportPreview to briefs page** - `bf45761` (feat)

## Files Created/Modified
- `src/components/briefs/ExportPreview.tsx` - ExportPreview component: markdown parser, clipboard copy, file download, toast notification, back button
- `src/app/(dashboard)/briefs/page.tsx` - ExportPhase type + isV2Brief guard + export state machine + handleExport + handleSelectBrief + floating action bar in BriefDetail footer + ExportPreview conditional render in right panel

## Decisions Made
- **No markdown library:** Custom line-by-line parser splits body into code blocks, H3 headings, lists, bold lines, and plain paragraphs. Avoids the dangerouslySetInnerHTML prohibition and eliminates dependency on react-markdown/marked.
- **Toast via local state:** CopyState enum ('idle' | 'copied' | 'error') drives both button appearance and toast visibility — no library needed.
- **Panel replacement, not modal:** Per CONTEXT.md, ExportPreview conditionally renders in the same panel div when exportPhase === 'done'. Same div container, same width (540px from Phase 1).
- **handleSelectBrief:** Wraps setSelectedId with export state reset — prevents stale ExportPreview persisting when user selects a different brief.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Two pre-existing TypeScript errors in unrelated files exist (sources/page.tsx:301, api/sources/upload/route.ts:121) — documented in Plan 01 summary. No new TypeScript errors introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Task 3 (human-verify checkpoint) is pending — user needs to verify the end-to-end export flow in the browser
- All code is complete and TypeScript-clean for the export feature
- After checkpoint approval, Phase 2 is fully complete and Phase 3 (Billing) can begin

---
*Phase: 02-coding-agent-export*
*Completed: 2026-02-26*
