import { createClient } from '@/lib/supabase/server'
import { PLATFORMS, type PlatformKey } from '@/lib/utils'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('id, topic, platforms, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('user_id', user!.id)
    .single()

  const historyDays = ({ start: 14, business: 90, agency: 999 } as Record<string, number>)[profile?.plan ?? 'start'] ?? 14

  return (
    <div className="flex flex-col flex-1">
      <div className="px-8 pt-6 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-[20px] font-semibold text-snow tracking-tight">История</h1>
          <p className="text-[12px] text-smoke mt-1">Генерации хранятся {historyDays} дней на вашем тарифе</p>
        </div>
        <input
          className="bg-ink3 border border-line rounded-[8px] px-3 py-2 text-snow text-[13px] outline-none placeholder-line2 focus:border-lime transition-colors w-[220px]"
          type="search"
          placeholder="🔍  Поиск..."
        />
      </div>

      <div className="px-8 py-5 flex flex-col gap-2.5">
        {!generations || generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-ink3 border border-line">📋</div>
            <div className="text-[14px] text-mist font-medium">История пуста</div>
            <div className="text-[12px] text-smoke">Создайте первую генерацию в разделе «Генератор»</div>
          </div>
        ) : (
          generations.map((g, i) => {
            const platforms = (g.platforms as string[]) ?? []
            const date = new Date(g.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            return (
              <div
                key={g.id}
                className="flex items-center gap-3.5 rounded-[12px] px-5 py-4 bg-ink2 border border-line cursor-pointer transition-all animate-fade-in hover:border-line2 hover:bg-ink3"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="text-3xl flex-shrink-0">📝</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-snow">{g.topic}</div>
                  <div className="text-[11px] text-smoke mt-0.5">{date}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {platforms.map(p => {
                      const pl = PLATFORMS[p as PlatformKey]
                      return pl ? (
                        <span key={p} className="text-[10px] text-smoke px-1.5 py-0.5 rounded-full bg-ink3 border border-line">
                          {pl.icon} {pl.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-heading text-[20px] font-bold text-lime">{platforms.length}</div>
                  <div className="text-[10px] text-smoke">платформ</div>
                </div>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-mist px-3 py-1.5 rounded-[8px] flex-shrink-0 bg-ink3 border border-line hover:text-snow transition-colors">
                  Открыть
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
