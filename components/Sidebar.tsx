'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Дашборд', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )},
  { href: '/generator', label: 'Генератор', badge: 'AI', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )},
  { href: '/scheduler', label: 'Планировщик', badge: 'NEW', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { href: '/history', label: 'История', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
]

const ACCOUNT_ITEMS = [
  { href: '/profile', label: 'Профиль бизнеса', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )},
  { href: '/tiers', label: 'Тарифы', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )},
  { href: '/onboarding', label: 'Анкета', icon: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
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

export default function Sidebar({
  plan = 'Старт',
  planKey = 'start',
  gensUsed = 0,
  gensLimit = 20,
  projectsCount = 0,
  projectsLimit = 1,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const pct = Math.min(Math.round((gensUsed / gensLimit) * 100), 100)

  return (
    <aside style={{ width: 240, flexShrink: 0, background: '#181920', borderRight: '1px solid #323344', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ content: '', position: 'absolute', top: -80, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,241,53,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #323344' }}>
        <div className="font-heading" style={{ fontSize: 15, fontWeight: 700, color: '#F8F8FC', letterSpacing: -0.3 }}>
          Content<span style={{ color: '#C8F135' }}>Factory</span>
        </div>
        <div style={{ fontSize: 10, color: '#8B8CA8', marginTop: 3, letterSpacing: '0.8px', textTransform: 'uppercase' }}>SMM без усилий</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 9, color: '#42435A', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '12px 12px 5px' }}>Главное</div>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 1, position: 'relative',
                fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s',
                background: active ? 'rgba(200,241,53,.14)' : 'transparent',
                color: active ? '#C8F135' : '#8B8CA8',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, background: '#C8F135', borderRadius: 2 }} />
              )}
              {item.icon}
              {item.label}
              {item.badge && (
                <span className="font-heading" style={{ marginLeft: 'auto', background: '#C8F135', color: '#0E0F13', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        <div style={{ fontSize: 9, color: '#42435A', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '12px 12px 5px' }}>Аккаунт</div>
        {ACCOUNT_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
                borderRadius: 8, cursor: 'pointer', marginBottom: 1, position: 'relative',
                fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s',
                background: active ? 'rgba(200,241,53,.14)' : 'transparent',
                color: active ? '#C8F135' : '#8B8CA8',
              }}
            >
              {active && (
                <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, background: '#C8F135', borderRadius: 2 }} />
              )}
              {item.icon}
              {item.label}
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 1, fontSize: 13, fontWeight: 500, width: '100%', textAlign: 'left', background: 'transparent', color: '#8B8CA8', border: 'none', marginTop: 4, transition: 'all .15s' }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" style={{ width: 15, height: 15, flexShrink: 0, stroke: 'currentColor' }}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Выйти
        </button>
      </nav>

      {/* Plan widget */}
      <div style={{ margin: 12, padding: 14, background: '#21222C', border: '1px solid #323344', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#C8F135' }}>
            {planKey === 'start' ? '🌱' : planKey === 'agency' ? '🏢' : '🚀'} {plan}
          </span>
          <Link href="/tiers" style={{ fontSize: 10, color: '#8B8CA8', textDecoration: 'underline' }}>изменить</Link>
        </div>
        <div style={{ fontSize: 11, color: '#8B8CA8', marginBottom: 6 }}>{gensUsed} / {gensLimit} генераций</div>
        <div style={{ height: 2, background: '#323344', borderRadius: 2, marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#C8F135', borderRadius: 2, transition: 'width .3s' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#8B8CA8' }}>
          <span>Проекты</span>
          <span style={{ color: projectsCount >= projectsLimit ? '#FF5252' : '#8B8CA8' }}>{projectsCount} / {projectsLimit}</span>
        </div>
      </div>
      <div style={{ margin: '0 12px 12px' }}>
        <Link
          href="/tiers"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(200,241,53,.12)', border: '1px solid rgba(200,241,53,.25)', color: '#C8F135', textDecoration: 'none', transition: 'all .15s' }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Купить токены
        </Link>
      </div>

      <style>{`
        .sidebar-item:hover { background: #21222C !important; color: #C4C5D8 !important; }
      `}</style>
    </aside>
  )
}
