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

      <div className="px-8 pt-6 pb-0 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-heading text-[20px] font-semibold tracking-tight" style={{ color: '#F8F8FC' }}>История</h1>
          <p className="text-[12px] mt-1.5" style={{ color: '#8B8CA8' }}>Генерации хранятся {historyDays} дней на вашем тарифе</p>
        </div>
        <input
          className="px-3 py-2 text-[13px] rounded-[8px] outline-none transition-colors w-[220px] focus:border-[#C8F135]"
          style={{ background: '#21222C', border: '1px solid #323344', color: '#F8F8FC' }}
          type="search"
          placeholder="🔍  Поиск..."
        />
      </div>

      <div className="px-8 py-5 flex flex-col gap-2.5">
        {!generations || generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{ background: '#21222C', border: '1px solid #323344' }}>📋</div>
            <div className="text-[14px] font-medium" style={{ color: '#C4C5D8' }}>История пуста</div>
            <div className="text-[12px]" style={{ color: '#8B8CA8' }}>Создайте первую генерацию в разделе «Генератор»</div>
          </div>
        ) : (
          generations.map((g, i) => {
            const platforms = (g.platforms as string[]) ?? []
            const date = new Date(g.created_at).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })
            return (
              <div key={g.id}
                className="flex items-center gap-4 rounded-[12px] px-5 py-4 cursor-pointer transition-all hover:border-[#42435A] hover:bg-[#21222C]"
                style={{ background: '#181920', border: '1px solid #323344', animationDelay: `${i * 0.06}s` }}
              >
                <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#21222C', border: '1px solid #323344' }}>📝</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold" style={{ color: '#F8F8FC' }}>{g.topic}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#8B8CA8' }}>{date}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {platforms.map(p => {
                      const pl = PLATFORMS[p as PlatformKey]
                      return pl ? (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: '#8B8CA8', background: '#21222C', border: '1px solid #323344' }}>
                          {pl.icon} {pl.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 mr-2">
                  <div className="font-heading text-[20px] font-bold" style={{ color: '#C8F135' }}>{platforms.length}</div>
                  <div className="text-[10px]" style={{ color: '#8B8CA8' }}>платформ</div>
                </div>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0 hover:opacity-80 transition-opacity"
                  style={{ background: '#21222C', border: '1px solid #323344', color: '#C4C5D8' }}>
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
