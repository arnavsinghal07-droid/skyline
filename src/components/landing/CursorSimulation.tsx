'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { SPRING_GENTLE } from './motion'

// Waypoints as percentages of the container
const WAYPOINTS = [
  { x: 20, y: 15, delay: 0.8 },    // Start — hover above search bar
  { x: 35, y: 22, delay: 0.4 },    // Move to search bar center
  { x: 35, y: 22, delay: 1.5 },    // Pause — "clicking"
  { x: 50, y: 40, delay: 0.6 },    // Move down to results area
  { x: 45, y: 55, delay: 0.5 },    // Move to first result card
  { x: 45, y: 55, delay: 1.2 },    // Pause — "reading"
  { x: 60, y: 65, delay: 0.4 },    // Move to insight card
  { x: 60, y: 65, delay: 1.0 },    // Pause — "hovering insight"
  { x: 70, y: 78, delay: 0.5 },    // Move toward generate button
  { x: 70, y: 78, delay: 0.8 },    // Pause — "about to click"
]

export function CursorSimulation() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: false, margin: '-100px' })
  const [waypointIndex, setWaypointIndex] = useState(0)

  useEffect(() => {
    if (!isInView || prefersReduced) return

    const wp = WAYPOINTS[waypointIndex]
    const timer = setTimeout(() => {
      setWaypointIndex(prev =>
        prev >= WAYPOINTS.length - 1 ? 0 : prev + 1
      )
    }, wp.delay * 1000)

    return () => clearTimeout(timer)
  }, [waypointIndex, isInView, prefersReduced])

  if (prefersReduced) return null

  const currentWP = WAYPOINTS[waypointIndex]

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 hidden md:block"
    >
      <motion.div
        className="absolute"
        animate={{
          left: `${currentWP.x}%`,
          top: `${currentWP.y}%`,
        }}
        transition={SPRING_GENTLE}
      >
        {/* Cursor arrow SVG */}
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          className="drop-shadow-md"
        >
          <path
            d="M4 2L4 18L8.5 13.5L13.5 21L16 19.5L11 12L17 12L4 2Z"
            fill="#0f0f14"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Click ripple — visible when at a "pause" waypoint */}
        {waypointIndex > 0 &&
          WAYPOINTS[waypointIndex].x === WAYPOINTS[waypointIndex - 1]?.x && (
            <motion.div
              className="absolute -left-2 -top-2 h-6 w-6 rounded-full border border-purple-400/40"
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.8 }}
              key={waypointIndex}
            />
          )}
      </motion.div>
    </div>
  )
}
