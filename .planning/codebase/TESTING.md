# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Status:** Not configured

- No test framework installed (Jest, Vitest, or other)
- No test files in codebase (no `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`)
- No test configuration files (`jest.config.js`, `vitest.config.ts`, etc.)
- ESLint and TypeScript are configured, but no testing infrastructure

**Recommendation:** Before adding tests, select a framework:
- **Vitest**: Recommended for Next.js 15 + TypeScript (faster, ESM-native, better DX)
- **Jest**: Traditional choice, still widely used with Next.js

## Test Structure (Proposed)

**Location:** Test files should be co-located with source
- Component tests: `src/components/dashboard/sidebar.test.tsx`
- Route tests: `src/app/api/query/route.test.ts`
- Utility tests: `src/lib/supabase/server.test.ts`

**Naming:** `.test.ts` or `.test.tsx` suffix

**Directory structure (if implemented):**
```
src/
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   └── sidebar.test.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── server.test.ts
├── app/
│   └── api/
│       ├── query/
│       │   ├── route.ts
│       │   └── route.test.ts
```

## Test Structure (Current Code Patterns)

While tests are not yet written, the codebase exhibits testable patterns:

**Pure Functions:**
- `buildPrompt(documents, query)` in `src/app/api/query/route.ts` (lines 34-82)
  - Takes input, returns formatted string
  - Deterministic — ideal for unit testing

- `formatDate(iso)` in `src/app/(dashboard)/briefs/page.tsx` (lines 44-50)
  - Converts ISO date to locale string
  - Easy snapshot or assertion testing

- `getConfidence(brief)` in `src/app/(dashboard)/briefs/page.tsx` (lines 52-54)
  - Null-safe extraction of confidence from nested objects
  - Test: verify null handling and correct property access

**Components with State:**
- `QueryPage()` in `src/app/(dashboard)/query/page.tsx`
  - Multiple state variables: `input`, `phase`, `result`, `queryId`, `brief`, `saveState`
  - Event handlers: `handleSubmit()`, `handleGenerateBrief()`, `handleSaveBrief()`, `handleReset()`
  - Testing approach: render with state changes, assert DOM updates

- `BriefsPage()` in `src/app/(dashboard)/briefs/page.tsx`
  - Initial data fetch via `useEffect`
  - State management: `briefs`, `selectedId`, `decisionStates`
  - Testing approach: mock fetch, assert state transitions

**Route Handlers:**
- `POST src/app/api/query/route.ts`
  - Auth check, database query, API call, streaming response
  - Testing approach: mock Supabase and Anthropic SDK, assert response format

- `POST src/app/api/briefs/save/route.ts`
  - Auth, organization resolution, database insert
  - Testing approach: mock Supabase, assert insert parameters

## Mocking Patterns (Recommended)

**Framework:** `vi.mock()` (Vitest) or `jest.mock()` (Jest)

**What to Mock:**
- Anthropic SDK: `@anthropic-ai/sdk`
- Supabase client: `@/lib/supabase/server` and `@/lib/supabase/client`
- Next.js utilities: `next/navigation` (useRouter, usePathname), `next/headers` (cookies)
- Fetch API: for server-side API calls

**Pattern (Vitest example):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    const request = new Request('http://localhost/api/query', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

**What NOT to Mock:**
- Pure utility functions (e.g., `buildPrompt()`, `formatDate()`)
- Zod schemas (validate real schemas)
- Tailwind classes (test behavior, not styling)

## Fixtures and Factories

**Test Data Location:** (Not yet created)
- Recommend: `src/__tests__/fixtures/` or `src/__tests__/factories/`

**Example fixture structure (proposed):**
```typescript
// src/__tests__/fixtures/supabase.ts
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  org_id: 'org-123',
}

export const mockQueryResult = {
  recommendation: 'Add dark mode to reduce eye strain.',
  evidence: [
    {
      quote: 'Users are requesting dark mode',
      customer_name: 'Jane Doe',
      source_type: 'call_recording',
    },
  ],
  confidence: 'HIGH' as const,
  reasoning: 'Multiple customers mentioned this.',
}
```

**Factory pattern (proposed):**
```typescript
// src/__tests__/factories/brief.ts
export function createMockBrief(overrides?: Partial<BriefContent>): BriefContent {
  return {
    problem_statement: 'Users struggle with onboarding.',
    proposed_solution: 'Add an onboarding checklist.',
    user_stories: [
      { role: 'user', action: 'complete onboarding', outcome: 'faster setup' },
    ],
    success_metrics: ['30% reduction in onboarding time'],
    out_of_scope: ['Mobile app'],
    ...overrides,
  }
}
```

## Coverage

**Requirements:** Not enforced (no coverage configuration found)

**Recommended targets (best practices):**
- Unit tests: 80%+ coverage on utilities and route handlers
- Integration tests: All API routes with mock Supabase
- E2E tests: Critical user flows (auth, query, save brief) — considered Phase 2

**View Coverage (when configured):**
```bash
npm run test -- --coverage
# or with Vitest
vitest --coverage
```

## Test Types

**Unit Tests:**
- Scope: Single pure function or component in isolation
- Approach: Test inputs, outputs, and error cases
- Examples:
  - `buildPrompt(documents, query)` returns correct format
  - `formatDate('2024-01-15T10:00:00Z')` returns `'Jan 15, 2024'`
  - `getConfidence(brief)` handles null gracefully

**Integration Tests:**
- Scope: Route handler + mocked external dependencies (Supabase, Anthropic)
- Approach: Verify request → validation → database → response flow
- Examples:
  - POST `/api/query` with valid query → returns 200 with recommendation
  - POST `/api/briefs/save` with invalid queryId → returns 400
  - POST `/api/query` with no auth → returns 401

**E2E Tests:**
- Status: Not yet implemented (Phase 2)
- Framework: Would use Playwright or Cypress
- Scope: Browser automation of full user flows
- Examples:
  - User logs in → uploads CSV → runs query → generates brief
  - User logs in → views saved briefs → logs decision

## Async Testing

**Pattern (Vitest with async handlers):**
```typescript
it('calls Anthropic API and returns result', async () => {
  const mockStream = {
    [Symbol.asyncIterator]: async function* () {
      yield {
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: '{"recommendation": "..."}' },
      }
    },
  }

  const mockAnthropic = {
    messages: {
      create: vi.fn().mockResolvedValue(mockStream),
    },
  }
  ;(Anthropic as any).mockImplementation(() => mockAnthropic)

  const request = new Request('http://localhost/api/query', {
    method: 'POST',
    body: JSON.stringify({ query: 'What should we build?' }),
  })

  const response = await POST(request)
  expect(response.status).toBe(200)
})
```

## Error Testing

**Pattern: Testing error conditions**
```typescript
it('returns 404 if workspace not found', async () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }),
  }
  ;(createClient as any).mockResolvedValue(mockSupabase)

  const request = new Request('http://localhost/api/briefs/save', {
    method: 'POST',
    body: JSON.stringify({ brief: {}, queryId: 'q-123' }),
  })

  const response = await POST(request)
  expect(response.status).toBe(404)
  const json = await response.json()
  expect(json.error).toBe('No workspace found')
})
```

## Test Configuration (Recommended Setup)

**If using Vitest:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // 'jsdom' for component tests
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**If using Jest:**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
}
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "jsdom": "^23.0.0"
  }
}
```

---

*Testing analysis: 2026-02-25*
