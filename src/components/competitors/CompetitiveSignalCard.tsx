'use client'

import type { SignalType } from '@/lib/competitive/types'

const SIGNAL_TYPE_STYLES: Record<SignalType, { bg: string; text: string; label: string }> = {
  pain_point:       { bg: 'bg-red-400/10',    text: 'text-red-400',     label: 'Pain Point' },
  switching_reason: { bg: 'bg-amber-400/10',   text: 'text-amber-400',   label: 'Switching Reason' },
  feature_request:  { bg: 'bg-blue-400/10',    text: 'text-blue-400',    label: 'Feature Request' },
  positive_mention: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', label: 'Positive Mention' },
}

export interface CompetitiveSignalForPanel {
  id: string
  quote: string
  competitor_name: string
  source: 'g2' | 'capterra' | 'csv'
  signal_type: SignalType
  review_date?: string | null
}

export function CompetitiveSignalCard({
  signal,
}: {
  signal: CompetitiveSignalForPanel
}) {
  const style = SIGNAL_TYPE_STYLES[signal.signal_type] ?? SIGNAL_TYPE_STYLES.pain_point

  return (
    <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-xl p-4 flex flex-col gap-2.5">
      {/* Top row: competitor name + source */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-purple-500/10 text-purple-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
          {signal.competitor_name}
        </span>
        <span className="bg-[#f0f0f3] text-[#999] text-[10px] font-medium px-2 py-0.5 rounded-full uppercase">
          {signal.source}
        </span>
      </div>

      {/* Quote */}
      <p className="text-sm text-[#555] leading-relaxed italic">
        &ldquo;{signal.quote}&rdquo;
      </p>

      {/* Bottom row: signal type + date */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`${style.bg} ${style.text} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
          {style.label}
        </span>
        {signal.review_date && (
          <>
            <span className="text-[#ddd]">&middot;</span>
            <span className="text-[10px] text-[#bbb]">
              {new Date(signal.review_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
