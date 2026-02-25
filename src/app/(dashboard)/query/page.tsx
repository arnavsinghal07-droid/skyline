'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  RotateCcw,
  Quote,
  TrendingUp,
  FileText,
  CheckCircle,
  Save,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import type { SSEEvent, QueryResult } from '@/app/api/query/route'
import type { BriefContent } from '@/app/api/briefs/generate/route'
import { UIDirectionSection } from '@/components/briefs/UIDirectionSection'
import { DataModelSection } from '@/components/briefs/DataModelSection'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EXAMPLE_QUERIES = [
  'What are the top pain points with our onboarding?',
  'Which features are customers requesting most often?',
  'What is driving churn in our enterprise accounts?',
]

const CONFIDENCE_STYLES: Record<
  QueryResult['confidence'],
  { badge: string; dot: string; label: string }
> = {
  HIGH:   { badge: 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20', dot: 'bg-emerald-400', label: 'High confidence' },
  MEDIUM: { badge: 'text-amber-400  bg-amber-400/[0.08]  border border-amber-400/20',  dot: 'bg-amber-400',  label: 'Medium confidence' },
  LOW:    { badge: 'text-red-400    bg-red-400/[0.08]    border border-red-400/20',    dot: 'bg-red-400',    label: 'Low confidence' },
}

const TOTAL_SECTIONS = 7

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (e: SSEEvent) => void
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6)) as SSEEvent
        onEvent(event)
      } catch (e) {
        console.error('[Sightline] Failed to parse SSE line:', line, e)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: QueryResult['confidence'] }) {
  const s = CONFIDENCE_STYLES[confidence]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function EvidenceCard({ item, index }: {
  item: QueryResult['evidence'][number]
  index: number
}) {
  return (
    <div className="bg-[#0a0a12] border border-white/[0.07] rounded-xl p-5 flex gap-4">
      <div className="shrink-0 mt-0.5">
        <Quote size={13} className="text-white/20" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-white/70 leading-relaxed mb-3 italic">
          &ldquo;{item.quote}&rdquo;
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-white/50">{item.customer_name}</span>
          <span className="text-white/15">·</span>
          <span className="text-[10px] text-white/25 uppercase tracking-wider">{item.source_type}</span>
          <span className="text-white/15">·</span>
          <span className="text-[10px] text-white/20">Evidence {index + 1}</span>
        </div>
      </div>
    </div>
  )
}

function PulsingDot() {
  return (
    <span className="relative inline-flex h-2 w-2 ml-1 align-middle">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60" />
    </span>
  )
}

function SectionWithRegen({
  label,
  section,
  onRegenerate,
  isRegenerating,
  children,
}: {
  label: string
  section: keyof BriefContent
  onRegenerate: (s: keyof BriefContent) => void
  isRegenerating: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] text-white/25 uppercase tracking-widest">{label}</p>
        <button
          onClick={() => onRegenerate(section)}
          disabled={isRegenerating}
          className="text-white/15 hover:text-white/40 transition-colors disabled:cursor-not-allowed"
          title={`Regenerate ${label}`}
        >
          <RefreshCw size={11} className={isRegenerating ? 'animate-spin' : ''} />
        </button>
      </div>
      {children}
    </div>
  )
}

