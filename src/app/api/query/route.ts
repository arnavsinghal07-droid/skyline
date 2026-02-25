import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SSEEvent =
  | { type: 'status'; message: string }
  | { type: 'delta';  text: string }
  | { type: 'result'; data: QueryResult; queryId: string | null }
  | { type: 'error';  message: string }

export interface QueryResult {
  recommendation: string
  evidence: Array<{
    quote: string
    customer_name: string
    source_type: string
  }>
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------
type Document = {
  id: string
  type: string
  metadata: Record<string, string> | null
}

function buildPrompt(documents: Document[], query: string): string {
  const signals = documents
    .map((doc, i) => {
      const m = doc.metadata ?? {}
      const date         = m.date          ?? 'unknown date'
      const customer     = m.customer_name ?? 'unknown customer'
      const sourceType   = m.source_type   ?? doc.type
      const content      = m.content       ?? '(no content)'
      return `[${i + 1}] Date: ${date} | Customer: ${customer} | Source: ${sourceType}\nContent: ${content}`
    })
    .join('\n\n')

  return `You have access to ${documents.length} customer feedback signal${documents.length !== 1 ? 's' : ''}.

${signals}

---
PM's Question: ${query}

Respond with a JSON object in this EXACT format. Output raw JSON only — no markdown fences, no commentary before or after:

{
  "recommendation": "A clear, actionable recommendation (2–4 sentences)",
  "evidence": [
    {
      "quote": "verbatim excerpt from one of the signals above",
      "customer_name": "the customer name from that signal",
      "source_type": "the source type from that signal"
    },
    {
      "quote": "verbatim excerpt from a second signal",
      "customer_name": "customer name",
      "source_type": "source type"
    },
    {
      "quote": "verbatim excerpt from a third signal",
      "customer_name": "customer name",
      "source_type": "source type"
    }
  ],
  "confidence": "HIGH",
  "reasoning": "Brief explanation of the confidence level and any caveats (1–2 sentences)"
}

Rules:
- Include exactly 3 evidence items. If fewer than 3 relevant signals exist, use the most relevant ones and repeat the best quote if needed.
- Quotes must be verbatim substrings copied directly from the signals above.
- confidence: HIGH = clear signal from 3+ customers | MEDIUM = 1–2 customers or mixed signals | LOW = no relevant signals or conflicting data.`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  // Parse body before opening the stream — body can only be read once
  let query: string
  try {
    const body = await request.json()
    query = (body?.query ?? '').trim()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!query) {
    return new Response('No query provided', { status: 400 })
  }

  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  const send = async (event: SSEEvent) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
  }

  // Run everything asynchronously so we can return the Response immediately
  ;(async () => {
    try {
      const supabase = await createClient()

      // ── Auth ──────────────────────────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        await send({ type: 'error', message: 'Unauthorized' })
        return
      }

      // ── Resolve org ───────────────────────────────────────────────────────
      const { data: profile } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        await send({ type: 'error', message: 'User profile not found. Complete onboarding first.' })
        return
      }

      const { org_id } = profile

      // ── Fetch workspace (for saving the query) ────────────────────────────
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('org_id', org_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      // ── Fetch documents ───────────────────────────────────────────────────
      await send({ type: 'status', message: 'Fetching signals…' })

      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, type, metadata')
        .eq('org_id', org_id)
        .limit(150)
        .order('created_at', { ascending: false })

      if (docsError || !documents || documents.length === 0) {
        await send({
          type: 'error',
          message: 'No signals found. Upload some customer feedback first.',
        })
        return
      }

      await send({ type: 'status', message: `Analysing ${documents.length} signal${documents.length !== 1 ? 's' : ''}…` })

      // ── Call Claude with streaming ────────────────────────────────────────
      console.log('[Sightline] calling Anthropic — model: claude-haiku-4-5-20251001, tokens: 1200')

      let stream: Awaited<ReturnType<typeof anthropic.messages.create>>
      try {
        stream = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system:
            'You are an expert product analyst. Answer PM questions based ONLY on the provided customer feedback signals. Always respond with valid JSON in the exact format requested — no markdown, no prose outside the JSON.',
          messages: [{ role: 'user', content: buildPrompt(documents, query) }],
          stream: true,
        })
      } catch (apiErr) {
        if (apiErr instanceof Anthropic.APIError) {
          console.error('[Sightline] Anthropic APIError', {
            status:  apiErr.status,
            message: apiErr.message,
            error:   apiErr.error,   // full structured error body from the API
            headers: Object.fromEntries(apiErr.headers ?? []),
          })
          await send({
            type: 'error',
            message: `Anthropic API error ${apiErr.status}: ${apiErr.message}`,
          })
        } else {
          console.error('[Sightline] Unexpected error calling Anthropic:', apiErr)
          await send({ type: 'error', message: 'Failed to reach the AI service.' })
        }
        return
      }

      let fullText = ''
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullText += event.delta.text
          await send({ type: 'delta', text: event.delta.text })
        }
      }

      // ── Parse structured response ─────────────────────────────────────────
      let parsed: QueryResult
      try {
        // Strip accidental markdown code fences Claude sometimes adds
        const jsonStr = fullText
          .replace(/^```(?:json)?\s*/m, '')
          .replace(/\s*```\s*$/m, '')
          .trim()
        parsed = JSON.parse(jsonStr)
      } catch {
        await send({ type: 'error', message: 'Failed to parse AI response. Please try again.' })
        return
      }

      // ── Persist to queries table ──────────────────────────────────────────
      let savedQueryId: string | null = null
      if (workspace) {
        const { data: savedQuery } = await supabase.from('queries').insert({
          workspace_id:  workspace.id,
          org_id,
          user_id:       user.id,
          text:          query,
          response_json: parsed,
        }).select('id').single()
        savedQueryId = savedQuery?.id ?? null
      }

      await send({ type: 'result', data: parsed, queryId: savedQueryId })
    } catch (err) {
      await send({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
