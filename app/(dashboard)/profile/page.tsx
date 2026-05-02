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
}

const DEFAULT: Profile = {
  business_name: '', niche: '', description: '', usp: '', advantages: '',
  audience: '', style: STYLES[0], tg_bot_token: '', tg_channel_id: '', vk_token: '',
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
        toast(`Лимит проектов для вашего тарифа: ${limit}. Перейдите на тариф выше.`, 'err')
        setSaving(false)
        return
      }
      await supabase.from('projects').insert({ ...profile, user_id: user.id, name: profile.business_name || 'Мой бизнес' })
    }
    toast('Профиль сохранён ✓', 'ok')
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center flex-1 text-smoke">Загрузка...</div>

  const inputCls = "bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"
  const labelCls = "text-[10px] font-semibold text-smoke uppercase tracking-wider"
  const sectionCls = "rounded-[12px] p-5 flex flex-col gap-3.5"
  const sectionStyle = { background: '#181920', border: '1px solid #323344' }

  return (
    <div className="flex flex-col flex-1">
      <div className="px-8 pt-6 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-[20px] font-semibold text-snow tracking-tight">Профиль бизнеса</h1>
          <p className="text-[12px] text-smoke mt-1">Используется при каждой генерации — чем точнее, тем лучше тексты</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-lime text-ink text-[13px] font-semibold px-[18px] py-[9px] rounded-[8px] hover:bg-lime2 transition-colors disabled:opacity-50"
        >
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>

      <div className="px-8 py-5 max-w-[640px] flex flex-col gap-[18px]">
        {/* Main */}
        <div className={sectionCls} style={sectionStyle}>
          <div className="text-[13px] font-semibold text-snow">Основное</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Название бизнеса</label>
              <input className={inputCls} value={profile.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Кофейня «Аромат»" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Ниша</label>
              <input className={inputCls} value={profile.niche} onChange={e => set('niche', e.target.value)} placeholder="Кофейня, кафе" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Описание продукта или услуги</label>
            <textarea className={inputCls} rows={3} value={profile.description} onChange={e => set('description', e.target.value)} placeholder="Уютная кофейня в центре города..." style={{ resize: 'vertical', lineHeight: '1.6' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>УТП (уникальное торговое предложение)</label>
            <input className={inputCls} value={profile.usp} onChange={e => set('usp', e.target.value)} placeholder="Единственная кофейня с собственной обжаркой" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Главные преимущества</label>
            <textarea className={inputCls} rows={2} value={profile.advantages} onChange={e => set('advantages', e.target.value)} placeholder="Собственная обжарка, авторские рецепты, wi-fi..." style={{ resize: 'vertical', lineHeight: '1.6' }} />
          </div>
        </div>

        {/* Audience & style */}
        <div className={`${sectionCls} animate-fade-in-1`} style={sectionStyle}>
          <div className="text-[13px] font-semibold text-snow">Аудитория и стиль</div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Целевая аудитория</label>
            <textarea className={inputCls} rows={2} value={profile.audience} onChange={e => set('audience', e.target.value)} placeholder="Офисные работники 25–45 лет, молодёжь..." style={{ resize: 'vertical', lineHeight: '1.6' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Стиль коммуникации</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => set('style', s)}
                  className="flex items-center gap-2 flex-1 min-w-[120px] px-3 py-2 rounded-[8px] text-[12px] font-medium transition-all"
                  style={{
                    background: profile.style === s ? 'rgba(200,241,53,.14)' : '#21222C',
                    border: `1px solid ${profile.style === s ? 'rgba(200,241,53,.3)' : '#323344'}`,
                    color: profile.style === s ? '#C8F135' : '#8B8CA8',
                  }}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0 transition-all" style={{ background: profile.style === s ? '#C8F135' : 'transparent', borderColor: profile.style === s ? '#C8F135' : '#42435A' }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connections */}
        <div className={`${sectionCls} animate-fade-in-2`} style={sectionStyle}>
          <div className="text-[13px] font-semibold text-snow">Подключённые платформы для автопостинга</div>
          <div className="flex flex-col gap-2">
            {/* Telegram */}
            <div className="p-3.5 rounded-[8px] flex flex-col gap-2" style={{ background: '#21222C', border: '1px solid #323344' }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-mist flex items-center gap-2">💬 Telegram</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${profile.tg_bot_token ? 'text-lime' : 'text-smoke'}`}
                  style={{ background: profile.tg_bot_token ? 'rgba(200,241,53,.14)' : '#2C2D3A', border: `1px solid ${profile.tg_bot_token ? 'rgba(200,241,53,.2)' : '#323344'}` }}>
                  {profile.tg_bot_token ? 'подключён' : 'не подключён'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} value={profile.tg_bot_token} onChange={e => set('tg_bot_token', e.target.value)} placeholder="Bot token (BotFather)" />
                <input className={inputCls} value={profile.tg_channel_id} onChange={e => set('tg_channel_id', e.target.value)} placeholder="@channel или -100..." />
              </div>
            </div>
            {/* VK */}
            <div className="p-3.5 rounded-[8px] flex flex-col gap-2" style={{ background: '#21222C', border: '1px solid #323344' }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-mist flex items-center gap-2">🔵 ВКонтакте</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${profile.vk_token ? 'text-lime' : 'text-smoke'}`}
                  style={{ background: profile.vk_token ? 'rgba(200,241,53,.14)' : '#2C2D3A', border: `1px solid ${profile.vk_token ? 'rgba(200,241,53,.2)' : '#323344'}` }}>
                  {profile.vk_token ? 'подключён' : 'не подключён'}
                </span>
              </div>
              <input className={inputCls} value={profile.vk_token} onChange={e => set('vk_token', e.target.value)} placeholder="Access token VK API" />
            </div>
            {/* Instagram */}
            <div className="p-3.5 rounded-[8px] flex items-center justify-between" style={{ background: '#21222C', border: '1px solid #323344', opacity: 0.6 }}>
              <span className="text-[13px] text-mist">📸 Instagram</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full text-smoke" style={{ background: '#2C2D3A', border: '1px solid #323344' }}>доступно в v2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
