import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL обязателен' }, { status: 400 })

    const response = await fetch(url)
    if (!response.ok) return NextResponse.json({ error: 'Ошибка загрузки изображения' }, { status: 400 })

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Proxy image error:', err)
    return NextResponse.json({ error: 'Ошибка проксирования изображения' }, { status: 500 })
  }
}
