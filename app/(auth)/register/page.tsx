'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Пароль минимум 8 символов'); return }
    setLoading(true)
    setError('')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="bg-ink2 border border-line rounded-[12px] p-7 text-center flex flex-col gap-4">
        <div className="text-3xl">📬</div>
        <h2 className="font-heading text-[16px] font-semibold text-snow">Проверьте почту</h2>
        <p className="text-[13px] text-smoke leading-relaxed">
          Мы отправили письмо на <span className="text-mist">{email}</span>.<br/>
          Перейдите по ссылке для подтверждения.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-ink2 border border-line rounded-[12px] p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-[18px] font-semibold text-snow">Создать аккаунт</h1>
        <p className="text-[12px] text-smoke mt-1">Уже есть аккаунт? <Link href="/login" className="text-lime hover:underline">Войти</Link></p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        {error && (
          <div className="text-[12px] text-red bg-red/10 border border-red/20 rounded-[8px] px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-smoke uppercase tracking-wider">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="минимум 8 символов"
            className="bg-ink3 border border-line rounded-[8px] px-3 py-2.5 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-lime text-ink font-semibold text-[13px] rounded-[8px] py-2.5 hover:bg-lime2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="text-[11px] text-smoke text-center">
        После регистрации — 20 генераций бесплатно на тарифе Старт
      </p>
    </div>
  )
}