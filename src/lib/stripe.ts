import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    '[Sightline] STRIPE_SECRET_KEY is not set. Add it to .env.local.'
  )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
