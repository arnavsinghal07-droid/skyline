# Technology Stack

**Analysis Date:** 2025-02-25

## Languages

**Primary:**
- TypeScript 5 - Application code, type safety across all `.ts` and `.tsx` files

**Secondary:**
- SQL - Database schema and migrations via PostgreSQL (Supabase)
- Python - Future use for tools directory (pipeline scripts, connectors, evals)

## Runtime

**Environment:**
- Node.js (version specified in `.nvmrc` or package.json engines field - not explicitly set)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router, Server Components, API routes
- React 19.2.3 - UI library
- React DOM 19.2.3 - React rendering

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS 4 - CSS processing via `@tailwindcss/postcss`

**Testing:**
- Not detected - No test framework configured (Jest/Vitest not installed)

**Build/Dev:**
- Next.js CLI - Build and dev server
- TypeScript 5 - Type checking
- ESLint 9 - Linting with `eslint-config-next/16.1.6`
- Babel React Compiler 1.0.0 - Automatic memoization and optimization

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` 0.78.0 - Claude API integration for AI reasoning and brief generation
- `@supabase/supabase-js` 2.97.0 - PostgreSQL database, auth, and realtime client
- `@supabase/ssr` 0.8.0 - Supabase auth session management for Server Components
- `stripe` 20.3.1 - Payment processing (wired in schema, not yet used in code)
- `resend` 6.9.2 - Email delivery (available, not yet integrated)
- `lucide-react` 0.575.0 - Icon component library

**Validation:**
- `zod` 4.3.6 - Runtime schema validation and type inference

## Configuration

**Environment:**
- Variables loaded from `.env.local` (present)
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (in server code only), `ANTHROPIC_API_KEY` (inferred from SDK usage)

**Build:**
- `next.config.ts` - Next.js configuration with React Compiler enabled (`reactCompiler: true`)
- `tsconfig.json` - TypeScript compiler options with `@/*` path alias pointing to `./src/*`

**Linting:**
- `.eslintrc.json` - Not detected (using default ESLint Next.js config)

## Platform Requirements

**Development:**
- Node.js 18+ (implied by Next.js 16 and React 19)
- Supabase project (cloud-hosted PostgreSQL with auth)
- Anthropic API key for Claude models

**Production:**
- Deployment target: Vercel (inferred from Next.js 16 default) or any Node.js-compatible platform
- Requires Supabase project accessible via `NEXT_PUBLIC_SUPABASE_URL`
- Requires Anthropic API key accessible in environment

---

*Stack analysis: 2025-02-25*
