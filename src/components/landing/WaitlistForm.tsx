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
        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
        <span className="text-emerald-400 text-sm font-medium">
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
          className="flex-1 bg-white/[0.04] border border-white/[0.10] focus:border-white/[0.22] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="flex items-center gap-2 bg-white text-[#09090e] rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {state === 'loading' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              Join waitlist
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-red-400/70 text-xs leading-relaxed">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
