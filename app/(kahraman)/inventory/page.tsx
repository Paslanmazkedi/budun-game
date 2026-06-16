import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import InventoryPanel from '@/components/InventoryPanel'
import { serializeInventoryItems } from '@/lib/inventory'
import { getActiveCharacterContext } from '@/lib/character-server'
import { BAG_SLOT_COUNT } from '@/lib/inventory-slots'

export default async function InventoryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <div>
        <p className="text-stone-500 font-mono text-sm mb-4">Önce bir karakter oluşturmalısın.</p>
        <Link href="/characters" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
          → Karakter seç
        </Link>
      </div>
    )
  }

  const { data: inventoryItems } = await supabase
    .from('character_items')
    .select('id, equipped_slot, item_templates(*)')
    .eq('character_id', character.id)

  const items = serializeInventoryItems(inventoryItems ?? [])
  const bagCount = items.filter((i) => !i.equipped_slot).length

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="text-amber-500 font-bold">{bagCount}/{BAG_SLOT_COUNT}</span>
          <span className="text-stone-600">heybe</span>
        </div>
      </div>
      <InventoryPanel character={character} initialItems={items} />
    </div>
  )
}
