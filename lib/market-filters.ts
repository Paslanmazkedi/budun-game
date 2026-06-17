import type { ItemRarityId } from '@/lib/item-rarity'
import { normalizeRarityId } from '@/lib/item-rarity'
import { getMarketCategory, type MarketCategory } from '@/lib/market'

export type MarketSubtypeId = string

export type MarketRarityFilter = 'all' | ItemRarityId

/** Çoklu seçimde kullanılan türler (all hariç) */
export type SelectableMarketCategory = Exclude<MarketCategory, 'all'>

export type MarketFilterState = {
  weapon: MarketSubtypeId[] | null
  armor: MarketSubtypeId[] | null
  accessory: MarketSubtypeId[] | null
  rarities: ItemRarityId[]
}

export const SELECTABLE_MARKET_CATEGORIES: SelectableMarketCategory[] = ['weapon', 'armor', 'accessory']

export const MARKET_RARITY_FILTERS: Array<{ id: MarketRarityFilter; label: string }> = [
  { id: 'all', label: 'Tüm nadirlik' },
  { id: 'COMMON', label: 'Yaygın' },
  { id: 'NORMAL', label: 'Normal' },
  { id: 'RARE', label: 'Nadir' },
  { id: 'HIGH', label: 'Üstün' },
  { id: 'UNIQUE', label: 'Eşsiz' },
]

export const SELECTABLE_MARKET_RARITIES: ItemRarityId[] = ['COMMON', 'NORMAL', 'RARE', 'HIGH', 'UNIQUE']

export const MARKET_SUBTYPES: Record<
  Exclude<MarketCategory, 'all'>,
  Array<{ id: MarketSubtypeId; label: string; emoji: string }>
> = {
  weapon: [
    { id: 'kilic', label: 'Kılıç', emoji: '🗡️' },
    { id: 'yay', label: 'Yay', emoji: '🏹' },
    { id: 'asa', label: 'Asa', emoji: '🦯' },
    { id: 'bicak', label: 'Bıçak', emoji: '🔪' },
    { id: 'balta', label: 'Balta', emoji: '🪓' },
    { id: 'kalkan', label: 'Kalkan', emoji: '🛡️' },
  ],
  armor: [
    { id: 'migfer', label: 'Miğfer', emoji: '🧢' },
    { id: 'zirh', label: 'Zırh', emoji: '🦺' },
    { id: 'cizme', label: 'Çizme', emoji: '🥾' },
    { id: 'eldiven', label: 'Eldiven', emoji: '🧤' },
  ],
  accessory: [
    { id: 'yuzuk', label: 'Yüzük', emoji: '💍' },
    { id: 'kemer', label: 'Kemer', emoji: '🎗️' },
    { id: 'kolye', label: 'Kolye', emoji: '📿' },
    { id: 'kupe', label: 'Küpe', emoji: '💎' },
  ],
}

export function getSlugFamily(slug?: string | null) {
  if (!slug) return null
  return slug.replace(/-(common|normal|rare|high|unique)$/, '')
}

export function itemMatchesSubtype(slug?: string | null, subtype: MarketSubtypeId = 'all') {
  if (subtype === 'all') return true
  const family = getSlugFamily(slug)
  if (family === subtype) return true
  return slug?.startsWith(`${subtype}-`) ?? false
}

export function itemMatchesRarity(rarity: string, filter: MarketRarityFilter) {
  if (filter === 'all') return true
  return normalizeRarityId(rarity) === filter
}

export function itemMatchesRarities(rarity: string, rarities: ItemRarityId[]) {
  if (rarities.length === 0) return true
  return rarities.includes(normalizeRarityId(rarity))
}

export function itemMatchesCategorySubtypeFilter(
  slot: string,
  category: SelectableMarketCategory,
  subtypes: MarketSubtypeId[] | null,
  slug?: string | null
) {
  if (subtypes === null) return false
  const itemCat = getMarketCategory(slot)
  if (itemCat !== category) return false
  if (subtypes.length === 0) return true
  return subtypes.some((st) => itemMatchesSubtype(slug, st))
}

export function matchesMarketFilters(
  slot: string,
  rarity: string,
  filters: MarketFilterState,
  slug?: string | null
) {
  const activeCategoryFilters = [
    { category: 'weapon' as const, subtypes: filters.weapon },
    { category: 'armor' as const, subtypes: filters.armor },
    { category: 'accessory' as const, subtypes: filters.accessory },
  ].filter((f) => f.subtypes !== null)

  if (activeCategoryFilters.length > 0) {
    const matchesCategory = activeCategoryFilters.some((f) =>
      itemMatchesCategorySubtypeFilter(slot, f.category, f.subtypes, slug)
    )
    if (!matchesCategory) return false
  }

  if (!itemMatchesRarities(rarity, filters.rarities)) return false
  return true
}

export function defaultSubtypeForCategory(category: MarketCategory): MarketSubtypeId {
  return 'all'
}
