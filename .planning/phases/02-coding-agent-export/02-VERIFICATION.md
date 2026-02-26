---
phase: 02-coding-agent-export
verified: 2026-02-26T01:00:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: "Export button visible only on v2 briefs — confirm v1 brief (no UI Direction / Data Model Hints) does not show the Export button"
    expected: "Export button absent from v1 brief footer; present in v2 brief footer above Log Decision"
    why_human: "v1/v2 distinction depends on live DB data — cannot verify without a running app and both brief types in the database"
  - test: "Copy to Clipboard flow — click button, verify toast appears and clipboard contains full 7-section markdown"
    expected: "Button turns green with checkmark, toast 'Copied to clipboard — paste into Cursor or Claude Code' appears for ~3s, pasted content is complete markdown"
    why_human: "navigator.clipboard.writeText() behavior and toast visibility require browser interaction"
  - test: "Download .md — click Download, verify file saves with slugified title and contains valid markdown"
    expected: "File named '{brief-title}-export.md' downloads; opening it shows the complete 7-section package"
    why_human: "Blob/createObjectURL download requires browser interaction to confirm file receipt"
  - test: "Export panel replacement — clicking Export on a v2 brief shows spinner, then replaces the brief panel with ExportPreview"
    expected: "Loading spinner appears on Export button during 2-8s API call; brief panel swaps to ExportPreview showing formatted sections"
    why_human: "State machine transition and Claude API latency require end-to-end runtime verification"
  - test: "Back button restores BriefDetail — clicking 'Back to brief' in ExportPreview returns to the full brief view"
    expected: "BriefDetail with all sections and action buttons reappears; ExportPreview is gone"
    why_human: "Panel swap requires live React state interaction"
---

# Phase 2: Coding Agent Export — Verification Report

