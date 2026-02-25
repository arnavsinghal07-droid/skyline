import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'

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

  // New users have no profile row yet — send them through onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/onboard')
  }

  return (
    <div className="min-h-screen bg-[#09090e]">
      <Sidebar />
      <main className="ml-[240px] min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
