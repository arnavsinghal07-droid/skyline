import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

interface DiscoveredCompetitor {
  name: string
  description: string
  g2_slug: string | null
  capterra_slug: string | null
  relevance: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let company: string | undefined
  let product: string | undefined
  let industry: string | undefined
  let description: string | undefined

  try {
    const body = await request.json()
    company = body.company?.trim()
    product = body.product?.trim()
    industry = body.industry?.trim()
    description = body.description?.trim()

    if (!company && !product && !industry && !description) {
      return NextResponse.json(
        { error: 'Provide at least one of: company, product, industry, or description' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const contextParts: string[] = []
  if (company) contextParts.push(`Company: ${company}`)
  if (product) contextParts.push(`Product: ${product}`)
  if (industry) contextParts.push(`Industry: ${industry}`)
  if (description) contextParts.push(`Description: ${description}`)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Given the following company/product context, identify 5-8 direct competitors that a product manager would want to track.

${contextParts.join('\n')}

Return JSON array only — no markdown, no explanation:
[
  {
    "name": "Competitor Name",
    "description": "One sentence describing what they do and why they compete",
    "g2_slug": "their-g2-url-slug or null if unknown",
    "capterra_slug": "their-capterra-url-slug or null if unknown",
    "relevance": "direct | adjacent | emerging"
  }
]

Rules:
- Focus on real, well-known competitors in the space
- g2_slug is the slug from g2.com/products/{slug} — use lowercase-hyphenated format
- capterra_slug is the slug from capterra.com/p/{id}/{slug} — use lowercase-hyphenated format
- If you're not confident about a slug, set it to null
- "direct" = same core product, "adjacent" = overlapping features, "emerging" = newer entrant
- Order by relevance (direct first)
- Only return competitors you're confident about — don't fabricate companies`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
    const competitors = JSON.parse(cleaned) as DiscoveredCompetitor[]

    if (!Array.isArray(competitors)) {
      return NextResponse.json({ competitors: [] })
    }

    return NextResponse.json({
      competitors: competitors.slice(0, 8).filter(c => c.name && c.description)
    })
  } catch (err) {
    console.error('[Sightline] Competitor discovery failed:', err)
    return NextResponse.json({ error: 'Discovery failed. Please try again.' }, { status: 500 })
  }
}
