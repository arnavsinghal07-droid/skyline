# Phase 4: Landing Page - Research

**Researched:** 2026-03-02
**Domain:** Next.js 16 marketing page, Supabase waitlist persistence, Resend transactional email, Tailwind CSS 4 dark-mode landing page
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Hero & messaging
- Identity-first headline: "Cursor for Product Managers" as the positioning anchor
- Product screenshot as the hero visual — real app UI, not illustration or animation
- Dual CTA: "Join the Waitlist" as primary button + secondary text link for existing users (login/demo)
- Dark & technical visual tone — Vercel/Linear/Cursor aesthetic (dark background, code-like accents, developer-tool feel)

#### Page structure & flow
- Compact layout: 4-5 sections total, no filler
- Section order: Hero → How it works (3-step) → Product screenshots (tabbed) → Pricing → Final CTA
- 3-step "How it works" visual: Upload signals → Ask questions → Get briefs
- Tabbed screenshot showcase: clickable tabs (e.g. "Discovery" / "Brief" / "Export") that swap the visible screenshot — interactive, saves vertical space
- Minimal sticky nav: logo + Login link + CTA button only, no section anchor links

#### Waitlist experience
- Email input appears in hero section AND in a final CTA section at the bottom (after pricing)
- Email only — single field, no role/company/name collection
- Inline success state: form transforms to "You're on the list!" with checkmark — no redirect, no separate page
- No social proof or waitlist count at launch — too early, low numbers hurt credibility
- Confirmation email sent via Resend, email saved to Supabase

#### Pricing presentation
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAND-01 | Visitor sees a marketing landing page with hero section, value proposition, and primary CTA | Root `page.tsx` is currently a Next.js default placeholder — replace entirely; no middleware redirect blocks unauthenticated visitors at `/` |
| LAND-02 | Visitor can submit email to join the waitlist (saved to Supabase, confirmation via Resend) | New API route `/api/waitlist/route.ts` using `createAdminClient()` to bypass RLS; `sendWaitlistConfirmationEmail()` added to `src/lib/email.ts`; new `waitlist` Supabase table required |
| LAND-03 | Landing page displays product screenshots of query interface and brief panel | Static screenshots as Next.js `<Image>` components in `/public/screenshots/`; tabbed switcher via `useState` (client component island) |
| LAND-04 | Landing page shows pricing section with Starter and Pro tier feature comparison | Reuse visual language from `PlanCard.tsx`; CTAs link to `/signup` (user creates account, picks plan from `/settings/billing`); "Start with 3 free briefs" note replaces free tier card |
</phase_requirements>

---

## Summary

Phase 4 builds a single-page marketing site at the root URL. The existing `src/app/page.tsx` is a create-next-app boilerplate and must be fully replaced. There is no middleware protecting the root route — the `(dashboard)` route group layout handles auth gating only for its own routes — so an unauthenticated visitor at `/` will see whatever `page.tsx` renders. This means LAND-01 is purely a replacement of that file: no middleware changes needed.

The project's design system is already established: `#09090e` background, `border-white/[0.07]` card borders, `var(--font-syne)` for display headings, Geist Sans for body, white-on-dark component palette. The landing page must match this aesthetic precisely. All spacing, radius, and opacity conventions from the dashboard should be inherited — this is not a rebrand exercise.

LAND-02 (waitlist) requires a new database table, a new API route, and a new email function. The Resend integration already exists in `src/lib/email.ts` with `sendWelcomeEmail` as the established pattern — the waitlist confirmation follows the same lazy-init, fire-and-forget pattern. The admin client (`createAdminClient()`) is used for all unauthenticated writes because waitlist submissions have no session. One critical blocker: the Supabase `SUPABASE_SERVICE_ROLE_KEY` env var must be available in production for the admin client to work; this is confirmed present from Phase 3.

