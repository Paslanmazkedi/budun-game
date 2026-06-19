import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import SceneShell from '@/components/SceneShell'
import WorldZoneRoom from '@/components/WorldZoneRoom'
import { getActiveCharacterContext } from '@/lib/character-server'
import { getWorldZone } from '@/lib/world-zones'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function DunyaZonePage({
  params,
}: {
  params: Promise<{ zoneId: string }>
}) {
  const { zoneId: rawZoneId } = await params
  const zoneId = decodeURIComponent(rawZoneId)
  const zone = getWorldZone(zoneId)

  if (!zone) notFound()

  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
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
      presetKey={`world-zone-${zoneId}`}
      title={zone.name}
      subtitle={zone.type === 'dungeon' ? 'Parti odası' : 'Bölge'}
      backHref="/dunya"
      backLabel="Harita"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <WorldZoneRoom zone={zone} characterId={characterId} />
    </SceneShell>
  )
}
