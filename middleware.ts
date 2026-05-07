import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Пропускаем cron без проверки авторизации
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/cron/:path*'],
}