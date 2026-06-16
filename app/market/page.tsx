import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import MarketPanel from '@/components/MarketPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { serializeInventoryItems } from '@/lib/inventory'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function MarketPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.market}
        presetKey="market"
        title="Pazar Yeri"
        subtitle="Alım-satım ve takas"
      >
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.market}
        presetKey="market"
        title="Pazar Yeri"
        subtitle="Alım-satım ve takas"
      >
        <p className="text-stone-500 font-mono text-sm mb-4">Önce bir karakter oluşturmalısın.</p>
        <Link href="/characters" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
          → Karakter seç
        </Link>
      </SceneShell>
    )
  }

  const { data: inventoryItems } = await supabase
    .from('character_items')
    .select('id, equipped_slot, bag_id, quantity, item_templates(*)')
    .eq('character_id', character.id)

  const items = serializeInventoryItems(inventoryItems ?? [])

  return (
    <SceneShell
      preset={SCENE_PRESETS.market}
      presetKey="market"
      title="Pazar Yeri"
      subtitle="İlanlara göz at, eşya sat veya takas için buluş"
      mainClassName="max-w-5xl lg:max-w-none"
      headerExtra={
        <div className="text-xs font-mono text-amber-500 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl" id="market-gold-display">
          🪙 {Number(character.gold).toLocaleString()}
        </div>
      }
    >
      <MarketPanel character={character} initialItems={items} />
    </SceneShell>
  )
}