**Phase Goal:** Users can generate and deliver the 7-section agent handoff package from any v2 brief — Preview-first export with Copy to Clipboard and Download .md
**Verified:** 2026-02-26T01:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/briefs/export receives brief content inline, calls Claude once for enrichment, returns complete 7-section markdown string | VERIFIED | `route.ts` line 182-236: anthropic.messages.create called once with inline content; returns `{ markdown, title }` |
| 2 | Export endpoint uses claude-haiku-4-5-20251001 for enrichment | VERIFIED | `route.ts` line 183: `model: 'claude-haiku-4-5-20251001'` — matches CLAUDE.md directive |
| 3 | v2 detection guard rejects briefs without ui_direction or data_model_hints with 400 status | VERIFIED | `route.ts` lines 167-177: explicit guard returning `{ status: 400 }` when either field is missing/empty |
| 4 | Enrichment failure degrades gracefully — fallback uses problem_statement, out_of_scope, generic paths | VERIFIED | `route.ts` lines 210-217: catch block sets `enriched` from brief data; export always produces output |
| 5 | Assembled markdown has 7 H2 sections separated by --- horizontal rules, metadata header, SQL fenced code blocks, testable checklist acceptance criteria | VERIFIED | Python analysis confirms: 7 H2 sections, 7 --- separators; line 83 has ` ```sql `; line 111-113 renders `- [ ] As a {role}...` |
| 6 | User sees Export button only on v2 briefs; clicking produces loading state then ExportPreview panel | VERIFIED (code) | `page.tsx` lines 238-250: `{isV2Brief(c) && (...)}` guard; lines 244-246: Loader2 spinner when `exportPhase === 'generating'`; lines 470-475: conditional ExportPreview render |
| 7 | Copy to Clipboard, Download .md, and Back button all function within ExportPreview | VERIFIED (code) | `ExportPreview.tsx` lines 151-161: `navigator.clipboard.writeText().then()`; lines 163-172: Blob + createObjectURL + anchor.click(); line 188: `onClick={onBack}` |

**Score:** 7/7 truths verified (code level). 5 behavioral truths need human confirmation.

---

## Required Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/app/api/briefs/export/route.ts` | Export Route Handler — 7-section assembly with Claude enrichment and graceful fallback | Yes | Yes (237 lines, full implementation) | Yes (called by briefs page) | VERIFIED |
| `src/components/briefs/ExportPreview.tsx` | ExportPreview component — rendered markdown, clipboard copy, file download, back button | Yes | Yes (263 lines, full implementation) | Yes (imported and rendered by briefs page) | VERIFIED |
| `src/app/(dashboard)/briefs/page.tsx` | Updated briefs page — ExportPhase state machine, isV2Brief guard, floating action bar, panel replacement | Yes | Yes (511 lines, export state machine added) | Yes (wires ExportPreview and export route) | VERIFIED |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/briefs/export/route.ts` | Anthropic SDK | `anthropic.messages.create` with `claude-haiku-4-5-20251001`, max_tokens 1500 | WIRED | Line 182-188: model and max_tokens exact match |
| `src/app/api/briefs/export/route.ts` | `src/app/api/briefs/generate/route.ts` | `import type { BriefContent }` | WIRED | Line 4: `import type { BriefContent } from '../generate/route'` |
| `src/app/api/briefs/export/route.ts` | Supabase server client | `createClient` + `getUser` auth check | WIRED | Lines 142-146: auth guard returns 401 if no user |
| `src/app/(dashboard)/briefs/page.tsx` | `src/app/api/briefs/export/route.ts` | `fetch('/api/briefs/export', { method: 'POST' })` | WIRED | Line 366: full POST call with `{ briefId, content, queryText, confidence }` |
| `src/app/(dashboard)/briefs/page.tsx` | `src/components/briefs/ExportPreview.tsx` | Renders `<ExportPreview>` when `exportPhase === 'done'` | WIRED | Lines 17 (import), 470-475 (conditional render) |
| `src/components/briefs/ExportPreview.tsx` | `navigator.clipboard.writeText` | Clipboard API for one-click copy | WIRED | Line 151: `navigator.clipboard.writeText(markdown).then(...)` |
| `src/components/briefs/ExportPreview.tsx` | Blob + createObjectURL | Native file download via anchor click | WIRED | Lines 165-172: Blob, createObjectURL, anchor.click(), revokeObjectURL |

All 7 key links: WIRED

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXPORT-01 | 02-01-PLAN.md, 02-02-PLAN.md | User can generate a 7-section coding agent export package from any v2 brief | SATISFIED | `route.ts` assembleMarkdown produces 7 H2 sections; Claude enriches 3; v2 guard blocks non-v2 briefs; endpoint returns complete markdown |
| EXPORT-02 | 02-02-PLAN.md | User can copy the full export package to clipboard with one click | SATISFIED (code) | `ExportPreview.tsx` lines 149-161: one-click copy handler; toast text "Copied to clipboard — paste into Cursor or Claude Code" at line 255 |
| EXPORT-03 | 02-02-PLAN.md | User can download the export package as a .md file | SATISFIED (code) | `ExportPreview.tsx` lines 163-172: Blob download; slugified filename pattern `{title}-export.md` at line 164 |

All 3 requirements claimed across both plans are accounted for. No orphaned requirements found — REQUIREMENTS.md maps exactly EXPORT-01, EXPORT-02, EXPORT-03 to Phase 2, and all three are claimed and implemented.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No TODOs, FIXMEs, placeholder returns, stub handlers, or empty implementations found in the three phase files. The two pre-existing TypeScript errors (`sources/page.tsx:301`, `api/sources/upload/route.ts:121`) are confirmed pre-existing from the Plan 01 SUMMARY — they precede this phase and are unrelated to export functionality.

---

## Human Verification Required

### 1. v2 vs v1 Brief Guard (UI)

**Test:** Navigate to the briefs page. Click a v1 brief (one generated before Brief v2 — it will show "Not available — generated before v2" for UI Direction). Verify the "Export for Coding Agent" button is absent.
**Expected:** No Export button in the brief footer for v1 briefs. Only the "Log Decision" button is visible.
**Why human:** The `isV2Brief` guard works correctly in code (`content.ui_direction?.screens.length > 0 && content.data_model_hints?.length > 0`), but confirming the right briefs exist in the live database and the guard fires correctly requires a running app.

### 2. Export Generation and Panel Replacement

**Test:** Click a v2 brief (one with visible UI Direction and Data Model Hints sections). Click "Export for Coding Agent".
**Expected:** Button shows a spinner with "Generating export..." text. After 2-8 seconds, the brief panel replaces with the ExportPreview showing: metadata header (title, date, query, confidence), 7 labeled sections with formatted content (headings, lists, SQL code blocks, checklist items).
**Why human:** Claude API latency and the panel swap require runtime verification. The rendered markdown parser (custom line-by-line in `renderSectionBody`) must be confirmed to produce formatted output, not raw text.

### 3. Copy to Clipboard with Toast

**Test:** In the ExportPreview, click "Copy to Clipboard".
**Expected:** Button turns green with a checkmark icon and "Copied to clipboard" label. A toast appears at bottom-center: "Copied to clipboard — paste into Cursor or Claude Code". Toast disappears after ~3 seconds. Paste the clipboard into any editor and confirm the full 7-section markdown package is present.
**Why human:** `navigator.clipboard.writeText` behavior and toast visibility require browser interaction. Clipboard content validity requires manual paste inspection.

### 4. Download .md File

**Test:** In the ExportPreview, click "Download .md".
**Expected:** A file downloads (no new tab opens) with a name like `improve-onboarding-flow-export.md` (slugified from the brief title). Opening the file shows the complete 7-section markdown.
**Why human:** Blob/createObjectURL file download requires browser interaction to confirm file receipt and content.

### 5. Back Button Restoration

**Test:** From within ExportPreview, click "Back to brief" (top-left).
**Expected:** The BriefDetail panel reappears with all sections and both action buttons (Export + Log Decision). ExportPreview is fully dismissed.
**Why human:** React state transition (`setExportPhase('idle')`) requires live interaction to confirm the panel swap is clean and no stale state persists.

---

## Summary

Phase 2 goal is achieved at the code level. The 7-section coding agent export package is fully implemented:

- **Backend (Plan 01):** `POST /api/briefs/export` assembles a complete package — auth guard, v2 guard (400 on non-v2 briefs), Claude Haiku enrichment for 3 sections (context block, edge cases, suggested file paths), deterministic assembly of 4 sections from brief data, graceful fallback if enrichment fails, returns `{ markdown, title }`.

- **Frontend (Plan 02):** `ExportPreview` component renders markdown as structured React components (no `dangerouslySetInnerHTML`, no external markdown library), clipboard copy via `.then()` pattern preserving user gesture, file download via Blob + createObjectURL, local CopyState toast. `briefs/page.tsx` adds a 4-state export machine (idle/generating/done/error), isV2Brief guard on the floating action bar, panel replacement on done, and brief-selection reset of all export state.

All 3 requirements (EXPORT-01, EXPORT-02, EXPORT-03) are satisfied by the implementation. No stubs, placeholders, or broken wiring found. TypeScript errors are pre-existing in unrelated files.

5 behavioral items require human verification with a running app to confirm the full user-facing experience.

---

_Verified: 2026-02-26T01:00:00Z_
_Verifier: Claude (gsd-verifier)_
