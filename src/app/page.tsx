import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Sparkles, Upload, MessageSquare, FileText, Menu } from 'lucide-react'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { AnimatedHero } from '@/components/landing/AnimatedHero'
import { FeatureDisplayCards } from '@/components/landing/FeatureDisplayCards'
import { GlassCard } from '@/components/landing/GlassCard'
import { AnimatedGradientBackground } from '@/components/landing/AnimatedGradientBackground'
import { NoiseOverlay } from '@/components/landing/NoiseOverlay'
import { HeroGradientBackground } from '@/components/landing/HeroGradientBackground'
import { FloatingMockup } from '@/components/landing/FloatingMockup'
import { DemoWorkflow } from '@/components/landing/DemoWorkflow'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Fixed animated gradient background */}
      <AnimatedGradientBackground />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">

        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 -mx-6 md:-mx-10 px-6 md:px-10 py-4 bg-white/70 backdrop-blur-[16px] border-b border-black/[0.04]">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-[7px] w-[7px] rotate-45 bg-[#0f0f14] shrink-0" />
              <span
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f0f14]"
              >
                Sightline
              </span>
            </div>

            <div className="hidden items-center gap-1 rounded-full bg-black/[0.03] px-1.5 py-1 md:flex">
              {['Features', 'Pricing', 'About'].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="rounded-full px-4 py-1.5 text-sm text-[#0f0f14]/50 transition-colors hover:text-[#0f0f14]"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden text-sm text-[#0f0f14]/40 transition-colors hover:text-[#0f0f14]/70 md:block"
              >
                Log in
              </Link>
              <a
                href="#waitlist-hero"
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/15 transition-shadow hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.97]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]"
                />
                <span className="relative z-10">Join Waitlist</span>
              </a>
              {/* Mobile menu button */}
              <button className="md:hidden text-[#0f0f14]/50 hover:text-[#0f0f14] transition-colors" aria-label="Menu">
                <Menu size={20} />
              </button>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="relative">
          <HeroGradientBackground />
          <AnimatedHero />
        </div>

        {/* ── Floating Product Mockup ── */}
        <section className="py-12 md:py-20">
          <ScrollReveal amount="sm">
            <h2
              style={{ fontFamily: 'var(--font-serif)' }}
              className="mb-8 text-center text-3xl text-[#0f0f14] md:text-5xl"
            >
              Your AI-powered<br />discovery workspace
            </h2>
          </ScrollReveal>

          <FloatingMockup>
            <Image
              src="/screenshots/query.png"
              alt="Sightline discovery interface"
              width={1400}
              height={720}
              className="mx-auto h-full w-full object-cover object-left-top"
              draggable={false}
              priority
            />
          </FloatingMockup>
        </section>

        {/* ── Features / Analytics Section ── */}
        <ScrollReveal>
          <section id="features" className="py-16 md:py-24">
            <h2
              style={{ fontFamily: 'var(--font-serif)' }}
              className="mb-4 text-center text-4xl text-[#0f0f14] md:text-5xl"
            >
              Advanced Discovery<br />and Reporting
            </h2>

            <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
              {/* Left card — Signal Analysis */}
              <ScrollReveal delay={0.1}>
                <GlassCard className="p-8" animate={false}>
                  <h3
                    style={{ fontFamily: 'var(--font-serif)' }}
                    className="mb-8 text-xl text-[#0f0f14]"
                  >
                    Signal Analysis
                  </h3>
                  <div className="relative h-[200px]">
                    {[
                      { label: 'Customer Calls', top: '5%', left: '10%', rotate: -4 },
                      { label: 'Support Tickets', top: '20%', left: '40%', rotate: 6 },
                      { label: 'NPS Responses', top: '38%', left: '5%', rotate: -2 },
                      { label: 'Usage Data', top: '42%', left: '55%', rotate: 8 },
                      { label: 'Competitor Reviews', top: '60%', left: '15%', rotate: -6 },
                      { label: 'Feedback', top: '58%', left: '65%', rotate: 3 },
                      { label: 'Feature Requests', top: '78%', left: '30%', rotate: -3 },
                      { label: 'Churn Signals', top: '8%', left: '65%', rotate: 5 },
                      { label: 'Onboarding', top: '75%', left: '0%', rotate: -8 },
                    ].map(({ label, top, left, rotate }) => (
                      <span
                        key={label}
                        className="absolute inline-flex items-center whitespace-nowrap rounded-full border border-black/[0.06] bg-white/70 px-3.5 py-1.5 text-xs text-[#0f0f14]/60"
                        style={{ top, left, transform: `rotate(${rotate}deg)` }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-[#7c3aed]" />
                    <div className="h-1.5 w-12 rounded-full bg-[#ec4899]" />
                    <div className="h-1.5 w-14 rounded-full bg-[#eab308]" />
                  </div>
                </GlassCard>
              </ScrollReveal>

              {/* Right card — Evidence Metrics */}
              <ScrollReveal delay={0.25}>
                <GlassCard className="p-8" animate={false}>
                  <h3
                    style={{ fontFamily: 'var(--font-serif)' }}
                    className="mb-6 text-xl text-[#0f0f14]"
                  >
                    Evidence Scoring
                  </h3>

                  <div className="mb-6 flex gap-3">
                    <div className="flex-1 rounded-2xl bg-[#eab308] px-5 py-4">
                      <p className="mb-1 text-xs font-semibold text-[#0f0f14]/70">Confidence</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-3xl text-[#0f0f14]"
                      >
                        HIGH
                      </p>
                    </div>
                    <div className="flex-1 rounded-2xl bg-[#ec4899] px-5 py-4">
                      <p className="mb-1 text-xs font-semibold text-white/80">Citations</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-3xl text-white"
                      >
                        12
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-1">
                    {['7 days', '30 days', '90 days', '1 year'].map((period, i) => (
                      <span
                        key={period}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          i === 1
                            ? 'bg-[#0f0f14] text-white'
                            : 'border border-black/[0.06] bg-white/70 text-[#0f0f14]/40'
                        }`}
                      >
                        {period}
                      </span>
                    ))}
                  </div>

                  <div className="flex h-20 items-end gap-1.5 px-2">
                    {[35, 42, 28, 55, 48, 62, 70, 58, 75, 80, 72, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-[#ec4899]/25"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </GlassCard>
              </ScrollReveal>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Demo Workflow — The Centerpiece ── */}
        <ScrollReveal>
          <section className="py-16 md:py-24">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#0f0f14]/30">
              See it in action
            </p>
            <h2
              style={{ fontFamily: 'var(--font-serif)' }}
              className="mb-4 text-center text-4xl text-[#0f0f14] md:text-5xl"
            >
              From question to insight<br />in seconds
            </h2>
            <p className="mx-auto mb-14 max-w-xl text-center text-sm text-[#0f0f14]/50">
              Type a question about your product. Sightline analyzes hundreds of customer signals and surfaces evidence-backed answers in real time.
            </p>

            <DemoWorkflow />
          </section>
        </ScrollReveal>

        {/* ── Display Cards — Capabilities ── */}
        <ScrollReveal>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#0f0f14]/30">
                Capabilities
              </p>
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="mb-4 text-center text-4xl text-[#0f0f14] md:text-5xl"
              >
                From signals to specs
              </h2>
              <p className="mx-auto mb-16 max-w-xl text-center text-sm text-[#0f0f14]/50">
                Three AI-powered steps that close the loop from customer feedback to implementation-ready specs.
              </p>

              <div className="flex justify-center">
                <FeatureDisplayCards />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Big Text ── */}
        <ScrollReveal>
          <section className="py-16 md:py-20 text-center">
            <p
              style={{ fontFamily: 'var(--font-serif)' }}
              className="mx-auto max-w-5xl text-4xl leading-[1.15] tracking-tight text-[#0f0f14] md:text-5xl lg:text-6xl"
            >
              Sightline analyzes your customer signals in real-time, delivering evidence-backed insights and actionable recommendations.
            </p>
          </section>
        </ScrollReveal>

        {/* ── How It Works — Staggered Cards ── */}
        <ScrollReveal>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
                {/* Card 1 — Upload */}
                <ScrollReveal delay={0}>
                  <div className="md:mt-20">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="mb-4 text-lg text-[#0f0f14]"
                    >
                      Upload Your<br />Customer Signals
                    </h3>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#f97316] p-6 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(249,115,22,0.2)] hover:-translate-y-1">
                      <p className="text-xs font-semibold text-white/80">Signal Ingestion</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="absolute bottom-2 left-6 text-[80px] leading-none text-white/30"
                      >
                        01
                      </p>
                      <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <Upload size={40} className="absolute right-6 top-6 text-white/60" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 2 — Query */}
                <ScrollReveal delay={0.15}>
                  <div className="md:-mt-8">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="mb-4 text-lg text-[#0f0f14]"
                    >
                      Ask Questions,<br />Get Cited Answers
                    </h3>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#ec4899] p-6 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(236,72,153,0.2)] hover:-translate-y-1">
                      <p className="text-xs font-semibold text-white/80">Discovery Query</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="absolute bottom-2 left-6 text-[80px] leading-none text-white/30"
                      >
                        02
                      </p>
                      <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <MessageSquare size={40} className="absolute right-6 top-6 text-white/60" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 3 — Briefs */}
                <ScrollReveal delay={0.3}>
                  <div className="md:mt-14">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="mb-4 text-lg text-[#0f0f14]"
                    >
                      Generate Complete<br />Feature Briefs
                    </h3>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[#7c3aed] p-6 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(124,58,237,0.2)] hover:-translate-y-1">
                      <p className="text-xs font-semibold text-white/80">Brief Generator</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="absolute bottom-2 left-6 text-[80px] leading-none text-white/30"
                      >
                        03
                      </p>
                      <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <FileText size={40} className="absolute right-6 top-6 text-white/60" />
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Stats Section ── */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl divide-y divide-black/[0.06]">
            <ScrollReveal>
              <div className="flex flex-col items-center gap-6 py-10 md:flex-row md:gap-8">
                <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] shadow-lg shadow-purple-500/15 md:h-[140px] md:w-[140px]">
                  <Upload size={48} className="text-white/70" />
                </div>
                <div className="flex flex-1 flex-col items-center gap-4 md:flex-row md:gap-6">
                  <div className="text-center md:text-left">
                    <span className="mb-2 inline-block rounded-full bg-[#f97316] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Signals Processed
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-6xl leading-none tracking-tight text-[#0f0f14] md:text-[72px]"
                    >
                      10X
                    </p>
                  </div>
                  <p className="max-w-[240px] text-center text-sm leading-relaxed text-[#0f0f14]/40 md:ml-auto md:text-left">
                    Faster than manual synthesis. Ingest calls, tickets, and usage data in minutes, not weeks.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex flex-col items-center gap-6 py-10 md:flex-row md:gap-8">
                <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#be185d] shadow-lg shadow-pink-500/15 md:h-[140px] md:w-[140px]">
                  <MessageSquare size={48} className="text-white/70" />
                </div>
                <div className="flex flex-1 flex-col items-center gap-4 md:flex-row md:gap-6">
                  <div className="text-center md:text-left">
                    <span className="mb-2 inline-block rounded-full bg-[#ec4899] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Evidence-Backed
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-6xl leading-none tracking-tight text-[#0f0f14] md:text-[72px]"
                    >
                      100%
                    </p>
                  </div>
                  <p className="max-w-[240px] text-center text-sm leading-relaxed text-[#0f0f14]/40 md:ml-auto md:text-left">
                    Every recommendation is grounded in real customer signals. No hallucinations, no guesswork.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex flex-col items-center gap-6 py-10 md:flex-row md:gap-8">
                <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eab308] to-[#a16207] shadow-lg shadow-yellow-500/15 md:h-[140px] md:w-[140px]">
                  <FileText size={48} className="text-white/70" />
                </div>
                <div className="flex flex-1 flex-col items-center gap-4 md:flex-row md:gap-6">
                  <div className="text-center md:text-left">
                    <span className="mb-2 inline-block rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Saved Weekly
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-6xl leading-none tracking-tight text-[#0f0f14] md:text-[72px]"
                    >
                      +40h
                    </p>
                  </div>
                  <p className="max-w-[240px] text-center text-sm leading-relaxed text-[#0f0f14]/40 md:ml-auto md:text-left">
                    From signal to spec in minutes. Briefs include UI direction, data model hints, and coding agent exports.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Pricing ── */}
        <ScrollReveal>
          <section id="pricing" className="py-16 md:py-24">
            <div className="mx-auto max-w-6xl">
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="mb-4 text-center text-4xl text-[#0f0f14]"
              >
                Simple pricing
              </h2>
              <p className="mx-auto mb-14 max-w-lg text-center text-sm text-[#0f0f14]/50">
                Start free with 3 briefs. Upgrade when you&apos;re ready to move fast.
              </p>

              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
                {/* Starter */}
                <ScrollReveal delay={0.1}>
                  <GlassCard className="flex h-full flex-col p-8" hoverEffect animate={false}>
                    <div className="mb-6">
                      <p className="mb-1 text-sm text-[#0f0f14]/40">Starter</p>
                      <div className="flex items-baseline gap-1">
                        <span
                          style={{ fontFamily: 'var(--font-serif)' }}
                          className="text-4xl text-[#0f0f14]"
                        >
                          $79
                        </span>
                        <span className="text-sm text-[#0f0f14]/30">/month</span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#0f0f14]/30">10 briefs per month</p>
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {[
                        'Discovery query interface',
                        '10 feature briefs per month',
                        'UI Direction + Data Model Hints',
                        'Coding agent export (.md)',
                      ].map(feature => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check size={13} className="mt-0.5 shrink-0 text-[#0f0f14]/20" />
                          <span className="text-sm text-[#0f0f14]/60">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className="flex items-center justify-center gap-2 rounded-full border border-black/[0.1] px-4 py-3 text-sm font-semibold text-[#0f0f14]/60 transition-all duration-200 hover:border-black/[0.2] hover:text-[#0f0f14] active:scale-[0.97]"
                    >
                      Get started
                    </Link>
                  </GlassCard>
                </ScrollReveal>

                {/* Pro */}
                <ScrollReveal delay={0.25}>
                  <div className="relative">
                    <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#0f0f14] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                        <Sparkles size={10} />
                        Recommended
                      </span>
                    </div>

                    <GlassCard className="flex h-full flex-col p-8" glowColor="purple" hoverEffect animate={false}>
                      <div className="mb-6">
                        <p className="mb-1 text-sm text-[#0f0f14]/40">Pro</p>
                        <div className="flex items-baseline gap-1">
                          <span
                            style={{ fontFamily: 'var(--font-serif)' }}
                            className="text-4xl text-[#0f0f14]"
                          >
                            $299
                          </span>
                          <span className="text-sm text-[#0f0f14]/30">/month</span>
                        </div>
                        <p className="mt-1.5 text-xs text-[#0f0f14]/30">Unlimited briefs</p>
                      </div>

                      <ul className="mb-8 flex-1 space-y-3">
                        {[
                          'Everything in Starter',
                          'Unlimited feature briefs',
                          'Priority support',
                          'Early access to new features',
                        ].map(feature => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <Check size={13} className="mt-0.5 shrink-0 text-[#0f0f14]/20" />
                            <span className="text-sm text-[#0f0f14]/60">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href="#waitlist-bottom"
                        className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/15 transition-shadow hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.97]"
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]"
                        />
                        <span className="relative z-10 flex items-center gap-2">
                          Get started
                          <ArrowRight size={13} />
                        </span>
                      </a>
                    </GlassCard>
                  </div>
                </ScrollReveal>
              </div>

              <p className="mt-6 text-center text-xs text-[#0f0f14]/30">
                Start with 3 free briefs — no credit card required.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Final CTA ── */}
        <ScrollReveal>
          <section id="waitlist-bottom" className="py-16 text-center md:py-24">
            <div className="mx-auto max-w-6xl">
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="mb-4 text-4xl text-[#0f0f14]"
              >
                Ready to build what matters?
              </h2>
              <p className="mb-8 text-sm text-[#0f0f14]/50">
                Join the waitlist and be first to try Sightline.
              </p>
              <div className="mx-auto max-w-md">
                <WaitlistForm />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Footer ── */}
        <footer className="border-t border-black/[0.06] py-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-[6px] w-[6px] rotate-45 bg-[#0f0f14]/20 shrink-0" />
              <span
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-[10px] font-bold uppercase tracking-[0.20em] text-[#0f0f14]/30"
              >
                Sightline
              </span>
            </div>

            <p className="text-xs text-[#0f0f14]/20">
              &copy; {new Date().getFullYear()} &middot; Built for PMs who ship.
            </p>
          </div>
        </footer>

      </div>

      {/* Noise overlay */}
      <NoiseOverlay />
    </div>
  )
}
