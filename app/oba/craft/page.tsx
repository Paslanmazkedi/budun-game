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
        description="Oba örsünde craft, malzeme birleştirme ve ekipman yükseltme burada olacak. Gücünü obadan besle."
      />
    </SceneShell>
  )
}
