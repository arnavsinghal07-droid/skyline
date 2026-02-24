'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  FileText,
  GitMerge,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/query',     label: 'Query',     icon: Search },
  { href: '/briefs',    label: 'Briefs',    icon: FileText },
  { href: '/decisions', label: 'Decisions', icon: GitMerge },
  { href: '/settings',  label: 'Settings',  icon: Settings },
] as const

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col"
      style={{ background: '#0a0a11', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-[7px] h-[7px] bg-white rotate-45 shrink-0" />
          <span
            style={{ fontFamily: 'var(--font-syne)', letterSpacing: '0.22em' }}
            className="text-[11px] font-extrabold text-white uppercase"
          >
            Sightline
          </span>
        </div>
      </div>

      <div className="h-px bg-white/[0.05] mx-0" />

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm transition-colors duration-100',
              isActive(href)
                ? 'text-white bg-white/[0.06]'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5">
        <div className="h-px bg-white/[0.05] mb-4" />
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {signingOut
            ? <Loader2 size={15} className="animate-spin" />
            : <LogOut size={15} />
          }
          Sign out
        </button>
      </div>
    </aside>
  )
}
