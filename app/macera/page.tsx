import SceneShell from '@/components/SceneShell'
import MaceraHubClient from '@/components/MaceraHubClient'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function MaceraPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraHub}
      presetKey="macera-hub"
      immersive
      showCharacterSwitcher={false}
    >
      <MaceraHubClient />
    </SceneShell>
  )
}
