'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeInUpCard, SPRING_DEFAULT, VIEWPORT_ONCE, DURATION_CARD } from './motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  glowColor?: 'purple' | 'pink' | 'blue' | 'orange'
  animate?: boolean
}

const GLOW_COLORS = {
  purple: 'rgba(124, 58, 237, 0.12)',
  pink: 'rgba(236, 72, 153, 0.10)',
  blue: 'rgba(59, 130, 246, 0.10)',
  orange: 'rgba(249, 115, 22, 0.10)',
}

export function GlassCard({
  children,
  className,
  hoverEffect = false,
  glowColor,
  animate = true,
}: GlassCardProps) {
  const prefersReduced = useReducedMotion()

  const card = (
    <div className="relative">
      {glowColor && (
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 rounded-3xl blur-3xl"
          style={{ background: `radial-gradient(ellipse, ${GLOW_COLORS[glowColor]}, transparent 70%)` }}
        />
      )}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-white/60 backdrop-blur-[20px]',
          'border border-black/[0.06]',
          'shadow-[0_2px_16px_rgba(0,0,0,0.04)]',
          hoverEffect && [
            'transition-all duration-200 ease-out',
            'hover:-translate-y-1 hover:scale-[1.02]',
            'hover:shadow-[0_10px_40px_rgba(0,0,0,0.1)]',
            'hover:border-black/[0.12]',
            'active:scale-[0.98] active:duration-[120ms]',
          ],
          className,
        )}
      >
        {/* Inner highlight gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
        />
        {children}
      </div>
    </div>
  )

  if (!animate) return card

  return (
    <motion.div
      variants={fadeInUpCard}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      transition={prefersReduced ? { duration: DURATION_CARD * 0.5 } : SPRING_DEFAULT}
    >
      {card}
    </motion.div>
  )
}
