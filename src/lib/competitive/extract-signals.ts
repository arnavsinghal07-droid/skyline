import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedSignal } from './types'

const anthropic = new Anthropic()

/**
 * Extract structured competitive signals from raw review text using Haiku.
 * Shared by both scrape and CSV paths — same extraction regardless of source.
 */
export async function extractCompetitiveSignals(
  reviewText: string,
  competitorName: string
): Promise<ExtractedSignal[]> {
  if (!reviewText || reviewText.trim().length === 0) {
    return []
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract structured signals from this ${competitorName} customer review.

Review: ${reviewText}

Return JSON array only — no markdown, no explanation:
[
  {
    "quote": "verbatim excerpt from review (max 200 chars)",
    "signal_type": "pain_point | switching_reason | feature_request | positive_mention"
  }
]

Rules:
- Only include quotes that are clearly one of the four signal types
- pain_point: complaint, frustration, limitation about ${competitorName}
- switching_reason: explicit mention of switching away from ${competitorName}
- feature_request: request for something ${competitorName} lacks
- positive_mention: explicit praise that reveals what users value (useful for gap analysis)
- Max 5 signals per review
- Return [] if no clear signals`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()

    const parsed = JSON.parse(cleaned) as ExtractedSignal[]

    if (!Array.isArray(parsed)) {
      console.log('[Sightline] Haiku extraction returned non-array, returning empty')
      return []
    }

    // Validate and limit to 5 signals
    return parsed.slice(0, 5).filter(
      (s) => s.quote && typeof s.quote === 'string' && s.signal_type
    )
  } catch (err) {
    console.error('[Sightline] Haiku extraction failed:', err)
    return []
  }
}
