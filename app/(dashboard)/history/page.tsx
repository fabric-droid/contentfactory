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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Topbar */}
      <div style={{ padding: '24px 32px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div className="font-heading" style={{ fontSize: 20, fontWeight: 600, color: '#F8F8FC', letterSpacing: -0.5 }}>История</div>
          <div style={{ fontSize: 12, color: '#8B8CA8', marginTop: 5 }}>Генерации хранятся {historyDays} дней на вашем тарифе</div>
        </div>
        <input
          style={{ background: '#21222C', border: '1px solid #323344', borderRadius: 8, padding: '8px 13px', color: '#F8F8FC', fontSize: 13, outline: 'none', width: 220 }}
          type="search"
          placeholder="Поиск..."
        />
      </div>

      <div style={{ padding: '20px 32px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!generations || generations.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#21222C', border: '1px solid #323344', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📋</div>
            <div style={{ fontSize: 14, color: '#C4C5D8', fontWeight: 500 }}>История пуста</div>
            <div style={{ fontSize: 12, color: '#8B8CA8' }}>Создайте первую генерацию в разделе «Генератор»</div>
          </div>
        ) : (
          generations.map(g => {
            const platforms = (g.platforms as string[]) ?? []
            const date = new Date(g.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            return (
              <div key={g.id} className="hist-row" style={{ background: '#181920', border: '1px solid #323344', borderRadius: 2, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all .15s' }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, background: '#21222C', border: '1px solid #323344', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📝</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F8F8FC' }}>{g.topic}</div>
                  <div style={{ fontSize: 11, color: '#8B8CA8', marginTop: 2 }}>{date}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                    {platforms.map(p => {
                      const pl = PLATFORMS[p as PlatformKey]
                      return pl ? (
                        <span key={p} style={{ fontSize: 10, color: '#8B8CA8', background: '#21222C', border: '1px solid #323344', padding: '2px 7px', borderRadius: 20 }}>
                          {pl.icon} {pl.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-heading" style={{ fontSize: 20, fontWeight: 700, color: '#C8F135' }}>{platforms.length}</div>
                  <div style={{ fontSize: 10, color: '#8B8CA8' }}>платформ</div>
                </div>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#21222C', color: '#C4C5D8', border: '1px solid #323344', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all .15s' }}>
                  Открыть
                </button>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        .hist-row:hover { border-color: #42435A !important; background: #21222C !important; }
      `}</style>
    </div>
  )
}
