'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  ChevronRight,
  GitMerge,
  Loader2,
  CheckCircle,
  AlertCircle,
  Inbox,
} from 'lucide-react'
import type { BriefContent } from '@/app/api/briefs/generate/route'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

type BriefRow = {
  id: string
  content_json: BriefContent
  created_at: string
  queries: {
    text: string
    response_json: { confidence: Confidence; recommendation: string } | null
  } | null
}

type DecisionState = 'idle' | 'logging' | 'logged' | 'error'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONFIDENCE_STYLES: Record<Confidence, { badge: string; dot: string; label: string }> = {
  HIGH:   { badge: 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20', dot: 'bg-emerald-400', label: 'High confidence' },
  MEDIUM: { badge: 'text-amber-400 bg-amber-400/[0.08] border border-amber-400/20',       dot: 'bg-amber-400',  label: 'Medium confidence' },
  LOW:    { badge: 'text-red-400 bg-red-400/[0.08] border border-red-400/20',             dot: 'bg-red-400',    label: 'Low confidence' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

function getConfidence(brief: BriefRow): Confidence | null {
  return brief.queries?.response_json?.confidence ?? null
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const s = CONFIDENCE_STYLES[confidence]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-white/[0.06] rounded mb-2.5 w-full" />
      <div className="h-3 bg-white/[0.06] rounded mb-5 w-3/4" />
      <div className="flex items-center justify-between">
        <div className="h-2.5 bg-white/[0.04] rounded w-20" />
        <div className="h-5 bg-white/[0.04] rounded-full w-24" />
      </div>
    </div>
  )
}

function BriefCard({
  brief,
  selected,
  onClick,
}: {
  brief: BriefRow
  selected: boolean
  onClick: () => void
}) {
  const confidence = getConfidence(brief)

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left bg-[#0d0d15] border rounded-xl p-5 transition-all',
        selected
          ? 'border-white/[0.18] bg-white/[0.02]'
          : 'border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.01]',
      ].join(' ')}
    >
      <p className="text-sm text-white/70 leading-relaxed mb-4 line-clamp-2">
        {brief.content_json.problem_statement}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] text-white/25">{formatDate(brief.created_at)}</span>
        {confidence && <ConfidenceBadge confidence={confidence} />}
      </div>
    </button>
  )
}

