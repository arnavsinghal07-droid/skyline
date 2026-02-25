# Phase 2: Coding Agent Export - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate a complete 7-section coding agent handoff package from any v2 brief, delivered via clipboard copy or .md file download. The seven sections are: Context Block, Feature Description, Acceptance Criteria, UI Direction, Data Model Hints, Edge Cases, Suggested File Paths. This phase does NOT include integrations (Linear, Notion, Jira export) or user-editable templates.

</domain>

<decisions>
## Implementation Decisions

### Export flow
- Preview-first flow: clicking Export opens a full preview of the assembled package before any copy/download action
- Preview replaces the brief panel content (full panel replace, not modal or drawer) with a Back button to return to the brief
- Single "Export" button in a floating action bar at the bottom of the brief panel — no separate Copy/Download buttons in the bar
- Copy to Clipboard and Download .md buttons live inside the export preview panel
- Export button only appears on v2 briefs (briefs with UI Direction + Data Model Hints). v1 briefs do not show the Export button

### Package formatting
- Acceptance Criteria rendered as a testable checklist: `- [ ] User can X and sees Y`
- Data Model Hints rendered as Prisma schema syntax in fenced code blocks (matches Sightline's ORM)
- Sections separated by H2 headings (`##`) with horizontal rules (`---`) between sections
- Compact metadata header at the top: brief title, generation date, source query, confidence level

### Content assembly
- Context Block auto-generated from the brief's problem statement, the original discovery query, and workspace name — no user-provided project description required
- Suggested File Paths AI-inferred from the feature type described in the brief (e.g., "src/components/Onboarding/", "src/api/routes/billing.ts") — generic but useful starting points
- Edge Cases sourced from dissenting signals in the brief's evidence PLUS AI-generated common edge cases for the feature type
- Package assembled server-side via tRPC endpoint — Claude enriches Context Block, Edge Cases, and Suggested File Paths beyond raw brief data

### Delivery UX
- Toast notification on clipboard copy: "Copied to clipboard — paste into Cursor or Claude Code" (disappears after ~3s)
- Downloaded file named by slugified brief title: e.g., `onboarding-flow-export.md`
- Export preview shows rendered markdown (formatted headings, code blocks, lists) — not raw source

### Claude's Discretion
- Exact toast component and animation
- Loading state during server-side package generation
- Error handling if generation fails
- Preview panel layout and spacing
- Floating action bar styling

</decisions>

<specifics>
## Specific Ideas

- Export should feel like a natural next step after reviewing a brief — the floating action bar keeps it always visible
- Prisma schema format for Data Model Hints means coding agents using Sightline's stack can copy-paste directly into schema.prisma
- The testable checklist format for Acceptance Criteria lets coding agents treat each item as a verification step

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-coding-agent-export*
*Context gathered: 2026-02-25*
