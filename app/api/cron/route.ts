import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: 'Напиши пост для Instagram (150–250 слов). Структура: эмоциональный hook → польза → детали → CTA. Добавь 8–10 хэштегов после текста начиная с новой строки.',
  reels: 'Напиши сценарий Instagram Reels на 30 секунд. Структура: HOOK (0–3 сек) → ОСНОВА (3–22 сек) → CTA (22–30 сек).',
  threads: 'Напиши пост для Threads (до 400 символов). Разговорный стиль, без хэштегов.',
  vk: 'Напиши пост для ВКонтакте (250–400 слов). Структурированный, emoji в начале блоков, с призывом к действию.',
  telegram: 'Напиши пост для Telegram-канала (3–5 предложений). Короткий, emoji, без хэштегов.',
  tiktok: 'Напиши сценарий TikTok на 15–20 секунд. Структура: HOOK → ОСНОВА → CTA.',
  site: 'Напиши SEO-статью (400–600 слов). H1 с названием, H2 преимущества, H2 для кого, CTA.',
  dzen: 'Напиши статью для Яндекс Дзен (400–600 слов). Нарративный стиль, личная история, подзаголовки.',
}

async function publishToTelegram(text: string, botToken: string, channelId: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channelId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description ?? 'Ошибка Telegram')
  }
}

async function publishToVK(text: string, token: string, groupId?: string): Promise<void> {
  const params = new URLSearchParams({
    message: text,
    access_token: token,
    v: '5.131',
    ...(groupId ? { owner_id: `-${groupId}` } : {}),
  })
  const res = await fetch(`https://api.vk.com/method/wall.post?${params}`)
  if (!res.ok) throw new Error('Ошибка VK API')
  const data = await res.json()
  if (data.error) throw new Error(data.error.error_msg ?? 'Ошибка VK')
}

export async function GET(req: NextRequest) {
  // Проверяем секретный ключ для Cron Job
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // Находим все задачи которые нужно опубликовать
    const { data: posts, error } = await supabase
      .from('scheduled_posts')
      .select('*, projects:user_id(tg_bot_token, tg_channel_id, vk_token, business_name, niche, description, usp, advantages, audience, style)')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(10)

    if (error) throw error
    if (!posts || posts.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let processed = 0

    for (const post of posts) {
      try {
        // Помечаем как "генерируется"
        await supabase
          .from('scheduled_posts')
          .update({ status: 'generating', updated_at: new Date().toISOString() })
          .eq('id', post.id)

        // Получаем профиль проекта
        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', post.user_id)
          .limit(1)
          .single()

        const businessContext = project ? `Бизнес: ${project.business_name}. Ниша: ${project.niche}. Описание: ${project.description}. УТП: ${project.usp}. Аудитория: ${project.audience}. Стиль: ${project.style ?? 'дружелюбный'}.` : ''

        // Генерируем текст
        const prompt = PLATFORM_PROMPTS[post.platform] ?? 'Напиши короткий пост для социальной сети.'
        const msg = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: `Ты профессиональный SMM-копирайтер. Пиши только на русском языке. ${businessContext}` },
            { role: 'user', content: `${prompt}\n\nТема: ${post.topic}${post.details ? `\nДетали: ${post.details}` : ''}` },
          ],
        })
        const generatedText = msg.choices[0].message.content ?? ''

        // Публикуем
        if (post.platform === 'telegram' && project?.tg_bot_token && project?.tg_channel_id) {
          await publishToTelegram(generatedText, project.tg_bot_token, project.tg_channel_id)
        } else if (post.platform === 'vk' && project?.vk_token) {
          await publishToVK(generatedText, project.vk_token)
        } else {
          throw new Error(`Платформа ${post.platform} не подключена`)
        }

        // Помечаем как опубликовано
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            generated_text: generatedText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        processed++
      } catch (postErr) {
        const errMsg = postErr instanceof Error ? postErr.message : 'Неизвестная ошибка'
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error: errMsg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id)
      }
    }

    return NextResponse.json({ processed })
  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: 'Ошибка cron' }, { status: 500 })
  }
}
