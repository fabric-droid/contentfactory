import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TIERS = [
  {
    key: 'start',
    name: '🌱 Старт',
    price: 690,
    desc: 'Для старта и тестирования',
    tokens: 50,
    projects: 1,
    history: 14,
    features: [
      { ok: true,  text: '50 генераций в месяц' },
      { ok: true,  text: '1 проект / профиль бизнеса' },
      { ok: true,  text: 'Тексты: Instagram, VK, Telegram, Threads' },
      { ok: true,  text: 'SEO-статья для сайта' },
      { ok: true,  text: 'DALL-E 3 иллюстрации · загрузка фото' },
      { ok: false, text: 'Яндекс Дзен' },
      { ok: false, text: 'Reels и TikTok сценарии' },
      { ok: false, text: 'Автопостинг' },
      { ok: false, text: 'История контента 14 дней' },
    ],
    popular: false,
  },
  {
    key: 'business',
    name: '🚀 Бизнес',
    price: 1990,
    desc: 'Полный набор для активного SMM',
    tokens: 200,
    projects: 3,
    history: 90,
    features: [
      { ok: true,  text: '200 генераций в месяц' },
      { ok: true,  text: '3 проекта / профиля бизнеса' },
      { ok: true,  text: 'Все 8 платформ включая Дзен' },
      { ok: true,  text: 'Reels и TikTok сценарии' },
      { ok: true,  text: 'DALL-E 3 иллюстрации · загрузка фото' },
      { ok: true,  text: 'Автопостинг Telegram + VK' },
      { ok: true,  text: 'История контента 90 дней' },
      { ok: false, text: 'Видеогенерация' },
    ],
    popular: true,
  },
  {
    key: 'agency',
    name: '🏢 Агентство',
    price: 4990,
    desc: 'Для агентств и нескольких клиентов',
    tokens: 1000,
    projects: 20,
    history: 0,
    features: [
      { ok: true, text: '1 000 генераций в месяц' },
      { ok: true, text: '20 проектов / профилей бизнеса' },
      { ok: true, text: 'Все платформы + приоритетная генерация' },
      { ok: true, text: 'DALL-E 3 · загрузка фото · брендовый стиль' },
      { ok: true, text: 'Видеогенерация (Kling / Runway)' },
      { ok: true, text: 'Автопостинг Telegram + VK + Instagram' },
      { ok: true, text: 'История контента безлимит' },
      { ok: true, text: 'Персональный менеджер' },
    ],
    popular: false,
  },
]

export default async function TiersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, gens_used, gens_limit')
    .eq('user_id', user!.id)
    .single()

  const currentPlan = profile?.plan ?? 'start'
  const gensUsed = profile?.gens_used ?? 0
  const gensLimit = profile?.gens_limit ?? 50
  const pct = Math.min(100, Math.round((gensUsed / gensLimit) * 100))

  return (
    <div className="flex flex-col flex-1">
      <div className="px-8 pt-6 flex-shrink-0">
        <h1 className="font-heading text-[20px] font-semibold text-snow tracking-tight">Тарифы</h1>
        <p className="text-[12px] text-smoke mt-1">Выберите план под ваши задачи</p>
      </div>

      {/* Usage banner */}
      <div className="px-8 pt-4 pb-0">
        <div className="flex items-center gap-4 p-4 rounded-[12px]" style={{ background: '#181920', border: '1px solid #323344' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-snow">Использовано генераций</span>
              <span className="text-[12px] font-semibold" style={{ color: pct >= 90 ? '#F87171' : '#C8F135' }}>{gensUsed} / {gensLimit}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: '#323344' }}>
              <div className="h-full bg-lime rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 90 ? '#F87171' : '#C8F135' }} />
            </div>
          </div>
          <Link
            href="#buy"
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold flex-shrink-0 transition-all hover:-translate-y-px"
            style={{ background: 'rgba(200,241,53,.14)', border: '1px solid rgba(200,241,53,.3)', color: '#C8F135' }}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Купить токены
          </Link>
        </div>
      </div>

      <div id="buy" className="px-8 py-5 grid grid-cols-3 gap-3">
        {TIERS.map((tier, i) => {
          const isCurrent = tier.key === currentPlan
          return (
            <div
              key={tier.key}
              className="rounded-[12px] p-6 flex flex-col gap-4 relative overflow-hidden"
              style={{
                background: '#181920',
                border: `1px solid ${tier.popular ? '#C8F135' : '#323344'}`,
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {tier.popular && (
                <div
                  className="absolute top-3.5 -right-6 font-heading text-[8px] font-bold tracking-[0.5px] text-ink bg-lime"
                  style={{ transform: 'rotate(35deg)', padding: '3px 32px' }}
                >ПОПУЛЯРНЫЙ</div>
              )}

              <div>
                <div className="font-heading text-[13px] font-semibold text-snow">{tier.name}</div>
                <div className="flex items-baseline gap-1 font-heading mt-1.5">
                  <span className="text-[28px] font-bold text-snow">{tier.price.toLocaleString('ru-RU')}</span>
                  <span className="text-[12px] text-smoke">руб/мес</span>
                </div>
                <div className="text-[12px] text-smoke leading-relaxed mt-1">{tier.desc}</div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-[8px] p-2.5 text-center" style={{ background: '#21222C', border: '1px solid #323344' }}>
                  <div className="font-heading text-[16px] font-bold text-snow">{tier.tokens.toLocaleString('ru-RU')}</div>
                  <div className="text-[9px] text-smoke uppercase tracking-wider mt-0.5">генераций</div>
                </div>
                <div className="rounded-[8px] p-2.5 text-center" style={{ background: '#21222C', border: '1px solid #323344' }}>
                  <div className="font-heading text-[16px] font-bold text-snow">{tier.projects}</div>
                  <div className="text-[9px] text-smoke uppercase tracking-wider mt-0.5">проект{tier.projects > 1 ? (tier.projects < 5 ? 'а' : 'ов') : ''}</div>
                </div>
              </div>

              <div className="h-px" style={{ background: '#323344' }} />

              <div className="flex flex-col gap-2 flex-1">
                {tier.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-[12px] leading-relaxed">
                    <span className={f.ok ? 'text-lime flex-shrink-0' : 'text-line2 flex-shrink-0'}>{f.ok ? '✓' : '—'}</span>
                    <span className={f.ok ? 'text-mist' : 'text-smoke'}>{f.text}</span>
                  </div>
                ))}
              </div>

              <button
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all hover:-translate-y-px"
                style={
                  isCurrent
                    ? { background: '#C8F135', color: '#0E0F13' }
                    : { background: 'transparent', color: '#8B8CA8', border: '1px solid #323344' }
                }
              >
                {isCurrent ? '✓ Текущий план' : `Купить ${tier.name.split(' ').pop()}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info box */}
      <div className="px-8 pb-8">
        <div className="flex gap-3 items-start p-4 rounded-[12px]" style={{ background: '#181920', border: '1px solid #323344' }}>
          <span className="text-lg flex-shrink-0 mt-px">💡</span>
          <div>
            <div className="text-[13px] font-semibold text-snow mb-1">Генерации не сгорают в конце месяца</div>
            <div className="text-[12px] text-smoke leading-relaxed">
              Неиспользованные генерации переносятся на следующий месяц. При смене тарифа остаток сохраняется. Иллюстрации через <strong className="text-mist">DALL-E 3</strong> и загрузка собственных фото доступны на всех тарифах.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