**Primary recommendation:** Build the landing page as a single Server Component file (`src/app/page.tsx`) with two `'use client'` island components — `WaitlistForm` (handles email submission + inline success state) and `ScreenshotTabs` (handles tab switching for screenshot showcase). Keep the rest server-rendered for performance.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (App Router) | 16.1.6 | SSR + page routing | Already installed; landing page is just `src/app/page.tsx` |
| Tailwind CSS 4 | ^4 | Styling | Already installed; all existing components use it |
| Lucide React | ^0.575.0 | Icons (checkmarks, arrows on landing) | Already installed; used throughout the app |
| Resend SDK | ^6.9.2 | Waitlist confirmation email | Already installed and configured in `src/lib/email.ts` |
| Supabase JS | ^2.97.0 | Persist waitlist emails | Already installed; admin client pattern established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/image` | bundled | Optimized screenshot delivery | All product screenshots must use this — not raw `<img>` |
| `next/font/google` | bundled | Syne font (display headings) | Already loaded in `layout.tsx` via CSS variable `--font-syne` |
| `next/navigation` | bundled | Link to `/login`, `/signup` from nav CTAs | Use `<Link>` not `<a>` for internal navigation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useState` tab switcher | Framer Motion tabs | Framer Motion not installed; zero-dep tab switcher is 10 lines and ships faster |
| Static screenshots in `/public` | Hosted on Supabase Storage | No auth needed for public assets; `/public` is simpler and already CDN-served by Vercel |
| Inline HTML email (Resend) | React Email templates | React Email adds a build step; inline HTML already established by `sendWelcomeEmail` |

**Installation:** No new packages required. Everything needed is already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

New files required:

```
src/
├── app/
│   ├── page.tsx                        # REPLACE: marketing landing page (Server Component)
│   └── api/
│       └── waitlist/
│           └── route.ts                # NEW: POST handler — save email + send confirmation
├── components/
│   └── landing/
│       ├── WaitlistForm.tsx            # NEW: 'use client' — email input + inline success state
│       └── ScreenshotTabs.tsx          # NEW: 'use client' — tabbed screenshot showcase
└── lib/
    └── email.ts                        # MODIFY: add sendWaitlistConfirmationEmail()

supabase/
└── migrations/
    └── 003_waitlist.sql                # NEW: waitlist table + RLS policy
```

No changes required to middleware, layout, auth flow, or existing components.

### Pattern 1: Server Component with Client Islands

The landing page should be a Server Component (`page.tsx` without `'use client'`) that renders static sections (nav, hero copy, how-it-works, pricing) server-side, with two small client component islands dropped in where interactivity is needed.

```typescript
// src/app/page.tsx — Server Component (no 'use client')
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { ScreenshotTabs } from '@/components/landing/ScreenshotTabs'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      <Nav />
      <HeroSection>
        <WaitlistForm />  {/* client island */}
      </HeroSection>
      <HowItWorksSection />
      <ScreenshotTabs />  {/* client island */}
      <PricingSection />
      <FinalCTASection>
        <WaitlistForm />  {/* second instance, same component */}
      </FinalCTASection>
      <Footer />
    </div>
  )
}
```

**When to use:** Landing pages benefit from Server Components for fast initial paint; only interactive elements (form, tabs) need client JS.

### Pattern 2: Waitlist API Route with Admin Client

The waitlist form POSTs to a Next.js API route. Because the visitor is unauthenticated, the anon Supabase client cannot INSERT into the waitlist table (RLS blocks it). Use the admin client (service role) instead — the same pattern established in Phase 3 for the billing webhook handler.

```typescript
// src/app/api/waitlist/route.ts
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  const admin = createAdminClient()

  // INSERT with ON CONFLICT DO NOTHING — idempotent re-submits
  const { error } = await admin
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim() })

  if (error && error.code !== '23505') {
    // 23505 = unique violation (already on list) — treat as success
    return Response.json({ error: 'Failed to save email' }, { status: 500 })
  }

  // Send confirmation — fire and forget (same pattern as sendWelcomeEmail)
  await sendWaitlistConfirmationEmail(email)

  return Response.json({ success: true })
}
```

