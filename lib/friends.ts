/** Arkadaş listesi ve istekleri */

export type FriendStatus = 'pending' | 'accepted' | 'rejected'

export type FriendRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendStatus
  created_at: string
  requester?: { name: string; level: number } | { name: string; level: number }[] | null
  addressee?: { name: string; level: number } | { name: string; level: number }[] | null
}

export function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

/** Kabul edilmiş arkadaşlık satırından diğer karakter id */
export function friendCharacterId(row: FriendRow, myId: string) {
  return row.requester_id === myId ? row.addressee_id : row.requester_id
}

export function friendDisplayName(row: FriendRow, myId: string) {
  const other =
    row.requester_id === myId ? pickOne(row.addressee) : pickOne(row.requester)
  return other?.name ?? '…'
}

export function friendDisplayLevel(row: FriendRow, myId: string) {
  const other =
    row.requester_id === myId ? pickOne(row.addressee) : pickOne(row.requester)
  return other?.level
}

export async function loadAcceptedFriends(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  characterId: string
) {
  const { data } = await supabase
    .from('character_friends')
    .select(
      'id, requester_id, addressee_id, status, requester:requester_id(name, level), addressee:addressee_id(name, level)'
    )
    .eq('status', 'accepted')
    .or(`requester_id.eq.${characterId},addressee_id.eq.${characterId}`)

  const rows = (data ?? []) as FriendRow[]
  return rows.map((row) => ({
    id: friendCharacterId(row, characterId),
    name: friendDisplayName(row, characterId),
    level: friendDisplayLevel(row, characterId),
  }))
}
