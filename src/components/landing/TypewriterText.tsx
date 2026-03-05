'use client'

import { useEffect, useState, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'

interface TypewriterTextProps {
  text: string
  speed?: number
  trigger: boolean
  onComplete?: () => void
  className?: string
}

export function TypewriterText({
  text,
  speed = 50,
  trigger,
  onComplete,
  className,
}: TypewriterTextProps) {
  const prefersReduced = useReducedMotion()
  const [displayed, setDisplayed] = useState('')
  const [complete, setComplete] = useState(false)

  const handleComplete = useCallback(() => {
    setComplete(true)
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (!trigger) {
      setDisplayed('')
      setComplete(false)
      return
    }

    if (prefersReduced) {
      setDisplayed(text)
      handleComplete()
      return
    }

    let i = 0
    setDisplayed('')
    setComplete(false)

    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        handleComplete()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [trigger, text, speed, prefersReduced, handleComplete])

  return (
    <span className={className} aria-live="polite">
      {displayed}
      {trigger && !complete && (
        <span className="inline-block w-[2px] h-[1em] bg-[#7c3aed] ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  )
}
