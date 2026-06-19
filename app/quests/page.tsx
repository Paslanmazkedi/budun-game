import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import QuestHub from '@/components/QuestHub'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function QuestsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
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
  const { data: questsRaw } = await supabase.from('quests').select('*')

  const quests = [...(questsRaw ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
  )

  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Aksiyon">
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Aksiyon">
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
      backLabel="Aksiyon"
      mainClassName="max-w-5xl lg:max-w-none"
      headerExtra={
        <div className="text-xs font-mono text-amber-500 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
          🪙 {Number(character.gold).toLocaleString()}
        </div>
      }
    >
      <QuestHub quests={quests} character={character} />
    </SceneShell>
  )
}
