export type InventoryItem = {
  id: string
  item_template_id?: string
  equipped_slot: string | null
  bag_id?: string | null
  quantity?: number
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
    item_template_id?: string
    equipped_slot?: string | null
    bag_id?: string | null
    quantity?: number | null
    item_templates: InventoryItem['template'] | InventoryItem['template'][] | null
  }>
): InventoryItem[] {
  return rows.map((row) => {
    const template = Array.isArray(row.item_templates)
      ? row.item_templates[0]
      : row.item_templates
    return {
      id: row.id,
      item_template_id: row.item_template_id,
      equipped_slot: row.equipped_slot ?? null,
      bag_id: row.bag_id ?? null,
      quantity: row.quantity ?? 1,
      template: template ?? { name: 'Bilinmeyen', rarity: 'COMMON', slot: 'MISC' },
    }
  })
}
