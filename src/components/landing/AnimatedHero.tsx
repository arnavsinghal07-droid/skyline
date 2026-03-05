'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MoveRight } from 'lucide-react'
import { SPRING_DEFAULT } from './motion'

export function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const prefersReduced = useReducedMotion()
  const titles = useMemo(
    () => ['Discovery', 'Insights', 'Briefs', 'Decisions'],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  const springTransition = prefersReduced
    ? { duration: 0.3 }
    : SPRING_DEFAULT

  return (
    <section className="pt-24 pb-8 px-6 md:px-10 text-center">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-5xl sm:text-6xl md:text-[72px] tracking-tight text-[#0f0f14] mb-6 leading-[1.05]"
      >
        <span>Cursor for Product</span>
        <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
          &nbsp;
          {titles.map((title, index) => (
            <motion.span
              key={index}
              className="absolute"
              initial={{ opacity: 0, y: '-100' }}
              transition={springTransition}
              animate={
                titleNumber === index
                  ? { y: 0, opacity: 1 }
                  : {
                      y: titleNumber > index ? -150 : 150,
                      opacity: 0,
                    }
              }
            >
              {title}
            </motion.span>
          ))}
        </span>
      </h1>

      <p className="text-lg md:text-xl leading-relaxed tracking-tight text-[#0f0f14]/50 max-w-2xl mx-auto text-center mb-8">
        Upload customer signals, ask questions, get evidence-backed feature
        briefs — complete with UI direction and coding agent exports.
      </p>

      <div
        id="waitlist-hero"
        className="flex items-center justify-center gap-3"
      >
        <a
          href="#waitlist-bottom"
          className="group relative flex items-center gap-2 overflow-hidden bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-full px-7 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 transition-shadow hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.97] active:duration-[120ms]"
        >
          {/* Light sweep effect */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]"
          />
          <span className="relative z-10 flex items-center gap-2">
            Join Waitlist
            <MoveRight className="w-4 h-4" />
          </span>
        </a>
        <a
          href="#features"
          className="flex items-center gap-2 border border-black/[0.1] text-[#0f0f14]/60 rounded-full px-7 py-3 text-sm font-semibold hover:border-black/[0.2] hover:text-[#0f0f14] transition-all duration-200"
        >
          See How It Works
        </a>
      </div>
    </section>
  )
}
