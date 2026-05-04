'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/Toast'

const PLATFORMS = [
  { key: 'telegram', label: 'Telegram', icon: '💬' },
  { key: 'vk', label: 'ВКонтакте', icon: '🔵' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'reels', label: 'Reels', icon: '🎬' },
  { key: 'threads', label: 'Threads', icon: '🧵' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
]

interface ScheduledPost {
  id: string
  topic: string
  details: string
  platform: string
  scheduled_at: string
  status: 'pending' | 'generating' | 'published' | 'failed'
  generated_text: string
  error: string
}

interface PlatformEntry {
  platform: string
  date: string
  time: string
}

const inp: React.CSSProperties = { background: '#21222C', border: '1px solid #323344', borderRadius: 6, padding: '8px 11px', color: '#F8F8FC', fontFamily: 'inherit', fontSize: 12, outline: 'none', width: '100%', transition: 'border-color .15s' }
const lbl: React.CSSProperties = { fontSize: 9, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 5 }

function getMiniCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function toLocalInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function SchedulerPage() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)

  // Calendar
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(toLocalInputDate(today))

  // Form
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [platformEntries, setPlatformEntries] = useState<PlatformEntry[]>([])
  const [saving, setSaving] = useState(false)

  // Edit modal
  const [editPost, setEditPost] = useState<ScheduledPost | null>(null)
  const [editTopic, setEditTopic] = useState('')
  const [editDetails, setEditDetails] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler')
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      toast('Ошибка загрузки задач', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  // Посты для выбранной даты
  const selectedPosts = posts.filter(p => {
    const d = new Date(p.scheduled_at)
    return toLocalInputDate(d) === selectedDate
  })

  // Дни с постами в текущем месяце
  const daysWithPosts = new Set(
    posts
      .filter(p => {
        const d = new Date(p.scheduled_at)
        return d.getFullYear() === calYear && d.getMonth() === calMonth
      })
      .map(p => new Date(p.scheduled_at).getDate())
  )

  function togglePlatform(key: string) {
    setPlatformEntries(prev => {
      const exists = prev.find(e => e.platform === key)
      if (exists) return prev.filter(e => e.platform !== key)
      return [...prev, { platform: key, date: selectedDate, time: '10:00' }]
    })
  }

  function updateEntry(key: string, field: 'date' | 'time', value: string) {
    setPlatformEntries(prev => prev.map(e => e.platform === key ? { ...e, [field]: value } : e))
  }

  async function addTask() {
    if (!topic.trim()) { toast('Введите тему', 'err'); return }
    if (platformEntries.length === 0) { toast('Выберите хотя бы одну платформу', 'err'); return }

    setSaving(true)
    try {
      const platforms = platformEntries.map(e => ({
        platform: e.platform,
        scheduled_at: new Date(`${e.date}T${e.time}:00`).toISOString(),
      }))
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, details, platforms }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast('Задача добавлена ✓', 'ok')
      setTopic('')
      setDetails('')
      setPlatformEntries([])
      loadPosts()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(id: string) {
    try {
      await fetch('/api/scheduler', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setPosts(prev => prev.filter(p => p.id !== id))
      toast('Задача удалена', 'ok')
    } catch { toast('Ошибка удаления', 'err') }
  }

  async function saveEdit() {
    if (!editPost) return
    try {
      const scheduled_at = new Date(`${editDate}T${editTime}:00`).toISOString()
      const res = await fetch('/api/scheduler', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editPost.id, topic: editTopic, details: editDetails, scheduled_at }),
      })
      if (!res.ok) throw new Error()
      toast('Сохранено ✓', 'ok')
      setEditPost(null)
      loadPosts()
    } catch { toast('Ошибка сохранения', 'err') }
  }

  function openEdit(post: ScheduledPost) {
    const d = new Date(post.scheduled_at)
    setEditPost(post)
    setEditTopic(post.topic)
    setEditDetails(post.details)
    setEditDate(toLocalInputDate(d))
    setEditTime(d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
  }

  const calDays = getMiniCalendar(calYear, calMonth)
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
  const weekDays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

  const statusLabel = (s: string) => ({ pending: 'Запланировано', generating: 'Генерируется...', published: 'Опубликовано', failed: 'Ошибка' }[s] ?? s)
  const statusColor = (s: string) => ({ pending: { bg: 'rgba(200,241,53,.1)', border: 'rgba(200,241,53,.2)', color: '#C8F135' }, generating: { bg: 'rgba(200,241,53,.06)', border: 'rgba(200,241,53,.15)', color: '#8B8CA8' }, published: { bg: 'rgba(72,184,240,.1)', border: 'rgba(72,184,240,.2)', color: '#48B8F0' }, failed: { bg: 'rgba(255,82,82,.1)', border: 'rgba(255,82,82,.2)', color: '#FF5252' } }[s] ?? { bg: '#21222C', border: '#323344', color: '#8B8CA8' })

  const totalPending = posts.filter(p => p.status === 'pending').length
  const totalPublished = posts.filter(p => p.status === 'published').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Edit modal */}
      {editPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(14,15,19,.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditPost(null)}>
          <div style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-unbounded, sans-serif)', fontSize: 14, fontWeight: 600, color: '#F8F8FC' }}>Редактировать задачу</div>
            <div>
              <label style={lbl}>Тема</label>
              <input style={inp} value={editTopic} onChange={e => setEditTopic(e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>
            <div>
              <label style={lbl}>Детали</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' } as React.CSSProperties} value={editDetails} onChange={e => setEditDetails(e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Дата</label>
                <input type="date" style={inp} value={editDate} onChange={e => setEditDate(e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
              <div>
                <label style={lbl}>Время</label>
                <input type="time" style={inp} value={editTime} onChange={e => setEditTime(e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditPost(null)} style={{ padding: '8px 16px', borderRadius: 6, background: 'transparent', border: '1px solid #323344', color: '#8B8CA8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
              <button onClick={saveEdit} style={{ padding: '8px 16px', borderRadius: 6, background: '#C8F135', border: 'none', color: '#0E0F13', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
        <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>Планировщик</div>
        <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Запланируйте публикации — система сгенерирует и опубликует автоматически</div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Запланировано', value: String(totalPending), delta: 'ожидают публикации', up: false },
          { label: 'Опубликовано', value: String(totalPublished), delta: '↑ за всё время', up: true },
          { label: 'Всего задач', value: String(posts.length), delta: 'в планировщике', up: false },
        ].map(s => (
          <div key={s.label} style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 14 }}>
            <div style={{ fontSize: 9, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>{s.label}</div>
            <div className="font-heading" style={{ fontSize: 22, fontWeight: 700, color: '#F8F8FC', marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: 10, marginTop: 2, color: s.up ? '#C8F135' : '#8B8CA8' }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ padding: '16px 28px 28px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, flex: 1 }}>

        {/* LEFT: Calendar + Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Mini Calendar */}
          <div style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                style={{ background: 'none', border: 'none', color: '#8B8CA8', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>‹</button>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#F8F8FC', fontFamily: 'var(--font-unbounded, sans-serif)' }}>
                {monthNames[calMonth]} {calYear}
              </div>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                style={{ background: 'none', border: 'none', color: '#8B8CA8', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
              {weekDays.map(d => (
                <div key={d} style={{ fontSize: 8, color: '#42435A', textAlign: 'center', fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {calDays.map((day, i) => {
                if (!day) return <div key={i} />
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = dateStr === selectedDate
                const isToday = dateStr === toLocalInputDate(today)
                const hasPost = daysWithPosts.has(day)
                return (
                  <div key={i} onClick={() => setSelectedDate(dateStr)}
                    style={{ position: 'relative', width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: isSelected ? 700 : 400, background: isSelected ? '#C8F135' : isToday ? 'rgba(200,241,53,.1)' : 'transparent', color: isSelected ? '#0E0F13' : isToday ? '#C8F135' : '#C4C5D8', border: isToday && !isSelected ? '1px solid rgba(200,241,53,.3)' : '1px solid transparent', transition: 'all .1s' }}>
                    {day}
                    {hasPost && !isSelected && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#C8F135' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <div style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="font-heading" style={{ fontSize: 9, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Новая задача</div>

            <div>
              <label style={lbl}>Тема *</label>
              <input style={inp} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Летняя акция — скидка 20%" onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>
            <div>
              <label style={lbl}>Детали</label>
              <textarea style={{ ...inp, minHeight: 48, resize: 'vertical', lineHeight: '1.5' } as React.CSSProperties} value={details} onChange={e => setDetails(e.target.value)} placeholder="Необязательно..." onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
            </div>

            <div>
              <label style={lbl}>Платформы и время</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLATFORMS.map(pl => {
                  const entry = platformEntries.find(e => e.platform === pl.key)
                  const on = !!entry
                  return (
                    <div key={pl.key}>
                      <div onClick={() => togglePlatform(pl.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: `1px solid ${on ? 'rgba(200,241,53,.3)' : '#323344'}`, background: on ? 'rgba(200,241,53,.08)' : '#21222C', cursor: 'pointer', fontSize: 11, color: on ? '#C8F135' : '#8B8CA8', transition: 'all .12s' }}>
                        <span>{pl.icon}</span>
                        <span style={{ flex: 1 }}>{pl.label}</span>
                        <span style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px solid ${on ? '#C8F135' : '#42435A'}`, background: on ? '#C8F135' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: on ? '#0E0F13' : 'transparent', flexShrink: 0 }}>✓</span>
                      </div>
                      {on && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4, paddingLeft: 4 }}>
                          <input type="date" style={{ ...inp, fontSize: 11, padding: '5px 8px' }} value={entry.date} onChange={e => updateEntry(pl.key, 'date', e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                          <input type="time" style={{ ...inp, fontSize: 11, padding: '5px 8px' }} value={entry.time} onChange={e => updateEntry(pl.key, 'time', e.target.value)} onFocus={e => (e.target.style.borderColor = '#C8F135')} onBlur={e => (e.target.style.borderColor = '#323344')} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <button onClick={addTask} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 6, background: '#C8F135', border: 'none', color: '#0E0F13', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'all .15s' }}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" style={{ width: 13, height: 13 }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {saving ? 'Добавляем...' : 'Добавить в план'}
            </button>
          </div>
        </div>

        {/* RIGHT: Posts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="font-heading" style={{ fontSize: 10, fontWeight: 600, color: '#8B8CA8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 10, color: '#8B8CA8' }}>
              {selectedPosts.length > 0 ? `${selectedPosts.length} задач` : 'Нет задач'}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#8B8CA8', fontSize: 12 }}>Загрузка...</div>
          ) : selectedPosts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#21222C', border: '1px solid #323344', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <div style={{ fontSize: 13, color: '#C4C5D8', fontWeight: 500 }}>Нет задач на этот день</div>
              <div style={{ fontSize: 11, color: '#8B8CA8' }}>Добавьте задачу в форме слева</div>
            </div>
          ) : (
            selectedPosts
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .map(post => {
                const sc = statusColor(post.status)
                const pl = PLATFORMS.find(p => p.key === post.platform)
                return (
                  <div key={post.id} style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#42435A')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#323344')}>
                    <div className="font-heading" style={{ fontSize: 14, fontWeight: 700, color: '#F8F8FC', flexShrink: 0, width: 44 }}>
                      {formatTime(post.scheduled_at)}
                    </div>
                    <div style={{ width: 1, height: 36, background: '#323344', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{post.topic}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#8B8CA8', background: '#21222C', border: '1px solid #323344', padding: '2px 7px', borderRadius: 10 }}>
                          {pl?.icon} {pl?.label ?? post.platform}
                        </span>
                        {post.details && <span style={{ fontSize: 10, color: '#42435A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{post.details}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, flexShrink: 0, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {statusLabel(post.status)}
                    </div>
                    {post.status === 'failed' && post.error && (
                      <div style={{ fontSize: 10, color: '#FF5252', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.error}>{post.error}</div>
                    )}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {post.status !== 'published' && (
                        <button onClick={() => openEdit(post)} style={{ width: 28, height: 28, borderRadius: 6, background: '#21222C', border: '1px solid #323344', color: '#8B8CA8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" style={{ width: 12, height: 12 }}>
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      <button onClick={() => deletePost(post.id)} style={{ width: 28, height: 28, borderRadius: 6, background: '#21222C', border: '1px solid #323344', color: '#8B8CA8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" style={{ width: 12, height: 12 }}>
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
