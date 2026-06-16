export type InventoryItem = {
  id: string
  equipped_slot: string | null
  bag_id?: string | null
  template: {
    name: string
    rarity: string
    slot: string
    emoji?: string | null
    icon?: string | null
    slug?: string | null
  }
}

export function serializeInventoryItems(
  rows: Array<{
    id: string
    equipped_slot?: string | null
    bag_id?: string | null
    item_templates: InventoryItem['template'] | InventoryItem['template'][] | null
  }>
): InventoryItem[] {
  return rows.map((row) => {
    const template = Array.isArray(row.item_templates)
      ? row.item_templates[0]
      : row.item_templates
    return {
      id: row.id,
      equipped_slot: row.equipped_slot ?? null,
      bag_id: row.bag_id ?? null,
      template: template ?? { name: 'Bilinmeyen', rarity: 'COMMON', slot: 'MISC' },
    }
  })
}
