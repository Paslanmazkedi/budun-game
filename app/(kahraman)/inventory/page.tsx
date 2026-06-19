import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import InventoryPanel from '@/components/InventoryPanel'
import { serializeInventoryItems } from '@/lib/inventory'
import { getActiveCharacterContext } from '@/lib/character-server'

export default async function InventoryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
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
    .select('id, item_template_id, equipped_slot, bag_id, quantity, item_templates(*)')
    .eq('character_id', character.id)

  const items = serializeInventoryItems(inventoryItems ?? [])

  return <InventoryPanel character={character} initialItems={items} />
}
