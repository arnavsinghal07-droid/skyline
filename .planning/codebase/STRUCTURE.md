# Codebase Structure

**Analysis Date:** 2025-02-25

## Directory Layout

```
pm-copilot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (not protected)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/        # Protected pages (require profile)
│   │   │   ├── dashboard/
│   │   │   ├── query/
│   │   │   ├── briefs/
│   │   │   ├── decisions/
│   │   │   ├── sources/
│   │   │   └── layout.tsx      # Auth guard + sidebar
│   │   ├── api/                # HTTP API routes
│   │   │   ├── query/
│   │   │   ├── briefs/
│   │   │   ├── decisions/
│   │   │   ├── sources/
│   │   │   ├── onboard/
│   │   │   └── auth/
│   │   ├── onboard/            # Onboarding flow
│   │   ├── auth/callback/      # Supabase auth redirect
│   │   ├── page.tsx            # Landing page (/)
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css
│   ├── components/
│   │   └── dashboard/
│   │       └── sidebar.tsx     # Navigation sidebar
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # Browser Supabase client
│   │       ├── server.ts       # Server Supabase client (async)
│   │       └── admin.ts        # Service-role client (onboarding only)
│   ├── proxy.ts                # Middleware: auth session refresh
│   └── middleware.ts           # NOT FOUND — proxy.ts is the middleware
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # 9 tables, RLS policies, auth helpers
├── public/                     # Static assets
├── .env.local                  # Environment configuration (not committed)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
└── CLAUDE.md                   # Project instructions

```

## Directory Purposes

**`src/app/(auth)/`:**
- Purpose: Login and signup pages (no auth required to access)
- Contains: `page.tsx` files for `/login` and `/signup`
- Key files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- Notes: Layout wraps these pages

**`src/app/(dashboard)/`:**
- Purpose: Protected pages that require successful onboarding
- Contains: Pages for dashboard, query, briefs, decisions, sources
- Key files: `src/app/(dashboard)/layout.tsx` (auth guard + sidebar render)
- Notes: Layout checks auth and profile, redirects if missing

**`src/app/api/`:**
- Purpose: HTTP route handlers for all business logic
- Contains: POST/GET handlers for query, brief generation, decision logging, onboarding
- Key routes:
  - `query/route.ts` — SSE streaming discovery query
  - `briefs/generate/route.ts` — Generate brief from query result
  - `briefs/save/route.ts` — Persist brief to DB
  - `briefs/route.ts` — Fetch user's briefs
  - `decisions/route.ts` — POST to log decision, GET to fetch timeline
  - `decisions/[id]/route.ts` — PATCH to update decision outcome
  - `onboard/route.ts` — POST to create org/user/workspace
  - `sources/upload/route.ts` — CSV upload (stub)

**`src/components/dashboard/`:**
- Purpose: Reusable sub-components for dashboard
- Contains: `sidebar.tsx` (main navigation)
- Notes: Most UI components are inline in pages (not extracted yet)

**`src/lib/supabase/`:**
- Purpose: Supabase client factories and utilities
- Contains:
  - `client.ts` — Browser client (createBrowserClient)
  - `server.ts` — Server client (async, wraps await cookies())
  - `admin.ts` — Service-role client for privileged operations
- Notes: Used by every API route and protected page

