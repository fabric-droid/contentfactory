'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const AUDIENCES = ['Молодёжь 18–25 лет', 'Взрослая аудитория 25–45 лет', 'Бизнес-аудитория (B2B)', 'Семьи с детьми', 'Опишу вручную']
const STYLES = ['😊 Дружелюбный и тёплый', '👔 Официальный и профессиональный', '🎓 Экспертный и информативный', '🎉 Игривый и энергичный']

interface Answers {
  business: string
  audience: string
  style: string
  product: string
  advantages: string
}

const EMPTY: Answers = { business: '', audience: AUDIENCES[1], style: STYLES[0], product: '', advantages: '' }

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(key: keyof Answers, value: string) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [name, niche] = answers.business.split(',').map(s => s.trim())
    await supabase.from('projects').upsert({
      user_id: user.id,
      name: name || 'Мой бизнес',
      niche: niche || '',
      audience: answers.audience,
      style: answers.style,
      description: answers.product,
      advantages: answers.advantages,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await supabase.from('user_profiles').upsert(
      { user_id: user.id, plan: 'start', gens_used: 0, gens_limit: 20, onboarding_done: true },
      { onConflict: 'user_id' }
    )

    router.push('/dashboard')
  }

  const TOTAL = 5
  const progressPct = (step - 1) / TOTAL * 100

  const inputCls = "bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E0F13' }}>
      <div className="w-full max-w-[560px] px-8 py-7 flex flex-col gap-6">
        {/* Header */}
        <div>
          <div className="font-heading text-[18px] font-semibold text-snow">Настройка профиля</div>
          <div className="text-[12px] text-smoke mt-1.5">Ответьте на 5 вопросов — займёт 2 минуты</div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all"
              style={{ background: i < step - 1 ? '#C8F135' : i === step - 1 ? 'rgba(200,241,53,.5)' : '#323344' }}
            />
          ))}
          <span className="text-[11px] text-smoke ml-2 whitespace-nowrap">Вопрос {step} из {TOTAL}</span>
        </div>

        {/* Questions */}
        <div className="rounded-[12px] p-7 flex flex-col gap-5" style={{ background: '#181920', border: '1px solid #323344' }}>

          {step === 1 && (
            <>
              <div>
                <div className="text-[10px] text-lime font-bold uppercase tracking-[1px] mb-2">Вопрос 1 из 5</div>
                <div className="font-heading text-[18px] font-semibold text-snow leading-snug">Как называется ваш бизнес и в какой нише?</div>
                <div className="text-[12px] text-smoke mt-2">Контекст для всех генерируемых текстов</div>
              </div>
              <input className={inputCls} value={answers.business} onChange={e => set('business', e.target.value)} placeholder="Напр.: Кофейня «Аромат», салон красоты, магазин одежды" />
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="bg-lime text-ink font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:bg-lime2 transition-colors">Далее →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <div className="text-[10px] text-lime font-bold uppercase tracking-[1px] mb-2">Вопрос 2 из 5</div>
                <div className="font-heading text-[18px] font-semibold text-snow leading-snug">Кто ваша целевая аудитория?</div>
                <div className="text-[12px] text-smoke mt-2">Чем точнее — тем лучше тексты попадут в аудиторию</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {AUDIENCES.map(a => (
                  <button
                    key={a}
                    onClick={() => set('audience', a)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-left transition-all"
                    style={{
                      background: answers.audience === a ? 'rgba(200,241,53,.14)' : '#21222C',
                      border: `1px solid ${answers.audience === a ? 'rgba(200,241,53,.3)' : '#323344'}`,
                      color: answers.audience === a ? '#C8F135' : '#8B8CA8',
                    }}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0" style={{ background: answers.audience === a ? '#C8F135' : 'transparent', borderColor: answers.audience === a ? '#C8F135' : '#42435A' }} />
                    {a}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-smoke hover:text-mist text-[13px] font-medium border border-line px-4 py-2 rounded-[8px] transition-colors">← Назад</button>
                <button onClick={() => setStep(3)} className="bg-lime text-ink font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:bg-lime2 transition-colors">Далее →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <div className="text-[10px] text-lime font-bold uppercase tracking-[1px] mb-2">Вопрос 3 из 5</div>
                <div className="font-heading text-[18px] font-semibold text-snow leading-snug">Какой стиль общения вам ближе?</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => set('style', s)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13px] font-medium text-left transition-all"
                    style={{
                      background: answers.style === s ? 'rgba(200,241,53,.14)' : '#21222C',
                      border: `1px solid ${answers.style === s ? 'rgba(200,241,53,.3)' : '#323344'}`,
                      color: answers.style === s ? '#C8F135' : '#8B8CA8',
                    }}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border-[1.5px] flex-shrink-0" style={{ background: answers.style === s ? '#C8F135' : 'transparent', borderColor: answers.style === s ? '#C8F135' : '#42435A' }} />
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-smoke hover:text-mist text-[13px] font-medium border border-line px-4 py-2 rounded-[8px] transition-colors">← Назад</button>
                <button onClick={() => setStep(4)} className="bg-lime text-ink font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:bg-lime2 transition-colors">Далее →</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <div className="text-[10px] text-lime font-bold uppercase tracking-[1px] mb-2">Вопрос 4 из 5</div>
                <div className="font-heading text-[18px] font-semibold text-snow leading-snug">Опишите ваш продукт или услугу</div>
                <div className="text-[12px] text-smoke mt-2">2–3 предложения: что продаёте, какая польза клиенту</div>
              </div>
              <textarea
                className={inputCls}
                rows={4}
                value={answers.product}
                onChange={e => set('product', e.target.value)}
                placeholder="Напр.: Продаём авторскую кожаную обувь ручной работы. Каждая пара под заказ за 2–3 недели."
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="text-smoke hover:text-mist text-[13px] font-medium border border-line px-4 py-2 rounded-[8px] transition-colors">← Назад</button>
                <button onClick={() => setStep(5)} className="bg-lime text-ink font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:bg-lime2 transition-colors">Далее →</button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <div className="text-[10px] text-lime font-bold uppercase tracking-[1px] mb-2">Вопрос 5 из 5</div>
                <div className="font-heading text-[18px] font-semibold text-snow leading-snug">Ваши главные преимущества перед конкурентами?</div>
                <div className="text-[12px] text-smoke mt-2">Это основа УТП в каждом тексте</div>
              </div>
              <textarea
                className={inputCls}
                rows={3}
                value={answers.advantages}
                onChange={e => set('advantages', e.target.value)}
                placeholder="Напр.: Гарантия 3 года, бесплатная доставка, собственное производство..."
                style={{ resize: 'vertical', lineHeight: '1.6' }}
              />
              <div className="flex justify-between">
                <button onClick={() => setStep(4)} className="text-smoke hover:text-mist text-[13px] font-medium border border-line px-4 py-2 rounded-[8px] transition-colors">← Назад</button>
                <button onClick={finish} disabled={saving} className="bg-lime text-ink font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:bg-lime2 transition-colors disabled:opacity-50">
                  {saving ? 'Сохраняем...' : '✓ Сохранить профиль'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
