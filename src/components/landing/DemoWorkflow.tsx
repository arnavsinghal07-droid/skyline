'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Search, Quote, ArrowRight, Sparkles } from 'lucide-react'
import { TypewriterText } from './TypewriterText'
import { ShimmerLoader } from './ShimmerLoader'
import {
  fadeInUpCard,
  staggerContainer,
  SPRING_DEFAULT,
  SPRING_SNAPPY,
  DURATION_CARD,
} from './motion'

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const QUERY_TEXT = 'What are the top pain points causing churn?'

const RESULTS = [
  {
    tag: 'Gong Call',
    tagColor: 'bg-purple-500/10 text-purple-600',
    quote: '"We cancelled because the onboarding took 3 weeks and nobody followed up..."',
    customer: 'Sarah K., Head of Product @ Acme',
    confidence: 'HIGH' as const,
  },
  {
    tag: 'Support Ticket',
    tagColor: 'bg-pink-500/10 text-pink-600',
    quote: '"The integration keeps breaking after every update. We\'ve filed 4 tickets this month."',
    customer: 'Mark T., CTO @ Bevel',
    confidence: 'HIGH' as const,
  },
  {
    tag: 'NPS Response',
    tagColor: 'bg-orange-500/10 text-orange-600',
    quote: '"Love the product but the reporting dashboard is basically useless for our team."',
    customer: 'Li W., PM @ Cascade',
    confidence: 'MED' as const,
  },
]

const CONFIDENCE_STYLES = {
  HIGH: 'text-emerald-600 bg-emerald-500/10',
  MED: 'text-amber-600 bg-amber-500/10',
  LOW: 'text-red-600 bg-red-500/10',
}

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
type DemoState = 'idle' | 'typing' | 'processing' | 'results' | 'highlight'

const STATE_DURATIONS: Record<DemoState, number> = {
  idle: 800,
  typing: 0, // controlled by TypewriterText onComplete
  processing: 2200,
  results: 2000,
  highlight: 6000,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DemoWorkflow() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-120px' })
  const [state, setState] = useState<DemoState>('idle')
  const [showBriefBtn, setShowBriefBtn] = useState(false)

  // Advance state machine
  const advance = useCallback((from: DemoState) => {
    const next: Record<DemoState, DemoState> = {
      idle: 'typing',
      typing: 'processing',
      processing: 'results',
      results: 'highlight',
      highlight: 'idle',
    }
    setState(next[from])
    if (next[from] === 'idle') setShowBriefBtn(false)
  }, [])

  // Start when in view
  useEffect(() => {
    if (!isInView) return
    if (prefersReduced) {
      setState('highlight')
      setShowBriefBtn(true)
      return
    }
    setState('idle')
  }, [isInView, prefersReduced])

  // Auto-advance timed states
  useEffect(() => {
    if (state === 'typing') return // TypewriterText controls this
    const duration = STATE_DURATIONS[state]
    if (!duration || !isInView) return

    const timer = setTimeout(() => advance(state), duration)
    return () => clearTimeout(timer)
  }, [state, isInView, advance])

  // Show brief button during highlight phase
  useEffect(() => {
    if (state === 'highlight') {
      const t = setTimeout(() => setShowBriefBtn(true), 800)
      return () => clearTimeout(t)
    }
  }, [state])

  const showQuery = state !== 'idle'
  const showShimmer = state === 'processing'
  const showResults = state === 'results' || state === 'highlight'

  return (
    <div ref={containerRef} className="mx-auto max-w-3xl space-y-6">
      {/* Search bar */}
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <Search size={18} className="shrink-0 text-[#0f0f14]/30" />
          <div className="flex-1 text-[15px] text-[#0f0f14] min-h-[1.5em]">
            {showQuery ? (
              <TypewriterText
                text={QUERY_TEXT}
                speed={45}
                trigger={state === 'typing' || showResults}
                onComplete={() => {
                  if (state === 'typing') advance('typing')
                }}
              />
            ) : (
              <span className="text-[#0f0f14]/25">Ask a product question...</span>
            )}
          </div>
          <div className="shrink-0 rounded-lg bg-[#0f0f14] px-3 py-1.5 text-xs font-medium text-white">
            Ask
          </div>
        </div>
      </div>

      {/* Processing shimmer */}
      <AnimatePresence>
        {showShimmer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING_DEFAULT}
            className="rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-[20px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#0f0f14]/40">
              <Sparkles size={12} className="animate-pulse text-purple-500" />
              Analyzing 847 signals across 12 sources...
            </div>
            <ShimmerLoader lines={4} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result cards */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {RESULTS.map((result, i) => (
              <motion.div
                key={i}
                variants={fadeInUpCard}
                transition={SPRING_DEFAULT}
                className={`relative overflow-hidden rounded-2xl border bg-white/60 backdrop-blur-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 ${
                  state === 'highlight' && i === 0
                    ? 'border-purple-400/30 shadow-[0_0_20px_rgba(124,58,237,0.08)]'
                    : 'border-black/[0.06]'
                }`}
              >
                {/* Highlight pulse on first card */}
                {state === 'highlight' && i === 0 && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-purple-400/20"
                    animate={{
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${result.tagColor}`}>
                    {result.tag}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_STYLES[result.confidence]}`}>
                    {result.confidence}
                  </span>
                </div>

                <div className="mb-2 flex gap-2">
                  <Quote size={14} className="mt-0.5 shrink-0 text-[#0f0f14]/15" />
                  <p className="text-sm italic leading-relaxed text-[#0f0f14]/70">
                    {result.quote}
                  </p>
                </div>

                <p className="text-[11px] text-[#0f0f14]/35">
                  {result.customer}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Brief CTA */}
      <AnimatePresence>
        {showBriefBtn && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SNAPPY}
            className="flex justify-center"
          >
            <div className="group relative inline-flex cursor-default items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]"
              />
              <span className="relative z-10 flex items-center gap-2">
                Generate Brief
                <ArrowRight size={14} />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
