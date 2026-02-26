import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'

// Disable Next.js body parsing — we need the raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // CRITICAL: use .text() not .json() — preserves raw body for signature verification
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Sightline] Webhook signature verification failed:', msg)
    return new Response(`Webhook Error: ${msg}`, { status: 400 })
  }

  const admin = createAdminClient()

  // Idempotency: insert event_id BEFORE processing side effects
  // UNIQUE constraint on event_id means duplicate inserts fail silently
  const { data, error: insertError } = await admin
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
    })
    .select('id')
    .maybeSingle()

  // If insert returned null (conflict) or error with code 23505 (unique violation),
  // this event was already processed
  if (insertError?.code === '23505' || (!insertError && data === null)) {
    return new Response('Already processed', { status: 200 })
  }

  if (insertError) {
    console.error('[Sightline] Webhook idempotency insert error:', insertError)
    return new Response('Internal error', { status: 500 })
  }

  // Dispatch to lifecycle handlers
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          admin
        )
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          admin
        )
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          admin
        )
        break
      case 'invoice.paid':
        await handleInvoicePaid(
          event.data.object as Stripe.Invoice,
          admin
        )
        break
      default:
        // Unhandled event types are acknowledged but not processed
        break
    }
  } catch (err) {
    console.error(`[Sightline] Webhook handler error for ${event.type}:`, err)
    // Still return 200 — the event was recorded in idempotency table.
    // Returning 500 would cause Stripe to retry, but idempotency would catch it.
    // Log the error for debugging.
  }

  return new Response('OK', { status: 200 })
}

type AdminClient = ReturnType<typeof createAdminClient>

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  admin: AdminClient
) {
  const orgId = session.metadata?.org_id
  const planName = session.metadata?.plan_name // 'starter' or 'pro'
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!orgId || !planName) {
    console.error('[Sightline] checkout.session.completed missing metadata:', {
      orgId,
      planName,
    })
    return
  }

  await admin
    .from('organizations')
    .update({
      plan: planName,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      briefs_used_this_period: 0,
      briefs_period_start: new Date().toISOString(),
    })
    .eq('id', orgId)

  // Send welcome email — fire and forget (sendWelcomeEmail catches its own errors)
  const customerEmail = session.customer_details?.email ?? session.customer_email
  if (customerEmail) {
    await sendWelcomeEmail(customerEmail, planName)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  admin: AdminClient
) {
  const customerId = subscription.customer as string

  // Map Stripe price ID to plan name
  const priceId = subscription.items.data[0]?.price?.id
  let planName = 'free'
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) planName = 'starter'
  else if (priceId === process.env.STRIPE_PRO_PRICE_ID) planName = 'pro'

  // Only update if subscription is active
  if (subscription.status === 'active') {
    await admin
      .from('organizations')
      .update({
        plan: planName,
        stripe_subscription_id: subscription.id,
      })
      .eq('stripe_customer_id', customerId)
  } else if (
    subscription.status === 'past_due' ||
    subscription.status === 'unpaid'
  ) {
    // Optionally downgrade on payment failure — for now just log
    console.warn(
      `[Sightline] Subscription ${subscription.id} is ${subscription.status} for customer ${customerId}`
    )
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  admin: AdminClient
) {
  const customerId = subscription.customer as string

  await admin
    .from('organizations')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  admin: AdminClient
) {
  // Only reset on subscription cycle renewals, not initial subscription payment
  if (invoice.billing_reason !== 'subscription_cycle') return

  const customerId = invoice.customer as string

  await admin
    .from('organizations')
    .update({
      briefs_used_this_period: 0,
      briefs_period_start: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}
