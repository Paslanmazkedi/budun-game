export type InventoryItem = {
  id: string
  equipped_slot: string | null
  template: {
    name: string
    rarity: string
    slot: string
  }
}

export function serializeInventoryItems(
  rows: Array<{
    id: string
    equipped_slot?: string | null
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
      template: template ?? { name: 'Bilinmeyen', rarity: 'SIRADAN', slot: 'MISC' },
    }
  })
}
