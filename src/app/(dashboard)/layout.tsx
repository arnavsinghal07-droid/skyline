import { redirect } from 'next/navigation'
import { Syne } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
})

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className={`${syne.variable} min-h-screen bg-[#09090e]`}>
      <Sidebar />
      <main className="ml-[240px] min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
