import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { BriefContent } from '../generate/route'

const anthropic = new Anthropic()

type EnrichedSections = {
  context_block: string
  edge_cases: string[]
  suggested_file_paths: string[]
}

function buildExportEnrichmentPrompt(content: BriefContent, queryText: string): string {
  return `You are generating the AI-enriched sections of a coding agent handoff package.

Feature Brief:
- Problem: ${content.problem_statement}
- Solution: ${content.proposed_solution}
- User Stories: ${content.user_stories.map(s => `As a ${s.role}, I want ${s.action} so that ${s.outcome}`).join('; ')}
- Out of Scope: ${content.out_of_scope.join('; ')}
- UI Screens: ${content.ui_direction!.screens.map(s => s.screen_name).join(', ')}

Original PM Query: ${queryText}

Respond with a JSON object in this EXACT format — no markdown, no commentary:

{
  "context_block": "2-3 sentences of product background explaining what this feature does, why it matters, and what existing system it touches. Written for a coding agent who needs to understand the codebase context before implementing.",
  "edge_cases": [
    "- [ ] Edge case description 1",
    "- [ ] Edge case description 2"
  ],
  "suggested_file_paths": [
    "src/components/FeatureName/FeatureComponent.tsx",
    "src/app/api/feature-route/route.ts"
  ]
}

Rules:
- context_block: derive from the problem statement, proposed solution, and query — do not invent facts not present in the brief
- edge_cases: 4-6 items as markdown checklist strings starting with "- [ ]"; pull from out_of_scope items, failure modes of the UI interactions, and common edge cases for this feature type; do not fabricate scenarios unrelated to the brief
- suggested_file_paths: 3-6 paths inferred from the feature type and Next.js App Router conventions (src/app/ for routes, src/components/ for UI, src/lib/ for utilities, src/app/api/ for API routes); make them directionally correct for this feature`
}

function deriveBriefTitle(content: BriefContent): string {
  // Extract a short title from the proposed solution (first sentence, capped at 80 chars)
  const firstSentence = content.proposed_solution.split(/\.\s/)[0] ?? content.proposed_solution
  return firstSentence.slice(0, 80).replace(/\.$/, '').trim()
}

function assembleMarkdown(
  content: BriefContent,
  enriched: EnrichedSections,
  meta: { title: string; query: string; confidence: string; date: string }
): string {
  // --- Section 4: UI Direction ---
  const uiDirectionMd = content.ui_direction!.screens.map(screen => {
    const changesBlock = screen.changes.map(c => `- ${c.text}`).join('\n')
    const newComps = screen.new_components.length > 0
      ? screen.new_components.join(', ')
      : 'None'
    const interactions = screen.interactions.length > 0
      ? screen.interactions.map(i => `- ${i}`).join('\n')
      : '- None specified'

    return `### ${screen.screen_name}

**Changes:**
${changesBlock}

**New Components:** ${newComps}

**Interactions:**
${interactions}`
  }).join('\n\n')

  // --- Section 5: Data Model Hints (SQL DDL with normalized newlines) ---
  const dataModelMd = content.data_model_hints!.map(hint => {
    const normalizedDDL = hint.ddl.replace(/\\n/g, '\n')
    return `### ${hint.feature_group}

\`\`\`sql
${normalizedDDL}
\`\`\``
  }).join('\n\n')

  // --- Assemble full package ---
  return `# ${meta.title}

**Generated:** ${meta.date}
**Source Query:** ${meta.query}
**Confidence:** ${meta.confidence}

---

## 1. Context Block

${enriched.context_block}

---

## 2. Feature Description

${content.proposed_solution}

---

## 3. Acceptance Criteria

${content.user_stories.map(s =>
  `- [ ] As a ${s.role}, I can ${s.action} so that ${s.outcome}`
).join('\n')}

---

## 4. UI Direction

${uiDirectionMd}

---

## 5. Data Model Hints

${dataModelMd}

---

## 6. Edge Cases

${enriched.edge_cases.join('\n')}

---

## 7. Suggested File Paths

${enriched.suggested_file_paths.map(p => `- \`${p}\``).join('\n')}
`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate request body
  let briefId: string
  let content: BriefContent
  let queryText: string
  let confidence: string
  try {
    const body = await request.json()
    briefId = body.briefId
    content = body.content
    queryText = (body.queryText ?? '').trim()
    confidence = body.confidence ?? 'MEDIUM'
    if (!content || !queryText) {
      return NextResponse.json({ error: 'Missing content or queryText' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // v2 guard — defense in depth (client also checks)
  if (
    !content.ui_direction ||
    !content.ui_direction.screens.length ||
    !content.data_model_hints ||
    !content.data_model_hints.length
  ) {
    return NextResponse.json(
      { error: 'Export requires a v2 brief with UI Direction and Data Model Hints' },
      { status: 400 }
    )
  }

  let enriched: EnrichedSections

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system:
        'You are a coding assistant. Generate the AI-enriched sections of a coding agent handoff package. Always respond with valid JSON in the exact format requested.',
      messages: [{ role: 'user', content: buildExportEnrichmentPrompt(content, queryText) }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonStr = rawText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim()

    if (message.stop_reason === 'max_tokens') {
      throw new Error('Enrichment truncated')
    }

    enriched = JSON.parse(jsonStr) as EnrichedSections

    // Validate structure
    if (
      !enriched.context_block ||
      !Array.isArray(enriched.edge_cases) ||
      !Array.isArray(enriched.suggested_file_paths)
    ) {
      throw new Error('Invalid enrichment structure')
    }
  } catch {
    // Graceful fallback — export still works without enrichment
    enriched = {
      context_block: content.problem_statement,
      edge_cases: content.out_of_scope.map(item => `- [ ] Handle case: ${item}`),
      suggested_file_paths: ['src/components/', 'src/app/api/', 'src/lib/'],
    }
  }

  const title = deriveBriefTitle(content)
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const markdown = assembleMarkdown(content, enriched, {
    title,
    query: queryText,
    confidence,
    date,
  })

  // briefId is accepted for audit purposes — not used to fetch
  void briefId

  return NextResponse.json({ markdown, title })
}
