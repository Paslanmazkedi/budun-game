import GamePageShell from '@/components/GamePageShell'
import ComingSoonCard from '@/components/ComingSoonCard'

export default function MarketPage() {
  return (
    <GamePageShell
      title="Pazar Yeri"
      subtitle="Alım-satım ve takas"
    >
      <ComingSoonCard
        icon="⚖️"
        title="Pazar Yakında Açılacak"
        description="Demirci örsünde dövülen donanımları akçe karşılığı sat veya takas et. Tüccarlar yolda."
      />
    </GamePageShell>
  )
}
