# Phase 4: Landing Page - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship a marketing landing page at the root URL for unauthenticated visitors. Includes hero with value proposition, waitlist email capture (saved to Supabase, confirmation via Resend), product screenshots of query interface and brief panel, and pricing section with Starter/Pro tier comparison linking to signup. This is the public face of Sightline for design partners to send prospects to.

</domain>

<decisions>
## Implementation Decisions

### Hero & messaging
- Identity-first headline: "Cursor for Product Managers" as the positioning anchor
- Product screenshot as the hero visual — real app UI, not illustration or animation
- Dual CTA: "Join the Waitlist" as primary button + secondary text link for existing users (login/demo)
- Dark & technical visual tone — Vercel/Linear/Cursor aesthetic (dark background, code-like accents, developer-tool feel)

### Page structure & flow
- Compact layout: 4-5 sections total, no filler
- Section order: Hero → How it works (3-step) → Product screenshots (tabbed) → Pricing → Final CTA
- 3-step "How it works" visual: Upload signals → Ask questions → Get briefs
- Tabbed screenshot showcase: clickable tabs (e.g. "Discovery" / "Brief" / "Export") that swap the visible screenshot — interactive, saves vertical space
- Minimal sticky nav: logo + Login link + CTA button only, no section anchor links

### Waitlist experience
- Email input appears in hero section AND in a final CTA section at the bottom (after pricing)
- Email only — single field, no role/company/name collection
- Inline success state: form transforms to "You're on the list!" with checkmark — no redirect, no separate page
- No social proof or waitlist count at launch — too early, low numbers hurt credibility
- Confirmation email sent via Resend, email saved to Supabase

### Pricing presentation
- Side-by-side cards: Starter ($79/mo) and Pro ($299/mo) with feature lists
- Pro card highlighted with "Recommended" badge — slightly more prominent styling
- CTA on pricing cards goes to signup/login flow — user creates account first, picks plan from billing page
- No free tier card — instead, a note under both paid cards like "Start with 3 free briefs" to indicate trial availability

### Claude's Discretion
- Subheadline copy under the main headline
- Exact feature list items on pricing cards
- Footer content and layout
- Mobile responsive breakpoints and adaptations
- Animation/transition effects on scroll
- Screenshot tab labels and which screenshots to feature
- "How it works" step icons/illustrations

</decisions>

<specifics>
## Specific Ideas

- Positioning is "Cursor for Product Managers" — the headline should feel like a declaration, not a description
- Dark aesthetic references: Vercel's marketing site, Linear's landing page, Cursor's homepage — sophisticated developer-tool feel
- The tabbed screenshots should show the actual app in use, not mockups
- Keep the page tight and scannable — a PM should get the value prop in under 10 seconds of scrolling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-landing-page*
*Context gathered: 2026-03-02*
