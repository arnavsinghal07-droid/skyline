'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'

type UpgradeGateProps = {
  plan: string
  used: number
  limit: number | null
}

export function UpgradeGate({ plan, used: _used, limit }: UpgradeGateProps) {
  const router = useRouter()

  const isFree = plan === 'free'

  return (
    <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-5">
      <p className="text-sm text-white/70 font-medium mb-1.5">
        {isFree
          ? 'Subscribe to unlock briefs'
          : `You've used all ${limit} briefs this month`}
      </p>
      <p className="text-xs text-white/35 mb-4 leading-relaxed">
        {isFree
          ? 'Start a Starter or Pro subscription to generate feature briefs from your customer signals.'
          : 'Upgrade to Pro for unlimited briefs, or wait until your plan renews next month.'}
      </p>
      <button
        onClick={() => router.push('/settings/billing')}
        className="flex items-center gap-2 bg-white text-[#09090e] rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all"
      >
        <ArrowUpRight size={14} />
        {isFree ? 'View plans' : 'Upgrade to Pro'}
      </button>
    </div>
  )
}
