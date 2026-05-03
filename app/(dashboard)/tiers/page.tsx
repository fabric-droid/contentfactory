import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TIERS = [
  {
    key: 'start', name: 'Старт', price: 690, desc: 'Для старта и тестирования', tokens: 50, projects: 1, popular: false,
    features: [
      { ok: true,  text: '50 генераций в месяц' },
      { ok: true,  text: '1 проект / профиль бизнеса' },
      { ok: true,  text: 'Тексты: Instagram, VK, Telegram, Threads' },
      { ok: true,  text: 'SEO-статья для сайта' },
      { ok: true,  text: 'DALL-E 3 иллюстрации · загрузка фото' },
      { ok: false, text: 'Яндекс Дзен' },
      { ok: false, text: 'Reels и TikTok сценарии' },
      { ok: false, text: 'Автопостинг' },
    ],
  },
  {
    key: 'business', name: 'Бизнес', price: 1990, desc: 'Полный набор для активного SMM', tokens: 200, projects: 3, popular: true,
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
  },
  {
    key: 'agency', name: 'Агентство', price: 4990, desc: 'Для агентств и нескольких клиентов', tokens: 1000, projects: 20, popular: false,
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Topbar */}
      <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
        <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>Тарифы</div>
        <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Выберите план под ваши задачи</div>
      </div>

      {/* Usage */}
      <div style={{ padding: '16px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#181920', border: '1px solid #323344', borderRadius: 2 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#F8F8FC' }}>Использовано генераций</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: pct >= 90 ? '#FF5252' : '#C8F135' }}>{gensUsed} / {gensLimit}</span>
            </div>
            <div style={{ height: 6, background: '#323344', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#FF5252' : '#C8F135', borderRadius: 3, transition: 'width .3s' }} />
            </div>
          </div>
          <Link href="#buy" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(200,241,53,.14)', border: '1px solid rgba(200,241,53,.3)', color: '#C8F135', fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Купить токены
          </Link>
        </div>
      </div>

      {/* Tiers grid */}
      <div id="buy" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '16px 32px 24px' }}>
        {TIERS.map(tier => {
          const isCurrent = tier.key === currentPlan
          return (
            <div key={tier.key} style={{ background: '#181920', border: `1px solid ${tier.popular ? '#C8F135' : '#323344'}`, borderRadius: 2, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
              {tier.popular && (
                <div className="font-heading" style={{ position: 'absolute', top: 14, right: -24, background: '#C8F135', color: '#0E0F13', fontSize: 8, fontWeight: 700, letterSpacing: '0.5px', padding: '3px 32px', transform: 'rotate(35deg)' }}>
                  ПОПУЛЯРНЫЙ
                </div>
              )}
              <div>
                <div className="font-heading" style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>{tier.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                  <span className="font-heading" style={{ fontSize: 28, fontWeight: 700, color: '#F8F8FC' }}>{tier.price.toLocaleString('ru-RU')}</span>
                  <span style={{ fontSize: 12, color: '#8B8CA8' }}>руб/мес</span>
                </div>
                <div style={{ fontSize: 12, color: '#8B8CA8', lineHeight: 1.5, marginTop: 4 }}>{tier.desc}</div>
              </div>
              <div style={{ height: 1, background: '#323344' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {tier.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: f.ok ? '#C4C5D8' : '#8B8CA8', lineHeight: 1.4 }}>
                    <span style={{ color: f.ok ? '#C8F135' : '#42435A', flexShrink: 0 }}>{f.ok ? '✓' : '—'}</span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: isCurrent ? 'none' : tier.popular ? '1px solid rgba(200,241,53,.3)' : '1px solid #323344', background: isCurrent ? '#C8F135' : tier.popular ? 'rgba(200,241,53,.14)' : 'transparent', color: isCurrent ? '#0E0F13' : tier.popular ? '#C8F135' : '#8B8CA8', transition: 'all .18s' }}
              >
                {isCurrent ? '✓ Текущий план' : `Купить ${tier.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div style={{ padding: '0 32px 32px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 20px', background: '#181920', border: '1px solid #323344', borderRadius: 2 }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>💡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC', marginBottom: 4 }}>Генерации не сгорают в конце месяца</div>
            <div style={{ fontSize: 12, color: '#8B8CA8', lineHeight: 1.6 }}>
              Неиспользованные генерации переносятся на следующий месяц. При смене тарифа остаток сохраняется. Иллюстрации через <strong style={{ color: '#C4C5D8' }}>DALL-E 3</strong> и загрузка собственных фото доступны на всех тарифах.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
