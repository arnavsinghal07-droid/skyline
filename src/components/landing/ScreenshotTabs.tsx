'use client'

import { useState } from 'react'
import Image from 'next/image'

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
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="mx-auto w-fit">
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active === tab.id
                  ? 'bg-white text-[#09090e]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60">
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
