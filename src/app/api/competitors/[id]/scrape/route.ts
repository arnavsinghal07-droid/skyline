import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeG2Reviews, scrapeCapterraReviews } from '@/lib/competitive/scrape-reviews'
import { extractCompetitiveSignals } from '@/lib/competitive/extract-signals'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  // Verify competitor belongs to org and has slug(s)
  const { data: competitor } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .single()

  if (!competitor) return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })

  if (!competitor.g2_slug && !competitor.capterra_slug) {
    return NextResponse.json(
      { error: 'Competitor has no G2 or Capterra slug configured' },
      { status: 400 }
    )
  }

  // Create scraping job
  const { data: job, error: jobError } = await supabase
    .from('scraping_jobs')
    .insert({
      competitor_id: id,
      org_id: profile.org_id,
      status: 'pending',
      attempts: 0,
    })
    .select('id')
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create scraping job' }, { status: 500 })
  }

  // Process scraping in background
  after(async () => {
    const bgSupabase = await createClient()
    try {
      // Update status to processing
      await bgSupabase
        .from('scraping_jobs')
        .update({ status: 'processing', attempts: 1, updated_at: new Date().toISOString() })
        .eq('id', job.id)

      // Scrape reviews
      const reviews = []

      if (competitor.g2_slug) {
        const g2Reviews = await scrapeG2Reviews(competitor.g2_slug)
        reviews.push(...g2Reviews.map((r) => ({ ...r, source: 'g2' as const })))
      }

      if (competitor.capterra_slug) {
        // capterra_slug format: "numericId/slug" or just "slug"
        const parts = competitor.capterra_slug.split('/')
        const numericId = parts.length > 1 ? parts[0] : ''
        const slug = parts.length > 1 ? parts[1] : parts[0]
        if (numericId) {
          const capterraReviews = await scrapeCapterraReviews(slug, numericId)
          reviews.push(...capterraReviews.map((r) => ({ ...r, source: 'capterra' as const })))
        }
      }

      // Extract signals and upsert
      let signalsExtracted = 0

      for (const review of reviews) {
        const signals = await extractCompetitiveSignals(review.reviewText, competitor.name)

        for (const signal of signals) {
          const { error: upsertError } = await bgSupabase
            .from('competitive_signals')
            .upsert(
              {
                org_id: profile.org_id,
                workspace_id: competitor.workspace_id,
                competitor_id: id,
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

      // Mark job completed
      await bgSupabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          signals_extracted: signalsExtracted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      // Update competitor last_scraped_at
      await bgSupabase
        .from('competitors')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', id)

      console.log(`[Sightline] Scraping complete: ${signalsExtracted} signals extracted`)
    } catch (err) {
      console.error('[Sightline] Scraping job failed:', err)

      // Fetch current attempts
      const { data: currentJob } = await bgSupabase
        .from('scraping_jobs')
        .select('attempts')
        .eq('id', job.id)
        .single()

      const attempts = (currentJob?.attempts ?? 0) + 1
      const status = attempts >= 3 ? 'failed' : 'pending'

      await bgSupabase
        .from('scraping_jobs')
        .update({
          status,
          attempts,
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
    }
  })

  return NextResponse.json({ jobId: job.id, status: 'pending' }, { status: 202 })
}
