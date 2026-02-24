import type { Metadata } from 'next'
import { Syne } from 'next/font/google'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Sightline',
  description: 'AI-powered product management',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${syne.variable} min-h-screen bg-[#09090e] flex items-center justify-center p-4`}
    >
      {children}
    </div>
  )
}
