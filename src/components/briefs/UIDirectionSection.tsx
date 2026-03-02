'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { UIDirection, UIDirectionScreen } from '@/app/api/briefs/generate/route'
import type { QueryResult } from '@/app/api/query/route'
import { EvidenceChip } from './EvidenceChip'

// ---------------------------------------------------------------------------
// UIDirectionCard — one card per screen
// ---------------------------------------------------------------------------
function UIDirectionCard({
  screen,
  evidence,
}: {
  screen: UIDirectionScreen
  evidence?: QueryResult['evidence']
}) {
  const [expanded, setExpanded] = useState(false)

  const previewChanges = screen.changes.slice(0, 2)
  const extraChanges = screen.changes.slice(2)
  const hasExtra = extraChanges.length > 0

  return (
    <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-lg overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#fafafa] transition-colors"
      >
        <span className="text-xs font-medium text-[#444]">{screen.screen_name}</span>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[10px] text-[#bbb]">
            {screen.changes.length} change{screen.changes.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            size={12}
            className={`text-[#bbb] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Preview area — always visible */}
      <div className="px-4 pb-3">
        <div className="space-y-2">
          {previewChanges.map((change, i) => (
            <div key={i} className="flex items-start gap-1.5 flex-wrap">
              <span className="text-xs text-[#666] leading-relaxed">{change.text}</span>
              <EvidenceChip
                signalCount={change.signal_count}
                confidence={change.confidence}
                lowEvidence={change.low_evidence}
                evidence={evidence}
              />
            </div>
          ))}
        </div>

        {hasExtra && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] text-[#bbb] hover:text-[#999] transition-colors mt-2"
          >
            +{extraChanges.length} more
          </button>
        )}
      </div>

      {/* Expanded area */}
      {expanded && (
        <div className="border-t border-[#ebebef] px-4 py-3 space-y-4">
          {/* Remaining changes */}
          {hasExtra && (
            <div className="space-y-2">
              {extraChanges.map((change, i) => (
                <div key={i} className="flex items-start gap-1.5 flex-wrap">
                  <span className="text-xs text-[#666] leading-relaxed">{change.text}</span>
                  <EvidenceChip
                    signalCount={change.signal_count}
                    confidence={change.confidence}
                    lowEvidence={change.low_evidence}
                    evidence={evidence}
                  />
                </div>
              ))}
            </div>
          )}

          {/* New Components bucket */}
          {screen.new_components.length > 0 && (
            <div>
              <p className="text-[10px] text-[#bbb] uppercase tracking-widest mb-1.5">
                New Components
              </p>
              <div className="flex flex-wrap gap-1.5">
                {screen.new_components.map((comp, i) => (
                  <span
                    key={i}
                    className="bg-[#f5f5f7] border border-[#e8e8ec] rounded px-2 py-0.5 text-[10px] text-[#777]"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interactions bucket */}
          {screen.interactions.length > 0 && (
            <div>
              <p className="text-[10px] text-[#bbb] uppercase tracking-widest mb-1.5">
                Interactions
              </p>
              <ul className="space-y-1">
                {screen.interactions.map((interaction, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#ccc] shrink-0 mt-0.5 text-xs">·</span>
                    <span className="text-xs text-[#888]">{interaction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// UIDirectionSection — main export
// ---------------------------------------------------------------------------
interface UIDirectionSectionProps {
  direction: UIDirection
  evidence?: QueryResult['evidence']
}

export function UIDirectionSection({ direction, evidence }: UIDirectionSectionProps) {
  return (
    <div className="space-y-3">
      {direction.screens.map((screen, i) => (
        <UIDirectionCard key={i} screen={screen} evidence={evidence} />
      ))}
    </div>
  )
}
