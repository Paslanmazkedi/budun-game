export type EquipSlotDef = {
  id: string
  label: string
  icon: string
  slotTypes: string[]
  side: 'left' | 'right' | 'cosmetic'
}

export const LEFT_EQUIP_SLOTS: EquipSlotDef[] = [
  { id: 'helmet', label: 'MİĞFER', icon: '⛑️', slotTypes: ['HELMET', 'MIGFER', 'HEAD'], side: 'left' },
  { id: 'armor', label: 'ZIRH', icon: '🛡️', slotTypes: ['ARMOR', 'ZIRH', 'CHEST'], side: 'left' },
  { id: 'weapon', label: 'PUSAT', icon: '🗡️', slotTypes: ['WEAPON', 'PUSAT', 'SWORD'], side: 'left' },
  { id: 'offhand', label: 'YAN EL', icon: '🛡️', slotTypes: ['OFFHAND', 'SHIELD', 'YAN_EL'], side: 'left' },
  { id: 'boots', label: 'ÇİZME', icon: '🥾', slotTypes: ['BOOTS', 'CIZME', 'FEET'], side: 'left' },
]

export const RIGHT_EQUIP_SLOTS: EquipSlotDef[] = [
  { id: 'amulet', label: 'MUSKA', icon: '📿', slotTypes: ['AMULET', 'MUSKA'], side: 'right' },
  { id: 'ring1', label: 'YÜZÜK I', icon: '💍', slotTypes: ['RING', 'YUZUK'], side: 'right' },
  { id: 'ring2', label: 'YÜZÜK II', icon: '💍', slotTypes: ['RING', 'YUZUK'], side: 'right' },
  { id: 'bracelet', label: 'BİLEKLİK', icon: '⌚', slotTypes: ['BRACELET', 'BILEKLIK'], side: 'right' },
  { id: 'belt', label: 'KEMER', icon: '🎗️', slotTypes: ['BELT', 'KEMER'], side: 'right' },
]

export const COSMETIC_SLOTS: EquipSlotDef[] = [
  { id: 'mount', label: 'BİNEK', icon: '🐎', slotTypes: ['MOUNT', 'BINEK'], side: 'cosmetic' },
  { id: 'cloak', label: 'PELERİN', icon: '🧣', slotTypes: ['CLOAK', 'PELERIN'], side: 'cosmetic' },
  { id: 'costume', label: 'KOSTÜM', icon: '🥋', slotTypes: ['COSTUME', 'KOSTUM'], side: 'cosmetic' },
]

export const ALL_EQUIP_SLOTS = [...LEFT_EQUIP_SLOTS, ...RIGHT_EQUIP_SLOTS, ...COSMETIC_SLOTS]

export const BAG_SLOT_COUNT = 24

function normalizeSlot(value: string) {
  return value?.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ü/g, 'U').replace(/Ö/g, 'O')
}

export function itemMatchesEquipSlot(itemSlot: string, equipSlotId: string) {
  const def = ALL_EQUIP_SLOTS.find((s) => s.id === equipSlotId)
  if (!def) return false
  const normalized = normalizeSlot(itemSlot)
  return def.slotTypes.some((t) => normalized === t || normalized.includes(t))
}

export function getRarityClass(rarity: string) {
  switch (rarity?.toUpperCase()) {
    case 'DESTANSI':
      return 'border-orange-700/60 bg-orange-950/25 text-orange-400'
    case 'NADİR':
    case 'NADIR':
      return 'border-cyan-700/60 bg-cyan-950/25 text-cyan-400'
    default:
      return 'border-stone-700 bg-stone-900/50 text-stone-300'
  }
}

export function itemIcon(slot: string) {
  const s = normalizeSlot(slot)
  if (s.includes('WEAPON') || s.includes('PUSAT') || s.includes('SWORD')) return '🗡️'
  if (s.includes('SHIELD') || s.includes('ARMOR') || s.includes('ZIRH')) return '🛡️'
  if (s.includes('RING') || s.includes('YUZUK')) return '💍'
  return '🎒'
}