### Pattern 3: Inline Success State (No Redirect)

The WaitlistForm should transform in place — matching the magic-link pattern from `LoginPage`:

```typescript
// src/components/landing/WaitlistForm.tsx
'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit() {
    if (!email.trim() || state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2.5 text-emerald-400">
        <CheckCircle size={16} className="shrink-0" />
        <span className="text-sm font-medium">You're on the list!</span>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="you@company.com"
        className="flex-1 bg-white/[0.04] border border-white/[0.10] focus:border-white/[0.22] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors"
      />
      <button
        onClick={handleSubmit}
        disabled={!email.trim() || state === 'loading'}
        className="flex items-center gap-2 bg-white text-[#09090e] rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>Join waitlist <ArrowRight size={13} /></>
        )}
      </button>
    </div>
  )
}
```

### Pattern 4: Tabbed Screenshot Showcase

```typescript
// src/components/landing/ScreenshotTabs.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

const TABS = [
  { id: 'query', label: 'Discovery', src: '/screenshots/query.png' },
  { id: 'brief', label: 'Brief', src: '/screenshots/brief.png' },
  { id: 'export', label: 'Export', src: '/screenshots/export.png' },
] as const

export function ScreenshotTabs() {
  const [active, setActive] = useState<'query' | 'brief' | 'export'>('query')
  const current = TABS.find(t => t.id === active)!

  return (
    <section className="py-24 px-6">
      {/* Tab buttons */}
      <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl w-fit mx-auto mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              active === tab.id
                ? 'bg-white text-[#09090e]'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60">
        <Image
          src={current.src}
          alt={`${current.label} interface`}
          width={1280}
          height={800}
          className="w-full h-auto"
          priority={active === 'query'}
        />
      </div>
    </section>
  )
}
```

### Pattern 5: Pricing Section (No Free Tier Card)

The landing page pricing differs from the in-app billing page: only Starter and Pro cards, side by side, CTAs go to `/signup`. No free tier card — a subtle footnote handles the trial mention.

```typescript
// Inside page.tsx — static server component section
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$79',
      period: '/mo',
      briefLimit: '10 briefs/month',
      features: [
        'Discovery query interface',
        '10 feature briefs per month',
        'UI Direction + Data Model Hints',
        'Coding agent export (.md)',
      ],
      isRecommended: false,
      href: '/signup',
    },
    {
      name: 'Pro',
      price: '$299',
      period: '/mo',
      briefLimit: 'Unlimited briefs',
      features: [
        'Everything in Starter',
        'Unlimited feature briefs',
        'Priority support',
        'Early access to new features',
      ],
      isRecommended: true,
      href: '/signup',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* ... plan cards ... */}
        <p className="text-center text-xs text-white/25 mt-6">
          Start with 3 free briefs — no credit card required.
        </p>
      </div>
    </section>
  )
}
```

### Pattern 6: Sticky Nav

```typescript
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#09090e]/80 backdrop-blur-md border-b border-white/[0.05]">
      {/* Wordmark — matches the existing diamond + SIGHTLINE pattern */}
      <div className="flex items-center gap-2.5">
        <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
        <span style={{ fontFamily: 'var(--font-syne)' }}
          className="text-[11px] font-bold tracking-[0.22em] text-white uppercase">
          Sightline
        </span>
      </div>
      {/* Right side */}
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          Log in
        </Link>
        <button className="flex items-center gap-1.5 bg-white text-[#09090e] rounded-lg py-2 px-4 text-xs font-semibold hover:bg-white/90 transition-all">
          Join waitlist
        </button>
      </div>
    </nav>
  )
}
```

