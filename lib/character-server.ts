import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVE_CHARACTER_COOKIE,
  type GameCharacter,
  resolveActiveCharacter,
} from '@/lib/characters'
import { aggregateEquipmentBonuses, type EquipmentBonuses } from '@/lib/equipment-stats'
import { serializeInventoryItems } from '@/lib/inventory'

export async function fetchUserCharacters(
  supabase: SupabaseClient,
  userId: string
): Promise<GameCharacter[]> {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return (data ?? []) as GameCharacter[]
}

export async function getActiveCharacterContext(
  supabase: SupabaseClient,
  userId: string
) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTIVE_CHARACTER_COOKIE)?.value
  const preferredId = raw ? decodeURIComponent(raw) : undefined
  const characters = await fetchUserCharacters(supabase, userId)
  const active = resolveActiveCharacter(characters, preferredId)
  return { characters, active }
}

export async function fetchCharacterEquipmentBonuses(
  supabase: SupabaseClient,
  characterId: string
): Promise<EquipmentBonuses> {
  const { data } = await supabase
    .from('character_items')
    .select('id, equipped_slot, item_templates(name, rarity, slot, slug)')
    .eq('character_id', characterId)
    .not('equipped_slot', 'is', null)

  const items = serializeInventoryItems(data ?? [])
  return aggregateEquipmentBonuses(items)
}
