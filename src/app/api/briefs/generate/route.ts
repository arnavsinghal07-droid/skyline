import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { QueryResult } from '@/app/api/query/route'

export interface UIDirectionScreen {
  screen_name: string
  changes: Array<{
    text: string
    signal_count?: number
    confidence?: 'HIGH' | 'MED' | 'LOW'
    low_evidence?: boolean
  }>
  new_components: string[]
  interactions: string[]
}

export interface UIDirection {
  screens: UIDirectionScreen[]
}

export interface DataModelHint {
  feature_group: string
  ddl: string
}

export interface BriefContent {
  problem_statement: string
  proposed_solution: string
  user_stories: Array<{
    role: string
    action: string
    outcome: string
  }>
  success_metrics: string[]
  out_of_scope: string[]
  ui_direction?: UIDirection
  data_model_hints?: DataModelHint[]
}

function buildBriefPrompt(queryResult: QueryResult, query: string): string {
  const evidenceText = queryResult.evidence
    .map((e, i) => `[${i + 1}] "${e.quote}" — ${e.customer_name} (${e.source_type})`)
    .join('\n')

  return `You are a senior product manager writing a feature brief based on customer research findings.

PM Question: ${query}

Research Finding:
${queryResult.recommendation}

Supporting Evidence:
${evidenceText}

Confidence: ${queryResult.confidence}
Reasoning: ${queryResult.reasoning}

Write a structured feature brief based on these findings. Respond with a JSON object in this EXACT format — no markdown, no commentary:

{
  "problem_statement": "A clear 2-3 sentence description of the customer problem this feature addresses, grounded in the evidence above",
  "proposed_solution": "A concrete 2-3 sentence description of what should be built to solve this problem",
  "user_stories": [
    { "role": "user role", "action": "what they want to do", "outcome": "the benefit they get" },
    { "role": "user role", "action": "what they want to do", "outcome": "the benefit they get" },
    { "role": "user role", "action": "what they want to do", "outcome": "the benefit they get" }
  ],
  "success_metrics": [
    "Specific, measurable metric 1",
    "Specific, measurable metric 2",
    "Specific, measurable metric 3"
  ],
  "out_of_scope": [
    "Thing explicitly not included 1",
    "Thing explicitly not included 2",
    "Thing explicitly not included 3"
  ],
  "ui_direction": {
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
        "new_components": ["ComponentName1", "ComponentName2"],
        "interactions": ["Clicking X does Y", "Form validates on blur"]
      }
    ]
  },
  "data_model_hints": [
    {
      "feature_group": "Feature name grouping these changes",
      "ddl": "CREATE TABLE example (\\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\\n  -- Rationale as inline comment\\n  field_name TEXT NOT NULL\\n);\\nCREATE INDEX ON example (field_name);"
    }
  ]
}

Rules:
- Write exactly 3 user stories
- Write 3-4 success metrics (quantitative where possible, e.g. "Reduce onboarding drop-off by 30%")
- Write 3-4 out-of-scope items that prevent scope creep
- Ground everything in the evidence — do not fabricate requirements
- Write 1-3 screens in ui_direction — only include screens that are directly affected by this feature
- For each UI change, set signal_count to how many of the provided evidence items support it (max: the number of evidence items provided). Set confidence to HIGH if 3+, MED if 2, LOW if 1
- Set low_evidence to true when signal_count is 1
- For data_model_hints, write DDL in PostgreSQL syntax with inline -- comments explaining WHY each field exists
- Include CREATE INDEX for all foreign key columns and commonly queried fields
- Group related table changes under one feature_group (e.g. 'Onboarding tracking') — group by feature purpose, not by table
- Escape newlines in DDL strings as \\n
- Every UI change MUST be grounded in the provided evidence — do not fabricate changes unsupported by the evidence`
}

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let queryResult: QueryResult
  let query: string
  try {
    const body = await request.json()
    queryResult = body.queryResult
    query = (body.query ?? '').trim()
    if (!queryResult || !query) {
      return NextResponse.json({ error: 'Missing queryResult or query' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system:
        'You are a senior product manager. Generate structured feature briefs based on customer research. Always respond with valid JSON in the exact format requested — no markdown, no prose outside the JSON.',
      messages: [{ role: 'user', content: buildBriefPrompt(queryResult, query) }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonStr = rawText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim()

    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json(
        {
          error: 'Brief generation hit the token limit. The brief was truncated and could not be completed.',
          error_code: 'TOKEN_LIMIT',
          partial_text: rawText,
        },
        { status: 422 }
      )
    }

    const brief: BriefContent = JSON.parse(jsonStr)

    const evidenceCount = queryResult.evidence.length
    if (brief.ui_direction) {
      for (const screen of brief.ui_direction.screens) {
        for (const change of screen.changes) {
          if (change.signal_count && change.signal_count > evidenceCount) {
            change.signal_count = evidenceCount
          }
        }
      }
    }

    return NextResponse.json({ brief })
  } catch (err) {
    console.error('[Sightline] Brief generation error:', err)
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
  }
}
