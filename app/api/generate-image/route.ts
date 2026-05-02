import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { prompt } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt обязателен' }, { status: 400 })

    const result = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      size: '1024x1024',
      n: 1,
    })

    return NextResponse.json({ url: result.data?.[0]?.url })
  } catch (err) {
    console.error('Image gen error:', err)
    return NextResponse.json({ error: 'Ошибка генерации иллюстрации' }, { status: 500 })
  }
}
