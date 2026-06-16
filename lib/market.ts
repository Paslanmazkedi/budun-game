import { ALL_EQUIP_SLOTS } from '@/lib/inventory-slots'

export type MarketCategory = 'all' | 'weapon' | 'armor' | 'accessory'

export type MarketMode = 'buy' | 'sell'

export type MarketListingStatus = 'active' | 'sold' | 'expired' | 'cancelled'

export type MarketListing = {
  id: string
  characterItemId: string
  sellerCharacterId: string
  sellerName: string
  itemName: string
  slot: string
  rarity: string
  emoji?: string | null
  slug?: string | null
  price: number
  /** ISO timestamp — UI için formatMarketListedAt kullan */
  createdAt: string
  expiresAt: string
  /** Geriye uyumluluk — createdAt ile aynı */
  listedAt: string
  status: MarketListingStatus
  note?: string
}

function normalizeSlot(value: string) {
  return value?.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ü/g, 'U').replace(/Ö/g, 'O')
}

export function getMarketCategory(slot: string): MarketCategory {
  const s = normalizeSlot(slot)
  if (['WEAPON', 'PUSAT', 'SWORD'].some((t) => s.includes(t))) return 'weapon'
  if (
    ['HELMET', 'MIGFER', 'HEAD', 'ARMOR', 'ZIRH', 'CHEST', 'BOOTS', 'CIZME', 'FEET', 'SHIELD', 'OFFHAND', 'YAN_EL'].some(
      (t) => s.includes(t)
    )
  ) {
    return 'armor'
  }
  if (
    ['AMULET', 'MUSKA', 'RING', 'YUZUK', 'BRACELET', 'BILEKLIK', 'BELT', 'KEMER'].some((t) => s.includes(t))
  ) {
    return 'accessory'
  }
  return 'all'
}

export function listingMatchesCategory(slot: string, category: MarketCategory) {
  if (category === 'all') return true
  return getMarketCategory(slot) === category
}

export function getSlotLabel(slot: string) {
  const normalized = normalizeSlot(slot)
  const def = ALL_EQUIP_SLOTS.find((s) =>
    s.slotTypes.some((t) => normalized === t || normalized.includes(t))
  )
  return def?.label ?? slot
}

export const MARKET_CATEGORIES: Array<{ id: MarketCategory; label: string; icon: string }> = [
  { id: 'all', label: 'Tümü', icon: '📋' },
  { id: 'weapon', label: 'Silah', icon: '🗡️' },
  { id: 'armor', label: 'Zırh', icon: '🛡️' },
  { id: 'accessory', label: 'Takı', icon: '💍' },
]
