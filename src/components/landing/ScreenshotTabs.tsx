'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { SPRING_DEFAULT } from './motion'

const TABS = [
  { id: 'query', label: 'Discovery', src: '/screenshots/query.png' },
  { id: 'brief', label: 'Brief', src: '/screenshots/brief.png' },
  { id: 'export', label: 'Export', src: '/screenshots/export.png' },
] as const

type TabId = (typeof TABS)[number]['id']

export function ScreenshotTabs() {
  const [active, setActive] = useState<TabId>('query')

  const activeTab = TABS.find(t => t.id === active)!

  return (
    <div className="space-y-8">
      {/* Tab bar with sliding pill */}
      <div className="mx-auto w-fit">
        <div className="relative flex items-center gap-1 rounded-full bg-black/[0.03] p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200"
              style={{
                color: active === tab.id ? '#0f0f14' : 'rgba(15,15,20,0.4)',
              }}
            >
              {/* Sliding pill indicator */}
              {active === tab.id && (
                <motion.span
                  layoutId="screenshot-tab-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={SPRING_DEFAULT}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <Image
          src={activeTab.src}
          alt={`${activeTab.label} interface screenshot`}
          width={1280}
          height={800}
          className="w-full h-auto"
          priority={active === 'query'}
        />
      </div>
    </div>
  )
}
