'use client'

import { AlertCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Confidence = 'HIGH' | 'MED' | 'LOW'

interface EvidenceItem {
  quote: string
  customer_name: string
  source_type: string
}

interface EvidenceChipProps {
  signalCount?: number
  confidence?: Confidence
  lowEvidence?: boolean
  evidence?: EvidenceItem[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONFIDENCE_COLORS: Record<Confidence, string> = {
  HIGH: 'text-emerald-400',
  MED:  'text-amber-400',
  LOW:  'text-red-400',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EvidenceChip({
  signalCount,
  confidence,
  lowEvidence,
  evidence,
}: EvidenceChipProps) {
  const hasPopover = evidence && evidence.length > 0

  if (lowEvidence) {
    return (
      <span className="relative inline-flex group ml-1.5 align-middle">
        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 rounded px-1.5 py-0.5 text-[10px] cursor-default">
          <AlertCircle size={10} />
          Low evidence
        </span>
        {hasPopover && (
          <span className="absolute top-full left-0 mt-1 z-10 bg-[#0d0d15] border border-white/[0.1] rounded-lg p-3 w-64 shadow-xl hidden group-hover:block">
            {evidence.slice(0, 2).map((item, i) => (
              <p key={i} className="text-[10px] text-white/50 italic leading-relaxed mb-1 last:mb-0">
                &ldquo;{item.quote.length > 80 ? item.quote.slice(0, 80) + '…' : item.quote}&rdquo; &mdash; {item.customer_name}
              </p>
            ))}
          </span>
        )}
      </span>
    )
  }

  if (signalCount == null || confidence == null) return null

  return (
    <span className="relative inline-flex group ml-1.5 align-middle">
      <span className="inline-flex items-center text-[10px] cursor-default text-white/30 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
        {signalCount} signal{signalCount !== 1 ? 's' : ''}
        <span className="text-white/15 mx-1">·</span>
        <span className={CONFIDENCE_COLORS[confidence]}>{confidence}</span>
      </span>
      {hasPopover && (
        <span className="absolute top-full left-0 mt-1 z-10 bg-[#0d0d15] border border-white/[0.1] rounded-lg p-3 w-64 shadow-xl hidden group-hover:block">
          {evidence.slice(0, 2).map((item, i) => (
            <p key={i} className="text-[10px] text-white/50 italic leading-relaxed mb-1 last:mb-0">
              &ldquo;{item.quote.length > 80 ? item.quote.slice(0, 80) + '…' : item.quote}&rdquo; &mdash; {item.customer_name}
            </p>
          ))}
        </span>
      )}
    </span>
  )
}
