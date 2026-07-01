/**
 * Premium ticaret kataloğu — oyun akçesi (gold) ile karışmaz.
 *
 * Model:
 * - player_wallets.premium_balance → Kut Taşı (premium para)
 * - player_entitlements → abonelik / paket bonusları (EXP, +slot, at, kostüm…)
 * - Karakter.inventory_slot_capacity → kalıcı satın alınan slotlar (+1/+10/+20)
 * - getEffectiveInventoryCapacity() = karakter slotları + aktif entitlement bonusları
 *
 * Abonelik örneği (ileride): kut_baslangic → +20 slot, %10 EXP, başlangıç atı, kostüm
 */

export const PREMIUM_CURRENCY = {
  id: 'kut_tasi',
  label: 'Kut Taşı',
  emoji: '💠',
} as const

/** Entitlement anahtarları — DB player_entitlements.entitlement_key ile aynı */
export type PremiumEntitlementKey =
  | 'inventory_slots_bonus'
  | 'exp_bonus_pct'
  | 'starter_mount_unlocked'
  | 'starter_costume_unlocked'
  | 'subscription_active'

export type PremiumEntitlement = {
  key: PremiumEntitlementKey
  value: number
  expiresAt?: string | null
}

export type PremiumProductKind =
  | 'inventory_slot_pack'
  | 'subscription'
  | 'cosmetic_bundle'

/** Satın alınabilir premium ürün */
export type PremiumProduct = {
  id: string
  kind: PremiumProductKind
  label: string
  description?: string
  premiumCost: number
  /** inventory_slot_pack için */
  slotsGranted?: number
  /** subscription için verilecek entitlement'lar (aktivasyon RPC ile) */
  entitlementsGranted?: Array<{ key: PremiumEntitlementKey; value: number }>
}

/** Tekil heybe slot paketleri — premium para ile */
export const INVENTORY_SLOT_PRODUCTS: PremiumProduct[] = [
  {
    id: 'inventory_slots_1',
    kind: 'inventory_slot_pack',
    label: '+1 slot',
    premiumCost: 5,
    slotsGranted: 1,
  },
  {
    id: 'inventory_slots_10',
    kind: 'inventory_slot_pack',
    label: '+10 slot',
    premiumCost: 40,
    slotsGranted: 10,
  },
  {
    id: 'inventory_slots_20',
    kind: 'inventory_slot_pack',
    label: '+20 slot',
    premiumCost: 70,
    slotsGranted: 20,
  },
]

/** Abonelik planları — ödeme entegrasyonu sonraki faz; şimdilik katalog */
export type SubscriptionPlan = {
  id: string
  label: string
  description: string
  /** Aylık Kut Taşı veya gerçek para eşdeğeri (ileride) */
  premiumCostMonthly: number
  entitlements: Array<{ key: PremiumEntitlementKey; value: number }>
  perkLabels: string[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'kut_baslangic',
    label: 'Kut Başlangıç',
    description: 'Yeni maceracılar için premium paket',
    premiumCostMonthly: 0,
    entitlements: [
      { key: 'inventory_slots_bonus', value: 20 },
      { key: 'exp_bonus_pct', value: 10 },
      { key: 'starter_mount_unlocked', value: 1 },
      { key: 'starter_costume_unlocked', value: 1 },
      { key: 'subscription_active', value: 1 },
    ],
    perkLabels: [
      'Başlangıç atı',
      'Özel kostüm',
      '+20 heybe slotu',
      '%10 EXP bonusu',
    ],
  },
]

const PRODUCT_BY_ID = Object.fromEntries(
  [...INVENTORY_SLOT_PRODUCTS].map((p) => [p.id, p])
) as Record<string, PremiumProduct>

export function getPremiumProduct(productId: string): PremiumProduct | null {
  return PRODUCT_BY_ID[productId] ?? null
}

export function getInventorySlotProducts(): PremiumProduct[] {
  return INVENTORY_SLOT_PRODUCTS
}

export function formatPremiumCost(cost: number): string {
  return `${cost.toLocaleString()} ${PREMIUM_CURRENCY.emoji}`
}

export function sumEntitlementValue(
  entitlements: PremiumEntitlement[] | null | undefined,
  key: PremiumEntitlementKey
): number {
  if (!entitlements?.length) return 0
  const now = Date.now()
  return entitlements.reduce((sum, row) => {
    if (row.key !== key) return sum
    if (row.expiresAt && Date.parse(row.expiresAt) < now) return sum
    return sum + row.value
  }, 0)
}

export function hasEntitlement(
  entitlements: PremiumEntitlement[] | null | undefined,
  key: PremiumEntitlementKey
): boolean {
  return sumEntitlementValue(entitlements, key) > 0
}

export function getSubscriptionPlan(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null
}

export function formatSubscriptionPrice(plan: SubscriptionPlan): string {
  if (plan.premiumCostMonthly <= 0) {
    return 'Yakında fiyatlandırılacak'
  }
  return `${plan.premiumCostMonthly.toLocaleString()} ${PREMIUM_CURRENCY.emoji} / ay`
}

export function getActiveSubscriptionExpiry(
  entitlements: PremiumEntitlement[] | null | undefined
): string | null {
  if (!entitlements?.length) return null
  const row = entitlements.find((e) => e.key === 'subscription_active')
  if (!row?.expiresAt) return null
  if (Date.parse(row.expiresAt) < Date.now()) return null
  return row.expiresAt
}
