import type { Metadata } from 'next'
import { Unbounded, Geologica } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  variable: '--font-unbounded',
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
})

const geologica = Geologica({
  variable: '--font-geologica',
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ContentFactory — Контент для бизнеса',
  description: 'Сервис автоматической генерации контента для малого бизнеса',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${geologica.variable}`}>
      <body>{children}</body>
    </html>
  )
}
