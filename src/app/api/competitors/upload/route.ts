import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCsvReviews } from '@/lib/competitive/parse-csv'
import { extractCompetitiveSignals } from '@/lib/competitive/extract-signals'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  // Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const competitorId = formData.get('competitor_id') as string | null

  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (!competitorId) return NextResponse.json({ error: 'Missing competitor_id' }, { status: 400 })

  // Verify competitor belongs to org
  const { data: competitor } = await supabase
    .from('competitors')
    .select('id, name, workspace_id')
    .eq('id', competitorId)
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  // Read CSV content
  const csvText = await file.text()

  // Parse CSV
  let parsedReviews
  try {
    parsedReviews = parseCsvReviews(csvText)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse CSV' },
      { status: 400 }
    )
  }

  // Extract signals and upsert
  let signalsExtracted = 0

  for (const review of parsedReviews) {
    const signals = await extractCompetitiveSignals(review.reviewText, competitor.name)

    for (const signal of signals) {
      const { error: upsertError } = await supabase
        .from('competitive_signals')
        .upsert(
          {
            org_id: profile.org_id,
            workspace_id: competitor.workspace_id,
            competitor_id: competitorId,
            quote: signal.quote,
            signal_type: signal.signal_type,
            source: review.source,
            review_source_id: review.reviewSourceId,
            reviewer_role: signal.reviewer_role ?? review.reviewerRole ?? null,
            company_size: signal.company_size ?? review.companySize ?? null,
            review_date: review.reviewDate ?? null,
          },
          { onConflict: 'competitor_id,review_source_id' }
        )

      if (!upsertError) signalsExtracted++
    }
  }

  return NextResponse.json({
    signals_extracted: signalsExtracted,
    source: parsedReviews[0]?.source ?? 'unknown',
    reviews_processed: parsedReviews.length,
  })
}
