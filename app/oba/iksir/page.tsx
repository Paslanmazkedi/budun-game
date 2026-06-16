import SceneShell from '@/components/SceneShell'
import ComingSoonCard from '@/components/ComingSoonCard'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function ObaIksirPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.obaIksir}
      presetKey="oba-iksir"
      title="İksir Tezgâhı"
      subtitle="İksir ve malzeme hazırlığı"
      backHref="/"
      backLabel="Oba"
    >
      <ComingSoonCard
        icon="🧪"
        title="İksir Tezgâhı"
        description="Savaş öncesi iksirler, buff malzemeleri ve oba kaynakları burada üretilecek."
      />
    </SceneShell>
  )
}
