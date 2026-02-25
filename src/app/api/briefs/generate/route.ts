import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { QueryResult } from '@/app/api/query/route'

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
  ]
}

Rules:
- Write exactly 3 user stories
- Write 3-4 success metrics (quantitative where possible, e.g. "Reduce onboarding drop-off by 30%")
- Write 3-4 out-of-scope items that prevent scope creep
- Ground everything in the evidence — do not fabricate requirements`
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
      max_tokens: 1500,
      system:
        'You are a senior product manager. Generate structured feature briefs based on customer research. Always respond with valid JSON in the exact format requested — no markdown, no prose outside the JSON.',
      messages: [{ role: 'user', content: buildBriefPrompt(queryResult, query) }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonStr = rawText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim()

    const brief: BriefContent = JSON.parse(jsonStr)
    return NextResponse.json({ brief })
  } catch (err) {
    console.error('[Sightline] Brief generation error:', err)
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
  }
}
