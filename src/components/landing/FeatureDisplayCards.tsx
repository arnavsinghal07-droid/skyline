'use client'

import { Upload, MessageSquare, FileText } from 'lucide-react'
import DisplayCards from '@/components/ui/display-cards'

export function FeatureDisplayCards() {
  const cards = [
    {
      icon: <Upload className="size-4 text-orange-400" />,
      title: 'Signal Ingestion',
      description: 'Ingest calls, tickets & usage data',
      date: 'Automated',
      iconBgClassName: 'bg-orange-100',
      titleClassName: 'text-orange-600',
      className:
        '[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-[#e8e8ec] before:h-[100%] before:content-[\'\'] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0',
    },
    {
      icon: <MessageSquare className="size-4 text-pink-400" />,
      title: 'Discovery Query',
      description: 'Ask questions, get cited answers',
      date: 'Real-time',
      iconBgClassName: 'bg-pink-100',
      titleClassName: 'text-pink-600',
      className:
        '[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-[#e8e8ec] before:h-[100%] before:content-[\'\'] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0',
    },
    {
      icon: <FileText className="size-4 text-purple-400" />,
      title: 'Feature Briefs',
      description: 'Complete specs with UI direction',
      date: 'Auto-generated',
      iconBgClassName: 'bg-purple-100',
      titleClassName: 'text-purple-600',
      className:
        '[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10',
    },
  ]

  return <DisplayCards cards={cards} />
}
