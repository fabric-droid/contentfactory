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

  return (
    <div className="flex flex-col flex-1">

      <div className="px-8 pt-6 pb-0 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-[20px] font-semibold tracking-tight" style={{ color: '#F8F8FC' }}>Дашборд</h1>
          <p className="text-[12px] mt-1.5" style={{ color: '#8B8CA8' }}>Сегодня хороший день создать контент</p>
        </div>
        <Link
          href="/generator"
          className="flex items-center gap-2 text-[13px] font-semibold px-[18px] py-[9px] rounded-[8px] hover:opacity-90 transition-opacity"
          style={{ background: '#C8F135', color: '#0E0F13' }}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Создать контент
        </Link>
      </div>

      <div className="px-8 py-5 flex flex-col gap-[22px]">

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Генераций', value: String(profile?.gens_used ?? 0), delta: '↑ этого месяца', up: true },
            { label: 'Постов создано', value: String((totalGens ?? 0) * 7), delta: '↑ за всё время', up: true },
            { label: 'Платформ', value: '8', delta: 'доступно', up: false },
            { label: 'Тариф', value: planLabel, delta: 'активен', up: false },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] p-[18px]" style={{ background: '#181920', border: '1px solid #323344' }}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.6px]" style={{ color: '#8B8CA8' }}>{s.label}</div>
              <div className="font-heading text-[26px] font-bold mt-2" style={{ color: '#F8F8FC' }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: s.up ? '#C8F135' : '#8B8CA8' }}>{s.delta}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.5px] mb-[10px]" style={{ color: '#C4C5D8' }}>Быстрые действия</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/generator', emoji: '✨', title: 'Новая генерация', desc: 'Контент для всех платформ + иллюстрация за 30 сек' },
              { href: '/profile', emoji: '🏢', title: 'Профиль бизнеса', desc: 'Обновите данные для более точных текстов' },
              { href: '/tiers', emoji: '⭐', title: 'Тарифы', desc: 'Сравните планы и расширьте возможности' },
            ].map(q => (
              <Link
                key={q.href}
                href={q.href}
                className="flex flex-col gap-[10px] p-5 rounded-[12px] transition-all hover:border-[#42435A] hover:bg-[#21222C] hover:-translate-y-0.5"
                style={{ background: '#181920', border: '1px solid #323344' }}
              >
                <div className="text-2xl">{q.emoji}</div>
                <div className="text-[13px] font-semibold" style={{ color: '#F8F8FC' }}>{q.title}</div>
                <div className="text-[12px] leading-relaxed" style={{ color: '#8B8CA8' }}>{q.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {recent && recent.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.5px] mb-[10px]" style={{ color: '#C4C5D8' }}>Последние генерации</div>
            <div className="grid grid-cols-2 gap-[10px]">
              {recent.map(g => {
                const platforms = (g.platforms as string[]) ?? []
                const date = new Date(g.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={g.id} className="flex gap-3 items-start rounded-[12px] px-4 py-[14px] transition-all hover:border-[#42435A] hover:bg-[#21222C] cursor-pointer" style={{ background: '#181920', border: '1px solid #323344' }}>
                    <div className="text-2xl flex-shrink-0 mt-0.5">📝</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: '#F8F8FC' }}>{g.topic}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: '#8B8CA8' }}>{date}</div>
                      <div className="flex flex-wrap gap-1 mt-[7px]">
                        {platforms.slice(0, 4).map(p => (
                          <span key={p} className="text-[10px] px-[7px] py-0.5 rounded-full" style={{ color: '#8B8CA8', background: '#21222C', border: '1px solid #323344' }}>{p}</span>
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
