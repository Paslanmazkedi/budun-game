import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import QuestList from '@/components/QuestList'
import GameNav from '@/components/GameNav'

export default async function QuestsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { data: quests } = await supabase.from('quests').select('*')
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .single()

  if (!character) return <div className="p-8">Karakter bulunamadı.</div>

  const currentLevel = character.level ?? 1
  const nextLevelXpTarget = currentLevel * 50 * (1 + currentLevel * 0.15)
  const xpPercentage = Math.min(100, Math.floor(((character.xp ?? 0) / nextLevelXpTarget) * 100))

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <GameNav character={character} nextLevelXpTarget={nextLevelXpTarget} xpPercentage={xpPercentage} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl w-full mx-auto space-y-4">
          <div>
            <h3 className="text-xl font-bold text-stone-200 tracking-wide">Bozkır Seferleri</h3>
            <p className="text-sm text-stone-500 mt-0.5">Kutlu görevlere çıkarak şanını yürüt, ganimet topla.</p>
          </div>
          <QuestList quests={quests ?? []} character={character} />
        </main>
      </div>
    </div>
  )
}