import { notFound } from 'next/navigation'
import SceneShell from '@/components/SceneShell'
import WorldZoneRoom from '@/components/WorldZoneRoom'
import { getWorldZone } from '@/lib/world-zones'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function DunyaZonePage({
  params,
}: {
  params: Promise<{ zoneId: string }>
}) {
  const { zoneId } = await params
  const zone = getWorldZone(zoneId)

  if (!zone) notFound()

  return (
    <SceneShell
      preset={SCENE_PRESETS.worldMap}
      presetKey={`world-zone-${zoneId}`}
      title={zone.name}
      subtitle={zone.type === 'dungeon' ? 'Parti odası' : 'Bölge'}
      backHref="/dunya"
      backLabel="Harita"
      mainClassName="max-w-lg"
    >
      <WorldZoneRoom zone={zone} />
    </SceneShell>
  )
}
