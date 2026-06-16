import { createClient } from '@/lib/supabase-browser'
import type { MarketListing } from '@/lib/market'

type ListingRow = {
  id: string
  price: number
  created_at: string
  expires_at: string
  status: string
  seller_character_id: string
  character_item_id: string
  character_items:
    | {
        id: string
        item_templates: TemplateJoin | TemplateJoin[] | null
      }
    | {
        id: string
        item_templates: TemplateJoin | TemplateJoin[] | null
      }[]
    | null
  characters: { name: string } | { name: string }[] | null
}

type TemplateJoin = {
  name: string
  slot: string
  rarity: string
  emoji?: string | null
  slug?: string | null
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function mapListingRow(row: ListingRow): MarketListing | null {
  const itemRow = pickOne(row.character_items)
  if (!itemRow) return null
  const template = pickOne(itemRow.item_templates)
  if (!template) return null
  const seller = pickOne(row.characters)

  return {
    id: row.id,
    characterItemId: itemRow.id,
    sellerCharacterId: row.seller_character_id,
    sellerName: seller?.name ?? 'Bilinmeyen',
    itemName: template.name,
    slot: template.slot,
    rarity: template.rarity,
    emoji: template.emoji ?? null,
    slug: template.slug ?? null,
    price: row.price,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    listedAt: row.created_at,
    status: row.status as MarketListing['status'],
  }
}

const LISTING_SELECT = `
  id,
  price,
  created_at,
  expires_at,
  status,
  seller_character_id,
  character_item_id,
  character_items (
    id,
    item_templates ( name, slot, rarity, emoji, slug )
  ),
  characters!seller_character_id ( name )
`

export async function fetchActiveMarketListings() {
  const supabase = createClient()
  await supabase.rpc('market_expire_stale_listings')

  const { data, error } = await supabase
    .from('market_listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as ListingRow[])
    .map(mapListingRow)
    .filter((row): row is MarketListing => row !== null)
}

export async function fetchMyActiveListings(sellerCharacterId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('market_listings')
    .select(LISTING_SELECT)
    .eq('seller_character_id', sellerCharacterId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as ListingRow[])
    .map(mapListingRow)
    .filter((row): row is MarketListing => row !== null)
}

export async function createMarketListing(characterItemId: string, price: number) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('market_create_listing', {
    p_character_item_id: characterItemId,
    p_price: price,
  })
  if (error) throw error
  return data as string
}

export async function cancelMarketListing(listingId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('market_cancel_listing', { p_listing_id: listingId })
  if (error) throw error
}

export async function buyMarketListing(listingId: string, buyerCharacterId: string) {
  const supabase = createClient()
  const { error } = await supabase.rpc('market_buy_listing', {
    p_listing_id: listingId,
    p_buyer_character_id: buyerCharacterId,
  })
  if (error) throw error
}

export async function dismantleInventoryItem(characterItemId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('dismantle_character_item', {
    p_character_item_id: characterItemId,
  })
  if (error) throw error
  return data as {
    material_slug: string
    material_name: string
    amount: number
  }
}

export async function fetchCharacterBagItems(characterId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('character_items')
    .select('id, equipped_slot, bag_id, quantity, item_templates(*)')
    .eq('character_id', characterId)

  if (error) throw error
  return data ?? []
}

export async function fetchCharacterMaterials(characterId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('character_materials')
    .select('material_slug, quantity')
    .eq('character_id', characterId)
    .gt('quantity', 0)

  if (error) throw error
  return (data ?? []) as Array<{ material_slug: string; quantity: number }>
}
