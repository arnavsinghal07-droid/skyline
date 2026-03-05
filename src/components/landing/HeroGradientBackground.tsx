'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export function HeroGradientBackground() {
  const prefersReduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollY } = useScroll()
  // Background glow moves at 0.7x scroll rate (parallax)
  const bgY = useTransform(scrollY, [0, 600], [0, -180])

  return (
    <motion.div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={prefersReduced ? {} : { y: bgY }}
    >
      {/* Purple glow — top right */}
      <motion.div
        className="absolute -right-[10%] -top-[20%] h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
        }}
        animate={
          prefersReduced
            ? {}
            : { x: [0, 40, -20, 0], y: [0, -30, 20, 0] }
        }
        transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />

      {/* Pink glow — center left */}
      <motion.div
        className="absolute -left-[5%] top-[20%] h-[500px] w-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
        }}
        animate={
          prefersReduced
            ? {}
            : { x: [0, -30, 25, 0], y: [0, 25, -15, 0] }
        }
        transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />
    </motion.div>
  )
}
