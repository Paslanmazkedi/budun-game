import type { ItemRarityId } from '@/lib/item-rarity'

export type ItemTemplateDef = {
  id: string
  slug: string
  name: string
  emoji: string
  slot: string
  rarity: ItemRarityId
}

const TIER_LABELS: Record<ItemRarityId, string> = {
  COMMON: 'Yaygın',
  NORMAL: 'Normal',
  RARE: 'Nadir',
  HIGH: 'Üstün',
  UNIQUE: 'Eşsiz',
}

const TIER_SUFFIX: Record<ItemRarityId, string> = {
  COMMON: 'common',
  NORMAL: 'normal',
  RARE: 'rare',
  HIGH: 'high',
  UNIQUE: 'unique',
}

const TIER_ORDER: ItemRarityId[] = ['COMMON', 'NORMAL', 'RARE', 'HIGH', 'UNIQUE']

function item(
  id: string,
  slug: string,
  name: string,
  emoji: string,
  slot: string,
  rarity: ItemRarityId
): ItemTemplateDef {
  return { id, slug, name, emoji, slot, rarity }
}

/** Orta çağ seti — 5 nadirlik × 15 kategori (75 eşya) */
function tierSet(
  groupCode: string,
  slugBase: string,
  nameBase: string,
  emoji: string,
  slot: string
): ItemTemplateDef[] {
  return TIER_ORDER.map((rarity, index) => {
    const seq = String(index + 1).padStart(12, '0')
    return item(
      `a102${groupCode}-0001-4000-8000-${seq}`,
      `${slugBase}-${TIER_SUFFIX[rarity]}`,
      `${TIER_LABELS[rarity]} ${nameBase}`,
      emoji,
      slot,
      rarity
    )
  })
}

/** Silahlar */
const SWORDS = tierSet('0101', 'kilic', 'Kılıç', '🗡️', 'WEAPON')
const BOWS = tierSet('0102', 'yay', 'Yay', '🏹', 'WEAPON')
const SHIELDS = tierSet('0103', 'kalkan', 'Kalkan', '🛡️', 'OFFHAND')
const STAVES = tierSet('0104', 'asa', 'Asa', '🦯', 'WEAPON')
const KNIVES = tierSet('0105', 'bicak', 'Bıçak', '🔪', 'WEAPON')
const AXES = tierSet('0106', 'balta', 'Balta', '🪓', 'WEAPON')

/** Zırh */
const HELMETS = [
  item('a1020201-0001-4000-8000-000000000001', 'migfer-common', 'Yaygın Deri Başlık', '🧢', 'HELMET', 'COMMON'),
  item('a1020201-0001-4000-8000-000000000002', 'migfer-normal', 'Normal Baş Örtüsü', '🧣', 'HELMET', 'NORMAL'),
  item('a1020201-0001-4000-8000-000000000003', 'migfer-rare', 'Nadir Bozkır Başlığı', '🪶', 'HELMET', 'RARE'),
  item('a1020201-0001-4000-8000-000000000004', 'migfer-high', 'Üstün Şaman Tacı', '👑', 'HELMET', 'HIGH'),
  item('a1020201-0001-4000-8000-000000000005', 'migfer-unique', 'Eşsiz Ay Tacı', '🌙', 'HELMET', 'UNIQUE'),
]

const ARMORS = tierSet('0301', 'zirh', 'Zırh', '🦺', 'ARMOR')
const BOOTS = tierSet('0401', 'cizme', 'Çizme', '🥾', 'BOOTS')
const GLOVES = tierSet('0501', 'eldiven', 'Eldiven', '🧤', 'GLOVES')

/** Binek — Bozkır Atı, Ahal Teke, Tulpar */
const MOUNTS = [
  item('a1011001-0001-4000-8000-000000000002', 'mount-bozkir-at', 'Bozkır Atı', '🐎', 'MOUNT', 'NORMAL'),
  item('a1011001-0001-4000-8000-000000000003', 'mount-ahal-teke', 'Ahal Teke', '🐎', 'MOUNT', 'RARE'),
  item('a1011001-0001-4000-8000-000000000005', 'mount-tulpar', 'Tulpar', '🦄', 'MOUNT', 'UNIQUE'),
]

/** Takı */
const RINGS = tierSet('0701', 'yuzuk', 'Yüzük', '💍', 'RING')
const BELTS = tierSet('0801', 'kemer', 'Kemer', '🎗️', 'BELT')
const NECKLACES = tierSet('0901', 'kolye', 'Kolye', '📿', 'AMULET')
const EARRINGS = tierSet('1001', 'kupe', 'Küpe', '💎', 'EARRING')

export const PHASE1_ITEM_GROUPS = {
  swords: SWORDS,
  bows: BOWS,
  shields: SHIELDS,
  staves: STAVES,
  knives: KNIVES,
  axes: AXES,
  helmets: HELMETS,
  armors: ARMORS,
  boots: BOOTS,
  gloves: GLOVES,
  mounts: MOUNTS,
  rings: RINGS,
  belts: BELTS,
  necklaces: NECKLACES,
  earrings: EARRINGS,
}

export const ALL_PHASE1_ITEMS: ItemTemplateDef[] = [
  ...SWORDS,
  ...BOWS,
  ...SHIELDS,
  ...STAVES,
  ...KNIVES,
  ...AXES,
  ...HELMETS,
  ...ARMORS,
  ...BOOTS,
  ...GLOVES,
  ...MOUNTS,
  ...RINGS,
  ...BELTS,
  ...NECKLACES,
  ...EARRINGS,
]

const BY_ID = new Map(ALL_PHASE1_ITEMS.map((i) => [i.id, i]))
const BY_SLUG = new Map(ALL_PHASE1_ITEMS.map((i) => [i.slug, i]))
const BY_NAME = new Map(ALL_PHASE1_ITEMS.map((i) => [i.name.toLowerCase(), i]))

/** Görev loot tablosu — lib/content-loot.ts ile aynı UUID */
export const DEFAULT_LOOT_TABLE_ID = '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea'

export function getPhase1ItemsByRarities(rarities: ItemRarityId[]) {
  const set = new Set(rarities)
  return ALL_PHASE1_ITEMS.filter((i) => set.has(i.rarity))
}

/** Yeni karaktere verilen başlangıç seti */
export const STARTER_ITEM_SLUGS = [
  'kilic-common',
  'zirh-common',
  'migfer-common',
  'cizme-common',
  'mount-bozkir-at',
] as const

export function getPhase1ItemById(id: string) {
  return BY_ID.get(id)
}

export function getPhase1ItemBySlug(slug: string) {
  return BY_SLUG.get(slug)
}

export function findPhase1Item(key: string) {
  return BY_SLUG.get(key) ?? BY_NAME.get(key.toLowerCase()) ?? BY_ID.get(key)
}

export function getStarterItemIds() {
  return STARTER_ITEM_SLUGS.map((slug) => BY_SLUG.get(slug)?.id).filter(Boolean) as string[]
}

export function getAllPhase1ItemIds() {
  return ALL_PHASE1_ITEMS.map((i) => i.id)
}
