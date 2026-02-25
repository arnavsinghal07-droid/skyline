# External Integrations

**Analysis Date:** 2025-02-25

## APIs & External Services

**AI / LLM:**
- Claude (Anthropic) - Primary reasoning and brief generation model
  - SDK: `@anthropic-ai/sdk` 0.78.0
  - Model: `claude-haiku-4-5-20251001` (discovery queries, brief generation)
  - Integration: `src/app/api/query/route.ts` (streaming query responses)
  - Integration: `src/app/api/briefs/generate/route.ts` (feature brief generation)
  - Auth: `ANTHROPIC_API_KEY` environment variable

**Email:**
- Resend - Email delivery service
  - SDK: `resend` 6.9.2
  - Status: Installed but not yet integrated in codebase
  - Expected usage: Onboarding confirmations, weekly digests (from CLAUDE.md roadmap)

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser client)
  - Connection: `SUPABASE_SERVICE_ROLE_KEY` (server-side admin operations, in `src/lib/supabase/admin.ts`)
  - Client: `@supabase/supabase-js` 2.97.0 (browser), `@supabase/ssr` 0.8.0 (Server Components)
  - RLS enabled on all tables; scoped to `org_id` for multi-tenant isolation

**Schema Overview:**
- 10 core tables: organizations, users, workspaces, sources, documents, chunks, queries, briefs, decisions, (decisions table referenced)
- All tables include `org_id` foreign key for Row Level Security enforcement
- See `supabase/migrations/001_initial_schema.sql` for full schema definition

**File Storage:**
- Local filesystem only — No cloud storage configured (S3, GCS)
- CSV upload handled in-memory via `src/app/api/sources/upload/route.ts`

**Caching:**
- None detected — No Redis or in-memory cache configured in codebase

**Vector Store:**
- Not yet implemented — Schema includes `chunks.qdrant_id` field but Qdrant integration not present in frontend code
- CLAUDE.md specifies Qdrant hybrid search (dense + sparse) as future component in `tools/pipeline/`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (social login + magic link)
  - Implementation: `src/lib/supabase/client.ts` (browser auth client)
  - Implementation: `src/lib/supabase/server.ts` (server auth client with session refresh)
  - Implementation: `src/middleware.ts` (auth session middleware on every request)
  - Auth callback: `src/app/auth/callback/route.ts` (handles Supabase redirect after OAuth/magic link)
  - User profile created during onboarding via `src/app/api/onboard/route.ts`

**Enterprise SSO:**
- WorkOS - Planned for Phase 3 (SAML) per CLAUDE.md, not yet integrated

## Monitoring & Observability

**Error Tracking:**
- Not detected — No Sentry, Rollbar, or similar service integrated

**Logs:**
- Console logging only via `console.log()` and `console.error()` in API routes
- Example: `src/app/api/query/route.ts` line 167 logs Claude API calls and errors

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured — Likely Vercel (default for Next.js) or self-hosted Node.js

**CI Pipeline:**
- Not detected — No GitHub Actions, GitLab CI, or similar configured

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public, safe in browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public, safe in browser)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret, server-only, never exposed to browser)
- `ANTHROPIC_API_KEY` - Claude API authentication (secret, server-only)

**Optional env vars:**
- `STRIPE_SECRET_KEY` - Not yet used (installed but not integrated)
- `RESEND_API_KEY` - Not yet used (installed but not integrated)

**Secrets location:**
- `.env.local` file (present but not read per security policy)
- Never commit `.env*` files to version control

## Webhooks & Callbacks

**Incoming:**
- Auth callback: `src/app/auth/callback/route.ts` - Handles Supabase OAuth/magic link redirects

**Outgoing:**
- None detected in current code
- Future planned: Signal loop closer may emit webhooks for monitoring shipped features (CLAUDE.md roadmap)

## Future Integrations (From CLAUDE.md Roadmap)

**Connectors (Not yet implemented):**
- Gong - Call recording ingestion
- Zoom - Meeting recording ingestion
- Intercom - Customer support tickets
- Zendesk - Support ticket platform
- Mixpanel - Product usage analytics
- Amplitude - Product usage analytics

**Export Targets (Not yet implemented):**
- Linear - Issue tracking
- Notion - Documentation
- Jira - Project management
- Cursor / Claude Code - Coding agents

**Vector Search (Not yet implemented):**
- Qdrant - Hybrid semantic + keyword search for chunk retrieval
- OpenAI text-embedding-3-large - Embedding model (planned per CLAUDE.md)

---

*Integration audit: 2025-02-25*