### Anti-Patterns to Avoid
- **Using a raw `<form>` element:** CLAUDE.md explicitly forbids HTML `<form>` tags. Use controlled `<input>` with `onClick`/`onKeyDown` handlers on the button.
- **Calling `createClient()` (anon) in the waitlist API route:** The visitor is unauthenticated — anon client cannot INSERT into `waitlist` table. Use `createAdminClient()` instead.
- **Redirecting to a success page after waitlist submission:** CONTEXT.md locked this as an inline success state transform, no redirect.
- **Putting the entire landing page as a Client Component:** Marking `src/app/page.tsx` with `'use client'` blocks SSR optimizations. Only the interactive islands (WaitlistForm, ScreenshotTabs) need client-side hydration.
- **Using `<img>` instead of `<Image>` for screenshots:** `next/image` optimizes delivery (WebP, lazy loading, layout shift prevention). Screenshots will be large — the optimization matters.
- **Mixing landing page nav into `(auth)` or `(dashboard)` layout:** The root route sits outside both route groups. It has its own standalone layout handled by `src/app/layout.tsx`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email deduplication on waitlist | Custom uniqueness check before insert | Postgres UNIQUE constraint + `ON CONFLICT DO NOTHING` | Race conditions if you check-then-insert; DB constraint is atomic |
| Email validation | Regex email parser | Basic `email.includes('@')` check + Resend delivery failures | RFC 5322 regex is notoriously complex and still has edge cases; Resend will bounce invalid addresses |
| Tab animation | Custom CSS keyframe switcher | Instant swap via `useState` + Tailwind `transition-all` on the image container | One-state tab switcher needs no animation library |
| Scroll-triggered animations | Intersection Observer API | Simple Tailwind `animate-fade-in-up` (already in `globals.css`) | The `fadeInUp` keyframe is already defined; no IntersectionObserver complexity needed |
| Custom dark mode | `prefers-color-scheme` toggle | Fixed dark background `#09090e` — no toggle | The product is always dark; a toggle adds complexity with no benefit for this audience |

**Key insight:** This is a landing page, not a design system exercise. Every custom solution adds maintenance surface. The existing codebase provides all needed primitives.

---

## Common Pitfalls

### Pitfall 1: Middleware Blocking the Landing Page

**What goes wrong:** Developer adds a Supabase auth check in middleware that redirects unauthenticated users to `/login`, inadvertently blocking unauthenticated visitors from seeing the landing page.

**Why it happens:** The existing middleware pattern (from MEMORY.md) refreshes auth sessions on all routes. If someone adds a redirect guard without a route exclusion, `/` gets caught.

**How to avoid:** There is currently NO middleware file in this project (`middleware.ts` does not exist at the project root — confirmed by file search). If middleware is added for auth session refresh in Phase 4, it MUST exclude `/` and `/api/waitlist` from any redirect logic. The `(dashboard)` layout's auth guard only applies inside that route group.

**Warning signs:** During testing, if an incognito browser visits `/` and gets redirected to `/login`, middleware is interfering.

### Pitfall 2: Waitlist Table Visible to Authenticated Users

