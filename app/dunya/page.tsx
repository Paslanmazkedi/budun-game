import SceneShell from '@/components/SceneShell'
import WorldMap from '@/components/WorldMap'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function DunyaPage() {
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
      <WorldMap />
    </SceneShell>
  )
}
