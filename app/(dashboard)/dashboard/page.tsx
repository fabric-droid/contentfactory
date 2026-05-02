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

  return (
    <div className="flex flex-col flex-1">
      {/* Topbar */}
      <div className="px-8 pt-6 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-[20px] font-semibold text-snow tracking-tight">Дашборд</h1>
          <p className="text-[12px] text-smoke mt-1">Сегодня хороший день создать контент</p>
        </div>
        <Link
          href="/generator"
          className="flex items-center gap-2 bg-lime text-ink text-[13px] font-semibold px-[18px] py-[9px] rounded-[8px] hover:bg-lime2 transition-all hover:-translate-y-px"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Создать контент
        </Link>
      </div>

      <div className="px-8 py-5 flex flex-col gap-[22px]">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 animate-fade-in">
          {[
            { label: 'Генераций', value: String(profile?.gens_used ?? 0), delta: '↑ этого месяца', up: true },
            { label: 'Постов создано', value: String((totalGens ?? 0) * 7), delta: '↑ за всё время', up: true },
            { label: 'Платформ', value: '8', delta: 'доступно', up: false },
            { label: 'Тариф', value: ({ start: 'Старт', business: 'Бизнес', agency: 'Агентство' } as Record<string, string>)[profile?.plan ?? 'start'] ?? 'Старт', delta: 'активен', up: false },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] p-[18px] bg-ink2 border border-line">
              <div className="text-[10px] text-smoke uppercase tracking-[0.6px] font-semibold">{s.label}</div>
              <div className="font-heading text-[26px] font-bold text-snow mt-2">{s.value}</div>
              <div className={`text-[11px] mt-0.5 ${s.up ? 'text-lime' : 'text-smoke'}`}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <div className="text-[12px] font-semibold text-mist uppercase tracking-[0.5px] mb-2.5">Быстрые действия</div>
          <div className="grid grid-cols-3 gap-3 animate-fade-in-1">
            {[
              { href: '/generator', icon: '✨', title: 'Новая генерация', desc: 'Контент для всех платформ + иллюстрация за 30 сек' },
              { href: '/profile', icon: '🏢', title: 'Профиль бизнеса', desc: 'Обновите данные для более точных текстов' },
              { href: '/tiers', icon: '⭐', title: 'Тарифы', desc: 'Сравните планы и расширьте возможности' },
            ].map(q => (
              <Link
                key={q.href}
                href={q.href}
                className="flex flex-col gap-2.5 p-5 rounded-[12px] bg-ink2 border border-line transition-all hover:-translate-y-0.5 hover:border-line2 hover:bg-ink3"
              >
                <div className="text-2xl">{q.icon}</div>
                <div className="text-[13px] font-semibold text-snow">{q.title}</div>
                <div className="text-[12px] text-smoke leading-relaxed">{q.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent */}
        {recent && recent.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold text-mist uppercase tracking-[0.5px] mb-2.5">Последние генерации</div>
            <div className="grid grid-cols-2 gap-2.5 animate-fade-in-2">
              {recent.map(g => {
                const platforms = (g.platforms as string[]) ?? []
                const date = new Date(g.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                return (
                  <div
                    key={g.id}
                    className="flex gap-3 items-start p-3.5 rounded-[12px] bg-ink2 border border-line transition-all hover:border-line2 hover:bg-ink3"
                  >
                    <div className="text-2xl flex-shrink-0 mt-0.5">📝</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-snow truncate">{g.topic}</div>
                      <div className="text-[11px] text-smoke mt-0.5">{date}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {platforms.slice(0, 4).map(p => (
                          <span key={p} className="text-[10px] text-smoke px-1.5 py-0.5 rounded-full bg-ink3 border border-line">{p}</span>
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
    </div>
  )
}
