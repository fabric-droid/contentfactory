export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export const PLATFORMS = {
  instagram: { name: 'Instagram Post', icon: '📸', type: 'Пост + иллюстрация', ratio: '1:1' },
  reels:     { name: 'Instagram Reels', icon: '🎬', type: 'Сценарий + субтитры', ratio: '9:16' },
  threads:   { name: 'Threads', icon: '🧵', type: 'Короткий пост', ratio: '1:1' },
  vk:        { name: 'ВКонтакте', icon: '🔵', type: 'Пост + иллюстрация', ratio: '1.91:1' },
  telegram:  { name: 'Telegram', icon: '💬', type: 'Пост в канал', ratio: '1.91:1' },
  tiktok:    { name: 'TikTok', icon: '🎵', type: 'Сценарий', ratio: '9:16' },
  site:      { name: 'Сайт (SEO)', icon: '🌐', type: 'SEO-статья', ratio: '16:9' },
  dzen:      { name: 'Яндекс Дзен', icon: '📰', type: 'Статья', ratio: '16:9' },
} as const

export type PlatformKey = keyof typeof PLATFORMS

export const TIERS = {
  start:   { name: '🌱 Старт',    price: 690,  gens: 20,  projects: 1, history: 14 },
  business: { name: '🚀 Бизнес', price: 1990, gens: 100, projects: 3, history: 90 },
  agency:  { name: '🏢 Агентство', price: 4990, gens: 500, projects: 20, history: 0 },
} as const

export type TierKey = keyof typeof TIERS
