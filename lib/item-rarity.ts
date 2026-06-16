export type ItemRarityId = 'COMMON' | 'NORMAL' | 'RARE' | 'HIGH' | 'UNIQUE'

export type ItemRarityDef = {
  id: ItemRarityId
  label: string
  /** Loot tablosu ağırlığı */
  lootWeight: number
  borderClass: string
  textClass: string
  glowClass?: string
}

export const ITEM_RARITIES: ItemRarityDef[] = [
  {
    id: 'COMMON',
    label: 'Yaygın',
    lootWeight: 40,
    borderClass: 'border-stone-600/70',
    textClass: 'text-stone-400',
  },
  {
    id: 'NORMAL',
    label: 'Normal',
    lootWeight: 28,
    borderClass: 'border-stone-400/60',
    textClass: 'text-stone-200',
  },
  {
    id: 'RARE',
    label: 'Nadir',
    lootWeight: 18,
    borderClass: 'border-cyan-600/70',
    textClass: 'text-cyan-400',
    glowClass: 'shadow-[0_0_12px_rgba(34,211,238,0.15)]',
  },
  {
    id: 'HIGH',
    label: 'Üstün',
    lootWeight: 8,
    borderClass: 'border-violet-600/70',
    textClass: 'text-violet-400',
    glowClass: 'shadow-[0_0_14px_rgba(167,139,250,0.2)]',
  },
  {
    id: 'UNIQUE',
    label: 'Eşsiz',
    lootWeight: 2,
    borderClass: 'border-amber-500/80',
    textClass: 'text-amber-400',
    glowClass: 'shadow-[0_0_16px_rgba(251,191,36,0.25)]',
  },
]

const RARITY_MAP = new Map(ITEM_RARITIES.map((r) => [r.id, r]))

/** Eski DB değerleri → faz 1 nadirlik */
export function normalizeRarityId(rarity: string): ItemRarityId {
  const r = rarity?.toUpperCase().replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ü/g, 'U')
  switch (r) {
    case 'SIRADAN':
      return 'COMMON'
    case 'NADIR':
    case 'NADİR':
      return 'RARE'
    case 'DESTANSI':
      return 'UNIQUE'
    case 'NORMAL':
    case 'RARE':
    case 'HIGH':
    case 'UNIQUE':
    case 'COMMON':
      return r as ItemRarityId
    default:
      return 'COMMON'
  }
}

export function getRarityDef(rarity: string): ItemRarityDef {
  return RARITY_MAP.get(normalizeRarityId(rarity)) ?? RARITY_MAP.get('COMMON')!
}

export function getRarityLabel(rarity: string) {
  return getRarityDef(rarity).label
}

export function getRarityClass(rarity: string) {
  const def = getRarityDef(rarity)
  const bg =
    def.id === 'COMMON'
      ? 'bg-stone-900/55'
      : def.id === 'NORMAL'
        ? 'bg-stone-800/50'
        : def.id === 'RARE'
          ? 'bg-cyan-950/30'
          : def.id === 'HIGH'
            ? 'bg-violet-950/30'
            : 'bg-amber-950/25'
  return `${def.borderClass} ${bg} ${def.textClass} ${def.glowClass ?? ''}`.trim()
}
