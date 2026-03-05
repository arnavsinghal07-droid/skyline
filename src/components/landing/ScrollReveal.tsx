'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { SPRING_DEFAULT, DURATION_SECTION, VIEWPORT_ONCE } from './motion'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  amount?: 'sm' | 'md'
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  amount = 'md',
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, VIEWPORT_ONCE)
  const prefersReduced = useReducedMotion()

  const dist = amount === 'sm' ? 20 : 40
  const reducedDist = dist * 0.6

  const d = prefersReduced ? reducedDist : dist

  const offsets = {
    up: { y: d },
    down: { y: -d },
    left: { x: d },
    right: { x: -d },
  }

  const transition = prefersReduced
    ? { duration: DURATION_SECTION * 0.5, delay }
    : { ...SPRING_DEFAULT, delay }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...offsets[direction] }
      }
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  )
}
