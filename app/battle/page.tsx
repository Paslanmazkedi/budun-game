import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import SceneShell from '@/components/SceneShell'
import ComingSoonCard from '@/components/ComingSoonCard'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function BattlePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { active: character } = user
    ? await getActiveCharacterContext(supabase, user.id)
    : { active: null }

  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraBattle}
      presetKey="macera-battle"
      title="Düello Alanı"
      subtitle="Oyuncularla cenk ve kapışma"
      backHref="/macera"
      backLabel="Aksiyon"
      headerExtra={
        character ? (
          <span className="text-xs font-mono text-stone-500 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
            {character.name} · Lv.{character.level}
          </span>
        ) : null
      }
    >
      <ComingSoonCard
        icon="⚔️"
        title="Düello Alanı Yakında"
        description="Diğer oyuncularla cenk, düello sıralaması ve boy savaşları bu alanda açılacak."
      />
    </SceneShell>
  )
}
