import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const VALID_PLAN_NAMES = ['starter', 'pro'] as const
type PlanName = (typeof VALID_PLAN_NAMES)[number]

const PRICE_IDS: Record<PlanName, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
}

export async function POST(request: NextRequest) {
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

  // Get org for stripe_customer_id
  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id')
    .eq('id', profile.org_id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
  }

  // Parse request body
  let planName: PlanName
  try {
    const body = await request.json()
    const plan = body.plan as string
    if (!VALID_PLAN_NAMES.includes(plan as PlanName)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    planName = plan as PlanName
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const priceId = PRICE_IDS[planName]
  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${planName.toUpperCase()}_PRICE_ID not configured` },
      { status: 500 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: org.stripe_customer_id ?? undefined,
      customer_email: org.stripe_customer_id ? undefined : user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings/billing?success=true&plan=${planName}`,
      cancel_url: `${baseUrl}/settings/billing`,
      metadata: {
        org_id: org.id,
        plan_name: planName,
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Sightline] Checkout session creation error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
