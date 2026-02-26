'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard } from 'lucide-react'

const settingsTabs = [
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  // Future tabs: Account, Team, etc.
] as const

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="p-8 max-w-5xl w-full">
      {/* Header */}
      <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Settings</p>
      <h1
        style={{ fontFamily: 'var(--font-syne)' }}
        className="text-2xl font-bold text-white mb-1"
      >
        Settings
      </h1>
      <p className="text-sm text-white/35 mb-6">
        Manage your subscription and account preferences
      </p>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] mb-8">
        {settingsTabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'text-white border-white'
                  : 'text-white/35 border-transparent hover:text-white/60',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Tab content */}
      {children}
    </div>
  )
}
