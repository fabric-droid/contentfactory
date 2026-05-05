'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

const STYLES = ['😊 Дружелюбный', '👔 Официальный', '🎓 Экспертный', '🎉 Игривый']

interface Profile {
  business_name: string
  niche: string
  description: string
  usp: string
  advantages: string
  audience: string
  style: string
  tg_bot_token: string
  tg_channel_id: string
  vk_token: string
  ok_token: string
  ok_app_key: string
  ok_group_id: string
  fb_page_token: string
  fb_page_id: string
  pinterest_token: string
  pinterest_board_id: string
}

const DEFAULT: Profile = {
  business_name: '', niche: '', description: '', usp: '', advantages: '',
  audience: '', style: STYLES[0],
  tg_bot_token: '', tg_channel_id: '',
  vk_token: '',
  ok_token: '', ok_app_key: '', ok_group_id: '',
  fb_page_token: '', fb_page_id: '',
  pinterest_token: '', pinterest_board_id: '',
}

const inp: React.CSSProperties = { background: '#21222C', border: '1px solid #323344', borderRadius: 8, padding: '10px 13px', color: '#F8F8FC', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color .15s' }
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }
const sec: React.CSSProperties = { background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }

function PlatformRow({
  icon, name, connected, children, soon
}: {
  icon: string, name: string, connected?: boolean, children?: React.ReactNode, soon?: boolean
}) {
  return (
    <div style={{ background: '#21222C', border: '1px solid #323344', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10, opacity: soon ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: '#C4C5D8' }}>{icon} {name}</span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: soon ? '#2C2D3A' : connected ? 'rgba(200,241,53,.14)' : '#2C2D3A', color: soon ? '#8B8CA8' : connected ? '#C8F135' : '#8B8CA8', border: `1px solid ${soon ? '#323344' : connected ? 'rgba(200,241,53,.2)' : '#323344'}` }}>
          {soon ? 'доступно в v2' : connected ? 'подключён' : 'не подключён'}
        </span>
      </div>
      {!soon && children}
    </div>
  )
}

