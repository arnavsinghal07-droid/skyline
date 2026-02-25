# Architecture

**Analysis Date:** 2025-02-25

## Pattern Overview

**Overall:** Next.js 16 SSR monolith with streaming API responses and server-side authentication.

**Key Characteristics:**
- Next.js App Router with Server Components for auth-protected pages
- Supabase Auth (magic link + social) with RLS-enforced multi-tenancy
- Streaming event sources (SSE) for long-running AI operations
- Client-driven state management using React hooks (Zustand not yet adopted)
- Direct Anthropic SDK calls from API routes with no middleware layer

## Layers

**Presentation (Frontend):**
- Purpose: Render UI and orchestrate user interactions
- Location: `src/app/(auth)/` and `src/app/(dashboard)/`
- Contains: Next.js page components (Server and Client), sub-components
- Depends on: Supabase client for auth queries, API routes for data
- Used by: Web browser clients

**API (Backend):**
- Purpose: Handle HTTP requests, call external APIs (Anthropic), persist to database
- Location: `src/app/api/`
- Contains: Route handlers, request validation, AI orchestration
- Depends on: Supabase server client, Anthropic SDK, database schema
- Used by: Frontend pages via fetch(), streaming clients

**Authentication & Session:**
- Purpose: Manage auth state, refresh tokens, enforce RLS
- Location: `src/lib/supabase/` (client, server) and `src/proxy.ts`
- Contains: Supabase client factories, session middleware
- Depends on: Next.js headers/cookies APIs, Supabase SDK
- Used by: All pages and API routes

**Data Access (Supabase/PostgreSQL):**
- Purpose: Persist and retrieve user data with multi-tenant isolation
- Location: `supabase/migrations/001_initial_schema.sql`
- Contains: 9 tables with RLS policies scoped to `org_id`
- Depends on: PostgreSQL, Supabase Auth
- Used by: All API routes and Server Components

## Data Flow

**Authentication & Onboarding:**

1. User visits login page (`src/app/(auth)/login/page.tsx`)
2. Clicks magic link → Supabase Auth handles redirect
3. Middleware (`src/proxy.ts`) intercepts, calls `supabase.auth.getUser()` to refresh session
4. If user has no profile, redirects to `/onboard` (checked in `src/app/(dashboard)/layout.tsx`)
5. Onboarding form (`src/app/onboard/page.tsx`) POSTs to `src/app/api/onboard/route.ts`
6. API creates org (via service role) + user profile + default workspace
7. User redirected to dashboard

**Query → Brief → Decision Flow:**

1. User types question on Query page (`src/app/(dashboard)/query/page.tsx`)
2. Client calls `POST /api/query` with SSE streaming
3. API route fetches user's org_id, retrieves documents from DB, builds prompt
4. Calls Anthropic with streaming enabled, sends SSE events: status → delta text → result
5. Client parses structured JSON response (recommendation + evidence + confidence)
6. User clicks "Generate Feature Brief" → `POST /api/briefs/generate`
7. API calls Anthropic again with query result + evidence to generate brief structure
8. Brief displayed in side panel, user can "Save Brief" → `POST /api/briefs/save`
9. Brief persisted to `briefs` table, linked to query via `query_id`
10. User clicks "Log Decision" on brief → `POST /api/decisions`
11. Decision created, links brief_id + title + confidence score
12. Decision appears on Decisions page timeline

**State Management:**

- Auth state: Managed by Supabase session (stored in cookies)
- UI state: Local React hooks per page (no global Zustand store yet)
- Async operation state: Loading/error/success flags on individual components
- Database writes: Immediate → server responds with updated row

## Key Abstractions

**Supabase Clients:**
- Purpose: Abstraction for single-tenant (user) vs. multi-tenant (service role) operations
- Examples: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`
- Pattern: Factory functions that return configured clients; server client wraps `await cookies()` from `next/headers`

**SSE Streaming:**
- Purpose: Stream long-running AI operations (query, brief generation) back to client in real-time
- Examples: `src/app/api/query/route.ts` uses TransformStream + TextEncoder
- Pattern: Async function runs in background; sends JSON-encoded events prefixed with `data: `; client reads with `readableStream.getReader()`

**RLS & Multi-Tenancy:**
- Purpose: Enforce org-level data isolation at the database level, not in code
- Examples: Every table has `org_id` column; Postgres RLS policies check `public.auth_user_org_id()` function
- Pattern: All queries automatically scoped to authenticated user's org; no per-request org parameter needed

**Type-Safe API Payloads:**
- Purpose: Ensure request/response shape consistency
- Examples: `QueryResult` in `src/app/api/query/route.ts`, `BriefContent` in `src/app/api/briefs/generate/route.ts`
- Pattern: Inline TypeScript interfaces per route file; no shared schema validation layer yet (Zod not used in codebase)

## Entry Points

**Web App:**
- Location: `src/app/layout.tsx` (root)
- Triggers: Browser navigation to `/`
- Responsibilities: Loads fonts, sets metadata, renders children

**Auth Guard:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Navigation to `/dashboard`, `/query`, `/briefs`, `/decisions`
- Responsibilities: Checks if user is authenticated and has profile; redirects to `/login` or `/onboard`

**Middleware:**
- Location: `src/proxy.ts` (Next.js middleware, not in App Router)
- Triggers: Every request matching glob pattern (excludes static assets)
- Responsibilities: Refreshes Supabase auth session by calling `getUser()`

**API Routes:**
- `POST /api/query` — Run discovery query with streaming
- `POST /api/briefs/generate` — Generate feature brief from query result
- `POST /api/briefs/save` — Persist brief to database
- `GET /api/briefs` — Fetch user's briefs with linked query data
- `POST /api/decisions` — Log a decision linked to a brief
- `GET /api/decisions` — Fetch user's decisions timeline
- `PATCH /api/decisions/[id]` — Update decision outcome
- `POST /api/onboard` — Create org/user/workspace on first login
- `POST /api/sources/upload` — Upload CSV signals (not yet implemented)
- `POST /api/auth/callback` — Handle Supabase auth redirect

## Error Handling

**Strategy:** Try-catch blocks per route handler; structured error responses as JSON

**Patterns:**

- **Validation errors:** Return 400 with `{ error: "message" }`
- **Auth errors:** Return 401 for missing user; 404 for missing profile
- **Anthropic API errors:** Log to console, send SSE error event or JSON error response
- **Database errors:** Log error, return 500 with generic message (error details not exposed)
- **Client error recovery:** Show inline error UI; provide "Try Again" button to retry

**Streaming error handling:** If error occurs mid-stream, send `{ type: 'error', message: '...' }` SSE event before closing stream

## Cross-Cutting Concerns

**Logging:** Console.log statements in API routes (search `console.log` for patterns like `[Sightline]` prefix)

**Validation:** Inline `.trim()` and falsy checks per route; no centralized validation schema library

**Authentication:** Supabase Auth via session cookies; `supabase.auth.getUser()` called on every protected route and middleware

**Multi-tenancy:** RLS policies at database level; `public.auth_user_org_id()` function resolves current user's org; all queries implicit scoped

**Streaming:** Next.js TransformStream API with JSON-encoded SSE lines; client parses with custom `readStream()` helper

**Styling:** Tailwind CSS with custom color palette (`bg-[#09090e]`, `text-white/70`); dark theme only

---

*Architecture analysis: 2025-02-25*
