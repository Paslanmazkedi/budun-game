import SceneShell from '@/components/SceneShell'
import FarmZonesClient from '@/components/FarmZonesClient'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function MaceraFarmPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraHub}
      presetKey="macera-farm"
      title="Farm Alanları"
      subtitle="Slot mantığı — 3 / 4 / 8 kişilik seferler"
      backHref="/macera"
      backLabel="Aksiyon"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <FarmZonesClient />
    </SceneShell>
  )
}
