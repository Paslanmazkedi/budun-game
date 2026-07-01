import type { SupabaseClient } from '@supabase/supabase-js'

export async function expandInventoryDisplaySlots(
  supabase: SupabaseClient,
  characterId: string,
  newDisplaySlots: number
): Promise<{ inventory_display_slots: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('expand_inventory_display', {
    p_character_id: characterId,
    p_display_slots: newDisplaySlots,
  })

  if (error) {
    return { inventory_display_slots: null, error: error.message }
  }

  const row = data as { inventory_display_slots?: number } | null
  return {
    inventory_display_slots: row?.inventory_display_slots ?? newDisplaySlots,
    error: null,
  }
}
