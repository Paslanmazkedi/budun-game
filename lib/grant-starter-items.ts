import type { SupabaseClient } from '@supabase/supabase-js'
import { getStarterItemIds } from '@/lib/item-catalog'

export async function grantStarterItems(supabase: SupabaseClient, characterId: string) {
  const templateIds = getStarterItemIds()
  if (!templateIds.length) return { granted: 0, error: null as string | null }

  const rows = templateIds.map((item_template_id) => ({
    character_id: characterId,
    item_template_id,
    bag_id: 'bag1',
  }))

  const { error } = await supabase.from('character_items').insert(rows)
  if (error) {
    return { granted: 0, error: error.message }
  }

  return { granted: rows.length, error: null }
}
