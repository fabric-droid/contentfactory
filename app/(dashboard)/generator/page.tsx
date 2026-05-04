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

const inp: React.CSSProperties = { background: '#21222C', border: '1px solid #323344', borderRadius: 8, padding: '10px 13px', color: '#F8F8FC', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', transition: 'border-color .15s' }
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.8px' }

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
  const [exporting, setExporting] = useState(false)
  const topicRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imgMode, setImgMode] = useState<'upload' | 'dalle' | null>(null)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [dallePrompt, setDallePrompt] = useState('')
  const [dalleUrl, setDalleUrl] = useState<string | undefined>()
  const [dalleLoading, setDalleLoading] = useState(false)

  const illustrationUrls = imgMode === 'upload' ? uploadItems.map(i => i.url ?? i.preview) : imgMode === 'dalle' && dalleUrl ? [dalleUrl] : []
  const hasSite = [...selected].some(p => SITE_PLATFORMS.includes(p))

  function togglePlatform(p: PlatformKey) {
    setSelected(prev => { const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next })
  }
  function switchImgMode(mode: 'upload' | 'dalle') { setImgMode(prev => prev === mode ? null : mode) }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (fileInputRef.current) fileInputRef.current.value = ''
    const remaining = 5 - uploadItems.length
    const valid: File[] = []
    let skipped = false
    for (const f of files) {
      if (valid.length >= remaining) { skipped = true; break }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 10 * 1024 * 1024) { skipped = true; continue }
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
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Ошибка загрузки') }
      const data = await res.json()
      setUploadItems(prev => { const next = [...prev]; let urlIdx = 0; for (let i = next.length - valid.length; i < next.length && urlIdx < data.urls.length; i++) { next[i] = { ...next[i], url: data.urls[urlIdx++] } }; return next })
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Ошибка загрузки файла', 'err')
      setUploadItems(prev => prev.slice(0, prev.length - valid.length))
    } finally { setUploading(false) }
  }

  function removeUpload(idx: number) {
    setUploadItems(prev => { const item = prev[idx]; if (item && !item.url) URL.revokeObjectURL(item.preview); return prev.filter((_, i) => i !== idx) })
  }

  async function generateDalle() {
    if (!dallePrompt.trim()) return
    setDalleLoading(true)
    try {
      const res = await fetch('/api/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: dallePrompt }) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Ошибка генерации') }
      const data = await res.json()
      setDalleUrl(data.url)
      toast('Иллюстрация готова ✓', 'ok')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Ошибка генерации иллюстрации', 'err')
    } finally { setDalleLoading(false) }
  }

  const LOAD_STEPS = ['Читаем профиль бизнеса', 'Создаём мастер-текст', 'Адаптируем под платформы', 'Собираем результат']

  async function runGenerate() {
    if (!topic.trim()) { topicRef.current?.focus(); toast('Введите тему или название товара', 'err'); return }
    if (selected.size === 0) { toast('Выберите хотя бы одну платформу', 'err'); return }
    setLoading(true); setLoadStep(1); setResults([])
    try {
      const stepInterval = setInterval(() => setLoadStep(prev => Math.min(prev + 1, LOAD_STEPS.length)), 2500)
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, details, url, platforms: [...selected], siteMode }) })
      clearInterval(stepInterval)
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Ошибка генерации') }
      const data = await res.json()
      setResults(data.results)
      toast('Контент готов ✓', 'ok')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка генерации', 'err')
    } finally { setLoading(false); setLoadStep(0) }
  }

  async function regenPlatform(platform: PlatformKey) {
    toast('Перегенерация...', 'ok')
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, details, url, platforms: [platform], siteMode, regenOnly: true }) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(prev => prev.map(r => r.platform === platform ? { ...r, ...data.results[0] } : r))
    } catch { toast('Ошибка перегенерации', 'err') }
  }

  function copyText(text: string) { navigator.clipboard.writeText(text); toast('Текст скопирован ✓', 'ok') }

  async function exportZip() {
    if (results.length === 0) return
    setExporting(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder('contentfactory_export')!

      // Добавляем тексты для каждой платформы
      for (const r of results) {
        const pl = PLATFORMS[r.platform]
        const fileName = r.platform.replace(/[^a-z0-9]/gi, '_')
        let content = `${pl.name}\n${'='.repeat(pl.name.length)}\n\n${r.text}`
        if (r.hashtags && r.hashtags.length > 0) {
          content += `\n\n${r.hashtags.join(' ')}`
        }
        folder.file(`${fileName}.txt`, content)
      }

      // Добавляем иллюстрации
      if (illustrationUrls.length > 0) {
        const imgFolder = folder.folder('illustrations')!
        for (let i = 0; i < illustrationUrls.length; i++) {
          try {
            const imgUrl = illustrationUrls[i]
            const response = await fetch(imgUrl)
            const blob = await response.blob()
            const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg'
            const arrayBuffer = await blob.arrayBuffer()
            imgFolder.file(`illustration_${i + 1}.${ext}`, arrayBuffer)
          } catch {
            // пропускаем если не удалось загрузить
          }
        }
      }

      // Добавляем README
      const platformList = results.map(r => `- ${PLATFORMS[r.platform].name}: ${r.platform}.txt`).join('\n')
      const readme = `ContentFactory Export\n${'='.repeat(21)}\n\nТема: ${topic}\nДата: ${new Date().toLocaleDateString('ru-RU')}\n\nФайлы:\n${platformList}${illustrationUrls.length > 0 ? '\n- Иллюстрации: папка illustrations/' : ''}\n\nСоздано с помощью ContentFactory — contentfactory-psi.vercel.app`
      folder.file('README.txt', readme)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contentfactory_${topic.slice(0, 30).replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Архив скачан ✓', 'ok')
    } catch (e) {
      toast('Ошибка экспорта', 'err')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: 'rgba(14,15,19,.88)', backdropFilter: 'blur(6px)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #323344', borderTopColor: '#C8F135' }} className="animate-spin-lime" />
          <div className="font-heading" style={{ fontSize: 13, color: '#F8F8FC' }}>Генерируем контент...</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LOAD_STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: loadStep > i + 1 ? '#C8F135' : loadStep === i + 1 ? '#F8F8FC' : '#8B8CA8', transition: 'color .3s' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Topbar */}
        <div style={{ padding: '24px 32px 0', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>Генератор</div>
            <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Тексты для всех платформ + иллюстрация на выбор</div>
          </div>
          {results.length > 0 && (
            <button onClick={exportZip} disabled={exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, background: exporting ? '#2C2D3A' : '#21222C', border: '1px solid #42435A', color: exporting ? '#8B8CA8' : '#C4C5D8', fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all .18s', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" style={{ width: 15, height: 15 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? 'Создаём архив...' : 'Экспортировать проект'}
            </button>
          )}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', flex: 1, padding: '20px 32px 32px', gap: 0 }}>

          {/* Left panel */}
          <div style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: 'fit-content', position: 'sticky', top: 0, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <div className="font-heading" style={{ fontSize: 11, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Что генерируем</div>

            {/* Topic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>Тема / название товара <span style={{ color: '#FF5252' }}>*</span></label>
              <input ref={topicRef} value={topic} onChange={e => setTopic(e.target.value.slice(0, 120))} type="text" placeholder="Напр.: Кофе латте с карамелью, Акция —20% на обувь" style={inp} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              <div style={{ fontSize: 10, color: '#42435A', textAlign: 'right' }}>{topic.length}/120</div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>Детали <span style={{ color: '#42435A', fontWeight: 400, textTransform: 'none' }}>(цена, условия, особенности)</span></label>
              <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2} placeholder="Необязательно — для более точных текстов..." style={{ ...inp, resize: 'vertical', lineHeight: '1.6', minHeight: 60 } as React.CSSProperties} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>

            {/* URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>Ссылка <span style={{ color: '#42435A', fontWeight: 400, textTransform: 'none' }}>(необязательно)</span></label>
              <input value={url} onChange={e => setUrl(e.target.value)} type="url" placeholder="https://vk.com/yourbusiness" style={inp} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>

            {/* Platforms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={lbl}>Платформы</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSelected(new Set(PLATFORM_KEYS))} style={{ ...inp, width: 'auto', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Все</button>
                <button onClick={() => setSelected(new Set())} style={{ ...inp, width: 'auto', padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Сбросить</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PLATFORM_KEYS.map(p => {
                  const pl = PLATFORMS[p]
                  const on = selected.has(p)
                  return (
                    <button key={p} onClick={() => togglePlatform(p)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 8, border: `1px solid ${on ? 'rgba(200,241,53,.3)' : '#323344'}`, cursor: 'pointer', background: on ? 'rgba(200,241,53,.14)' : '#21222C', fontSize: 12, fontWeight: 500, color: on ? '#C8F135' : '#8B8CA8', transition: 'all .12s', userSelect: 'none', position: 'relative' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: '#2C2D3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{pl.icon}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>{pl.name.replace('Instagram ', '').replace('ВКонтакте', 'VK').replace('Яндекс Дзен', 'Дзен')}</span>
                      <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${on ? '#C8F135' : '#42435A'}`, background: on ? '#C8F135' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: on ? '#0E0F13' : 'transparent', flexShrink: 0, transition: 'all .12s' }}>✓</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Site mode */}
            {hasSite && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={lbl}>Для сайта / Дзен — текст на основе</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['product', 'brand'] as const).map(m => (
                    <button key={m} onClick={() => setSiteMode(m)} style={{ flex: 1, padding: 7, borderRadius: 8, border: `1px solid ${siteMode === m ? 'rgba(200,241,53,.3)' : '#323344'}`, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: siteMode === m ? '#C8F135' : '#8B8CA8', textAlign: 'center', transition: 'all .12s', background: siteMode === m ? 'rgba(200,241,53,.14)' : '#21222C' }}>
                      {m === 'product' ? '📦 Товара' : '🏢 Бренда'}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#42435A' }}>{siteMode === 'product' ? 'Статья будет написана именно об этом товаре' : 'Текст о бизнесе в целом'}</div>
              </div>
            )}

            {/* Illustration */}
            <div style={{ borderTop: '1px solid #323344', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={lbl}>Иллюстрация</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(['upload', 'dalle'] as const).map(m => {
                  const on = imgMode === m
                  return (
                    <button key={m} onClick={() => switchImgMode(m)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: `1px solid ${on ? 'rgba(200,241,53,.3)' : '#323344'}`, cursor: 'pointer', background: on ? 'rgba(200,241,53,.14)' : '#21222C', fontSize: 12, fontWeight: 500, color: on ? '#C8F135' : '#8B8CA8', transition: 'all .12s' }}>
                      {m === 'upload' ? '📁 Загрузить фото' : '✨ DALL-E 3'}
                    </button>
                  )
                })}
              </div>

              {imgMode === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {uploadItems.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {uploadItems.map((item, i) => (
                        <div key={i} style={{ position: 'relative', width: 80, height: 80, background: '#21222C', border: '1px solid #323344', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {!item.url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #323344', borderTopColor: '#C8F135' }} className="animate-spin-lime" /></div>}
                          <button onClick={() => removeUpload(i)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.7)', color: '#F8F8FC', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadItems.length < 5 && (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileSelect} disabled={uploading} />
                      <div style={{ border: '1.5px dashed #42435A', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 12, color: '#8B8CA8', cursor: 'pointer' }}>
                        {uploading ? 'Загрузка...' : uploadItems.length === 0 ? '+ Выберите фото (JPG, PNG, WebP · до 10 МБ)' : `+ Добавить ещё (${uploadItems.length}/5)`}
                      </div>
                    </label>
                  )}
                  {uploadItems.length === 5 && <div style={{ fontSize: 11, color: '#8B8CA8', textAlign: 'center' }}>Максимум 5 фото загружено</div>}
                </div>
              )}

              {imgMode === 'dalle' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea value={dallePrompt} onChange={e => setDallePrompt(e.target.value)} rows={3} placeholder="Опишите иллюстрацию: стиль, объект, фон, настроение..." style={{ ...inp, resize: 'none', lineHeight: '1.6' } as React.CSSProperties} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                  <button onClick={generateDalle} disabled={dalleLoading || !dallePrompt.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: 'rgba(200,241,53,.14)', border: '1px solid rgba(200,241,53,.3)', color: '#C8F135', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: dalleLoading || !dallePrompt.trim() ? 0.4 : 1, transition: 'all .15s' }}>
                    {dalleLoading ? '⏳ Генерируем...' : '✨ Сгенерировать иллюстрацию'}
                  </button>
                </div>
              )}
            </div>

            {/* Generate btn */}
            <button onClick={runGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#C8F135', color: '#0E0F13', fontSize: 14, fontWeight: 600, borderRadius: 8, padding: '12px 24px', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1, transition: 'all .18s', width: '100%' }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" style={{ width: 16, height: 16 }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {loading ? 'Генерируем...' : 'Сгенерировать'}
            </button>
            <div style={{ fontSize: 11, color: '#8B8CA8', textAlign: 'center', marginTop: -8 }}>1 генерация из лимита</div>
          </div>

          {/* Results */}
          <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {results.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, minHeight: 360 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#21222C', border: '1px solid #323344', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
                <div style={{ fontSize: 14, color: '#C4C5D8', fontWeight: 500 }}>Контент появится здесь</div>
                <div style={{ fontSize: 12, color: '#8B8CA8', textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>Заполните форму и нажмите «Сгенерировать» — получите тексты для выбранных платформ</div>
              </div>
            ) : (
              <>
                {results.map(r => {
                  const pl = PLATFORMS[r.platform]
                  const hasImg = !['reels', 'tiktok'].includes(r.platform) && illustrationUrls.length > 0
                  return (
                    <div key={r.platform} style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#21222C', borderBottom: '1px solid #323344' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(200,241,53,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{pl.icon}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>{pl.name}</div>
                            <div style={{ fontSize: 10, color: '#8B8CA8', marginTop: 1 }}>{pl.type}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <button onClick={() => copyText(r.text)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #323344', color: '#8B8CA8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>Копировать</button>
                          <button onClick={() => regenPlatform(r.platform)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #323344', color: '#8B8CA8', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>↻ Платформу</button>
                        </div>
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div contentEditable suppressContentEditableWarning style={{ fontSize: 13, lineHeight: 1.75, color: '#C4C5D8', whiteSpace: 'pre-wrap', outline: 'none', minHeight: 60, cursor: 'text', borderRadius: 8, padding: 8, margin: -8, transition: 'background .15s' }}>{r.text}</div>
                        {r.hashtags && r.hashtags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {r.hashtags.map(tag => (
                              <span key={tag} style={{ fontSize: 11, color: '#C8F135', background: 'rgba(200,241,53,.08)', padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(200,241,53,.15)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                        {hasImg && (
                          <div style={{ borderTop: '1px solid #323344', paddingTop: 12 }}>
                            <span style={{ fontSize: 10, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>🖼 Иллюстрация · {pl.ratio}</span>
                            {illustrationUrls.length === 1 ? (
                              <img src={illustrationUrls[0]} alt="Иллюстрация" style={{ maxWidth: 360, width: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8, border: '1px solid #323344' }} />
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: illustrationUrls.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 6 }}>
                                {illustrationUrls.map((u, i) => <img key={i} src={u} alt="Иллюстрация" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8, border: '1px solid #323344' }} />)}
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTop: '1px solid #323344', paddingTop: 12 }}>
                          <span style={{ fontSize: 11, color: '#8B8CA8' }}>Публикация</span>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {r.platform === 'telegram' && <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,136,204,.15)', color: '#48B8F0', border: '1px solid rgba(0,136,204,.25)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>💬 Telegram</button>}
                            {r.platform === 'vk' && <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(76,117,163,.15)', color: '#7BA8D8', border: '1px solid rgba(76,117,163,.25)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>🔵 VK</button>}
                            {!['telegram', 'vk'].includes(r.platform) && <span style={{ fontSize: 11, color: '#42435A', padding: '6px 0' }}>Автопостинг — в профиле</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Export button at bottom of results */}
                <button onClick={exportZip} disabled={exporting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, background: '#21222C', border: '1px solid #42435A', color: exporting ? '#8B8CA8' : '#C4C5D8', fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all .18s', width: '100%', marginTop: 4 }}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" style={{ width: 16, height: 16 }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {exporting ? 'Создаём архив...' : 'Экспортировать проект (ZIP)'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
