import Link from 'next/link'
import {
  Radio,
  MessageSquare,
  FileText,
  GitMerge,
  Inbox,
  Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const stats = [
  {
    label: 'Total Signals',
    icon: Radio,
    value: '0',
    sublabel: 'across all sources',
  },
  {
    label: 'Queries',
    icon: MessageSquare,
    value: '0',
    sublabel: 'this week',
  },
  {
    label: 'Briefs Generated',
    icon: FileText,
    value: '0',
    sublabel: 'all time',
  },
  {
    label: 'Decisions Logged',
    icon: GitMerge,
    value: '0',
    sublabel: 'all time',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8 max-w-5xl w-full">

      {/* Header */}
      <p className="text-xs text-[#aaa] uppercase tracking-widest mb-2">
        Overview
      </p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-[#111]"
      >
        Dashboard
      </h1>
      <p className="text-sm text-[#999] mt-1">
        Welcome back, {user?.email}
      </p>

      <div className="mt-8 mb-8 border-b border-[#e8e8ec]" />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, icon: Icon, value, sublabel }) => (
          <div
            key={label}
            className="bg-white border border-[#e8e8ec] rounded-xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#aaa] uppercase tracking-wider">
                {label}
              </span>
              <Icon size={14} className="text-[#ccc] shrink-0" />
            </div>
            <p
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-3xl font-bold text-[#111] mt-3"
            >
              {value}
            </p>
            <p className="text-xs text-[#bbb] mt-1">{sublabel}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <p
          style={{ fontFamily: 'var(--font-syne)' }}
          className="text-sm font-semibold text-[#777] uppercase tracking-widest mb-5"
        >
          Recent Activity
        </p>

        <div className="bg-white border border-[#e8e8ec] rounded-xl">
          <div className="py-16 flex flex-col items-center">
            <Inbox size={28} className="text-[#ddd] mb-4" />
            <p
              style={{ fontFamily: 'var(--font-syne)' }}
              className="text-sm font-semibold text-[#999] mb-1.5"
            >
              No signals yet
            </p>
            <p className="text-xs text-[#bbb] mb-6">
              Connect your first source to start analysing customer signals
            </p>
            <Link
              href="/sources/new"
              className="flex items-center gap-1.5 bg-[#111] text-white rounded-lg py-2 px-4 text-xs font-semibold hover:bg-[#222] active:bg-[#333] transition-all"
            >
              <Plus size={12} />
              Connect a Source
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