**What goes wrong:** Enabling RLS on `waitlist` table without an explicit `anon` policy results in the admin client bypassing it (that's intentional), but forgetting to also prevent authenticated users from reading all waitlist entries via their session.

**How to avoid:** The `waitlist` table should only be written by the service role (admin client). RLS policy: no SELECT for authenticated or anon roles — all reads are done via service role from the dashboard/admin tooling later.

```sql
CREATE TABLE public.waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
-- No SELECT/UPDATE/DELETE policies for authenticated or anon
-- All access is via service role only
```

### Pitfall 3: Resend Domain Not Verified for Waitlist Email

**What goes wrong:** The `from` address for the waitlist confirmation uses `onboarding@resend.dev` (the Resend test domain). This domain is not customized — emails may land in spam or display as "via resend.dev" in Gmail.

**Why it happens:** STATE.md explicitly flags this: "Verify `RESEND_API_KEY` and sender domain before Phase 4 begins (waitlist confirmation email blocks on Resend setup). Currently using `onboarding@resend.dev` for development."

**How to avoid:** Use `onboarding@resend.dev` as the `from` address for the waitlist email — it works in development and for early-stage design partners. Treat domain verification as a production concern, not a code concern. Add a code comment marking this as the production upgrade point.

**Warning signs:** Resend dashboard shows emails delivering but recipients report spam folder placement.

### Pitfall 4: Screenshots Not Taken Yet

**What goes wrong:** The `ScreenshotTabs` component references `/public/screenshots/query.png`, `/public/screenshots/brief.png`, `/public/screenshots/export.png` — but these files don't exist yet.

**Why it happens:** Landing page build order: code first, then take screenshots of the running app.

**How to avoid:** The planner should create a task that explicitly lists screenshot capture as a required step BEFORE writing the final `ScreenshotTabs` component paths. Use placeholder dimensions (e.g., a solid-color `1280x800` PNG) during development. The plan must explicitly include: "Take screenshots of Query interface, Brief panel, and Export panel from running app."

**Warning signs:** Next.js build error: "Image with src '/screenshots/query.png' has no explicit dimensions."

### Pitfall 5: `pt-[nav-height]` Missing on First Section

**What goes wrong:** The sticky nav is `fixed` positioning, so it sits on top of the first section (Hero). The hero content slides under the nav.

**How to avoid:** Add `pt-20` (or `pt-[72px]` to match nav height) to the hero section outer div, or add it to the root page container.

---

## Code Examples

Verified patterns from existing codebase:

### Wordmark pattern (from login page)
```typescript
// Source: src/app/(auth)/login/page.tsx
<div className="flex items-center gap-2.5">
  <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
  <span
    style={{ fontFamily: 'var(--font-syne)' }}
    className="text-[11px] font-bold tracking-[0.22em] text-white uppercase"
  >
    Sightline
  </span>
</div>
```

### Recommended badge (from PlanCard)
```typescript
// Source: src/components/billing/PlanCard.tsx
<div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
  <span className="inline-flex items-center gap-1 bg-white text-[#09090e] text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
    <Sparkles size={10} />
    Recommended
  </span>
</div>
```

### Send email (from email.ts pattern)
```typescript
// Source: src/lib/email.ts — lazy-init Resend, fire-and-forget pattern
export async function sendWaitlistConfirmationEmail(to: string) {
  if (!to || !process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'Sightline <onboarding@resend.dev>',
      to,
      subject: "You're on the Sightline waitlist",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">You're on the list.</h2>
          <p style="color: #444; line-height: 1.6;">
            We'll be in touch when your spot opens up.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Sightline] Failed to send waitlist email:', err)
  }
}
```

### Admin client for unauthenticated writes
```typescript
// Source: src/lib/supabase/admin.ts
import { createAdminClient } from '@/lib/supabase/admin'

const admin = createAdminClient()
const { error } = await admin.from('waitlist').insert({ email })
// error.code '23505' = duplicate — treat as success (already on list)
```

### CSS animation (already in globals.css)
```css
/* Source: src/app/globals.css — already available */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.35s ease-out both;
}
```

### backdrop-blur nav (Tailwind 4)
```typescript
// Standard pattern for sticky nav in Tailwind 4
className="fixed top-0 left-0 right-0 z-50 bg-[#09090e]/80 backdrop-blur-md border-b border-white/[0.05]"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `form` submit + page reload | Controlled components with `onClick` | CLAUDE.md mandate | No HTML `<form>` tags — use controlled inputs |
| `stripe.redirectToCheckout()` | Hosted checkout session URL via `router.push(data.url)` | Stripe removed Sept 2025 | Pricing CTAs on landing go to `/signup` (user picks plan from billing page after account creation) — no Stripe interaction from landing page itself |
| Separate `next-themes` package | Fixed dark background `#09090e` | Project decision | No dark mode toggle complexity |

**Deprecated/outdated:**
- `pages/` directory routing: This project uses App Router (`src/app/`) exclusively
- `getServerSideProps` / `getStaticProps`: Use Server Components and async page functions
- `import Image from 'next/image'` with `layout` prop: Use `width`/`height` or `fill` instead

---

## Open Questions

1. **Screenshots: Do they exist yet?**
   - What we know: The app is fully built through Phase 3. Screenshots CAN be taken now.
   - What's unclear: Whether placeholder images should be used during development or if screenshots should be captured first.
   - Recommendation: The plan should include a dedicated task for capturing screenshots before the `ScreenshotTabs` component is finalized. Use placeholder 1280x800 PNG files in `/public/screenshots/` as stubs during development; replace with real captures before verification.

2. **Nav "Join waitlist" button scroll behavior**
   - What we know: CONTEXT.md says "no section anchor links" in the nav.
   - What's unclear: Whether the nav "Join waitlist" CTA should scroll to the hero form or open a modal/sheet.
   - Recommendation: Scroll to the hero email input using `document.getElementById('waitlist-hero').scrollIntoView()` — simpler than a modal, matches the "no separate page" decision.

3. **Resend sender domain for production**
   - What we know: STATE.md flags this as a pre-Phase-4 blocker. Current sender is `onboarding@resend.dev`.
   - What's unclear: Whether a custom sender domain is set up in Resend dashboard.
   - Recommendation: Use `onboarding@resend.dev` in code. Add a `// TODO: update from address when custom domain verified` comment. This is an ops concern, not a code concern.

---

## Implementation Plan Summary

The phase requires exactly 3 new files, 1 modified file, 1 new migration, and screenshot assets:

| File | Action | Notes |
|------|--------|-------|
| `src/app/page.tsx` | Replace entirely | Marketing landing page — Server Component |
| `src/components/landing/WaitlistForm.tsx` | Create | `'use client'` island for email input |
| `src/components/landing/ScreenshotTabs.tsx` | Create | `'use client'` island for tabbed screenshots |
| `src/app/api/waitlist/route.ts` | Create | POST handler: save email + send confirmation |
| `src/lib/email.ts` | Add function | `sendWaitlistConfirmationEmail()` |
| `supabase/migrations/003_waitlist.sql` | Create | `waitlist` table + service-role-only RLS |
| `/public/screenshots/*.png` | Capture | query.png, brief.png, export.png |

No middleware changes. No layout changes. No changes to auth flow. No new npm packages.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/email.ts` — established Resend pattern (lazy-init, fire-and-forget, inline HTML)
- Existing codebase: `src/lib/supabase/admin.ts` — admin client for service-role writes
- Existing codebase: `src/app/api/billing/webhook/route.ts` — idempotency via `ON CONFLICT`/`23505` error code handling
- Existing codebase: `src/components/billing/PlanCard.tsx` — Recommended badge, feature list, pricing card visual pattern
- Existing codebase: `src/app/(auth)/login/page.tsx` — Wordmark pattern, inline success state (magic link sent pattern), controlled email input
- Existing codebase: `src/app/layout.tsx` — Syne font variable `--font-syne` confirmed available
- Existing codebase: `src/app/globals.css` — `animate-fade-in-up` already defined
- `.planning/STATE.md` — RESEND_API_KEY blocker documented, `onboarding@resend.dev` current sender
- `.planning/REQUIREMENTS.md` — LAND-01 through LAND-04 requirements

### Secondary (MEDIUM confidence)
- `package.json` — confirmed no Framer Motion, no react-email, no animation library installed; zero new dependencies required

### Tertiary (LOW confidence)
- None — all findings grounded in codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed via `package.json` inspection
- Architecture patterns: HIGH — all patterns derived from existing working code in the codebase
- Pitfalls: HIGH — middleware pitfall confirmed by file-system check (no middleware.ts exists); screenshot pitfall is structural; Resend domain explicitly documented in STATE.md
- Implementation scope: HIGH — exact file count and modification list verified against directory structure

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable stack — Next.js 16, Resend SDK, Supabase JS are stable releases)