function BriefDetail({
  brief,
  decisionState,
  onLogDecision,
}: {
  brief: BriefRow
  decisionState: DecisionState
  onLogDecision: () => void
}) {
  const { content_json: c } = brief

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">
            {brief.queries?.text ?? 'Feature Brief'}
          </p>
          <p className="text-xs text-white/20">{formatDate(brief.created_at)}</p>
        </div>
        {getConfidence(brief) && (
          <ConfidenceBadge confidence={getConfidence(brief)!} />
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto space-y-7 pr-1">

        <DetailSection label="Problem Statement">
          <p className="text-sm text-white/65 leading-relaxed">{c.problem_statement}</p>
        </DetailSection>

        <DetailSection label="Proposed Solution">
          <p className="text-sm text-white/65 leading-relaxed">{c.proposed_solution}</p>
        </DetailSection>

        <DetailSection label="User Stories">
          <div className="space-y-2">
            {c.user_stories.map((story, i) => (
              <div
                key={i}
                className="bg-[#0a0a12] border border-white/[0.06] rounded-lg px-4 py-3"
              >
                <p className="text-xs text-white/55 leading-relaxed">
                  <span className="text-white/25">As a </span>
                  <span className="text-white/70 font-medium">{story.role}</span>
                  <span className="text-white/25">, I want </span>
                  <span className="text-white/70">{story.action}</span>
                  <span className="text-white/25"> so that </span>
                  <span className="text-white/70">{story.outcome}</span>
                  <span className="text-white/25">.</span>
                </p>
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection label="Success Metrics">
          <ul className="space-y-2">
            {c.success_metrics.map((metric, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight size={12} className="text-white/20 shrink-0 mt-0.5" />
                <span className="text-xs text-white/55 leading-relaxed">{metric}</span>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection label="Out of Scope">
          <ul className="space-y-2">
            {c.out_of_scope.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-white/15 shrink-0 text-xs leading-relaxed mt-0.5">—</span>
                <span className="text-xs text-white/35 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>

      {/* Log Decision button */}
      <div className="pt-6 border-t border-white/[0.06] mt-6">
        {decisionState === 'error' && (
          <p className="text-xs text-red-400/60 mb-3">Failed to log decision. Try again.</p>
        )}
        <button
          onClick={onLogDecision}
          disabled={decisionState === 'logging' || decisionState === 'logged'}
          className={[
            'flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all w-full justify-center',
            decisionState === 'logged'
              ? 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 cursor-default'
              : decisionState === 'error'
              ? 'text-red-400/70 bg-red-400/[0.06] border border-red-400/15 hover:bg-red-400/[0.1]'
              : 'text-white/60 bg-white/[0.04] border border-white/[0.09] hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.16] disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {decisionState === 'logging' ? (
            <><Loader2 size={14} className="animate-spin" />Logging…</>
          ) : decisionState === 'logged' ? (
            <><CheckCircle size={14} />Decision Logged</>
          ) : (
            <><GitMerge size={14} />Log Decision</>
          )}
        </button>
      </div>
    </div>
  )
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2.5">{label}</p>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BriefsPage() {
  const [briefs, setBriefs] = useState<BriefRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decisionStates, setDecisionStates] = useState<Record<string, DecisionState>>({})

  // ── Fetch briefs ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/briefs')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setBriefs(data.briefs)
        if (data.briefs.length > 0) setSelectedId(data.briefs[0].id)
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const selectedBrief = briefs.find(b => b.id === selectedId) ?? null

  // ── Log decision ─────────────────────────────────────────────────────────
  async function handleLogDecision(brief: BriefRow) {
    if (decisionStates[brief.id] === 'logging' || decisionStates[brief.id] === 'logged') return

    setDecisionStates(s => ({ ...s, [brief.id]: 'logging' }))

    const recommendation = brief.queries?.response_json?.recommendation
    const title = (recommendation ?? brief.content_json.problem_statement).slice(0, 200)
    const confidence = getConfidence(brief)

    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId: brief.id, title, confidence }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setDecisionStates(s => ({ ...s, [brief.id]: 'logged' }))
    } catch {
      setDecisionStates(s => ({ ...s, [brief.id]: 'error' }))
    }
  }

  // ==========================================================================
  return (
    <div className="p-8 max-w-6xl w-full">

      {/* Header */}
      <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Briefs</p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-white mb-1"
      >
        Feature Briefs
      </h1>
      <p className="text-sm text-white/35 mb-8">
        Saved briefs generated from your customer signal analysis
      </p>
      <div className="border-b border-white/[0.06] mb-8" />

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-center gap-2 text-red-400/70 text-sm">
          <AlertCircle size={15} />
          {fetchError}
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {!fetchError && (
        <div className="flex gap-5 items-start">

          {/* Left: brief list */}
          <div className="w-[340px] shrink-0">

            {/* List header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs text-white/25 uppercase tracking-widest">
                {loading ? 'Loading…' : `${briefs.length} brief${briefs.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="space-y-2">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : briefs.length === 0 ? (
                <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl py-12 flex flex-col items-center">
                  <Inbox size={24} className="text-white/15 mb-3" />
                  <p
                    style={{ fontFamily: 'var(--font-syne)' }}
                    className="text-sm font-semibold text-white/30 mb-1"
                  >
                    No briefs yet
                  </p>
                  <p className="text-xs text-white/20 text-center px-4">
                    Run a query and click &ldquo;Generate Feature Brief&rdquo; to create one
                  </p>
                </div>
              ) : (
                briefs.map(brief => (
                  <BriefCard
                    key={brief.id}
                    brief={brief}
                    selected={brief.id === selectedId}
                    onClick={() => setSelectedId(brief.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          <div className="flex-1 min-w-0">
            {!loading && selectedBrief ? (
              <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-6 sticky top-8">
                <BriefDetail
                  brief={selectedBrief}
                  decisionState={decisionStates[selectedBrief.id] ?? 'idle'}
                  onLogDecision={() => handleLogDecision(selectedBrief)}
                />
              </div>
            ) : !loading && briefs.length === 0 ? null : !loading ? (
              <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl py-20 flex flex-col items-center sticky top-8">
                <FileText size={24} className="text-white/10 mb-3" />
                <p className="text-sm text-white/20">Select a brief to view details</p>
              </div>
            ) : (
              /* Skeleton for detail panel */
              <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-6 animate-pulse sticky top-8">
                <div className="h-3 bg-white/[0.06] rounded w-1/2 mb-2" />
                <div className="h-2.5 bg-white/[0.04] rounded w-1/3 mb-8" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="mb-6">
                    <div className="h-2.5 bg-white/[0.04] rounded w-24 mb-3" />
                    <div className="h-3 bg-white/[0.06] rounded w-full mb-2" />
                    <div className="h-3 bg-white/[0.06] rounded w-4/5" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