**`supabase/migrations/`:**
- Purpose: Database schema and RLS policies
- Contains: `001_initial_schema.sql` with 9 tables
- Key tables:
  - `organizations` — Company/workspace (created via service role)
  - `users` — User profile (mirrors auth.users.id)
  - `workspaces` — Product workspace within org
  - `documents` — Ingested signals (CSV, calls, etc.)
  - `chunks` — Vector chunks from documents (metadata + qdrant_id)
  - `queries` — PM questions + AI responses (stored as JSONB)
  - `briefs` — Feature briefs (content_json stored as JSONB)
  - `decisions` — Product decisions linked to briefs
  - `sources` — Data source connectors

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` — Landing page (/)
- `src/app/layout.tsx` — Root HTML, fonts, metadata
- `src/app/(dashboard)/layout.tsx` — Auth guard + sidebar for all dashboard pages

**Configuration:**
- `next.config.ts` — Next.js config
- `tsconfig.json` — TypeScript config
- `package.json` — Dependencies, build scripts
- `.env.local` — Environment variables (Supabase keys, Anthropic API key)

**Core Logic:**
- `src/app/api/query/route.ts` — Discovery query orchestration (250 lines)
- `src/app/api/briefs/generate/route.ts` — Brief generation (110 lines)
- `src/lib/supabase/server.ts` — Server auth client setup

**Frontend Pages:**
- `src/app/(dashboard)/query/page.tsx` — Main query interface (620 lines, complex)
- `src/app/(dashboard)/briefs/page.tsx` — Brief list + detail view (390 lines)
- `src/app/(dashboard)/decisions/page.tsx` — Decision timeline (435 lines)
- `src/app/(dashboard)/dashboard/page.tsx` — Overview stats (120 lines)

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout wrappers: `layout.tsx`
- API routes: `route.ts` (Next.js convention)
- Sub-components: PascalCase, e.g. `Sidebar` → `sidebar.tsx`
- Utilities: camelCase, e.g. `createClient` → `client.ts`

**Directories:**
- Route grouping: Wrapped in parentheses, e.g. `(auth)`, `(dashboard)`
- Dynamic routes: Square brackets, e.g. `[id]` for `decisions/[id]/route.ts`
- Feature directories: Lowercase, e.g. `api`, `components`, `lib`

**Functions:**
- API route handlers: `GET`, `POST`, `PATCH` (Next.js convention)
- Helpers: camelCase, e.g. `buildPrompt()`, `readStream()`
- Components: PascalCase, e.g. `ConfidenceBadge()`, `BriefPanel()`

**Variables:**
- State: camelCase, e.g. `phase`, `saveState`, `selectedId`
- Constants: SCREAMING_SNAKE, e.g. `CONFIDENCE_STYLES`, `ROLE_MAP`
- Types: PascalCase or camelCase (mixed), e.g. `QueryResult`, `BriefContent`, `DecisionRow`

**Types:**
- Interfaces: PascalCase with suffix `Schema` rarely used (no Zod yet)
- Inline types per file (not centralized)

## Where to Add New Code

**New Feature (e.g., "Interview Guide Generator"):**
- API handler: `src/app/api/guides/generate/route.ts`
- Page: `src/app/(dashboard)/guides/page.tsx`
- Database table: Add to `supabase/migrations/002_add_guides.sql`
- Supabase types: Update via introspection

**New Component/Module:**
- Reusable sub-component: `src/components/[feature]/ComponentName.tsx`
- Form components: Inline in page files until extracted
- Utilities: `src/lib/[feature]/helper.ts` if shareable

**Utilities:**
- Shared helpers across routes: `src/lib/[name].ts`
- Supabase-specific: `src/lib/supabase/[helper].ts`
- Type-only modules: Inline near usage (not a separate types/ dir)

**Styling:**
- All inline with Tailwind classes
- Dark theme colors: `bg-[#09090e]`, `bg-[#0d0d15]`, `text-white/70`
- Component library: Not used; building UI from primitives

**Tests:**
- Not present in current codebase
- When needed: Co-located `*.test.ts` or `*.spec.ts` files
- Test runner: None configured yet

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (in .gitignore)

**`.planning/codebase/`:**
- Purpose: GSD mapping documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: By `/gsd:map-codebase` command
- Committed: Yes (for reference)

**`supabase/`:**
- Purpose: Database migrations and config
- Generated: No (manually written)
- Committed: Yes (schema is source of truth)

**`.env.local`:**
- Purpose: Local environment variables (secrets, API keys)
- Generated: No (manually created)
- Committed: No (in .gitignore)

## Component Structure Pattern

**Page components** (Server Components by default):

```tsx
// src/app/(dashboard)/[feature]/page.tsx
'use client'  // Only if interactive

import { createClient } from '@/lib/supabase/server'

export default async function FeaturePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch data
  const { data } = await supabase.from('table').select()

  return (
    <div>
      {/* Page content */}
    </div>
  )
}
```

**Sub-components** (Client Components):

```tsx
// src/components/dashboard/SubComponent.tsx
'use client'

import { useState } from 'react'

export default function SubComponent() {
  const [state, setState] = useState()

  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

**API routes** (always Server-side):

```tsx
// src/app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Handle request
  return NextResponse.json({ result })
}
```

## State Management Pattern

**UI state:** Local React hooks per page or component
```tsx
const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
const [error, setError] = useState('')
const [data, setData] = useState<Data | null>(null)
```

**Auth state:** Managed by Supabase (session in cookies, accessed via `supabase.auth.getUser()`)

**Database mutations:** Direct fetch() calls to API routes, manual state update in UI

**Server state (data fetching):** No React Query; direct Supabase queries in Server Components

## Tailwind Styling Pattern

**Dark theme palette:**
- Background: `bg-[#09090e]` (main), `bg-[#0d0d15]` (cards)
- Text: `text-white` (primary), `text-white/70` (secondary), `text-white/25` (tertiary)
- Borders: `border-white/[0.07]` (subtle), `border-white/[0.12]` (emphasized)
- Accents: `text-emerald-400` (high confidence), `text-amber-400` (medium), `text-red-400` (low)

**Interactive states:**
```tsx
className={`
  bg-white/[0.04] border border-white/[0.08]
  hover:bg-white/[0.08] hover:border-white/[0.15]
  disabled:opacity-40 disabled:cursor-not-allowed
`}
```

---

*Structure analysis: 2025-02-25*
