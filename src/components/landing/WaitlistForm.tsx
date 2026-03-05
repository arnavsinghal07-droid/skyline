'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

type FormState = 'idle' | 'loading' | 'done' | 'error'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')

  const handleSubmit = async () => {
    if (!email.trim() || state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Request failed')
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center justify-center gap-2.5 py-3">
        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
        <span className="text-emerald-600 text-sm font-medium">
          You&apos;re on the list!
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="you@company.com"
          className="flex-1 bg-white/70 backdrop-blur-[12px] border border-black/[0.08] focus:border-[#7c3aed]/40 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] rounded-full px-5 py-3 text-sm text-[#0f0f14] placeholder:text-[#0f0f14]/30 outline-none transition-all duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="group relative flex items-center gap-2 overflow-hidden bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-full px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-500/15 hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.97] active:duration-[120ms] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {/* Light sweep */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]"
          />
          <span className="relative z-10 flex items-center gap-2">
            {state === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                Join waitlist
                <ArrowRight size={13} />
              </>
            )}
          </span>
        </button>
      </div>
      {state === 'error' && (
        <p className="text-red-500 text-xs leading-relaxed pl-5">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
