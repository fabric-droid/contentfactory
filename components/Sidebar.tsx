'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Дашборд', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  { href: '/generator', label: 'Генератор', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ), badge: 'AI' },
  { href: '/history', label: 'История', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
]

const ACCOUNT_ITEMS = [
  { href: '/profile', label: 'Профиль бизнеса', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { href: '/tiers', label: 'Тарифы', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )},
  { href: '/onboarding', label: 'Анкета', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  )},
]

interface SidebarProps {
  plan?: string
  planKey?: string
  gensUsed?: number
  gensLimit?: number
  projectsCount?: number
  projectsLimit?: number
}

export default function Sidebar({ plan = 'Бизнес', planKey = 'business', gensUsed = 30, gensLimit = 100, projectsCount = 1, projectsLimit = 3 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const pct = Math.round((gensUsed / gensLimit) * 100)

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col relative overflow-hidden"
      style={{ background: '#181920', borderRight: '1px solid #323344' }}
    >
      {/* Lime glow bg */}
      <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(200,241,53,.06) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="px-5 py-[22px] pb-[18px]" style={{ borderBottom: '1px solid #323344' }}>
        <div className="font-heading text-[15px] font-bold text-snow tracking-tight">
          Content<span className="text-lime">Factory</span>
        </div>
        <div className="text-[10px] text-smoke mt-1 uppercase tracking-widest">SMM без усилий</div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-2.5 flex-1">
        <div className="text-[9px] text-line2 uppercase tracking-[1.2px] px-3 pt-3 pb-1.5">Главное</div>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-[9px] rounded-[8px] mb-px text-[13px] font-medium transition-all relative"
              style={{
                background: active ? 'rgba(200,241,53,.14)' : undefined,
                color: active ? '#C8F135' : '#8B8CA8',
              }}
            >
              {active && <span className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-lime rounded-sm" />}
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="ml-auto font-heading text-[9px] font-bold text-ink bg-lime px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </Link>
          )
        })}

        <div className="text-[9px] text-line2 uppercase tracking-[1.2px] px-3 pt-5 pb-1.5">Аккаунт</div>
        {ACCOUNT_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-[9px] rounded-[8px] mb-px text-[13px] font-medium transition-all relative"
              style={{
                background: active ? 'rgba(200,241,53,.14)' : undefined,
                color: active ? '#C8F135' : '#8B8CA8',
              }}
            >
              {active && <span className="absolute left-0 top-[20%] bottom-[20%] w-0.5 bg-lime rounded-sm" />}
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-[9px] rounded-[8px] mb-px text-[13px] font-medium w-full text-left transition-colors mt-1"
          style={{ color: '#8B8CA8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#C4C5D8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8B8CA8')}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current flex-shrink-0">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Выйти
        </button>
      </nav>

      {/* Plan widget */}
      <div className="m-3 flex flex-col gap-2">
        <div className="p-3.5 rounded-[12px]" style={{ background: '#21222C', border: '1px solid #323344' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-lime">
              {planKey === 'start' ? '🌱' : planKey === 'agency' ? '🏢' : '🚀'} {plan}
            </span>
            <Link href="/tiers" className="text-[10px] text-smoke underline hover:text-mist">изменить</Link>
          </div>
          <div className="text-[11px] text-smoke mb-1.5">{gensUsed} / {gensLimit} генераций</div>
          <div className="h-0.5 rounded-full mb-2.5" style={{ background: '#323344' }}>
            <div className="h-full bg-lime rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-smoke">
            <span>Проекты</span>
            <span style={{ color: projectsCount >= projectsLimit ? '#F87171' : '#8B8CA8' }}>
              {projectsCount} / {projectsLimit}
            </span>
          </div>
        </div>
        <Link
          href="/tiers"
          className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all hover:-translate-y-px"
          style={{ background: 'rgba(200,241,53,.12)', border: '1px solid rgba(200,241,53,.25)', color: '#C8F135' }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Купить токены
        </Link>
      </div>
    </aside>
  )
}