type BriefPhase = 'generating' | 'done' | 'error'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function BriefPanel({
  phase,
  brief,
  error,
  saveState,
  canSave,
  onSave,
  queryResult,
  activeQuery,
  onBriefUpdate,
}: {
  phase: BriefPhase
  brief: BriefContent | null
  error: string
  saveState: SaveState
  canSave: boolean
  onSave: () => void
  queryResult: QueryResult | null
  activeQuery: string
  onBriefUpdate: (updater: (prev: BriefContent | null) => BriefContent | null) => void
}) {
  const [visibleSections, setVisibleSections] = useState(0)
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({})

  // Stagger reveal when phase transitions to 'done'
  useEffect(() => {
    if (phase === 'done' && brief) {
      setVisibleSections(0)
      let current = 0
      const interval = setInterval(() => {
        current++
        setVisibleSections(current)
        if (current >= TOTAL_SECTIONS) clearInterval(interval)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [phase, brief])

  async function handleRegenerate(section: keyof BriefContent) {
    if (!brief || !queryResult || !activeQuery) return
    setRegenerating(prev => ({ ...prev, [section]: true }))
    try {
      const res = await fetch('/api/briefs/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          queryResult,
          query: activeQuery,
          existingBrief: brief,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const { data } = await res.json()
      // endpoint returns { section, data: value }
      onBriefUpdate(prev => prev ? { ...prev, [section]: data } : prev)
    } catch {
      // Silently fail — user can retry
    } finally {
      setRegenerating(prev => ({ ...prev, [section]: false }))
    }
  }

  return (
    <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-white/25" />
          <p className="text-xs text-white/30 uppercase tracking-widest">Feature Brief</p>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'generating' && (
            <Loader2 size={12} className="animate-spin text-white/20" />
          )}
          {phase === 'done' && brief && (
            <button
              onClick={onSave}
              disabled={!canSave || saveState === 'saving' || saveState === 'saved'}
              className={[
                'flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-medium transition-all',
                saveState === 'saved'
                  ? 'text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 cursor-default'
                  : saveState === 'error'
                  ? 'text-red-400/70 bg-red-400/[0.06] border border-red-400/15'
                  : 'text-white/50 bg-white/[0.04] border border-white/[0.08] hover:text-white/80 hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {saveState === 'saving' ? (
                <><Loader2 size={11} className="animate-spin" />Saving…</>
              ) : saveState === 'saved' ? (
                <><CheckCircle size={11} />Saved</>
              ) : (
                <><Save size={11} />Save Brief</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 max-h-[calc(100vh-200px)]">
        {/* Loading skeleton — 7 pulse rows */}
        {phase === 'generating' && (
          <div className="space-y-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-2.5 w-24 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-12 bg-white/[0.04] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {phase === 'error' && (
          <div className="flex items-start gap-2 text-red-400/70 py-4">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {phase === 'done' && brief && (
          <>
            {/* Section 1 */}
            {visibleSections >= 1 && (
              <SectionWithRegen
                label="Problem Statement"
                section="problem_statement"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.problem_statement}
              >
                <p className="text-sm text-white/65 leading-relaxed">
                  {brief.problem_statement}
                </p>
              </SectionWithRegen>
            )}

            {/* Section 2 */}
            {visibleSections >= 2 && (
              <SectionWithRegen
                label="Proposed Solution"
                section="proposed_solution"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.proposed_solution}
              >
                <p className="text-sm text-white/65 leading-relaxed">
                  {brief.proposed_solution}
                </p>
              </SectionWithRegen>
            )}

            {/* Section 3 */}
            {visibleSections >= 3 && (
              <SectionWithRegen
                label="User Stories"
                section="user_stories"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.user_stories}
              >
                <div className="space-y-2">
                  {brief.user_stories.map((story, i) => (
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
              </SectionWithRegen>
            )}

            {/* Section 4 */}
            {visibleSections >= 4 && (
              <SectionWithRegen
                label="Success Metrics"
                section="success_metrics"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.success_metrics}
              >
                <ul className="space-y-2">
                  {brief.success_metrics.map((metric, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight size={12} className="text-white/20 shrink-0 mt-0.5" />
                      <span className="text-xs text-white/55 leading-relaxed">{metric}</span>
                    </li>
                  ))}
                </ul>
              </SectionWithRegen>
            )}

            {/* Section 5 */}
            {visibleSections >= 5 && (
              <SectionWithRegen
                label="Out of Scope"
                section="out_of_scope"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.out_of_scope}
              >
                <ul className="space-y-2">
                  {brief.out_of_scope.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-white/15 shrink-0 mt-0.5 text-xs leading-relaxed">—</span>
                      <span className="text-xs text-white/35 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionWithRegen>
            )}

            {/* Section 6 — UI Direction */}
            {visibleSections >= 6 && (
              <SectionWithRegen
                label="UI Direction"
                section="ui_direction"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.ui_direction}
              >
                {brief.ui_direction ? (
                  <UIDirectionSection
                    direction={brief.ui_direction}
                    evidence={queryResult?.evidence}
                  />
                ) : (
                  <p className="text-xs text-white/25 italic">Not available — generated before v2</p>
                )}
              </SectionWithRegen>
            )}

            {/* Section 7 — Data Model Hints */}
            {visibleSections >= 7 && (
              <SectionWithRegen
                label="Data Model Hints"
                section="data_model_hints"
                onRegenerate={handleRegenerate}
                isRegenerating={!!regenerating.data_model_hints}
              >
                {brief.data_model_hints && brief.data_model_hints.length > 0 ? (
                  <DataModelSection hints={brief.data_model_hints} />
                ) : (
                  <p className="text-xs text-white/25 italic">Not available — generated before v2</p>
                )}
              </SectionWithRegen>
            )}

            {saveState === 'error' && (
              <p className="text-xs text-red-400/60">Failed to save. Please try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type Phase = 'idle' | 'querying' | 'done' | 'error'

export default function QueryPage() {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [queryId, setQueryId] = useState<string | null>(null)

  const [briefPhase, setBriefPhase] = useState<BriefPhase | 'idle'>('idle')
  const [brief, setBrief] = useState<BriefContent | null>(null)
  const [briefError, setBriefError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const q = input.trim()
    if (!q || phase === 'querying') return

    setActiveQuery(q)
    setPhase('querying')
    setStatus('Connecting…')
    setResult(null)
    setErrorMsg('')
    setQueryId(null)
    setBriefPhase('idle')
    setBrief(null)
    setBriefError('')
    setSaveState('idle')

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`)
      }

      let gotResult = false

      await readStream(res.body, event => {
        if (event.type === 'status') {
          setStatus(event.message)
        } else if (event.type === 'error') {
          setErrorMsg(event.message)
          setPhase('error')
        } else if (event.type === 'result') {
          setResult(event.data)
          setQueryId(event.queryId)
          setPhase('done')
          gotResult = true
        }
      })

      if (!gotResult) {
        setErrorMsg('The analysis completed without returning a result. Please try again.')
        setPhase('error')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('error')
    }
  }

  function handleReset() {
    setPhase('idle')
    setInput('')
    setResult(null)
    setErrorMsg('')
    setActiveQuery('')
    setQueryId(null)
    setBriefPhase('idle')
    setBrief(null)
    setBriefError('')
    setSaveState('idle')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Generate Brief ─────────────────────────────────────────────────────────
  async function handleGenerateBrief() {
    if (!result || briefPhase === 'generating') return
    setBriefPhase('generating')
    setBrief(null)
    setBriefError('')
    setSaveState('idle')

    try {
      const res = await fetch('/api/briefs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryResult: result, query: activeQuery }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error_code === 'TOKEN_LIMIT') {
          setBriefError('Brief was too long and got truncated. Try a more specific query or regenerate individual sections.')
        } else {
          setBriefError(data.error ?? 'Failed to generate brief')
        }
        setBriefPhase('error')
        return
      }
      setBrief(data.brief)
      setBriefPhase('done')
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'Failed to generate brief')
      setBriefPhase('error')
    }
  }

  // ── Save Brief ─────────────────────────────────────────────────────────────
  async function handleSaveBrief() {
    if (!brief || !queryId || saveState === 'saving' || saveState === 'saved') return
    setSaveState('saving')

    try {
      const res = await fetch('/api/briefs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, queryId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save brief')
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  const canSubmit = input.trim().length > 0 && phase !== 'querying'
  const showBriefPanel = phase === 'done' && briefPhase !== 'idle'

  // ==========================================================================
  return (
    <div className={`p-8 w-full ${showBriefPanel ? 'max-w-[1200px]' : 'max-w-3xl'}`}>

      {/* Page header */}
      <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Query</p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-white mb-1"
      >
        Ask your signals
      </h1>
      <p className="text-sm text-white/35 mb-8">
        Ask a natural language question — Sightline finds the answer in your customer data
      </p>
      <div className="border-b border-white/[0.06] mb-8" />

      {/* ── Query bar ───────────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d15] border border-white/[0.09] rounded-xl p-1.5 flex items-center gap-2 mb-2 focus-within:border-white/[0.18] transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="What do customers struggle with most?"
          disabled={phase === 'querying'}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none disabled:opacity-50"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 bg-white text-[#09090e] rounded-lg px-4 py-2.5 text-xs font-semibold hover:bg-white/90 active:bg-white/80 transition-all shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
        >
          {phase === 'querying'
            ? <Loader2 size={13} className="animate-spin" />
            : <ArrowRight size={13} />
          }
          {phase === 'querying' ? 'Analysing' : 'Ask'}
        </button>
      </div>

      {/* ── Example queries (idle only) ─────────────────────────────────────── */}
      {phase === 'idle' && (
        <div className="flex flex-wrap gap-2 mb-10">
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); inputRef.current?.focus() }}
              className="text-xs text-white/25 border border-white/[0.07] rounded-lg px-3 py-1.5 hover:text-white/45 hover:border-white/[0.13] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Streaming / loading state ────────────────────────────────────────── */}
      {phase === 'querying' && (
        <div className="mt-8">
          <div className="flex items-start gap-3 mb-7">
            <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 mt-0.5 flex items-center justify-center">
              <TrendingUp size={10} className="text-white/30" />
            </div>
            <p
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-sm font-semibold text-white/60 leading-snug"
            >
              {activeQuery}
            </p>
          </div>

          <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Status</p>
            <p className="text-sm text-white/55 flex items-center gap-1">
              {status}
              <PulsingDot />
            </p>
          </div>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="mt-8 bg-[#0d0d15] border border-red-400/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400/70 shrink-0 mt-0.5" />
            <div>
              <p
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-sm font-semibold text-white/60 mb-1"
              >
                Query failed
              </p>
              <p className="text-xs text-red-400/70 mb-4">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
              >
                <RotateCcw size={12} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────────────────── */}
      {phase === 'done' && result && (
        <div className={`mt-8 ${showBriefPanel ? 'flex gap-6 items-start' : 'space-y-4'}`}>

          {/* Left column: query results */}
          <div className={showBriefPanel ? 'flex-1 min-w-0 space-y-4' : 'space-y-4'}>

            {/* Active query echo + reset */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] shrink-0 mt-0.5 flex items-center justify-center">
                  <TrendingUp size={10} className="text-white/30" />
                </div>
                <p
                  style={{ fontFamily: 'var(--font-syne)' }}
                  className="text-sm font-semibold text-white/60 leading-snug"
                >
                  {activeQuery}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="shrink-0 flex items-center gap-1.5 text-xs text-white/20 hover:text-white/45 transition-colors"
              >
                <RotateCcw size={12} />
                New query
              </button>
            </div>

            {/* Recommendation card */}
            <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="text-xs text-white/30 uppercase tracking-widest">Recommendation</p>
                <ConfidenceBadge confidence={result.confidence} />
              </div>

              <p
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-[17px] font-semibold text-white leading-relaxed mb-4"
              >
                {result.recommendation}
              </p>

              {result.reasoning && (
                <p className="text-xs text-white/30 border-t border-white/[0.05] pt-4 leading-relaxed">
                  {result.reasoning}
                </p>
              )}
            </div>

            {/* Evidence panel */}
            {result.evidence?.length > 0 && (
              <div>
                <p className="text-xs text-white/25 uppercase tracking-widest mb-3 px-1">
                  Supporting evidence
                </p>
                <div className="space-y-2.5">
                  {result.evidence.map((item, i) => (
                    <EvidenceCard key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Generate Brief button — only shown before brief is triggered */}
            {briefPhase === 'idle' && (
              <div className="pt-1">
                <button
                  onClick={handleGenerateBrief}
                  className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/[0.15] rounded-xl px-5 py-3 text-sm font-medium transition-all"
                >
                  <FileText size={14} />
                  Generate Feature Brief
                </button>
              </div>
            )}
          </div>

          {/* Right column: brief panel */}
          {showBriefPanel && (
            <div className="w-[440px] shrink-0 sticky top-8">
              <BriefPanel
                phase={briefPhase as BriefPhase}
                brief={brief}
                error={briefError}
                saveState={saveState}
                canSave={!!queryId}
                onSave={handleSaveBrief}
                queryResult={result}
                activeQuery={activeQuery}
                onBriefUpdate={setBrief}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Empty state (idle, below examples) ──────────────────────────────── */}
      {phase === 'idle' && (
        <div className="bg-[#0d0d15] border border-white/[0.07] rounded-xl py-14 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
            <TrendingUp size={17} className="text-white/20" />
          </div>
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-sm font-semibold text-white/30 mb-1"
          >
            No queries yet
          </p>
          <p className="text-xs text-white/20">
            Ask your first question above to analyse your signals
          </p>
        </div>
      )}
    </div>
  )
}
