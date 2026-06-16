import type { ItemRarityId } from '@/lib/item-rarity'
import { ALL_PHASE1_ITEMS } from '@/lib/item-catalog'

/**
 * İçerik kaynağı → hangi nadirlikler düşer
 * - Görev: Yaygın + Normal
 * - Zindan: Nadir
 * - Grup zindan: Nadir + Üstün
 * - Dünya boss (haftalık): Eşsiz
 */
export type ContentLootSource = 'quest' | 'dungeon' | 'group_dungeon' | 'world_boss'

export const LOOT_TABLE_IDS: Record<ContentLootSource, string> = {
  quest: '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
  dungeon: 'b2010001-0001-4000-8000-000000000001',
  group_dungeon: 'b2010002-0001-4000-8000-000000000001',
  world_boss: 'b2010003-0001-4000-8000-000000000001',
}

export const LOOT_TABLE_LABELS: Record<ContentLootSource, string> = {
  quest: 'Görev Ganimeti',
  dungeon: 'Zindan Ganimeti',
  group_dungeon: 'Grup Zindan Ganimeti',
  world_boss: 'Dünya Boss Ganimeti',
}

/** Kaynak bazlı varsayılan eşya düşme şansı (%) */
export const DEFAULT_DROP_RATES: Record<ContentLootSource, number> = {
  quest: 0, // görevde zorluk bazlı — aşağıdaki QUEST_DIFFICULTY
  dungeon: 45,
  group_dungeon: 55,
  world_boss: 100,
}

export const SOURCE_ALLOWED_RARITIES: Record<ContentLootSource, ItemRarityId[]> = {
  quest: ['COMMON', 'NORMAL'],
  dungeon: ['RARE'],
  group_dungeon: ['RARE', 'HIGH'],
  world_boss: ['UNIQUE'],
}

export function getLootTableId(source: ContentLootSource) {
  return LOOT_TABLE_IDS[source]
}

export function getCatalogForSource(source: ContentLootSource) {
  const allowed = SOURCE_ALLOWED_RARITIES[source]
  return ALL_PHASE1_ITEMS.filter((i) => allowed.includes(i.rarity))
}

export function getDefaultDropRate(source: ContentLootSource) {
  return DEFAULT_DROP_RATES[source]
}
