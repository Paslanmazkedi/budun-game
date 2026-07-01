import type { SupabaseClient } from '@supabase/supabase-js'
import { getPhase1ItemById } from '@/lib/item-catalog'
import type { InventoryItem } from '@/lib/inventory'
import { normalizeEquippedSlotId } from '@/lib/inventory-slots'

export const MOUNT_EQUIP_SLOTS = ['mount', 'binek'] as const
export const EQUIPMENT_CHANGED_EVENT = 'budun:equipment-changed'

export function isMountEquipSlot(slot: string | null | undefined) {
  if (!slot) return false
  const normalized = normalizeEquippedSlotId(slot)
  return normalized === 'mount' || normalized === 'binek'
}

export function getEquippedMountSlug(items: InventoryItem[]): string | null {
  const mount = items.find((item) => isMountEquipSlot(item.equipped_slot))
  return mount?.template.slug ?? null
}

function slugFromMountRow(row: {
  item_template_id?: string | null
  item_templates: { slug?: string | null } | { slug?: string | null }[] | null
}): string | null {
  const tpl = row.item_templates
  const joined = Array.isArray(tpl) ? tpl[0] : tpl
  if (joined?.slug) return joined.slug
  if (row.item_template_id) {
    return getPhase1ItemById(row.item_template_id)?.slug ?? null
  }
  return null
}

export async function fetchEquippedMountSlug(
  supabase: SupabaseClient,
  characterId: string
): Promise<string | null> {
  const { data: mountRow } = await supabase
    .from('character_items')
    .select('item_template_id, item_templates(slug)')
    .eq('character_id', characterId)
    .in('equipped_slot', [...MOUNT_EQUIP_SLOTS])
    .limit(1)
    .maybeSingle()

  if (!mountRow) return null
  return slugFromMountRow(mountRow)
}

export function notifyEquipmentChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EQUIPMENT_CHANGED_EVENT))
}
