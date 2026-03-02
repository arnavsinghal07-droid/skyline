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
          className="flex-1 bg-[#f5f5f7] border border-[#e0e0e4] focus:border-[#bbb] rounded-full px-5 py-3 text-sm text-[#111] placeholder:text-[#999] outline-none transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="flex items-center gap-2 bg-[#111] text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-[#222] active:bg-[#333] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
        <p className="text-red-500 text-xs leading-relaxed pl-5">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
