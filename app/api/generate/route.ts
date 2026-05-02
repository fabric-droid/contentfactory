import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { PLATFORMS, type PlatformKey } from '@/lib/utils'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PLATFORM_PROMPTS: Record<PlatformKey, string> = {
  instagram: 'Напиши пост для Instagram (150–250 слов). Структура: эмоциональный hook → польза → детали → CTA → 8–10 хэштегов отдельно. Формат постинга: текст поста, затем строка "HASHTAGS:" и хэштеги через пробел.',
  reels:     'Напиши сценарий Instagram Reels на 30 секунд. Структура: ⚡ HOOK (0–3 сек) → 📍 ОСНОВА (3–22 сек) с конкретными кадрами → 🎯 CTA (22–30 сек) → 📝 СУБТИТРЫ одной строкой. Без иллюстрации.',
  threads:   'Напиши пост для Threads (до 400 символов). Разговорный стиль, личное мнение, без хэштегов.',
  vk:        'Напиши пост для ВКонтакте (250–400 слов). Структурированный, emoji в начале блоков, с призывом к действию.',
  telegram:  'Напиши пост для Telegram-канала (3–5 предложений). Короткий, emoji, без хэштегов, с ссылкой-заглушкой.',
  tiktok:    'Напиши сценарий TikTok на 15–20 секунд. Структура: ⚡ HOOK (0–2 сек) → ОСНОВА (2–15 сек) с монтажем → CTA + совет по trending audio. Без иллюстрации.',
  site:      'Напиши SEO-статью (400–600 слов). Структура: H1 с названием товара, H2 «Преимущества», H2 «Для кого подходит», H2 «Как заказать» с CTA.',
  dzen:      'Напиши статью для Яндекс Дзен (400–600 слов). Нарративный стиль, личная история, интригующий заголовок. Используй подзаголовки и списки.',
}

async function parseUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Authorization: `Bearer ${process.env.JINA_API_KEY}`, Accept: 'text/plain' },
    })
    const text = await res.text()
    return text.slice(0, 2000)
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan, gens_used, gens_limit')
      .eq('user_id', user.id)
      .single()

    const { topic, details, url, platforms, siteMode = 'product', regenOnly = false } = await req.json()

    if (!regenOnly) {
      if (!profile || profile.gens_used >= profile.gens_limit) {
        return NextResponse.json({ error: 'Лимит генераций исчерпан. Перейдите на следующий тариф.' }, { status: 429 })
      }
    }

    // Fetch project profile for context
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const businessContext = project ? `
Профиль бизнеса:
- Название: ${project.business_name || project.name || ''}
- Ниша: ${project.niche || ''}
- Описание: ${project.description || ''}
- УТП: ${project.usp || ''}
- Преимущества: ${project.advantages || ''}
- Аудитория: ${project.audience || ''}
- Стиль: ${project.style || 'дружелюбный'}` : ''

    const urlContext = url ? await parseUrl(url) : ''

    const selectedPlatforms = (platforms as PlatformKey[]) ?? []

    // System prompt
    const systemPrompt = `Ты профессиональный SMM-копирайтер для русскоязычного малого бизнеса.
Пиши только на русском языке. Тексты должны быть живыми, конкретными и продающими.
${businessContext}
${urlContext ? `\nДополнительная информация с сайта:\n${urlContext}` : ''}
${siteMode === 'brand' ? '\nДля сайта и Дзен — пиши о бизнесе в целом, а не о конкретном товаре.' : '\nДля сайта и Дзен — пиши именно об этом конкретном товаре/услуге.'}`

    // Generate master text first
    const masterMsg = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Тема: ${topic}${details ? `\nДетали: ${details}` : ''}\n\nНапиши развёрнутый мастер-текст (600–900 слов) об этом продукте/теме для русскоязычной аудитории малого бизнеса. Опиши преимущества, ценность, целевую аудиторию и призыв к действию. Этот текст будет адаптирован под разные платформы.` },
      ],
    })
    const masterText = masterMsg.choices[0].message.content ?? ''

    // Generate platform texts in parallel
    const platformResults = await Promise.all(
      selectedPlatforms.map(async (platform) => {
        const prompt = PLATFORM_PROMPTS[platform]
        const msg = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Мастер-текст:\n${masterText}\n\n${prompt}\n\nТема: ${topic}${details ? `\nДетали: ${details}` : ''}` },
          ],
        })
        const raw = msg.choices[0].message.content ?? ''

        // Extract hashtags for Instagram
        let text = raw
        let hashtags: string[] = []
        if (platform === 'instagram') {
          const parts = raw.split(/HASHTAGS:/i)
          text = parts[0].trim()
          if (parts[1]) {
            hashtags = parts[1].trim().split(/\s+/).filter(t => t.startsWith('#'))
          }
        }

        return { platform, text, hashtags }
      })
    )

    // Save to history and increment counter
    if (!regenOnly) {
      await supabase.from('generations').insert({
        user_id: user.id,
        topic,
        platforms: selectedPlatforms,
        results: platformResults,
        created_at: new Date().toISOString(),
      })

      await supabase
        .from('user_profiles')
        .update({ gens_used: (profile?.gens_used ?? 0) + 1 })
        .eq('user_id', user.id)
    }

    return NextResponse.json({ results: platformResults })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Ошибка генерации. Попробуйте ещё раз.' }, { status: 500 })
  }
}
