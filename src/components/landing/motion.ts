import type { Transition, Variants } from 'framer-motion'

// ---------------------------------------------------------------------------
// Spring presets
// ---------------------------------------------------------------------------
export const SPRING_DEFAULT: Transition = { type: 'spring', stiffness: 140, damping: 20 }
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 200, damping: 24 }
export const SPRING_GENTLE: Transition = { type: 'spring', stiffness: 100, damping: 18 }

// CSS cubic-bezier (for non-Framer transitions)
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// ---------------------------------------------------------------------------
// Duration constants (seconds)
// ---------------------------------------------------------------------------
export const DURATION_MICRO = 0.2
export const DURATION_CARD = 0.5
export const DURATION_SECTION = 0.7
export const DURATION_PAGE = 0.7

// ---------------------------------------------------------------------------
// Stagger constants (seconds)
// ---------------------------------------------------------------------------
export const STAGGER_TEXT = 0.1
export const STAGGER_CARDS = 0.12

// ---------------------------------------------------------------------------
// Viewport trigger config
// ---------------------------------------------------------------------------
export const VIEWPORT_ONCE = { once: true, margin: '-80px' as const }

// ---------------------------------------------------------------------------
// Reduced motion helpers
// ---------------------------------------------------------------------------
export function getSpringTransition(prefersReduced: boolean): Transition {
  return prefersReduced ? { duration: DURATION_SECTION * 0.5 } : SPRING_DEFAULT
}

// ---------------------------------------------------------------------------
// Reusable animation variants
// ---------------------------------------------------------------------------
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInUpCard: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_CARDS } },
}
