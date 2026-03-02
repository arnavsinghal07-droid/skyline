'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MoveRight } from 'lucide-react'

export function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0)
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

  return (
    <section className="pt-24 pb-8 px-10 text-center">
      <h1
        style={{ fontFamily: 'var(--font-serif)' }}
        className="text-5xl sm:text-6xl md:text-[72px] tracking-tight text-[#111] mb-6 leading-[1.05]"
      >
        <span>Cursor for Product</span>
        <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
          &nbsp;
          {titles.map((title, index) => (
            <motion.span
              key={index}
              className="absolute"
              initial={{ opacity: 0, y: '-100' }}
              transition={{ type: 'spring', stiffness: 50 }}
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

      <p className="text-lg md:text-xl leading-relaxed tracking-tight text-[#888] max-w-2xl mx-auto text-center mb-8">
        Upload customer signals, ask questions, get evidence-backed feature
        briefs — complete with UI direction and coding agent exports.
      </p>

      <div
        id="waitlist-hero"
        className="flex items-center justify-center gap-3"
      >
        <a
          href="#waitlist-bottom"
          className="flex items-center gap-2 bg-[#7c3aed] text-white rounded-full px-7 py-3 text-sm font-semibold hover:bg-[#6d28d9] transition-colors shadow-lg shadow-purple-500/20"
        >
          Join Waitlist
          <MoveRight className="w-4 h-4" />
        </a>
        <a
          href="#features"
          className="flex items-center gap-2 border border-[#ddd] text-[#444] rounded-full px-7 py-3 text-sm font-semibold hover:border-[#bbb] hover:text-[#222] transition-colors"
        >
          See How It Works
        </a>
      </div>
    </section>
  )
}
