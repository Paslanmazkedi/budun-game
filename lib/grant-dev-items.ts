import type { SupabaseClient } from '@supabase/supabase-js'
import { getAllPhase1ItemIds } from '@/lib/item-catalog'

type GrantResult = {
  characterId: string
  granted: number
  error: string | null
}

/** Geliştirme / test — karaktere tüm faz 1 eşyalarını verir */
export async function grantAllPhase1ItemsToCharacter(
  supabase: SupabaseClient,
  characterId: string,
  options?: { clearExisting?: boolean }
): Promise<GrantResult> {
  const clearExisting = options?.clearExisting ?? true
  const templateIds = getAllPhase1ItemIds()

  if (!templateIds.length) {
    return { characterId, granted: 0, error: 'Katalog boş.' }
  }

  if (clearExisting) {
    const { error: deleteError } = await supabase
      .from('character_items')
      .delete()
      .eq('character_id', characterId)

    if (deleteError) {
      return { characterId, granted: 0, error: deleteError.message }
    }
  }

  const rows = templateIds.map((item_template_id) => ({
    character_id: characterId,
    item_template_id,
    bag_id: 'bag1',
  }))

  const { error } = await supabase.from('character_items').insert(rows)
  if (error) {
    return { characterId, granted: 0, error: error.message }
  }

  return { characterId, granted: rows.length, error: null }
}

export async function grantAllPhase1ItemsByCharacterName(
  supabase: SupabaseClient,
  name: string,
  options?: { clearExisting?: boolean }
): Promise<GrantResult> {
  const { data, error } = await supabase
    .from('characters')
    .select('id')
    .eq('name', name)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { characterId: '', granted: 0, error: error.message }
  }

  if (!data?.id) {
    return { characterId: '', granted: 0, error: `Karakter bulunamadı: ${name}` }
  }

  return grantAllPhase1ItemsToCharacter(supabase, data.id, options)
}
