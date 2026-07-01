import type { SupabaseClient } from '@supabase/supabase-js'
import type { PremiumEntitlement } from '@/lib/premium-commerce'
import { validateSlotProductPurchase } from '@/lib/inventory-capacity'

export type PremiumWallet = {
  premium_balance: number
}

export type PurchasePremiumProductResult = {
  inventory_slot_capacity?: number
  inventory_display_slots?: number
  premium_balance: number
  product_id: string
}

export async function fetchPremiumWallet(
  supabase: SupabaseClient,
  userId: string
): Promise<{ wallet: PremiumWallet | null; error: string | null }> {
  const { data, error } = await supabase
    .from('player_wallets')
    .select('premium_balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return { wallet: null, error: error.message }
  }

  return {
    wallet: { premium_balance: data?.premium_balance ?? 0 },
    error: null,
  }
}

export async function fetchPlayerEntitlements(
  supabase: SupabaseClient,
  userId: string
): Promise<{ entitlements: PremiumEntitlement[]; error: string | null }> {
  const { data, error } = await supabase
    .from('player_entitlements')
    .select('entitlement_key, int_value, expires_at')
    .eq('user_id', userId)

  if (error) {
    return { entitlements: [], error: error.message }
  }

  const entitlements: PremiumEntitlement[] = (data ?? []).map((row) => ({
    key: row.entitlement_key as PremiumEntitlement['key'],
    value: row.int_value ?? 0,
    expiresAt: row.expires_at,
  }))

  return { entitlements, error: null }
}

export async function purchasePremiumInventorySlots(
  supabase: SupabaseClient,
  characterId: string,
  productId: string,
  currentBaseCapacity: number,
  entitlementBonus = 0
): Promise<{ data: PurchasePremiumProductResult | null; error: string | null }> {
  const validationError = validateSlotProductPurchase(
    currentBaseCapacity,
    productId,
    entitlementBonus
  )
  if (validationError) return { data: null, error: validationError }

  const { data, error } = await supabase.rpc('purchase_premium_product', {
    p_character_id: characterId,
    p_product_id: productId,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  const row = data as PurchasePremiumProductResult | null
  if (!row || typeof row.premium_balance !== 'number') {
    return { data: null, error: 'Premium satın alma kaydedilemedi.' }
  }

  return { data: row, error: null }
}
