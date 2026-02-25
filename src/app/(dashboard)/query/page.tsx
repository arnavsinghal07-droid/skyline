'use client'

import { useRef, useState } from 'react'
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  RotateCcw,
  Quote,
  TrendingUp,
} from 'lucide-react'
import type { SSEEvent, QueryResult } from '@/app/api/query/route'

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reads an SSE stream, calling `onEvent` for each parsed event. */
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

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`)
      }

      // Track whether a result event arrived — avoids relying on stale `phase`
      // closure to decide what to do after the stream ends.
      let gotResult = false

      await readStream(res.body, event => {
        console.log('[Sightline] SSE event:', event.type, event)

        if (event.type === 'status') {
          setStatus(event.message)
        } else if (event.type === 'error') {
          setErrorMsg(event.message)
          setPhase('error')
        } else if (event.type === 'result') {
          console.log('[Sightline] result received — setting state', event.data)
          setResult(event.data)
          setPhase('done')
          gotResult = true
        }
      })

      // Stream ended without a result event — surface an error rather than
      // leaving the UI in an ambiguous querying/idle state.
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
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const canSubmit = input.trim().length > 0 && phase !== 'querying'

  // ==========================================================================
  return (
    <div className="p-8 max-w-3xl w-full">

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
          {/* Active query echo */}
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

          {/* Status */}
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
        <div className="mt-8 space-y-4">

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
