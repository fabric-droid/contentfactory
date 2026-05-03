import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, gens_used')
    .eq('user_id', user!.id)
    .single()

  const { data: recent } = await supabase
    .from('generations')
    .select('id, topic, platforms, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const { count: totalGens } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const planLabel = ({ start: 'Старт', business: 'Бизнес', agency: 'Агентство' } as Record<string, string>)[profile?.plan ?? 'start'] ?? 'Старт'

  const card = { background: '#181920', border: '1px solid #323344', borderRadius: 2 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Topbar */}
      <div style={{ padding: '24px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>Дашборд</div>
          <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Сегодня хороший день создать контент</div>
        </div>
        <Link href="/generator" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: '#C8F135', color: '#0E0F13', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .18s', whiteSpace: 'nowrap' }}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" style={{ width: 14, height: 14 }}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Создать контент
        </Link>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 32px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: 'Генераций', value: String(profile?.gens_used ?? 0), delta: '↑ этого месяца', up: true },
            { label: 'Постов создано', value: String((totalGens ?? 0) * 7), delta: '↑ за всё время', up: true },
            { label: 'Платформ', value: '8', delta: 'доступно', up: false },
            { label: 'Тариф', value: planLabel, delta: 'активен', up: false },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: 10, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{s.label}</div>
              <div className="font-heading" style={{ fontSize: 26, fontWeight: 700, color: '#F8F8FC', marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: s.up ? '#C8F135' : '#8B8CA8' }}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#C4C5D8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Быстрые действия</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { href: '/generator', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 26, height: 26 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              ), title: 'Новая генерация', desc: 'Контент для всех платформ + иллюстрация за 30 сек' },
              { href: '/profile', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 26, height: 26 }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ), title: 'Профиль бизнеса', desc: 'Обновите данные для более точных текстов' },
              { href: '/tiers', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 26, height: 26 }}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              ), title: 'Тарифы', desc: 'Сравните планы и расширьте возможности' },
            ].map(q => (
              <Link key={q.href} href={q.href} className="qa-card" style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none', transition: 'all .18s', color: 'inherit' }}>
                <div style={{ color: '#8B8CA8' }}>{q.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>{q.title}</div>
                <div style={{ fontSize: 12, color: '#8B8CA8', lineHeight: 1.5 }}>{q.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent */}
        {recent && recent.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#C4C5D8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Последние генерации</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {recent.map(g => {
                const platforms = (g.platforms as string[]) ?? []
                const date = new Date(g.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={g.id} className="hcard" style={{ ...card, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>📝</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.topic}</div>
                      <div style={{ fontSize: 11, color: '#8B8CA8', marginTop: 2 }}>{date}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                        {platforms.slice(0, 4).map(p => (
                          <span key={p} style={{ fontSize: 10, color: '#8B8CA8', background: '#21222C', border: '1px solid #323344', padding: '2px 7px', borderRadius: 20 }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      <style>{`
        .qa-card:hover { border-color: #42435A !important; background: #21222C !important; transform: translateY(-2px); }
        .hcard:hover { border-color: #42435A !important; background: #21222C !important; }
      `}</style>
    </div>
  )
}