export default function ProfilePage() {
  const { toast } = useToast()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('projects').select('*').eq('user_id', user.id).limit(1).single()
      if (data) setProfile(prev => ({ ...prev, ...data }))
      setLoading(false)
    }
    load()
  }, [])

  function set(key: keyof Profile, value: string) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: existing } = await supabase.from('projects').select('id').eq('user_id', user.id).limit(1).single()
    if (existing) {
      await supabase.from('projects').update({ ...profile, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      const { data: userProfile } = await supabase.from('user_profiles').select('plan').eq('user_id', user.id).single()
      const projectLimits: Record<string, number> = { start: 1, business: 3, agency: 20 }
      const limit = projectLimits[userProfile?.plan ?? 'start'] ?? 1
      const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if ((count ?? 0) >= limit) {
        toast(`Лимит проектов для вашего тарифа: ${limit}.`, 'err')
        setSaving(false)
        return
      }
      await supabase.from('projects').insert({ ...profile, user_id: user.id, name: profile.business_name || 'Мой бизнес' })
    }
    toast('Профиль сохранён ✓', 'ok')
    setSaving(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#8B8CA8' }}>Загрузка...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      <div style={{ padding: '24px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>Профиль бизнеса</div>
          <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Используется при каждой генерации — чем точнее, тем лучше тексты</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: '#C8F135', color: '#0E0F13', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', opacity: saving ? 0.6 : 1, transition: 'all .18s' }}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      <div style={{ padding: '20px 32px 32px', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Основное */}
        <div style={sec}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>Основное</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Название бизнеса</label>
              <input style={inp} value={profile.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Кофейня «Аромат»" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>
            <div>
              <label style={lbl}>Ниша</label>
              <input style={inp} value={profile.niche} onChange={e => set('niche', e.target.value)} placeholder="Кофейня, кафе" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>
          </div>
          <div>
            <label style={lbl}>Описание продукта или услуги</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: '1.6' } as React.CSSProperties} rows={3} value={profile.description} onChange={e => set('description', e.target.value)} placeholder="Уютная кофейня в центре города..." onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
          </div>
          <div>
            <label style={lbl}>УТП (уникальное торговое предложение)</label>
            <input style={inp} value={profile.usp} onChange={e => set('usp', e.target.value)} placeholder="Единственная кофейня с собственной обжаркой" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
          </div>
          <div>
            <label style={lbl}>Главные преимущества</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60, lineHeight: '1.6' } as React.CSSProperties} rows={2} value={profile.advantages} onChange={e => set('advantages', e.target.value)} placeholder="Собственная обжарка, авторские рецепты, wi-fi..." onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
          </div>
        </div>

        {/* Аудитория и стиль */}
        <div style={sec}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>Аудитория и стиль</div>
          <div>
            <label style={lbl}>Целевая аудитория</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 60, lineHeight: '1.6' } as React.CSSProperties} rows={2} value={profile.audience} onChange={e => set('audience', e.target.value)} placeholder="Офисные работники 25–45 лет, молодёжь..." onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
          </div>
          <div>
            <label style={lbl}>Стиль коммуникации</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STYLES.map(s => (
                <button key={s} onClick={() => set('style', s)}
                  style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: `1px solid ${profile.style === s ? 'rgba(200,241,53,.3)' : '#323344'}`, cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all .12s', background: profile.style === s ? 'rgba(200,241,53,.14)' : '#21222C', color: profile.style === s ? '#C8F135' : '#8B8CA8', userSelect: 'none' }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${profile.style === s ? '#C8F135' : '#42435A'}`, flexShrink: 0, background: profile.style === s ? '#C8F135' : 'transparent', transition: 'all .12s' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Платформы */}
        <div style={sec}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>Подключённые платформы для автопостинга</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* Telegram */}
            <PlatformRow icon="💬" name="Telegram" connected={!!profile.tg_bot_token}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inp} value={profile.tg_bot_token} onChange={e => set('tg_bot_token', e.target.value)} placeholder="Bot token (BotFather)" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                <input style={inp} value={profile.tg_channel_id} onChange={e => set('tg_channel_id', e.target.value)} placeholder="@channel или -100..." onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
            </PlatformRow>

            {/* VK */}
            <PlatformRow icon="🔵" name="ВКонтакте" connected={!!profile.vk_token}>
              <input style={inp} value={profile.vk_token} onChange={e => set('vk_token', e.target.value)} placeholder="Access token VK API" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </PlatformRow>

            {/* Одноклассники */}
            <PlatformRow icon="🟠" name="Одноклассники" connected={!!profile.ok_token}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inp} value={profile.ok_token} onChange={e => set('ok_token', e.target.value)} placeholder="Access token OK API" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                <input style={inp} value={profile.ok_app_key} onChange={e => set('ok_app_key', e.target.value)} placeholder="Application key" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
              <input style={inp} value={profile.ok_group_id} onChange={e => set('ok_group_id', e.target.value)} placeholder="ID группы (необязательно)" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </PlatformRow>

            {/* Facebook */}
            <PlatformRow icon="📘" name="Facebook" connected={!!profile.fb_page_token}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inp} value={profile.fb_page_token} onChange={e => set('fb_page_token', e.target.value)} placeholder="Page Access Token" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                <input style={inp} value={profile.fb_page_id} onChange={e => set('fb_page_id', e.target.value)} placeholder="Page ID" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
            </PlatformRow>

            {/* Pinterest */}
            <PlatformRow icon="📌" name="Pinterest" connected={!!profile.pinterest_token}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={inp} value={profile.pinterest_token} onChange={e => set('pinterest_token', e.target.value)} placeholder="Access token Pinterest" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                <input style={inp} value={profile.pinterest_board_id} onChange={e => set('pinterest_board_id', e.target.value)} placeholder="Board ID" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
            </PlatformRow>

            {/* Instagram */}
            <PlatformRow icon="📸" name="Instagram" soon />

          </div>
        </div>

      </div>
    </div>
  )
}
