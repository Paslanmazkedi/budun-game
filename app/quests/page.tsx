import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import QuestList from '@/components/QuestList'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function QuestsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: quests } = await supabase.from('quests').select('*')

  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Macera">
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Macera">
        <p className="text-stone-500 font-mono text-sm mb-4">Önce bir karakter oluşturmalısın.</p>
        <Link href="/characters" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
          → Karakter seç
        </Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraQuests}
      presetKey="macera-quests"
      title="Bozkır Seferleri"
      subtitle="Görev seç, sefere gönder, ödül topla"
      backHref="/macera"
      backLabel="Macera"
      mainClassName="max-w-5xl"
      headerExtra={
        <div className="text-xs font-mono text-amber-500 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
          🪙 {Number(character.gold).toLocaleString()}
        </div>
      }
    >
      <QuestList quests={quests ?? []} character={character} />
    </SceneShell>
  )
}
