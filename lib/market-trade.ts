import { normalizeRarityId } from '@/lib/item-rarity'

export const MARKET_LISTING_TTL_HOURS = 24

export type DismantleReward = {
  material_slug: string
  material_name: string
  amount: number
}

export const MATERIAL_LABELS: Record<string, { label: string; emoji: string }> = {
  mat_bozkir_parcasi: { label: 'Bozkır Parçası', emoji: '🔩' },
  mat_nadir_tas: { label: 'Nadir Taş', emoji: '💎' },
  bozkir_parcasi: { label: 'Bozkır Parçası', emoji: '🔩' },
}

export function isMaterialSlot(slot: string) {
  const s = slot?.toUpperCase().replace(/\s+/g, '_')
  return s === 'MATERIAL' || s.includes('MATERIAL')
}

export function isMaterialSlug(slug?: string | null) {
  return slug?.startsWith('mat_') ?? false
}

export function getDismantleRewardPreview(rarity: string): DismantleReward | null {
  const r = normalizeRarityId(rarity)
  if (r === 'COMMON') {
    return { material_slug: 'mat_bozkir_parcasi', material_name: 'Bozkır Parçası', amount: 2 }
  }
  if (r === 'NORMAL') {
    return { material_slug: 'mat_bozkir_parcasi', material_name: 'Bozkır Parçası', amount: 4 }
  }
  if (r === 'RARE') {
    return { material_slug: 'mat_nadir_tas', material_name: 'Nadir Taş', amount: 2 }
  }
  return null
}

/** HIGH / UNIQUE bağlı — pazarda satılamaz */
export function canListOnMarket(rarity: string) {
  const r = normalizeRarityId(rarity)
  return r !== 'HIGH' && r !== 'UNIQUE'
}

/** Yaygın / normal / nadir parçalanabilir */
export function canDismantleItem(rarity: string) {
  return getDismantleRewardPreview(rarity) !== null
}

export function formatMarketListedAt(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime()
  const mins = Math.max(0, Math.floor(ms / 60000))
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} sa önce`
  return `${Math.floor(hours / 24)} gün önce`
}

export function formatMarketExpiresIn(expiresAt: string | Date) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Süresi doldu'
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} dk kaldı`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} sa kaldı`
  return `${Math.floor(hours / 24)} gün kaldı`
}
