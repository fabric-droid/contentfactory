import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function publishTelegram(text: string, botToken: string, channelId: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channelId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.description ?? 'Ошибка Telegram API')
  }
}

async function publishVK(text: string, token: string, imageUrl?: string): Promise<void> {
  const params = new URLSearchParams({ message: text, access_token: token, v: '5.131' })
  const res = await fetch(`https://api.vk.com/method/wall.post?${params}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.error_msg ?? 'Ошибка VK API')
}

async function publishOK(text: string, token: string, appKey: string, appSecret: string, groupId?: string): Promise<void> {
  // OK API: post to group wall
  const method = 'mediatopic.post'
  const params: Record<string, string> = {
    application_key: appKey,
    format: 'json',
    method,
    session_key: token,
    type: 'GROUP_THEME',
    ...(groupId ? { gid: groupId } : {}),
    attachment: JSON.stringify({
      media: [{ type: 'text', text }]
    }),
  }
  const sortedKeys = Object.keys(params).sort()
  const sigStr = sortedKeys.map(k => `${k}=${params[k]}`).join('') + appSecret
  const crypto = await import('crypto')
  params.sig = crypto.createHash('md5').update(sigStr).digest('hex')

  const url = `https://api.ok.ru/fb.do?${new URLSearchParams(params)}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error_code) throw new Error(data.error_message ?? 'Ошибка OK API')
}

async function publishFacebook(text: string, pageToken: string, pageId: string, imageUrl?: string): Promise<void> {
  const url = `https://graph.facebook.com/v18.0/${pageId}/feed`
  const body: Record<string, string> = { message: text, access_token: pageToken }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message ?? 'Ошибка Facebook API')
}

async function publishPinterest(text: string, token: string, boardId: string, imageUrl?: string): Promise<void> {
  if (!imageUrl) throw new Error('Pinterest требует изображение для публикации')
  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      board_id: boardId,
      title: text.slice(0, 100),
      description: text,
      media_source: { source_type: 'image_url', url: imageUrl },
    }),
  })
  const data = await res.json()
  if (data.code) throw new Error(data.message ?? 'Ошибка Pinterest API')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { platform, text, imageUrl } = await req.json()
    if (!platform || !text) return NextResponse.json({ error: 'platform и text обязательны' }, { status: 400 })

    // Получаем токены из профиля
    const { data: project } = await supabase
      .from('projects')
      .select('tg_bot_token, tg_channel_id, vk_token, ok_token, ok_app_key, ok_group_id, fb_page_token, fb_page_id, pinterest_token, pinterest_board_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!project) return NextResponse.json({ error: 'Профиль бизнеса не найден' }, { status: 404 })

    switch (platform) {
      case 'telegram':
        if (!project.tg_bot_token || !project.tg_channel_id)
          return NextResponse.json({ error: 'Telegram не подключён. Добавьте токен в Профиле бизнеса.' }, { status: 400 })
        await publishTelegram(text, project.tg_bot_token, project.tg_channel_id)
        break

      case 'vk':
        if (!project.vk_token)
          return NextResponse.json({ error: 'ВКонтакте не подключён. Добавьте токен в Профиле бизнеса.' }, { status: 400 })
        await publishVK(text, project.vk_token, imageUrl)
        break

      case 'ok':
        if (!project.ok_token || !project.ok_app_key)
          return NextResponse.json({ error: 'Одноклассники не подключены. Добавьте токены в Профиле бизнеса.' }, { status: 400 })
        const okSecret = process.env.OK_APP_SECRET ?? ''
        await publishOK(text, project.ok_token, project.ok_app_key, okSecret, project.ok_group_id)
        break

      case 'facebook':
        if (!project.fb_page_token || !project.fb_page_id)
          return NextResponse.json({ error: 'Facebook не подключён. Добавьте токены в Профиле бизнеса.' }, { status: 400 })
        await publishFacebook(text, project.fb_page_token, project.fb_page_id, imageUrl)
        break

      case 'pinterest':
        if (!project.pinterest_token || !project.pinterest_board_id)
          return NextResponse.json({ error: 'Pinterest не подключён. Добавьте токены в Профиле бизнеса.' }, { status: 400 })
        await publishPinterest(text, project.pinterest_token, project.pinterest_board_id, imageUrl)
        break

      default:
        return NextResponse.json({ error: `Платформа ${platform} не поддерживает автопостинг` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Publish error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Ошибка публикации' }, { status: 500 })
  }
}
