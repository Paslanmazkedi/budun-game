import type { InventoryItem } from '@/lib/inventory'

export function getEquippedMountSlug(items: InventoryItem[]): string | null {
  const mount = items.find((item) => item.equipped_slot === 'mount')
  return mount?.template.slug ?? null
}
