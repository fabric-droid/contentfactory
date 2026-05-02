'use client'

import { useState, useRef } from 'react'
import { PLATFORMS, type PlatformKey } from '@/lib/utils'
import { useToast } from '@/components/Toast'

const PLATFORM_KEYS = Object.keys(PLATFORMS) as PlatformKey[]
const SITE_PLATFORMS: PlatformKey[] = ['site', 'dzen']

interface ResultCard {
  platform: PlatformKey
  text: string
  hashtags?: string[]
}

interface UploadItem {
  preview: string
  url?: string
}

export default function GeneratorPage() {
  const { toast } = useToast()
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState<Set<PlatformKey>>(new Set(['instagram', 'reels', 'threads', 'vk']))
  const [siteMode, setSiteMode] = useState<'product' | 'brand'>('product')
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [results, setResults] = useState<ResultCard[]>([])
  const topicRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Illustration state
  const [imgMode, setImgMode] = useState<'upload' | 'dalle' | null>(null)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [dallePrompt, setDallePrompt] = useState('')
  const [dalleUrl, setDalleUrl] = useState<string | undefined>()
  const [dalleLoading, setDalleLoading] = useState(false)

  const illustrationUrls =
    imgMode === 'upload'
      ? uploadItems.map(i => i.url ?? i.preview)
      : imgMode === 'dalle' && dalleUrl
        ? [dalleUrl]
        : []

  const hasSite = [...selected].some(p => SITE_PLATFORMS.includes(p))

  function togglePlatform(p: PlatformKey) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  function switchImgMode(mode: 'upload' | 'dalle') {
    setImgMode(prev => prev === mode ? null : mode)
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (fileInputRef.current) fileInputRef.current.value = ''

    const remaining = 5 - uploadItems.length
    const valid: File[] = []
    let skipped = false

    for (const f of files) {
      if (valid.length >= remaining) { skipped = true; break }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 10 * 1024 * 1024) {
        skipped = true
        continue
      }
      valid.push(f)
    }

    if (skipped) toast('Часть файлов пропущена (макс. 10 МБ, JPG/PNG/WebP)', 'err')
    if (!valid.length) return

    const previews: UploadItem[] = valid.map(f => ({ preview: URL.createObjectURL(f) }))
    setUploadItems(prev => [...prev, ...previews].slice(0, 5))

    setUploading(true)
    try {
      const formData = new FormData()
      valid.forEach(f => formData.append('files', f))
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Ошибка загрузки')
      }
      const data = await res.json()
      setUploadItems(prev => {
        const next = [...prev]
        let urlIdx = 0
        for (let i = next.length - valid.length; i < next.length && urlIdx < data.urls.length; i++) {
          next[i] = { ...next[i], url: data.urls[urlIdx++] }
        }
        return next
      })
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Ошибка загрузки файла', 'err')
      setUploadItems(prev => prev.slice(0, prev.length - valid.length))
    } finally {
      setUploading(false)
    }
  }

  function removeUpload(idx: number) {
    setUploadItems(prev => {
      const item = prev[idx]
      if (item && !item.url) URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function generateDalle() {
    if (!dallePrompt.trim()) return
    setDalleLoading(true)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: dallePrompt }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Ошибка генерации')
      }
      const data = await res.json()
      setDalleUrl(data.url)
      toast('Иллюстрация готова ✓', 'ok')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Ошибка генерации иллюстрации', 'err')
    } finally {
      setDalleLoading(false)
    }
  }

  async function runGenerate() {
    if (!topic.trim()) {
      topicRef.current?.focus()
      toast('Введите тему или название товара', 'err')
      return
    }
    if (selected.size === 0) {
      toast('Выберите хотя бы одну платформу', 'err')
      return
    }

    setLoading(true)
    setLoadStep(1)
    setResults([])

    try {
      const stepInterval = setInterval(() => {
        setLoadStep(prev => Math.min(prev + 1, LOAD_STEPS.length))
      }, 2500)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, details, url, platforms: [...selected], siteMode }),
      })

      clearInterval(stepInterval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Ошибка генерации')
      }

      const data = await res.json()
      setResults(data.results)
      toast('Контент готов ✓', 'ok')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка генерации', 'err')
    } finally {
      setLoading(false)
      setLoadStep(0)
    }
  }

  async function regenPlatform(platform: PlatformKey) {
    toast('Перегенерация...', 'ok')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, details, url, platforms: [platform], siteMode, regenOnly: true }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(prev => prev.map(r => r.platform === platform ? { ...r, ...data.results[0] } : r))
    } catch {
      toast('Ошибка перегенерации', 'err')
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    toast('Текст скопирован ✓', 'ok')
  }

  const LOAD_STEPS = ['Читаем профиль бизнеса', 'Создаём мастер-текст', 'Адаптируем под платформы', 'Собираем результат']

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-5" style={{ background: 'rgba(14,15,19,.88)', backdropFilter: 'blur(6px)' }}>
          <div className="w-11 h-11 rounded-full border-2 border-line border-t-lime animate-spin-lime" />
          <div className="font-heading text-[13px] text-snow">Генерируем контент...</div>
          <div className="flex flex-col gap-1.5">
            {LOAD_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] transition-colors" style={{ color: loadStep > i + 1 ? '#C8F135' : loadStep === i + 1 ? '#F8F8FC' : '#8B8CA8' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1">
        <div className="px-8 pt-6 flex-shrink-0">
          <h1 className="font-heading text-[20px] font-semibold text-snow tracking-tight">Генератор</h1>
          <p className="text-[12px] text-smoke mt-1">Тексты для всех платформ + иллюстрация на выбор</p>
        </div>

        <div className="flex flex-1 gap-0 px-8 py-5" style={{ display: 'grid', gridTemplateColumns: '400px 1fr' }}>
          {/* Left panel */}
          <div className="flex flex-col gap-4 p-5 rounded-[12px] h-fit sticky top-5 max-h-[calc(100vh-120px)] overflow-y-auto" style={{ background: '#181920', border: '1px solid #323344' }}>
            <div className="font-heading text-[11px] font-semibold text-smoke uppercase tracking-[0.8px]">Что генерируем</div>

            {/* Topic */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">
                Тема / название товара <span className="text-red">*</span>
              </label>
              <input
                ref={topicRef}
                value={topic}
                onChange={e => setTopic(e.target.value.slice(0, 120))}
                type="text"
                placeholder="Напр.: Кофе латте с карамелью, Акция —20% на обувь"
                className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"
              />
              <div className="text-[10px] text-line2 text-right">{topic.length}/120</div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">
                Детали <span className="text-line2 font-normal normal-case">(цена, условия, особенности)</span>
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={2}
                placeholder="Необязательно — для более точных текстов..."
                className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full resize-y leading-relaxed"
              />
            </div>

            {/* URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">
                Ссылка <span className="text-line2 font-normal normal-case">(необязательно)</span>
              </label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="url"
                placeholder="https://vk.com/yourbusiness"
                className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"
              />
            </div>

            {/* Platforms */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">Платформы</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelected(new Set(PLATFORM_KEYS))}
                  className="text-[12px] font-medium text-smoke px-3 py-1.5 rounded-[8px] border border-line hover:border-line2 hover:text-mist transition-colors"
                >Все</button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-[12px] font-medium text-smoke px-3 py-1.5 rounded-[8px] border border-line hover:border-line2 hover:text-mist transition-colors"
                >Сбросить</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PLATFORM_KEYS.map(p => {
                  const pl = PLATFORMS[p]
                  const on = selected.has(p)
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] text-[12px] font-medium transition-all text-left relative"
                      style={{
                        background: on ? 'rgba(200,241,53,.14)' : '#21222C',
                        border: `1px solid ${on ? 'rgba(200,241,53,.3)' : '#323344'}`,
                        color: on ? '#C8F135' : '#8B8CA8',
                      }}
                    >
                      <span className="text-sm">{pl.icon}</span>
                      <span className="flex-1 text-left">{pl.name.replace('Instagram ', '').replace('ВКонтакте', 'VK').replace('Яндекс Дзен', 'Дзен')}</span>
                      <span
                        className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[9px] flex-shrink-0 transition-all"
                        style={{
                          background: on ? '#C8F135' : 'transparent',
                          border: `1.5px solid ${on ? '#C8F135' : '#42435A'}`,
                          color: on ? '#0E0F13' : 'transparent',
                        }}
                      >✓</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Site mode */}
            {hasSite && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">Для сайта / Дзен — текст на основе</label>
                <div className="flex gap-1.5">
                  {(['product', 'brand'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setSiteMode(m)}
                      className="flex-1 py-1.5 rounded-[8px] text-[11px] font-medium transition-all"
                      style={{
                        background: siteMode === m ? 'rgba(200,241,53,.14)' : '#21222C',
                        border: `1px solid ${siteMode === m ? 'rgba(200,241,53,.3)' : '#323344'}`,
                        color: siteMode === m ? '#C8F135' : '#8B8CA8',
                      }}
                    >
                      {m === 'product' ? '📦 Товара' : '🏢 Бренда'}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-line2">
                  {siteMode === 'product' ? 'Статья будет написана именно об этом товаре' : 'Текст о бизнесе в целом'}
                </div>
              </div>
            )}

            {/* Illustration */}
            <div className="flex flex-col gap-2" style={{ borderTop: '1px solid #323344', paddingTop: '12px' }}>
              <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">Иллюстрация</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['upload', 'dalle'] as const).map(m => {
                  const on = imgMode === m
                  return (
                    <button
                      key={m}
                      onClick={() => switchImgMode(m)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-[8px] text-[12px] font-medium transition-all"
                      style={{
                        background: on ? 'rgba(200,241,53,.14)' : '#21222C',
                        border: `1px solid ${on ? 'rgba(200,241,53,.3)' : '#323344'}`,
                        color: on ? '#C8F135' : '#8B8CA8',
                      }}
                    >
                      {m === 'upload' ? '📁 Загрузить фото' : '✨ DALL-E 3'}
                    </button>
                  )
                })}
              </div>

              {/* Upload mode */}
              {imgMode === 'upload' && (
                <div className="flex flex-col gap-2">
                  {uploadItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {uploadItems.map((item, i) => (
                        <div
                          key={i}
                          className="relative rounded-[6px] overflow-hidden flex-shrink-0"
                          style={{ width: 80, height: 80, background: '#21222C', border: '1px solid #323344' }}
                        >
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                          {!item.url && (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,.5)' }}>
                              <div className="w-4 h-4 rounded-full border-2 border-line border-t-lime animate-spin-lime" />
                            </div>
                          )}
                          <button
                            onClick={() => removeUpload(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors"
                            style={{ background: 'rgba(0,0,0,.7)', color: '#F8F8FC' }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadItems.length < 5 && (
                    <label className="cursor-pointer block">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                      <div
                        className="text-[12px] text-center py-3 rounded-[8px] transition-colors"
                        style={{ border: '1.5px dashed #323344', color: uploading ? '#8B8CA8' : '#8B8CA8' }}
                      >
                        {uploading
                          ? 'Загрузка...'
                          : uploadItems.length === 0
                            ? '+ Выберите фото (JPG, PNG, WebP · до 10 МБ)'
                            : `+ Добавить ещё (${uploadItems.length}/5)`}
                      </div>
                    </label>
                  )}
                  {uploadItems.length === 5 && (
                    <div className="text-[11px] text-smoke text-center">Максимум 5 фото загружено</div>
                  )}
                </div>
              )}

              {/* DALL-E mode */}
              {imgMode === 'dalle' && (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={dallePrompt}
                    onChange={e => setDallePrompt(e.target.value)}
                    rows={3}
                    placeholder="Опишите иллюстрацию: стиль, объект, фон, настроение..."
                    className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full resize-none leading-relaxed"
                  />
                  <button
                    onClick={generateDalle}
                    disabled={dalleLoading || !dallePrompt.trim()}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full"
                    style={{ background: 'rgba(200,241,53,.14)', border: '1px solid rgba(200,241,53,.3)', color: '#C8F135' }}
                  >
                    {dalleLoading
                      ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-lime/40 border-t-lime animate-spin-lime" /> Генерируем...</>
                      : '✨ Сгенерировать иллюстрацию'}
                  </button>
                </div>
              )}
            </div>

            {/* Generate btn */}
            <button
              onClick={runGenerate}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-lime text-ink font-semibold text-[14px] rounded-[8px] py-3 hover:bg-lime2 transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {loading ? 'Генерируем...' : 'Сгенерировать'}
            </button>
            <div className="text-[11px] text-smoke text-center -mt-2">1 генерация из лимита</div>
          </div>

          {/* Results */}
          <div className="pl-5 flex flex-col gap-3.5">
            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 min-h-[360px]">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ background: '#21222C', border: '1px solid #323344' }}>✨</div>
                <div className="text-[14px] text-mist font-medium">Контент появится здесь</div>
                <div className="text-[12px] text-smoke text-center max-w-[280px] leading-relaxed">
                  Заполните форму и нажмите «Сгенерировать» — получите тексты для выбранных платформ
                </div>
              </div>
            ) : (
              results.map(r => {
                const pl = PLATFORMS[r.platform]
                const hasImg = !['reels', 'tiktok'].includes(r.platform) && illustrationUrls.length > 0
                return (
                  <div key={r.platform} className="rounded-[12px] overflow-hidden animate-fade-up" style={{ background: '#181920', border: '1px solid #323344' }}>
                    {/* Head */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: '#21222C', borderBottom: '1px solid #323344' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-[15px]" style={{ background: 'rgba(200,241,53,.1)' }}>{pl.icon}</div>
                        <div>
                          <div className="text-[13px] font-semibold text-snow">{pl.name}</div>
                          <div className="text-[10px] text-smoke mt-px">{pl.type}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => copyText(r.text)} className="text-[12px] font-semibold text-smoke px-3 py-1.5 rounded-[8px] border border-line hover:border-line2 hover:text-mist transition-colors">
                          Копировать
                        </button>
                        <button onClick={() => regenPlatform(r.platform)} className="text-[12px] font-semibold text-smoke px-3 py-1.5 rounded-[8px] border border-line hover:border-line2 hover:text-mist transition-colors">
                          ↻ Платформу
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-3">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-[13px] leading-[1.75] text-mist whitespace-pre-wrap outline-none min-h-[60px] cursor-text rounded-[8px] p-2 -m-2 transition-colors hover:bg-white/[0.02] focus:bg-ink3"
                      >{r.text}</div>

                      {r.hashtags && r.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.hashtags.map(tag => (
                            <span key={tag} className="text-[11px] text-lime px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(200,241,53,.08)', border: '1px solid rgba(200,241,53,.15)' }}>{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Image block */}
                      {hasImg && (
                        <div style={{ borderTop: '1px solid #323344', paddingTop: '12px' }}>
                          <span className="text-[10px] text-smoke uppercase tracking-[0.5px] block mb-2">🖼 Иллюстрация · {pl.ratio}</span>
                          {illustrationUrls.length === 1 ? (
                            <img src={illustrationUrls[0]} alt="Иллюстрация" style={{ maxWidth: 360, width: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #323344' }} />
                          ) : (
                            <div className={`grid gap-1.5 ${illustrationUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {illustrationUrls.map((u, i) => (
                                <img key={i} src={u} alt="Иллюстрация" style={{ maxWidth: 360, width: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #323344' }} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Publish bar */}
                      <div className="flex items-center justify-between gap-2" style={{ borderTop: '1px solid #323344', paddingTop: '12px' }}>
                        <span className="text-[11px] text-smoke">Публикация</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {r.platform === 'telegram' && (
                            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors" style={{ background: 'rgba(0,136,204,.15)', color: '#48B8F0', border: '1px solid rgba(0,136,204,.25)' }}>
                              💬 Telegram
                            </button>
                          )}
                          {r.platform === 'vk' && (
                            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-colors" style={{ background: 'rgba(76,117,163,.15)', color: '#7BA8D8', border: '1px solid rgba(76,117,163,.25)' }}>
                              🔵 VK
                            </button>
                          )}
                          {!['telegram', 'vk'].includes(r.platform) && (
                            <span className="text-[11px] text-line2 py-1.5">Автопостинг — в профиле</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}
