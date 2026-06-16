export type EquipSlotDef = {
  id: string
  label: string
  icon: string
  slotTypes: string[]
  side: 'left' | 'right' | 'cosmetic'
}

export const LEFT_EQUIP_SLOTS: EquipSlotDef[] = [
  { id: 'helmet', label: 'MİĞFER', icon: '🧢', slotTypes: ['HELMET', 'MIGFER', 'HEAD'], side: 'left' },
  { id: 'armor', label: 'ZIRH', icon: '🛡️', slotTypes: ['ARMOR', 'ZIRH', 'CHEST'], side: 'left' },
  { id: 'gloves', label: 'ELDİVEN', icon: '🧤', slotTypes: ['GLOVES', 'ELDIVEN'], side: 'left' },
  { id: 'weapon', label: 'PUSAT', icon: '🗡️', slotTypes: ['WEAPON', 'PUSAT', 'SWORD', 'BOW', 'YAY', 'STAFF', 'ASA', 'AXE', 'DAGGER'], side: 'left' },
  { id: 'offhand', label: 'YAN EL', icon: '🛡️', slotTypes: ['OFFHAND', 'SHIELD', 'YAN_EL'], side: 'left' },
  { id: 'boots', label: 'ÇİZME', icon: '🥾', slotTypes: ['BOOTS', 'CIZME', 'FEET'], side: 'left' },
]

export const RIGHT_EQUIP_SLOTS: EquipSlotDef[] = [
  { id: 'amulet', label: 'KOLYE', icon: '📿', slotTypes: ['AMULET', 'MUSKA'], side: 'right' },
  { id: 'earring', label: 'KÜPE', icon: '💎', slotTypes: ['EARRING', 'KUPE'], side: 'right' },
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
