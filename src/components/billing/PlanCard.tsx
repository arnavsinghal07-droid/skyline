'use client'

import { useState } from 'react'
import { Loader2, Check, Sparkles } from 'lucide-react'

type PlanCardProps = {
  name: string
  price: string          // e.g. "$79/mo" or "Free"
  briefLimit: string     // e.g. "10 briefs/month" or "Unlimited briefs"
  features: string[]
  isCurrent: boolean
  isRecommended: boolean
  isFreeTier: boolean
  onSubscribe: (() => void) | null  // null for free tier or current plan
  loading: boolean
}

export function PlanCard({
  name,
  price,
  briefLimit,
  features,
  isCurrent,
  isRecommended,
  isFreeTier,
  onSubscribe,
  loading,
}: PlanCardProps) {
  return (
    <div
      className={[
        'relative flex flex-col rounded-xl border p-6 transition-all',
        isRecommended
          ? 'border-white/[0.25] bg-white/[0.03]'
          : isFreeTier
          ? 'border-white/[0.05] bg-[#0a0a12] opacity-70'
          : 'border-white/[0.08] bg-[#0d0d15]',
      ].join(' ')}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-white text-[#09090e] text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
            <Sparkles size={10} />
            Recommended
          </span>
        </div>
      )}

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-emerald-400/[0.15] text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-emerald-400/20">
            <Check size={10} />
            Current
          </span>
        </div>
      )}

      {/* Plan name */}
      <p
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-base font-bold text-white mb-1 mt-2"
      >
        {name}
      </p>

      {/* Price */}
      <p className="text-2xl font-bold text-white mb-1">
        {price}
      </p>

      {/* Brief limit — headline differentiator */}
      <p className="text-sm text-white/50 mb-5">
        {briefLimit}
      </p>

      {/* Features list */}
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check size={12} className="text-white/30 shrink-0 mt-0.5" />
            <span className="text-xs text-white/50 leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action button */}
      {isCurrent ? (
        <div className="text-center py-2.5 text-xs text-white/25 font-medium">
          Current plan
        </div>
      ) : onSubscribe ? (
        <button
          onClick={onSubscribe}
          disabled={loading}
          className={[
            'w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2',
            isRecommended
              ? 'bg-white text-[#09090e] hover:bg-white/90 active:bg-white/80'
              : 'bg-white/[0.06] border border-white/[0.09] text-white/70 hover:bg-white/[0.10] hover:text-white/90 hover:border-white/[0.16]',
            loading ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" />Redirecting…</>
          ) : (
            `Subscribe to ${name}`
          )}
        </button>
      ) : null}
    </div>
  )
}
