import type { GameCharacter } from '@/lib/characters'
import { getBagUnlockLevel } from '@/lib/inventory-bags'
import {
  getInventorySlotProducts,
  getPremiumProduct,
  type PremiumEntitlement,
  type PremiumProduct,
} from '@/lib/premium-commerce'

/** Karakter başına başlangıç / maksimum heybe slotu (entitlement bonus hariç taban) */
export const INVENTORY_SLOT_START = 20
export const INVENTORY_SLOT_MAX = 96

/** @deprecated gold kullanılmıyor — PremiumProduct kullanın */
export type InventoryExpandOffer = PremiumProduct & { slots: number }

function clampSlotCount(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function legacyCapacityFromBagLevel(level: number): number {
  switch (level) {
    case 3:
      return 90
    case 2:
      return 60
    case 1:
    default:
      return 30
  }
}

/** Karaktere yazılı kalıcı slot (premium paket satın alımları) */
export function getCharacterBaseSlotCapacity(character: GameCharacter): number {
  const raw = character.inventory_slot_capacity
  if (typeof raw === 'number' && raw >= INVENTORY_SLOT_START) {
    return clampSlotCount(raw, INVENTORY_SLOT_START, INVENTORY_SLOT_MAX)
  }
  return clampSlotCount(
    legacyCapacityFromBagLevel(getBagUnlockLevel(character)),
    INVENTORY_SLOT_START,
    INVENTORY_SLOT_MAX
  )
}

export function sumInventoryEntitlementBonus(
  entitlements?: PremiumEntitlement[] | null
): number {
  if (!entitlements?.length) return 0
  const now = Date.now()
  return entitlements.reduce((sum, row) => {
    if (row.key !== 'inventory_slots_bonus') return sum
    if (row.expiresAt && Date.parse(row.expiresAt) < now) return sum
    return sum + row.value
  }, 0)
}

/** Abonelik / entitlement bonus dahil efektif kapasite */
export function getEffectiveInventoryCapacity(
  character: GameCharacter,
  entitlements?: PremiumEntitlement[] | null
): number {
  const base = getCharacterBaseSlotCapacity(character)
  const bonus = sumInventoryEntitlementBonus(entitlements)
  return clampSlotCount(base + bonus, INVENTORY_SLOT_START, INVENTORY_SLOT_MAX)
}

/** @deprecated getCharacterBaseSlotCapacity veya getEffectiveInventoryCapacity kullanın */
export function getInventorySlotCapacity(character: GameCharacter): number {
  return getCharacterBaseSlotCapacity(character)
}

export function getInventoryDisplaySlots(
  character: GameCharacter,
  entitlements?: PremiumEntitlement[] | null
): number {
  const capacity = getEffectiveInventoryCapacity(character, entitlements)
  const raw = character.inventory_display_slots
  if (typeof raw === 'number' && raw >= INVENTORY_SLOT_START) {
    return clampSlotCount(raw, INVENTORY_SLOT_START, capacity)
  }
  return capacity
}

export function getSlotsRemainingToMax(
  baseCapacity: number,
  entitlementBonus = 0
): number {
  return Math.max(0, INVENTORY_SLOT_MAX - baseCapacity - entitlementBonus)
}

export function getAvailableSlotProducts(
  baseCapacity: number,
  entitlementBonus = 0
): PremiumProduct[] {
  const remaining = getSlotsRemainingToMax(baseCapacity, entitlementBonus)
  if (remaining <= 0) return []

  return getInventorySlotProducts().filter(
    (product) => (product.slotsGranted ?? 0) <= remaining
  )
}

/** @deprecated getAvailableSlotProducts kullanın */
export function getAvailableExpandOffers(
  baseCapacity: number,
  entitlementBonus = 0
): InventoryExpandOffer[] {
  return getAvailableSlotProducts(baseCapacity, entitlementBonus).map(toInventoryExpandOffer)
}

export function validateSlotProductPurchase(
  baseCapacity: number,
  productId: string,
  entitlementBonus = 0
): string | null {
  const product = getPremiumProduct(productId)
  if (!product || product.kind !== 'inventory_slot_pack') {
    return 'Geçersiz premium ürün.'
  }
  const slots = product.slotsGranted ?? 0
  if (
    slots < 1 ||
    baseCapacity + entitlementBonus + slots > INVENTORY_SLOT_MAX
  ) {
    return 'Maksimum slot kapasitesine ulaşıldı.'
  }
  return null
}

export function nextDisplaySlotsAfterRow(
  currentDisplay: number,
  capacity: number,
  gridCols: number
): number {
  return clampSlotCount(currentDisplay + gridCols, INVENTORY_SLOT_START, capacity)
}

export function toInventoryExpandOffer(product: PremiumProduct): InventoryExpandOffer {
  return {
    ...product,
    slots: product.slotsGranted ?? 0,
  }
}
