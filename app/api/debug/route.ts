import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    openai: process.env.OPENAI_API_KEY ? 'SET (' + process.env.OPENAI_API_KEY.slice(0, 10) + '...)' : 'NOT SET',
    supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    fal: process.env.FAL_KEY ? 'SET' : 'NOT SET',
  })
}
