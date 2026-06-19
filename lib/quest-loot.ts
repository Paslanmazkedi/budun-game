import { ITEM_RARITIES, normalizeRarityId } from '@/lib/item-rarity'
import type { ItemTemplateDef } from '@/lib/item-catalog'

export type LootTableRow = {
  item_template_id: string
  drop_chance?: number | null
  item_templates?: Partial<ItemTemplateDef> | Partial<ItemTemplateDef>[] | null
}

export function pickWeightedLootItem(
  rows: LootTableRow[],
  catalog: ItemTemplateDef[]
): ItemTemplateDef | null {
  if (!rows.length || !catalog.length) return null

  const catalogById = new Map(catalog.map((i) => [i.id, i]))
  const weights = new Map(ITEM_RARITIES.map((r) => [r.id, r.lootWeight]))

  const candidates: Array<{ item: ItemTemplateDef; weight: number }> = []

  for (const row of rows) {
    const raw = Array.isArray(row.item_templates) ? row.item_templates[0] : row.item_templates
    const catalogItem = catalogById.get(row.item_template_id)
    const merged: ItemTemplateDef | undefined =
      catalogItem && raw
        ? { ...catalogItem, ...raw, rarity: normalizeRarityId(raw.rarity ?? catalogItem.rarity) }
        : catalogItem ?? (raw?.id ? catalogById.get(raw.id) : undefined)

    if (!merged) continue

    const rarityWeight = weights.get(merged.rarity) ?? 1
    const rowWeight = row.drop_chance != null && row.drop_chance > 0 ? row.drop_chance : rarityWeight
    candidates.push({ item: merged, weight: rowWeight })
  }

  if (!candidates.length) return null

  const total = candidates.reduce((sum, c) => sum + c.weight, 0)
  let roll = Math.random() * total

  for (const candidate of candidates) {
    roll -= candidate.weight
    if (roll <= 0) return candidate.item
  }

  return candidates[candidates.length - 1].item
}

/** Katalogdan nadirlik ağırlıklı rastgele seçim (test görevi — tüm eşyalar) */
export function pickRandomFromCatalog(catalog: ItemTemplateDef[]): ItemTemplateDef | null {
  if (!catalog.length) return null

  const weights = new Map(ITEM_RARITIES.map((r) => [r.id, r.lootWeight]))
  const candidates = catalog.map((item) => ({
    item,
    weight: weights.get(normalizeRarityId(item.rarity)) ?? 1,
  }))
  const total = candidates.reduce((sum, c) => sum + c.weight, 0)
  let roll = Math.random() * total

  for (const candidate of candidates) {
    roll -= candidate.weight
    if (roll <= 0) return candidate.item
  }

  return candidates[candidates.length - 1]?.item ?? null
}
