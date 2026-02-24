'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingMagic, setLoadingMagic] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoadingGoogle(false)
    }
    // on success the browser navigates away; no need to reset state
  }

  const handleMagicLink = async () => {
    if (!email.trim()) return
    setLoadingMagic(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoadingMagic(false)
  }

  const busy = loadingGoogle || loadingMagic

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="bg-[#0d0d15] border border-white/[0.07] rounded-2xl p-8 shadow-xl shadow-black/40">

        {/* Wordmark */}
        <div className="flex items-center gap-2.5 mb-9">
          <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
          <span
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-[11px] font-bold tracking-[0.22em] text-white uppercase"
          >
            Sightline
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{ fontFamily: 'var(--font-syne)' }}
          className="text-[22px] font-bold text-white tracking-tight mb-1.5"
        >
          Welcome back
        </h1>
        <p className="text-sm text-white/35 mb-7 leading-relaxed">
          Sign in to your workspace
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2.5 border border-white/[0.09] rounded-lg py-2.5 px-4 text-sm text-white/65 hover:text-white hover:border-white/[0.16] hover:bg-white/[0.03] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingGoogle ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-white/20 uppercase tracking-[0.14em]">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Email section — swaps to success state after send */}
        {sent ? (
          <div className="text-center py-3">
            <CheckCircle size={20} className="text-white/40 mx-auto mb-3" />
            <p
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-white text-sm font-semibold mb-1.5"
            >
              Check your inbox
            </p>
            <p className="text-xs text-white/30 leading-relaxed">
              We sent a magic link to{' '}
              <span className="text-white/50">{email}</span>
            </p>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
              placeholder="you@company.com"
              className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-white/[0.18] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors mb-3"
            />
            <button
              onClick={handleMagicLink}
              disabled={!email.trim() || busy}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#09090e] rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              {loadingMagic ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Mail size={13} />
                  Send magic link
                  <ArrowRight size={13} className="ml-0.5" />
                </>
              )}
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400/70 text-xs mt-3.5 text-center leading-relaxed">{error}</p>
        )}
      </div>

      {/* Switch link */}
      <p className="text-center text-xs text-white/20 mt-5">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-white/40 hover:text-white/65 underline underline-offset-2 decoration-white/15 hover:decoration-white/30 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
