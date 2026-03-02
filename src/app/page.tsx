import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Sparkles, Upload, MessageSquare, FileText } from 'lucide-react'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { AnimatedHero } from '@/components/landing/AnimatedHero'
import { FeatureDisplayCards } from '@/components/landing/FeatureDisplayCards'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ebebef] font-[family-name:var(--font-geist-sans)]">

      {/* ── White Content Card ── */}
      <div className="max-w-[1240px] mx-auto bg-white rounded-b-[32px] shadow-xl shadow-black/[0.04]">

        {/* ── Nav ── */}
        <nav className="px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-[7px] h-[7px] bg-[#111] rotate-45 shrink-0" />
            <span
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-[11px] font-bold tracking-[0.22em] text-[#111] uppercase"
            >
              Sightline
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-[#f7f7f9] border border-[#eee] rounded-full px-1.5 py-1">
            {['Features', 'Pricing', 'About'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-1.5 rounded-full text-sm text-[#666] hover:text-[#111] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#888] hover:text-[#444] transition-colors"
            >
              Log in
            </Link>
            <a
              href="#waitlist-hero"
              className="flex items-center gap-1.5 bg-[#111] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#222] transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </nav>

        {/* ── Animated Hero ── */}
        <AnimatedHero />

        {/* ── Container Scroll Product Showcase ── */}
        <ContainerScroll
          titleComponent={
            <h2
              style={{ fontFamily: 'var(--font-serif)' }}
              className="text-3xl md:text-5xl text-[#111] mb-4"
            >
              Your AI-powered<br />discovery workspace
            </h2>
          }
        >
          <Image
            src="/screenshots/query.png"
            alt="Sightline discovery interface"
            width={1400}
            height={720}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
            priority
          />
        </ContainerScroll>

        {/* ── Features / Analytics Section ── */}
        <ScrollReveal>
          <section id="features" className="py-24 px-10">
            <h2
              style={{ fontFamily: 'var(--font-serif)' }}
              className="text-4xl md:text-5xl text-[#111] text-center mb-4"
            >
              Advanced Discovery<br />and Reporting
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14 max-w-5xl mx-auto">
              {/* Left card — Signal Analysis */}
              <ScrollReveal delay={0.1}>
                <div className="bg-[#fafafa] border border-[#eee] rounded-[20px] p-8">
                  <h3
                    style={{ fontFamily: 'var(--font-serif)' }}
                    className="text-xl text-[#111] mb-8"
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
                        className="absolute inline-flex items-center border border-[#ddd] rounded-full px-3.5 py-1.5 text-xs text-[#555] bg-white whitespace-nowrap"
                        style={{ top, left, transform: `rotate(${rotate}deg)` }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-4">
                    <div className="h-1.5 w-16 bg-[#7c3aed] rounded-full" />
                    <div className="h-1.5 w-12 bg-[#ec4899] rounded-full" />
                    <div className="h-1.5 w-14 bg-[#eab308] rounded-full" />
                  </div>
                </div>
              </ScrollReveal>

              {/* Right card — Evidence Metrics */}
              <ScrollReveal delay={0.25}>
                <div className="bg-[#fafafa] border border-[#eee] rounded-[20px] p-8">
                  <h3
                    style={{ fontFamily: 'var(--font-serif)' }}
                    className="text-xl text-[#111] mb-6"
                  >
                    Evidence Scoring
                  </h3>

                  <div className="flex gap-3 mb-6">
                    <div className="bg-[#eab308] rounded-2xl px-5 py-4 flex-1">
                      <p className="text-xs font-semibold text-[#111]/70 mb-1">Confidence</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-3xl text-[#111]"
                      >
                        HIGH
                      </p>
                    </div>
                    <div className="bg-[#ec4899] rounded-2xl px-5 py-4 flex-1">
                      <p className="text-xs font-semibold text-white/80 mb-1">Citations</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-3xl text-white"
                      >
                        12
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    {['7 days', '30 days', '90 days', '1 year'].map((period, i) => (
                      <span
                        key={period}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          i === 1
                            ? 'bg-[#111] text-white'
                            : 'bg-white border border-[#e0e0e4] text-[#888]'
                        }`}
                      >
                        {period}
                      </span>
                    ))}
                  </div>

                  <div className="h-20 flex items-end gap-1.5 px-2">
                    {[35, 42, 28, 55, 48, 62, 70, 58, 75, 80, 72, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-[#ec4899]/20"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Display Cards — Capabilities ── */}
        <ScrollReveal>
          <section className="py-24 px-10">
            <div className="max-w-5xl mx-auto">
              <p className="text-xs font-bold tracking-[0.16em] text-[#999] uppercase text-center mb-3">
                Capabilities
              </p>
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="text-4xl md:text-5xl text-[#111] text-center mb-4"
              >
                From signals to specs
              </h2>
              <p className="text-sm text-[#888] text-center max-w-xl mx-auto mb-16">
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
          <section className="py-20 px-10 text-center">
            <p
              style={{ fontFamily: 'var(--font-serif)' }}
              className="text-4xl md:text-5xl lg:text-6xl text-[#111] leading-[1.15] max-w-5xl mx-auto tracking-tight"
            >
              Sightline analyzes your customer signals in real-time, delivering evidence-backed insights and actionable recommendations.
            </p>
          </section>
        </ScrollReveal>

        {/* ── How It Works — Staggered Cards ── */}
        <ScrollReveal>
          <section className="py-24 px-10">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Card 1 — Upload */}
                <ScrollReveal delay={0}>
                  <div className="md:mt-20">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-lg text-[#111] mb-4"
                    >
                      Upload Your<br />Customer Signals
                    </h3>
                    <div className="bg-[#f97316] rounded-[20px] p-6 relative overflow-hidden aspect-[4/3]">
                      <p className="text-xs font-semibold text-white/80">Signal Ingestion</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-[80px] text-white/30 absolute bottom-2 left-6 leading-none"
                      >
                        01
                      </p>
                      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <Upload size={40} className="text-white/60 absolute top-6 right-6" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 2 — Query */}
                <ScrollReveal delay={0.15}>
                  <div className="md:-mt-8">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-lg text-[#111] mb-4"
                    >
                      Ask Questions,<br />Get Cited Answers
                    </h3>
                    <div className="bg-[#ec4899] rounded-[20px] p-6 relative overflow-hidden aspect-[4/3]">
                      <p className="text-xs font-semibold text-white/80">Discovery Query</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-[80px] text-white/30 absolute bottom-2 left-6 leading-none"
                      >
                        02
                      </p>
                      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <MessageSquare size={40} className="text-white/60 absolute top-6 right-6" />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 3 — Briefs */}
                <ScrollReveal delay={0.3}>
                  <div className="md:mt-14">
                    <h3
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-lg text-[#111] mb-4"
                    >
                      Generate Complete<br />Feature Briefs
                    </h3>
                    <div className="bg-[#7c3aed] rounded-[20px] p-6 relative overflow-hidden aspect-[4/3]">
                      <p className="text-xs font-semibold text-white/80">Brief Generator</p>
                      <p
                        style={{ fontFamily: 'var(--font-serif)' }}
                        className="text-[80px] text-white/30 absolute bottom-2 left-6 leading-none"
                      >
                        03
                      </p>
                      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowRight size={14} className="text-white" />
                      </div>
                      <FileText size={40} className="text-white/60 absolute top-6 right-6" />
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Stats Section ── */}
        <section className="py-20 px-10">
          <div className="max-w-4xl mx-auto divide-y divide-[#eee]">
            <ScrollReveal>
              <div className="flex items-center gap-8 py-10">
                <div className="w-[140px] h-[140px] rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] shrink-0 flex items-center justify-center">
                  <Upload size={48} className="text-white/70" />
                </div>
                <div className="flex items-center gap-6 flex-1">
                  <div>
                    <span className="inline-block bg-[#f97316] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                      Signals Processed
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-[72px] text-[#111] leading-none tracking-tight"
                    >
                      10X
                    </p>
                  </div>
                  <p className="text-sm text-[#888] leading-relaxed max-w-[240px] ml-auto">
                    Faster than manual synthesis. Ingest calls, tickets, and usage data in minutes, not weeks.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="flex items-center gap-8 py-10">
                <div className="w-[140px] h-[140px] rounded-2xl bg-gradient-to-br from-[#ec4899] to-[#be185d] shrink-0 flex items-center justify-center">
                  <MessageSquare size={48} className="text-white/70" />
                </div>
                <div className="flex items-center gap-6 flex-1">
                  <div>
                    <span className="inline-block bg-[#ec4899] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                      Evidence-Backed
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-[72px] text-[#111] leading-none tracking-tight"
                    >
                      100%
                    </p>
                  </div>
                  <p className="text-sm text-[#888] leading-relaxed max-w-[240px] ml-auto">
                    Every recommendation is grounded in real customer signals. No hallucinations, no guesswork.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="flex items-center gap-8 py-10">
                <div className="w-[140px] h-[140px] rounded-2xl bg-gradient-to-br from-[#eab308] to-[#a16207] shrink-0 flex items-center justify-center">
                  <FileText size={48} className="text-white/70" />
                </div>
                <div className="flex items-center gap-6 flex-1">
                  <div>
                    <span className="inline-block bg-[#7c3aed] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                      Saved Weekly
                    </span>
                    <p
                      style={{ fontFamily: 'var(--font-serif)' }}
                      className="text-[72px] text-[#111] leading-none tracking-tight"
                    >
                      +40h
                    </p>
                  </div>
                  <p className="text-sm text-[#888] leading-relaxed max-w-[240px] ml-auto">
                    From signal to spec in minutes. Briefs include UI direction, data model hints, and coding agent exports.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Pricing ── */}
        <ScrollReveal>
          <section id="pricing" className="py-24 px-10">
            <div className="max-w-6xl mx-auto">
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="text-4xl text-[#111] text-center mb-4"
              >
                Simple pricing
              </h2>
              <p className="text-sm text-[#888] text-center max-w-lg mx-auto mb-14">
                Start free with 3 briefs. Upgrade when you&apos;re ready to move fast.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                {/* Starter */}
                <ScrollReveal delay={0.1}>
                  <div className="bg-[#fafafa] border border-[#e8e8ec] rounded-[20px] p-8 flex flex-col h-full">
                    <div className="mb-6">
                      <p className="text-sm text-[#888] mb-1">Starter</p>
                      <div className="flex items-baseline gap-1">
                        <span
                          style={{ fontFamily: 'var(--font-serif)' }}
                          className="text-4xl text-[#111]"
                        >
                          $79
                        </span>
                        <span className="text-sm text-[#aaa]">/month</span>
                      </div>
                      <p className="text-xs text-[#aaa] mt-1.5">10 briefs per month</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {[
                        'Discovery query interface',
                        '10 feature briefs per month',
                        'UI Direction + Data Model Hints',
                        'Coding agent export (.md)',
                      ].map(feature => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check size={13} className="text-[#ccc] mt-0.5 shrink-0" />
                          <span className="text-sm text-[#666]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className="flex items-center justify-center gap-2 border border-[#ddd] rounded-full py-3 px-4 text-sm font-semibold text-[#444] hover:border-[#bbb] hover:text-[#222] transition-all duration-150"
                    >
                      Get started
                    </Link>
                  </div>
                </ScrollReveal>

                {/* Pro */}
                <ScrollReveal delay={0.25}>
                  <div className="relative bg-white border border-[#ddd] rounded-[20px] p-8 flex flex-col shadow-lg shadow-black/[0.04] h-full">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 bg-[#111] text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
                        <Sparkles size={10} />
                        Recommended
                      </span>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-[#888] mb-1">Pro</p>
                      <div className="flex items-baseline gap-1">
                        <span
                          style={{ fontFamily: 'var(--font-serif)' }}
                          className="text-4xl text-[#111]"
                        >
                          $299
                        </span>
                        <span className="text-sm text-[#aaa]">/month</span>
                      </div>
                      <p className="text-xs text-[#aaa] mt-1.5">Unlimited briefs</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {[
                        'Everything in Starter',
                        'Unlimited feature briefs',
                        'Priority support',
                        'Early access to new features',
                      ].map(feature => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check size={13} className="text-[#ccc] mt-0.5 shrink-0" />
                          <span className="text-sm text-[#666]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className="flex items-center justify-center gap-2 bg-[#111] text-white rounded-full py-3 px-4 text-sm font-semibold hover:bg-[#222] active:bg-[#333] transition-all duration-150"
                    >
                      Get started
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>

              <p className="text-center text-xs text-[#aaa] mt-6">
                Start with 3 free briefs — no credit card required.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Final CTA ── */}
        <ScrollReveal>
          <section id="waitlist-bottom" className="py-24 px-10 text-center">
            <div className="max-w-6xl mx-auto">
              <h2
                style={{ fontFamily: 'var(--font-serif)' }}
                className="text-4xl text-[#111] mb-4"
              >
                Ready to build what matters?
              </h2>
              <p className="text-sm text-[#888] mb-8">
                Join the waitlist and be first to try Sightline.
              </p>
              <div className="max-w-md mx-auto">
                <WaitlistForm />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ── Footer ── */}
        <footer className="py-10 px-10 border-t border-[#eee]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[6px] h-[6px] bg-[#ccc] rotate-45 shrink-0" />
              <span
                style={{ fontFamily: 'var(--font-syne)' }}
                className="text-[10px] font-bold tracking-[0.20em] text-[#aaa] uppercase"
              >
                Sightline
              </span>
            </div>

            <p className="text-xs text-[#bbb]">
              &copy; {new Date().getFullYear()} &middot; Built for PMs who ship.
            </p>
          </div>
        </footer>

      </div>

      {/* Gray bottom padding */}
      <div className="h-12" />

    </div>
  )
}
