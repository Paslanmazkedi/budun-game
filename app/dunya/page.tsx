import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import SceneShell from '@/components/SceneShell'
import WorldMap from '@/components/WorldMap'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function DunyaPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  let characterId: string | null = null

  if (user) {
    const { active } = await getActiveCharacterContext(supabase, user.id)
    characterId = active?.id ?? null
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.worldMap}
      presetKey="world-map"
      title="Dünya Haritası"
      subtitle="Yolculuk, parti ve dünya boss"
      backHref="/"
      backLabel="Oba"
      mainClassName="max-w-2xl"
    >
      <WorldMap characterId={characterId} />
    </SceneShell>
  )
}
