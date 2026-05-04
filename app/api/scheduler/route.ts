import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — получить все задачи пользователя
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (from) query = query.gte('scheduled_at', from)
    if (to) query = query.lte('scheduled_at', to)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ posts: data })
  } catch (err) {
    console.error('Scheduler GET error:', err)
    return NextResponse.json({ error: 'Ошибка получения задач' }, { status: 500 })
  }
}

// POST — создать новые задачи
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { topic, details, platforms } = await req.json()
    // platforms: [{ platform: 'telegram', scheduled_at: '2026-05-04T10:00:00Z' }, ...]

    if (!topic?.trim()) return NextResponse.json({ error: 'Тема обязательна' }, { status: 400 })
    if (!platforms?.length) return NextResponse.json({ error: 'Выберите хотя бы одну платформу' }, { status: 400 })

    const rows = platforms.map((p: { platform: string; scheduled_at: string }) => ({
      user_id: user.id,
      topic: topic.trim(),
      details: details?.trim() ?? '',
      platform: p.platform,
      scheduled_at: p.scheduled_at,
      status: 'pending',
    }))

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(rows)
      .select()

    if (error) throw error

    return NextResponse.json({ posts: data })
  } catch (err) {
    console.error('Scheduler POST error:', err)
    return NextResponse.json({ error: 'Ошибка создания задачи' }, { status: 500 })
  }
}

// DELETE — удалить задачу
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Scheduler DELETE error:', err)
    return NextResponse.json({ error: 'Ошибка удаления задачи' }, { status: 500 })
  }
}

// PATCH — обновить задачу
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { id, topic, details, scheduled_at } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID обязателен' }, { status: 400 })

    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({ topic, details, scheduled_at, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('Scheduler PATCH error:', err)
    return NextResponse.json({ error: 'Ошибка обновления задачи' }, { status: 500 })
  }
}
