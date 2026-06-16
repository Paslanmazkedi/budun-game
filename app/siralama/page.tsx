import SceneShell from '@/components/SceneShell'
import LeaderboardPreview from '@/components/LeaderboardPreview'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function SiralamaPage() {
  return (
    <SceneShell
      preset={SCENE_PRESETS.leaderboard}
      presetKey="siralama"
      title="Kudret Sıralaması"
      subtitle="Oyuncu rekabeti"
      backHref="/dunya"
      backLabel="Dünya"
      mainClassName="max-w-lg"
    >
      <LeaderboardPreview />
    </SceneShell>
  )
}
