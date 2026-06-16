import SceneShell from '@/components/SceneShell'
import ComingSoonCard from '@/components/ComingSoonCard'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function ObaKlanPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.obaKlan}
      presetKey="oba-klan"
      title="Klan"
      subtitle="Boy, totem ve oba ittifakı"
      backHref="/"
      backLabel="Oba"
    >
      <ComingSoonCard
        icon="🏛️"
        title="Klan Meydanı"
        description="Boy seçimi, klan görevleri ve totem bonusları burada açılacak."
      />
    </SceneShell>
  )
}
