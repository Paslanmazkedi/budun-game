export type EquipSlotDef = {
  id: string
  label: string
  icon: string
  slotTypes: string[]
  side: 'left' | 'right' | 'cosmetic'
}

export const ARMOR_SET_SLOT_ID = 'armor_set'

export const LEGACY_ARMOR_SLOT_IDS = ['helmet', 'armor', 'gloves', 'boots'] as const

const ARMOR_SET_ITEM_TYPES = [
  'ARMOR_SET',
  'ARMOR',
  'ZIRH',
  'CHEST',
  'HELMET',
  'MIGFER',
  'HEAD',
  'GLOVES',
  'ELDIVEN',
  'BOOTS',
  'CIZME',
  'FEET',
] as const

export const LEFT_EQUIP_SLOTS: EquipSlotDef[] = [
  {
    id: 'weapon',
    label: 'PUSAT',
    icon: '🗡️',
    slotTypes: ['WEAPON', 'PUSAT', 'SWORD', 'BOW', 'YAY', 'STAFF', 'ASA', 'AXE', 'DAGGER'],
    side: 'left',
  },
  {
    id: ARMOR_SET_SLOT_ID,
    label: 'ZIRH SETİ',
    icon: '🦺',
    slotTypes: [...ARMOR_SET_ITEM_TYPES],
    side: 'left',
  },
  {
    id: 'offhand',
    label: 'KALKAN',
    icon: '🛡️',
    slotTypes: ['OFFHAND', 'SHIELD', 'YAN_EL'],
    side: 'left',
  },
]

export const RIGHT_EQUIP_SLOTS: EquipSlotDef[] = [
  { id: 'amulet', label: 'KOLYE', icon: '📿', slotTypes: ['AMULET', 'MUSKA'], side: 'right' },
  { id: 'earring1', label: 'KÜPE I', icon: '💎', slotTypes: ['EARRING', 'KUPE'], side: 'right' },
  { id: 'earring2', label: 'KÜPE II', icon: '💎', slotTypes: ['EARRING', 'KUPE'], side: 'right' },
  { id: 'ring1', label: 'YÜZÜK I', icon: '💍', slotTypes: ['RING', 'YUZUK'], side: 'right' },
  { id: 'ring2', label: 'YÜZÜK II', icon: '💍', slotTypes: ['RING', 'YUZUK'], side: 'right' },
  { id: 'belt', label: 'KEMER', icon: '🎗️', slotTypes: ['BELT', 'KEMER'], side: 'right' },
]

export const COSMETIC_SLOTS: EquipSlotDef[] = [
  { id: 'mount', label: 'BİNEK', icon: '🐎', slotTypes: ['MOUNT', 'BINEK'], side: 'cosmetic' },
  { id: 'cloak', label: 'PELERİN', icon: '🧣', slotTypes: ['CLOAK', 'PELERIN'], side: 'cosmetic' },
  { id: 'costume', label: 'KOSTÜM', icon: '🥋', slotTypes: ['COSTUME', 'KOSTUM'], side: 'cosmetic' },
]

export const ALL_EQUIP_SLOTS = [...LEFT_EQUIP_SLOTS, ...RIGHT_EQUIP_SLOTS, ...COSMETIC_SLOTS]

export { BAG_SLOT_COUNT } from '@/lib/inventory-bags'

function normalizeSlot(value: string) {
  return value?.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ü/g, 'U').replace(/Ö/g, 'O')
}

export function itemMatchesEquipSlot(itemSlot: string, equipSlotId: string) {
  const def = ALL_EQUIP_SLOTS.find((s) => s.id === equipSlotId)
  if (!def) return false
  const normalized = normalizeSlot(itemSlot)
  return def.slotTypes.some((t) => normalized === t || normalized.includes(t))
}

/** Eski DB değerlerini yeni slot id'lerine çevir */
export function normalizeEquippedSlotId(slot: string | null | undefined): string | null {
  if (!slot) return null
  if (slot === 'ring') return 'ring1'
  if (slot === 'earring') return 'earring1'
  if ((LEGACY_ARMOR_SLOT_IDS as readonly string[]).includes(slot)) return ARMOR_SET_SLOT_ID
  return slot
}

export function isArmorSetEquipSlot(slot: string | null | undefined): boolean {
  if (!slot) return false
  const normalized = normalizeEquippedSlotId(slot)
  return normalized === ARMOR_SET_SLOT_ID
}

function armorPieceDisplayPriority(slot: string): number {
  const s = normalizeSlot(slot)
  if (s.includes('ARMOR') || s.includes('ZIRH') || s.includes('CHEST')) return 0
  if (s.includes('HELMET') || s.includes('MIGFER') || s.includes('HEAD')) return 1
  if (s.includes('GLOVES') || s.includes('ELDIVEN')) return 2
  if (s.includes('BOOTS') || s.includes('CIZME') || s.includes('FEET')) return 3
  return 4
}

/** Zırh seti slotunda gösterilecek temsil parçası (öncelik: gövde zırhı) */
export function pickArmorSetDisplayItem<T extends { template: { slot: string } }>(items: T[]): T {
  return [...items].sort(
    (a, b) => armorPieceDisplayPriority(a.template.slot) - armorPieceDisplayPriority(b.template.slot)
  )[0]
}

export function getMatchingEquipSlotIds(itemSlot: string): string[] {
  return ALL_EQUIP_SLOTS.filter((s) => itemMatchesEquipSlot(itemSlot, s.id)).map((s) => s.id)
}

export function findEmptyEquipSlotId(
  itemSlot: string,
  occupied: Record<string, unknown>
): string | null {
  const slots = getMatchingEquipSlotIds(itemSlot)
  return slots.find((id) => !occupied[id]) ?? null
}

/** DB'de eski slot adlarıyla kayıtlı eşyaları temizlemek için */
export function equippedSlotDbValues(slotId: string): string[] {
  if (slotId === 'ring1') return ['ring1', 'ring']
  if (slotId === 'earring1') return ['earring1', 'earring']
  if (slotId === ARMOR_SET_SLOT_ID) return [ARMOR_SET_SLOT_ID, ...LEGACY_ARMOR_SLOT_IDS]
  return [slotId]
}

export { getRarityClass, getRarityLabel } from '@/lib/item-rarity'

export function slotFallbackEmoji(slot: string) {
  const s = normalizeSlot(slot)
  if (s.includes('WEAPON') || s.includes('PUSAT') || s.includes('SWORD')) return '🗡️'
  if (s.includes('MOUNT') || s.includes('BINEK')) return '🐎'
  if (s.includes('HELMET') || s.includes('MIGFER') || s.includes('HEAD')) return '🧢'
  if (s.includes('BOOTS') || s.includes('CIZME') || s.includes('FEET')) return '🥾'
  if (s.includes('SHIELD') || s.includes('OFFHAND') || s.includes('YAN_EL')) return '🛡️'
  if (s.includes('ARMOR') || s.includes('ZIRH') || s.includes('CHEST')) return '🦺'
  if (s.includes('AMULET') || s.includes('MUSKA')) return '📿'
  if (s.includes('GLOVES') || s.includes('ELDIVEN')) return '🧤'
  if (s.includes('EARRING') || s.includes('KUPE')) return '💎'
  if (s.includes('BRACELET') || s.includes('BILEKLIK')) return '🧤'
  if (s.includes('BELT') || s.includes('KEMER')) return '🎗️'
  if (s.includes('RING') || s.includes('YUZUK')) return '💍'
  return '🎒'
}

/** @deprecated resolveItemEmoji kullan */
export function itemIcon(slot: string) {
  return slotFallbackEmoji(slot)
}
