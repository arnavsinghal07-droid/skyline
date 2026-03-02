import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Sparkles, Upload, MessageSquare, FileText } from 'lucide-react'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { ScreenshotTabs } from '@/components/landing/ScreenshotTabs'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090e] text-white font-[family-name:var(--font-geist-sans)]">

      {/* ── Sticky Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090e]/80 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
            <span
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-[11px] font-bold tracking-[0.22em] text-white uppercase"
            >
              Sightline
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/45 hover:text-white/70 transition-colors"
            >
              Log in
            </Link>
            <a
              href="#waitlist-hero"
              className="flex items-center gap-1.5 bg-white text-[#09090e] rounded-lg px-3.5 py-1.5 text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              Join waitlist
              <ArrowRight size={11} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Label */}
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1 mb-8">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-white/40 uppercase">
              Now in beta
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]"
          >
            Cursor for<br />Product Managers
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn customer signals into evidence-backed feature briefs — complete with UI direction,
            data model hints, and coding agent exports.
          </p>

          {/* Waitlist form */}
          <div id="waitlist-hero" className="max-w-md mx-auto mb-5">
            <WaitlistForm />
          </div>

          {/* Secondary link */}
          <p className="text-xs text-white/25">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-white/45 hover:text-white/65 underline underline-offset-2 decoration-white/15 hover:decoration-white/30 transition-colors"
            >
              Log in
            </Link>
          </p>

          {/* Hero screenshot */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60">
            <Image
              src="/screenshots/query.png"
              alt="Sightline discovery interface"
              width={1280}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-xs font-bold tracking-[0.16em] text-white/25 uppercase text-center mb-3"
          >
            How it works
          </p>
          <h2
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-3xl font-bold tracking-tight text-white text-center mb-4"
          >
            From signals to specs in minutes
          </h2>
          <p className="text-sm text-white/35 text-center max-w-xl mx-auto mb-16">
            No more synthesizing calls manually. Sightline turns your evidence into implementation-ready specs.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]">
            {/* Step 1 */}
            <div className="bg-[#09090e] p-8">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5">
                <Upload size={18} className="text-white/50" />
              </div>
              <div className="text-[10px] font-bold tracking-[0.14em] text-white/20 uppercase mb-2">01</div>
              <h3
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-base font-bold text-white mb-2.5"
              >
                Upload signals
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Drop in call recordings, support tickets, NPS responses, or usage data. Sightline ingests, chunks, and embeds everything automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#09090e] p-8">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5">
                <MessageSquare size={18} className="text-white/50" />
              </div>
              <div className="text-[10px] font-bold tracking-[0.14em] text-white/20 uppercase mb-2">02</div>
              <h3
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-base font-bold text-white mb-2.5"
              >
                Ask questions
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Query your evidence base in natural language. Get cited answers with confidence scores — not hallucinations. Every claim traces back to a real signal.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#09090e] p-8">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5">
                <FileText size={18} className="text-white/50" />
              </div>
              <div className="text-[10px] font-bold tracking-[0.14em] text-white/20 uppercase mb-2">03</div>
              <h3
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-base font-bold text-white mb-2.5"
              >
                Get briefs
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Generate feature briefs with UI direction, data model hints, and coding agent export packages — ready for Cursor or Claude Code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Screenshot Showcase ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-xs font-bold tracking-[0.16em] text-white/25 uppercase text-center mb-3"
          >
            Product
          </p>
          <h2
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-3xl font-bold tracking-tight text-white text-center mb-4"
          >
            See it in action
          </h2>
          <p className="text-sm text-white/35 text-center max-w-xl mx-auto mb-12">
            From discovery query to implementation-ready export in a single workflow.
          </p>

          <ScreenshotTabs />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-xs font-bold tracking-[0.16em] text-white/25 uppercase text-center mb-3"
          >
            Pricing
          </p>
          <h2
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-3xl font-bold tracking-tight text-white text-center mb-4"
          >
            Simple pricing
          </h2>
          <p className="text-sm text-white/35 text-center max-w-lg mx-auto mb-14">
            Start free with 3 briefs. Upgrade when you&apos;re ready to move fast.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">

            {/* Starter */}
            <div className="bg-[#0d0d15] border border-white/[0.08] rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-sm text-white/40 mb-1">Starter</p>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ fontFamily: 'var(--font-syne)' }}
                    className="text-4xl font-bold text-white"
                  >
                    $79
                  </span>
                  <span className="text-sm text-white/30">/month</span>
                </div>
                <p className="text-xs text-white/25 mt-1.5">10 briefs per month</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Discovery query interface',
                  '10 feature briefs per month',
                  'UI Direction + Data Model Hints',
                  'Coding agent export (.md)',
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <span className="text-sm text-white/55">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 border border-white/[0.15] rounded-lg py-2.5 px-4 text-sm font-semibold text-white hover:bg-white/[0.04] transition-all duration-150"
              >
                Get started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-white/[0.03] border border-white/[0.20] rounded-2xl p-8 flex flex-col">
              {/* Recommended badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-white text-[#09090e] text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  Recommended
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-white/40 mb-1">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span
                    style={{ fontFamily: 'var(--font-syne)' }}
                    className="text-4xl font-bold text-white"
                  >
                    $299
                  </span>
                  <span className="text-sm text-white/30">/month</span>
                </div>
                <p className="text-xs text-white/25 mt-1.5">Unlimited briefs</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Everything in Starter',
                  'Unlimited feature briefs',
                  'Priority support',
                  'Early access to new features',
                ].map(feature => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <span className="text-sm text-white/55">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 bg-white text-[#09090e] rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-white/90 active:bg-white/80 transition-all duration-150"
              >
                Get started
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Footnote */}
          <p className="text-center text-xs text-white/25 mt-6">
            Start with 3 free briefs — no credit card required.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h2
            style={{ fontFamily: 'var(--font-syne)' }}
            className="text-3xl font-bold tracking-tight text-white mb-4"
          >
            Ready to build what matters?
          </h2>
          <p className="text-sm text-white/45 mb-8">
            Join the waitlist and be first to try Sightline.
          </p>
          <div className="max-w-md mx-auto">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-[6px] h-[6px] bg-white/30 rotate-45 shrink-0" />
            <span
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-[10px] font-bold tracking-[0.20em] text-white/25 uppercase"
            >
              Sightline
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} · Built for PMs who ship.
          </p>
        </div>
      </footer>

    </div>
  )
}
