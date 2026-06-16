import SceneShell from '@/components/SceneShell'
import ComingSoonCard from '@/components/ComingSoonCard'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function ObaCraftPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.obaCraft}
      presetKey="oba-craft"
      title="Demirci"
      subtitle="Örs ile zırh ve silah üretimi"
      backHref="/"
      backLabel="Oba"
    >
      <ComingSoonCard
        icon="🔨"
        title="Demirci Atölyesi"
        description="Pazarda parçaladığın Bozkır Parçaları ve görevlerden gelen malzemelerle burada craft yapılacak. Nadir eşya için malzeme + görev ödülü birleştirilecek."
      />
    </SceneShell>
  )
}
