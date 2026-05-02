import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { ToastProvider } from '@/components/Toast'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, gens_used, gens_limit')
    .eq('user_id', user.id)
    .single()

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const planLabels: Record<string, string> = {
    start: 'Старт',
    business: 'Бизнес',
    agency: 'Агентство',
  }

  const projectLimits: Record<string, number> = {
    start: 1,
    business: 3,
    agency: 20,
  }

  const planKey = profile?.plan ?? 'start'

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0E0F13' }}>
        <Sidebar
          plan={planLabels[planKey] ?? 'Старт'}
          planKey={planKey}
          gensUsed={profile?.gens_used ?? 0}
          gensLimit={profile?.gens_limit ?? 20}
          projectsCount={projectsCount ?? 0}
          projectsLimit={projectLimits[planKey] ?? 1}
        />
        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
