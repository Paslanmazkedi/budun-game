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
      backHref="/macera"
      backLabel="Aksiyon"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <LeaderboardPreview />
    </SceneShell>
  )
}
