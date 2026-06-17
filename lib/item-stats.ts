import { normalizeRarityId, getRarityLabel } from '@/lib/item-rarity'
import { ALL_EQUIP_SLOTS } from '@/lib/inventory-slots'

function normalizeSlot(value: string) {
  return value?.toUpperCase().replace(/\s+/g, '_').replace(/İ/g, 'I').replace(/Ü/g, 'U').replace(/Ö/g, 'O')
}

export function getItemSlotLabel(slot: string) {
  const normalized = normalizeSlot(slot)
  const def = ALL_EQUIP_SLOTS.find((s) =>
    s.slotTypes.some((t) => normalized === t || normalized.includes(t))
  )
  return def?.label ?? slot
}

/** Knight Online tarzı slot tipi (İngilizce benzeri kısa) */
export function getItemSlotTypeName(slot: string) {
  const s = normalizeSlot(slot)
  if (s.includes('AMULET') || s.includes('MUSKA')) return 'Muska'
  if (s.includes('RING') || s.includes('YUZUK')) return 'Yüzük'
  if (s.includes('BRACELET') || s.includes('BILEKLIK')) return 'Bileklik'
  if (s.includes('BELT') || s.includes('KEMER')) return 'Kemer'
  if (s.includes('HELMET') || s.includes('MIGFER')) return 'Miğfer'
  if (s.includes('ARMOR') || s.includes('ZIRH')) return 'Zırh'
  if (s.includes('BOOTS') || s.includes('CIZME')) return 'Çizme'
  if (s.includes('GLOVES') || s.includes('ELDIVEN')) return 'Eldiven'
  if (s.includes('EARRING') || s.includes('KUPE')) return 'Küpe'
  if (s.includes('WEAPON') || s.includes('PUSAT') || s.includes('SWORD')) return 'Silah'
  if (s.includes('BOW') || s.includes('YAY')) return 'Yay'
  if (s.includes('STAFF') || s.includes('ASA')) return 'Asa'
  if (s.includes('SHIELD') || s.includes('OFFHAND')) return 'Kalkan'
  if (s.includes('MOUNT') || s.includes('BINEK')) return 'Binek'
  if (s.includes('CLOAK') || s.includes('PELERIN')) return 'Pelerin'
  if (s.includes('COSTUME') || s.includes('KOSTUM')) return 'Kostüm'
  return getItemSlotLabel(slot)
}

export type ItemStatLine = {
  text: string
  kind: 'base' | 'bonus' | 'rarity' | 'warning' | 'flavor'
}

export function getRarityBracketLabel(rarity: string) {
  const r = normalizeRarityId(rarity)
  switch (r) {
    case 'UNIQUE':
      return '(Eşsiz Eşya)'
    case 'HIGH':
      return '(Üstün Eşya)'
    case 'RARE':
      return '(Nadir Eşya)'
    case 'NORMAL':
      return '(Normal Eşya)'
    default:
      return '(Yaygın Eşya)'
  }
}

/** Faz 1 placeholder statlar — Faz 2.0'da DB'den */
export function getItemStatLines(
  rarity: string,
  slot: string,
  itemName: string
): ItemStatLine[] {
  const r = normalizeRarityId(rarity)
  const base = { COMMON: 2, NORMAL: 5, RARE: 10, HIGH: 18, UNIQUE: 30 }[r] ?? 2
  const s = normalizeSlot(slot)
  const lines: ItemStatLine[] = []

  if (s.includes('ARMOR') || s.includes('ZIRH') || s.includes('HELMET') || s.includes('SHIELD') || s.includes('OFFHAND')) {
    lines.push({ text: `Savunma : ${base * 4}`, kind: 'base' })
  } else if (s.includes('WEAPON') || s.includes('PUSAT') || s.includes('SWORD')) {
    lines.push({ text: `Saldırı : ${base * 3}`, kind: 'base' })
  } else {
    lines.push({ text: `Güç : ${base}`, kind: 'base' })
  }

  lines.push({ text: `Güç Bonusu : ${base}`, kind: 'bonus' })
  lines.push({ text: `Can Bonusu : ${base * 20}`, kind: 'bonus' })

  if (s.includes('BOOTS') || s.includes('CIZME')) {
    lines.push({ text: `Çeviklik Bonusu : ${Math.max(1, base - 1)}`, kind: 'bonus' })
  }
  if (s.includes('RING') || s.includes('YUZUK') || s.includes('AMULET')) {
    lines.push({ text: `Zeka Bonusu : ${Math.max(1, base - 2)}`, kind: 'bonus' })
  }

  if (r === 'RARE' || r === 'HIGH') {
    lines.push({ text: `Ateş Direnci : ${base}`, kind: 'bonus' })
  }
  if (r === 'UNIQUE' || r === 'HIGH') {
    lines.push({ text: getRarityLabel(rarity), kind: 'rarity' })
  }

  if (r === 'UNIQUE' || r === 'HIGH') {
    lines.push({
      text: 'Bağlı eşya — takas edilemez.',
      kind: 'warning',
    })
  }

  const flavor =
    r === 'UNIQUE'
      ? `*${itemName} — Bozkırın eşsiz ganimeti.*`
      : r === 'HIGH'
        ? `*${itemName} — Üstün işçilik.*`
        : null
  if (flavor) lines.push({ text: flavor, kind: 'flavor' })

  return lines
}

export type ComparableStat = {
  label: string
  value: number
  kind: 'base' | 'bonus'
}

/** Yan yana karşılaştırma için sayısal statlar */
export function getItemComparableStats(
  rarity: string,
  slot: string,
  itemName: string
): ComparableStat[] {
  return getItemStatLines(rarity, slot, itemName)
    .filter(
      (line): line is ItemStatLine & { kind: 'base' | 'bonus' } =>
        line.kind === 'base' || line.kind === 'bonus'
    )
    .map((line) => {
      const colon = line.text.indexOf(':')
      const label = colon >= 0 ? line.text.slice(0, colon).trim() : line.text
      const raw = colon >= 0 ? line.text.slice(colon + 1).trim() : ''
      const value = parseInt(raw.replace(/[^\d-]/g, ''), 10) || 0
      return { label, value, kind: line.kind }
    })
}

/** @deprecated */
export function getPlaceholderItemStats(rarity: string, slot: string) {
  return getItemStatLines(rarity, slot, '').map((l) => ({
    label: l.text.split(':')[0]?.trim() ?? l.text,
    value: l.text.includes(':') ? l.text.split(':').slice(1).join(':').trim() : '',
  }))
}
