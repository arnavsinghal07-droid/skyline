'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'
import { PlanCard } from '@/components/billing/PlanCard'
import { UsageBar } from '@/components/billing/UsageBar'

type BillingStatus = {
  plan: string
  briefsUsed: number
  briefsPeriodStart: string | null
  hasStripeCustomer: boolean
}

type SubscribingPlan = 'starter' | 'pro' | null

const PLAN_CONFIG = [
  {
    name: 'Free',
    key: 'free',
    price: 'Free',
    briefLimit: '0 briefs/month',
    features: [
      'Upload customer signals',
      'Run discovery queries',
      'View evidence panels',
    ],
    isRecommended: false,
    isFreeTier: true,
  },
  {
    name: 'Starter',
    key: 'starter',
    price: '$79/mo',
    briefLimit: '10 briefs/month',
    features: [
      'Everything in Free',
      '10 feature briefs per month',
      'UI Direction + Data Model Hints',
      'Coding agent export',
    ],
    isRecommended: false,
    isFreeTier: false,
  },
  {
    name: 'Pro',
    key: 'pro',
    price: '$299/mo',
    briefLimit: 'Unlimited briefs',
    features: [
      'Everything in Starter',
      'Unlimited feature briefs',
      'Priority support',
      'Early access to new features',
    ],
    isRecommended: true,
    isFreeTier: false,
  },
] as const

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscribing, setSubscribing] = useState<SubscribingPlan>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Optimistic: detect post-checkout redirect
  const checkoutSuccess = searchParams.get('success') === 'true'
  const checkoutPlan = searchParams.get('plan')
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // ── Fetch billing status ──────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status')
      if (!res.ok) throw new Error('Failed to fetch billing status')
      const data: BillingStatus = await res.json()
      setStatus(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // ── Optimistic update polling after checkout redirect ──────────────────
  useEffect(() => {
    if (!checkoutSuccess || !checkoutPlan) return

    setShowSuccessBanner(true)

    // Poll for up to 10 seconds (10 attempts, 1s apart) to confirm webhook has fired
    const interval = setInterval(async () => {
      const data = await fetchStatus()
      if (data && data.plan === checkoutPlan) {
        clearInterval(interval)
      }
    }, 1000)

    // Stop polling after 10 seconds regardless
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    // Clean up URL params after reading them
    const timer = setTimeout(() => {
      router.replace('/settings/billing', { scroll: false })
    }, 500)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      clearTimeout(timer)
    }
  }, [checkoutSuccess, checkoutPlan, fetchStatus, router])

  // ── Subscribe handler ──────────────────────────────────────────────────
  async function handleSubscribe(plan: 'starter' | 'pro') {
    setSubscribing(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout')
      // Redirect to Stripe hosted checkout
      // NOT stripe.redirectToCheckout() — removed Sept 2025
      router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setSubscribing(null)
    }
  }

  // ── Portal handler ────────────────────────────────────────────────────
  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to open portal')
      router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open portal')
      setPortalLoading(false)
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────
  const currentPlan = status?.plan ?? 'free'
  const briefsUsed = status?.briefsUsed ?? 0
  const hasSubscription = currentPlan !== 'free'
  const briefLimit = currentPlan === 'pro' ? null : currentPlan === 'starter' ? 10 : 0

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-[#ccc]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Success banner after checkout */}
      {showSuccessBanner && (
        <div className="bg-emerald-400/[0.06] border border-emerald-400/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-emerald-400 font-medium">
              Welcome to {checkoutPlan === 'pro' ? 'Pro' : 'Starter'}!
            </p>
            <p className="text-xs text-emerald-400/60 mt-0.5">
              {status?.plan === checkoutPlan
                ? 'Your subscription is active.'
                : 'Confirming your subscription — this may take a moment.'}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-400/[0.06] border border-red-400/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400/70 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      )}

      {/* Current plan + usage (if subscribed) */}
      {hasSubscription && status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#bbb] uppercase tracking-widest mb-1">Current plan</p>
              <p
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-lg font-bold text-[#111]"
              >
                {currentPlan === 'pro' ? 'Pro' : 'Starter'}
              </p>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-2 text-xs text-[#999] hover:text-[#444] transition-colors disabled:opacity-40"
            >
              {portalLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ExternalLink size={12} />
              )}
              Manage subscription
            </button>
          </div>
          <UsageBar used={briefsUsed} limit={briefLimit} plan={currentPlan} />
        </div>
      )}

      {/* Plan cards */}
      <div>
        <p className="text-[10px] text-[#bbb] uppercase tracking-widest mb-4">
          {hasSubscription ? 'Change plan' : 'Choose a plan'}
        </p>
        <div className="grid grid-cols-3 gap-4">
          {PLAN_CONFIG.map(config => (
            <PlanCard
              key={config.key}
              name={config.name}
              price={config.price}
              briefLimit={config.briefLimit}
              features={[...config.features]}
              isCurrent={currentPlan === config.key}
              isRecommended={config.isRecommended && currentPlan !== config.key}
              isFreeTier={config.isFreeTier}
              onSubscribe={
                config.key === 'free' || currentPlan === config.key
                  ? null
                  : () => handleSubscribe(config.key as 'starter' | 'pro')
              }
              loading={subscribing === config.key}
            />
          ))}
        </div>
      </div>

      {/* Portal link for subscribed users (secondary placement) */}
      {hasSubscription && (
        <div className="text-center">
          <p className="text-[10px] text-[#ccc]">
            View invoices, update payment method, or cancel via{' '}
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="text-[#999] underline underline-offset-2 hover:text-[#666] transition-colors"
            >
              Stripe Customer Portal
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
