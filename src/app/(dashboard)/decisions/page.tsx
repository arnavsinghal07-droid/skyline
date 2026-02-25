'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GitMerge,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  PenLine,
  X,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

type DecisionRow = {
  id: string
  title: string
  rationale: string | null
  confidence: number | null
  outcome: string | null
  outcome_date: string | null
  created_at: string
  users: { email: string } | null
}

type OutcomeEditState = 'idle' | 'saving' | 'error'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONFIDENCE_STYLES: Record<Confidence, { badge: string; dot: string; label: string }> = {
  HIGH:   { badge: 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20', dot: 'bg-emerald-400', label: 'High' },
  MEDIUM: { badge: 'text-amber-400 bg-amber-400/[0.08] border border-amber-400/20',       dot: 'bg-amber-400',  label: 'Medium' },
  LOW:    { badge: 'text-red-400 bg-red-400/[0.08] border border-red-400/20',             dot: 'bg-red-400',    label: 'Low' },
}

const TIMELINE_DOT: Record<Confidence, string> = {
  HIGH:   'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]',
  MEDIUM: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.35)]',
  LOW:    'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.35)]',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function numericToConfidence(n: number | null): Confidence {
  if (n === null) return 'MEDIUM'
  if (n >= 0.9) return 'HIGH'
  if (n >= 0.5) return 'MEDIUM'
  return 'LOW'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function initials(email: string) {
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
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

function SkeletonEntry({ last }: { last?: boolean }) {
  return (
    <div className="flex gap-5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 w-5">
        <div className="w-2.5 h-2.5 rounded-full bg-white/[0.08] mt-1 animate-pulse" />
        {!last && <div className="w-px flex-1 bg-white/[0.05] mt-2" />}
      </div>
      {/* Card */}
      <div className="flex-1 pb-10 animate-pulse">
        <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="h-3.5 bg-white/[0.08] rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/[0.05] rounded w-1/2" />
            </div>
            <div className="h-5 w-16 bg-white/[0.06] rounded-full shrink-0" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-5 w-5 rounded-full bg-white/[0.06]" />
            <div className="h-2.5 bg-white/[0.05] rounded w-32" />
            <div className="w-px h-3 bg-white/[0.06]" />
            <div className="h-2.5 bg-white/[0.04] rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

function OutcomeEditor({
  decisionId,
  existingOutcome,
  outcomeDate,
  onSaved,
}: {
  decisionId: string
  existingOutcome: string | null
  outcomeDate: string | null
  onSaved: (outcome: string, date: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(existingOutcome ?? '')
  const [saveState, setSaveState] = useState<OutcomeEditState>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function openEditor() {
    setDraft(existingOutcome ?? '')
    setSaveState('idle')
    setEditing(true)
    // Focus after render
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveState('idle')
  }

  async function saveOutcome() {
    const trimmed = draft.trim()
    if (!trimmed) return
    setSaveState('saving')
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      onSaved(data.decision.outcome, data.decision.outcome_date)
      setEditing(false)
    } catch {
      setSaveState('error')
    }
  }

  // ── Already has an outcome ─────────────────────────────────────────────
  if (existingOutcome && !editing) {
    return (
      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <CheckCircle2 size={13} className="text-emerald-400/70 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Outcome</p>
              <p className="text-xs text-white/55 leading-relaxed">{existingOutcome}</p>
              {outcomeDate && (
                <p className="text-[10px] text-white/20 mt-1.5">{formatDate(outcomeDate)}</p>
              )}
            </div>
          </div>
          <button
            onClick={openEditor}
            className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
            title="Edit outcome"
          >
            <PenLine size={11} />
          </button>
        </div>
      </div>
    )
  }

  // ── Editing state ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="mt-4 pt-4 border-t border-white/[0.05]">
        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">
          {existingOutcome ? 'Edit Outcome' : 'Add Outcome'}
        </p>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="What actually happened? How did this decision play out?"
          rows={3}
          className="w-full bg-[#0a0a12] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-xs text-white/70 placeholder:text-white/20 leading-relaxed resize-none focus:outline-none focus:border-white/[0.2] transition-colors"
        />
        {saveState === 'error' && (
          <p className="text-[10px] text-red-400/60 mt-1.5">Failed to save. Try again.</p>
        )}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={saveOutcome}
            disabled={saveState === 'saving' || !draft.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/[0.07] border border-white/[0.12] text-xs text-white/70 font-medium hover:text-white/90 hover:bg-white/[0.1] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saveState === 'saving'
              ? <><Loader2 size={11} className="animate-spin" />Saving…</>
              : 'Save outcome'
            }
          </button>
          <button
            onClick={cancelEdit}
            disabled={saveState === 'saving'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/55 transition-colors"
          >
            <X size={11} />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── No outcome yet ─────────────────────────────────────────────────────
  return (
    <div className="mt-4 pt-4 border-t border-white/[0.05]">
      <button
        onClick={openEditor}
        className="flex items-center gap-2 text-xs text-white/25 hover:text-white/55 border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-lg px-3.5 py-2 transition-all w-full"
      >
        <Clock size={11} className="shrink-0" />
        <span>Add outcome — what actually happened?</span>
      </button>
    </div>
  )
}

function DecisionEntry({
  decision,
  isLast,
  onOutcomeSaved,
}: {
  decision: DecisionRow
  isLast: boolean
  onOutcomeSaved: (id: string, outcome: string, date: string) => void
}) {
  const confidence = numericToConfidence(decision.confidence)
  const dot = TIMELINE_DOT[confidence]

  return (
    <div className="flex gap-5">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 w-5">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dot}`} />
        {!isLast && <div className="w-px flex-1 bg-white/[0.07] mt-2" />}
      </div>

      {/* Card */}
      <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-10'}`}>
        <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.11] transition-colors">

          {/* Title + badge */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-white/85 leading-snug flex-1 min-w-0">
              {decision.title}
            </p>
            <ConfidenceBadge confidence={confidence} />
          </div>

          {/* Rationale */}
          {decision.rationale && (
            <p className="text-xs text-white/40 leading-relaxed mt-2.5">
              {decision.rationale}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
            {decision.users?.email && (
              <>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.08] text-[9px] font-semibold text-white/50 shrink-0">
                  {initials(decision.users.email)}
                </span>
                <span className="text-[11px] text-white/30">{decision.users.email}</span>
                <span className="w-px h-3 bg-white/[0.1]" />
              </>
            )}
            <span className="text-[11px] text-white/20">{formatDate(decision.created_at)}</span>
          </div>

          {/* Outcome */}
          <OutcomeEditor
            decisionId={decision.id}
            existingOutcome={decision.outcome}
            outcomeDate={decision.outcome_date}
            onSaved={(outcome, date) => onOutcomeSaved(decision.id, outcome, date)}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setDecisions(data.decisions)
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleOutcomeSaved(id: string, outcome: string, date: string) {
    setDecisions(prev =>
      prev.map(d => d.id === id ? { ...d, outcome, outcome_date: date } : d)
    )
  }

  // ---------------------------------------------------------------------------
  return (
    <div className="p-8 max-w-3xl w-full">

      {/* Header */}
      <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Decisions</p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-white mb-1"
      >
        Decision Log
      </h1>
      <p className="text-sm text-white/35 mb-8">
        An audit trail of every product decision, its evidence, and what actually happened
      </p>
      <div className="border-b border-white/[0.06] mb-8" />

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 text-red-400/70 text-sm">
          <AlertCircle size={15} />
          {fetchError}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !fetchError && (
        <div>
          <SkeletonEntry />
          <SkeletonEntry />
          <SkeletonEntry last />
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && decisions.length === 0 && (
        <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl py-16 flex flex-col items-center px-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
            <BookOpen size={18} className="text-white/20" />
          </div>
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-sm font-semibold text-white/35 mb-2"
          >
            No decisions logged yet
          </p>
          <p className="text-xs text-white/20 max-w-xs leading-relaxed mb-6">
            Generate a brief and log your first decision to start building an audit trail
          </p>
          <Link
            href="/briefs"
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 border border-white/[0.1] hover:border-white/[0.2] rounded-lg px-4 py-2 transition-all"
          >
            Go to Briefs
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Timeline */}
      {!loading && !fetchError && decisions.length > 0 && (
        <div>
          {/* Count */}
          <p className="text-xs text-white/20 uppercase tracking-widest mb-6 px-0.5">
            {decisions.length} decision{decisions.length !== 1 ? 's' : ''} logged
          </p>

          {decisions.map((decision, i) => (
            <DecisionEntry
              key={decision.id}
              decision={decision}
              isLast={i === decisions.length - 1}
              onOutcomeSaved={handleOutcomeSaved}
            />
          ))}

          {/* Timeline end cap */}
          <div className="flex gap-5 mt-2">
            <div className="flex flex-col items-center shrink-0 w-5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/[0.1] mt-0.5" />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <GitMerge size={11} className="text-white/15" />
              <span className="text-[10px] text-white/15 uppercase tracking-wider">
                Start of log
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
