import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { QueryResult } from '@/app/api/query/route'
import type { BriefContent } from '@/app/api/briefs/generate/route'

const anthropic = new Anthropic()

// Valid section names that can be regenerated
const VALID_SECTIONS: Array<keyof BriefContent> = [
  'problem_statement',
  'proposed_solution',
  'user_stories',
  'success_metrics',
  'out_of_scope',
  'ui_direction',
  'data_model_hints',
]

function buildSectionPrompt(
  section: string,
  query: string,
  queryResult: QueryResult,
  evidenceText: string,
  existingBrief: BriefContent
): string {
  const sectionShapes: Record<string, string> = {
    problem_statement: `{ "value": "A clear 2-3 sentence description of the customer problem" }`,
    proposed_solution: `{ "value": "A concrete 2-3 sentence description of what should be built" }`,
    user_stories: `{ "value": [
  { "role": "user role", "action": "what they want to do", "outcome": "the benefit they get" }
] }`,
    success_metrics: `{ "value": ["Specific, measurable metric 1", "Specific, measurable metric 2"] }`,
    out_of_scope: `{ "value": ["Thing explicitly not included 1", "Thing explicitly not included 2"] }`,
    ui_direction: `{ "value": {
  "screens": [
    {
      "screen_name": "Name of the affected screen",
      "changes": [
        {
          "text": "Description of the specific UI change",
          "signal_count": 2,
          "confidence": "HIGH",
          "low_evidence": false
        }
      ],
      "new_components": ["ComponentName1"],
      "interactions": ["Clicking X does Y"]
    }
  ]
} }`,
    data_model_hints: `{ "value": [
  {
    "feature_group": "Feature name grouping these changes",
    "ddl": "CREATE TABLE example (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  -- Rationale as inline comment\\n  field_name TEXT NOT NULL\\n);\\nCREATE INDEX ON example (field_name);"
  }
] }`,
  }

  const sectionRules: Record<string, string> = {
    ui_direction: `
- Write 1-3 screens — only include screens directly affected by this feature
- For each UI change, set signal_count to how many of the provided evidence items support it (max: number of evidence items). Set confidence to HIGH if 3+, MED if 2, LOW if 1
- Set low_evidence to true when signal_count is 1
- Every UI change MUST be grounded in the provided evidence — do not fabricate changes unsupported by the evidence`,
    data_model_hints: `
- Write DDL in PostgreSQL syntax with inline -- comments explaining WHY each field exists
- Include CREATE INDEX for all foreign key columns and commonly queried fields
- Group related table changes under one feature_group (e.g. 'Onboarding tracking') — group by feature purpose, not by table
- Escape newlines in DDL strings as \\n`,
    user_stories: `
- Write exactly 3 user stories`,
    success_metrics: `
- Write 3-4 success metrics (quantitative where possible, e.g. "Reduce onboarding drop-off by 30%")`,
    out_of_scope: `
- Write 3-4 out-of-scope items that prevent scope creep`,
  }

  const shape = sectionShapes[section] ?? `{ "value": ... }`
  const extraRules = sectionRules[section] ?? ''

  return `You are regenerating ONLY the ${section} section of an existing feature brief.

Here is the full existing brief for context:
${JSON.stringify(existingBrief, null, 2)}

Here is the original PM question: ${query}

Here is the supporting evidence:
${evidenceText}

Confidence: ${queryResult.confidence}
Reasoning: ${queryResult.reasoning}

Regenerate ONLY the "${section}" section. Respond with JSON in this exact shape — no markdown, no prose outside the JSON:

${shape}

Rules:
- Ground the regenerated section in the evidence above — do not fabricate requirements${extraRules}`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let section: string
  let queryResult: QueryResult
  let query: string
  let existingBrief: BriefContent
  try {
    const body = await request.json()
    section = body.section
    queryResult = body.queryResult
    query = (body.query ?? '').trim()
    existingBrief = body.existingBrief
    if (!section || !queryResult || !query || !existingBrief) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!VALID_SECTIONS.includes(section as keyof BriefContent)) {
      return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const evidenceText = queryResult.evidence
    .map((e, i) => `[${i + 1}] "${e.quote}" — ${e.customer_name} (${e.source_type})`)
    .join('\n')

  const sectionPrompt = buildSectionPrompt(section, query, queryResult, evidenceText, existingBrief)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: 'You are a senior product manager. Regenerate a specific section of a feature brief. Always respond with valid JSON — no markdown, no prose outside the JSON.',
      messages: [{ role: 'user', content: sectionPrompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonStr = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: 'Section regeneration hit token limit.', error_code: 'TOKEN_LIMIT' },
        { status: 422 }
      )
    }

    const parsed: { value: unknown } = JSON.parse(jsonStr)
    return NextResponse.json({ section, data: parsed.value })
  } catch (err) {
    console.error('[Sightline] Section regeneration error:', err)
    return NextResponse.json({ error: 'Failed to regenerate section' }, { status: 500 })
  }
}
