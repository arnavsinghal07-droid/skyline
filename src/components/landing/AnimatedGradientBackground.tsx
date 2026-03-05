'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function AnimatedGradientBackground() {
  const prefersReduced = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f8f8fc]"
    >
      {/* Purple blob — top right */}
      <motion.div
        className="absolute -right-[20%] -top-[10%] h-[800px] w-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
        }}
        animate={
          prefersReduced
            ? {}
            : {
                x: [0, 80, -40, 0],
                y: [0, -60, 40, 0],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />

      {/* Pink blob — bottom left */}
      <motion.div
        className="absolute -bottom-[10%] -left-[15%] h-[700px] w-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)',
        }}
        animate={
          prefersReduced
            ? {}
            : {
                x: [0, -60, 50, 0],
                y: [0, 50, -30, 0],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />

      {/* Blue blob — center */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)',
        }}
        animate={
          prefersReduced
            ? {}
            : {
                scale: [1, 1.15, 0.95, 1],
              }
        }
        transition={{
          duration: 14,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />
    </div>
  )
}
