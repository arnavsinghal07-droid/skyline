'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { SPRING_DEFAULT } from './motion'
import { CursorSimulation } from './CursorSimulation'

interface FloatingMockupProps {
  children: React.ReactNode
}

export function FloatingMockup({ children }: FloatingMockupProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      className="relative mx-auto max-w-5xl"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 60, rotateX: 6 }}
      whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={prefersReduced ? { duration: 0.3 } : SPRING_DEFAULT}
      style={{ perspective: '1200px' }}
    >
      {/* Subtle floating animation */}
      <motion.div
        animate={
          prefersReduced
            ? {}
            : { y: [0, -4, 0] }
        }
        transition={
          prefersReduced
            ? {}
            : { duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
        }
      >
        {/* Dark product frame */}
        <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-[#1a1a24] p-1.5 md:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          {/* Top bar dots */}
          <div className="mb-2 flex items-center gap-1.5 px-2 pt-1">
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>

          {/* Content area */}
          <div className="relative overflow-hidden rounded-xl bg-[#f5f5f7]">
            {children}
            <CursorSimulation />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
