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
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="mx-auto w-fit">
        <div className="flex items-center gap-1 bg-[#f5f5f7] border border-[#e8e8ec] rounded-full p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                active === tab.id
                  ? 'bg-[#111] text-white shadow-sm'
                  : 'text-[#888] hover:text-[#555]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden border border-[#e8e8ec] shadow-xl shadow-black/[0.06]">
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
