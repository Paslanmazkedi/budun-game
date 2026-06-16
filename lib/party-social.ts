/** Parti katılım politikası ve davetler */

import type { SupabaseClient } from '@supabase/supabase-js'

export type PartyJoinPolicy = 'public' | 'friends' | 'clan' | 'invite_only'

export const JOIN_POLICY_OPTIONS: Array<{
  value: PartyJoinPolicy
  label: string
  hint: string
}> = [
  { value: 'public', label: 'Açık', hint: 'Herkes görebilir ve katılabilir' },
  { value: 'friends', label: 'Arkadaşlar', hint: 'Herkes görür — sadece arkadaşlar katılır' },
  { value: 'clan', label: 'Boy', hint: 'Herkes görür — sadece aynı boy katılır' },
  { value: 'invite_only', label: 'Davetli', hint: 'Listede gizli — yalnızca davetle' },
]

export const JOIN_POLICY_LABELS: Record<PartyJoinPolicy, string> = {
  public: 'Açık',
  friends: 'Arkadaş',
  clan: 'Boy',
  invite_only: 'Davetli',
}

/** Parti kurma / lider — 3 seçenek */
export const PARTY_CREATE_POLICY_OPTIONS: Array<{
  value: PartyJoinPolicy
  label: string
  hint: string
}> = [
  { value: 'public', label: 'Açık', hint: 'Herkes görebilir ve katılabilir' },
  { value: 'friends', label: 'Arkadaş', hint: 'Arkadaşlarını seç — kurulunca davet gider' },
  { value: 'clan', label: 'Boy', hint: 'Aynı boy üyeleri katılabilir' },
]

export const JOIN_POLICY_BADGE: Record<PartyJoinPolicy, string> = {
  public: 'border-emerald-800/50 text-emerald-400 bg-emerald-950/30',
  friends: 'border-cyan-800/50 text-cyan-400 bg-cyan-950/30',
  clan: 'border-amber-800/50 text-amber-400 bg-amber-950/30',
  invite_only: 'border-stone-700 text-stone-400 bg-stone-900/50',
}

export type PartyInviteRow = {
  id: string
  party_id: string
  from_character_id: string
  to_character_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export function normalizeJoinPolicy(v: string | null | undefined): PartyJoinPolicy {
  if (v === 'friends' || v === 'clan' || v === 'invite_only') return v
  return 'public'
}

export async function areFriends(
  supabase: SupabaseClient,
  characterA: string,
  characterB: string
) {
  if (characterA === characterB) return true
  const { data } = await supabase
    .from('character_friends')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${characterA},addressee_id.eq.${characterB}),and(requester_id.eq.${characterB},addressee_id.eq.${characterA})`
    )
    .maybeSingle()
  return !!data
}

export async function shareClan(
  supabase: SupabaseClient,
  characterA: string,
  characterB: string
) {
  if (characterA === characterB) return true
  const { data: a } = await supabase
    .from('clan_members')
    .select('clan_id')
    .eq('character_id', characterA)
    .maybeSingle()
  if (!a?.clan_id) return false
  const { data: b } = await supabase
    .from('clan_members')
    .select('clan_id')
    .eq('character_id', characterB)
    .maybeSingle()
  return b?.clan_id === a.clan_id
}

export async function hasPartyInvite(
  supabase: SupabaseClient,
  partyId: string,
  characterId: string
) {
  const { data } = await supabase
    .from('party_invites')
    .select('id')
    .eq('party_id', partyId)
    .eq('to_character_id', characterId)
    .eq('status', 'pending')
    .maybeSingle()
  return !!data
}

export async function canJoinParty(
  supabase: SupabaseClient,
  party: { id: string; leader_character_id: string; join_policy?: string | null },
  characterId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const policy = normalizeJoinPolicy(party.join_policy)

  if (policy === 'public') return { ok: true }

  if (policy === 'friends') {
    const friends = await areFriends(supabase, characterId, party.leader_character_id)
    if (!friends) return { ok: false, reason: 'Bu parti yalnızca liderin arkadaşlarına açık.' }
    return { ok: true }
  }

  if (policy === 'clan') {
    const same = await shareClan(supabase, characterId, party.leader_character_id)
    if (!same) return { ok: false, reason: 'Bu parti yalnızca liderin boy üyelerine açık.' }
    return { ok: true }
  }

  const invited = await hasPartyInvite(supabase, party.id, characterId)
  if (!invited) return { ok: false, reason: 'Davet bekleniyor — liderden davet iste.' }
  return { ok: true }
}
