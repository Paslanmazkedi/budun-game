import { ALL_EQUIP_SLOTS } from '@/lib/inventory-slots'

export type MarketCategory = 'all' | 'weapon' | 'armor' | 'accessory'

export type MarketMode = 'buy' | 'sell'

export type MarketListing = {
  id: string
  sellerName: string
  itemName: string
  slot: string
  rarity: string
  price: number
  listedAt: string
  /** Opsiyonel kısa açıklama / bonus */
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

/** Oyuncu ilanları — backend bağlanana kadar örnek veri */
export const MOCK_MARKET_LISTINGS: MarketListing[] = [
  {
    id: 'm1',
    sellerName: 'Börü Khan',
    itemName: 'Kılkılıç Pusat',
    slot: 'WEAPON',
    rarity: 'RARE',
    price: 450,
    listedAt: '2 sa önce',
    note: 'Güç +8',
  },
  {
    id: 'm2',
    sellerName: 'Altın Ordu',
    itemName: 'Yaycı Hançeri',
    slot: 'WEAPON',
    rarity: 'NORMAL',
    price: 120,
    listedAt: '5 sa önce',
  },
  {
    id: 'm3',
    sellerName: 'Kökten',
    itemName: 'Kurt Dişi Balta',
    slot: 'WEAPON',
    rarity: 'UNIQUE',
    price: 2400,
    listedAt: '1 gün önce',
    note: 'Güç +15',
  },
  {
    id: 'm4',
    sellerName: 'Tengri\'nin Eli',
    itemName: 'Demir Kalkan',
    slot: 'OFFHAND',
    rarity: 'NORMAL',
    price: 95,
    listedAt: '3 sa önce',
  },
  {
    id: 'm5',
    sellerName: 'Sarıkız',
    itemName: 'Yırtıcı Miğferi',
    slot: 'HELMET',
    rarity: 'RARE',
    price: 380,
    listedAt: '8 sa önce',
    note: 'Zırh +12',
  },
  {
    id: 'm6',
    sellerName: 'Oğuz Beyi',
    itemName: 'Demir Zırh',
    slot: 'ARMOR',
    rarity: 'NORMAL',
    price: 210,
    listedAt: '12 sa önce',
  },
  {
    id: 'm7',
    sellerName: 'Kökten',
    itemName: 'Savaşçı Çizmesi',
    slot: 'BOOTS',
    rarity: 'RARE',
    price: 290,
    listedAt: '1 gün önce',
  },
  {
    id: 'm8',
    sellerName: 'Altın Ordu',
    itemName: 'Kurt Muska',
    slot: 'AMULET',
    rarity: 'RARE',
    price: 520,
    listedAt: '4 sa önce',
    note: 'Can +40',
  },
  {
    id: 'm9',
    sellerName: 'Börü Khan',
    itemName: 'Ay Yüzüğü',
    slot: 'RING',
    rarity: 'UNIQUE',
    price: 1800,
    listedAt: '2 gün önce',
    note: 'Güç +15',
  },
  {
    id: 'm10',
    sellerName: 'Sarıkız',
    itemName: 'Bronz Yüzük',
    slot: 'RING',
    rarity: 'NORMAL',
    price: 65,
    listedAt: '6 sa önce',
  },
  {
    id: 'm11',
    sellerName: 'Oğuz Beyi',
    itemName: 'Savaş Bilekliği',
    slot: 'BRACELET',
    rarity: 'RARE',
    price: 340,
    listedAt: '1 gün önce',
  },
  {
    id: 'm12',
    sellerName: 'Tengri\'nin Eli',
    itemName: 'Demir Kemer',
    slot: 'BELT',
    rarity: 'NORMAL',
    price: 80,
    listedAt: '9 sa önce',
  },
  {
    id: 'm13',
    sellerName: 'Kökten',
    itemName: 'Ok Yığını',
    slot: 'MISC',
    rarity: 'NORMAL',
    price: 25,
    listedAt: '1 sa önce',
    note: '50 ok',
  },
  {
    id: 'm14',
    sellerName: 'Altın Ordu',
    itemName: 'İksir Kutusu',
    slot: 'MISC',
    rarity: 'NORMAL',
    price: 40,
    listedAt: '3 sa önce',
  },
]

export const MARKET_CATEGORIES: Array<{ id: MarketCategory; label: string; icon: string }> = [
  { id: 'all', label: 'Tümü', icon: '📋' },
  { id: 'weapon', label: 'Silah', icon: '🗡️' },
  { id: 'armor', label: 'Zırh', icon: '🛡️' },
  { id: 'accessory', label: 'Takı', icon: '💍' },
]
