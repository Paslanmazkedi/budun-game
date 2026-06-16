import SceneShell from '@/components/SceneShell'
import CharacterSwitcher from '@/components/CharacterSwitcher'
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
      <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 pointer-events-auto">
        <CharacterSwitcher compact />
      </div>
      <MaceraHubClient />
    </SceneShell>
  )
}
