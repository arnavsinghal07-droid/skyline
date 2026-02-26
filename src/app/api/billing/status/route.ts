import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org
  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, briefs_used_this_period, briefs_period_start, stripe_customer_id')
    .eq('id', profile.org_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
  }

  return NextResponse.json({
    plan: org.plan,
    briefsUsed: org.briefs_used_this_period,
    briefsPeriodStart: org.briefs_period_start,
    hasStripeCustomer: !!org.stripe_customer_id,
  })
}
