# Phase 3: Stripe Billing - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe to Starter ($79/mo) or Pro ($299/mo) plans via Stripe hosted checkout, manage their subscription through the Stripe Customer Portal, and brief generation is gated by plan limits (Starter: 10/month, Pro: unlimited). Free tier exists as the default with limited access.

</domain>

<decisions>
## Implementation Decisions

### Billing Page Design
- Side-by-side plan cards showing all three tiers: Free, Starter, Pro
- For subscribed users: show plan name + briefs used/remaining with a progress bar (e.g. "7/10 briefs used this month")
- "Manage subscription" link opens Stripe Customer Portal for invoice history, cancellation, and upgrades
- Billing page lives under Settings > Billing tab in the existing navigation

### Limit Gate Experience
- Inline replacement: when a user hits their limit, replace the "Generate Brief" action area with an upgrade prompt — no modal, no separate page
- Always-visible brief count near the generate button (e.g. "3/10 briefs remaining") so users are never surprised
- Same gate pattern for both Free and Starter users, but different copy:
  - Free users: "Subscribe to unlock briefs"
  - Starter users: "Upgrade to Pro for unlimited briefs"
- Tone is helpful and direct: "You've used all 10 briefs this month. Upgrade to Pro for unlimited."

### Checkout & Confirmation Flow
- After Stripe hosted checkout succeeds: redirect back to /settings/billing with a success banner ("Welcome to Starter!" or "Welcome to Pro!")
- If user cancels during Stripe checkout: return silently to billing page — no error message, no nudge
- Optimistic update: immediately show the new plan after Stripe redirect, webhook confirms in background. If webhook fails, revert and notify.
- Send a brief welcome email on subscription start (Stripe sends its own receipt separately)

### Plan Presentation
- Brief limit is the headline differentiator: Starter = "10 briefs/month", Pro = "Unlimited briefs"
- Pro card visually highlighted as "Recommended" (colored border or badge)
- Free tier card de-emphasized — smaller or muted, labeled "Current" if user is on free plan
- Monthly pricing only for now — no annual toggle

### Claude's Discretion
- Exact visual styling of plan cards (shadows, borders, spacing)
- Progress bar design for usage display
- Welcome email template and copy details
- Webhook retry/failure notification UX
- Stripe Customer Portal theming (if any)

</decisions>

<specifics>
## Specific Ideas

- The upgrade prompt should feel like a natural part of the page, not a popup — inline replacement keeps the user in context
- Usage counter should be persistent and visible, similar to how Vercel shows deployment counts on their dashboard
- Pro plan should feel clearly premium without making Starter feel cheap

</specifics>

<deferred>
## Deferred Ideas

- Annual pricing toggle — future billing enhancement
- Feature-based plan differentiation beyond brief limits — future phase
- Team/organization billing with multiple seats — future phase

</deferred>

---

*Phase: 03-stripe-billing*
*Context gathered: 2026-02-25*
