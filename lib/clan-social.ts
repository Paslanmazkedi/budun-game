import type { SupabaseClient } from '@supabase/supabase-js'
import { pickOne } from '@/lib/friends'
import type { ClanRank } from '@/lib/clans'

export type ClanInviteRow = {
  id: string
  clan_id: string
  from_character_id: string
  to_character_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from_character?: { name: string; level: number } | { name: string; level: number }[] | null
  to_character?: { name: string; level: number } | { name: string; level: number }[] | null
}

export async function loadClanInvitesForClan(
  supabase: SupabaseClient,
  clanId: string
): Promise<ClanInviteRow[]> {
  const { data, error } = await supabase
    .from('clan_invites')
    .select(
      'id, clan_id, from_character_id, to_character_id, status, created_at, to_character:to_character_id(name, level)'
    )
    .eq('clan_id', clanId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ClanInviteRow[]
}

export async function loadIncomingClanInvites(
  supabase: SupabaseClient,
  characterId: string
): Promise<ClanInviteRow[]> {
  const { data, error } = await supabase
    .from('clan_invites')
    .select(
      'id, clan_id, from_character_id, to_character_id, status, created_at, from_character:from_character_id(name, level)'
    )
    .eq('to_character_id', characterId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ClanInviteRow[]
}

export async function sendClanInvite(
  supabase: SupabaseClient,
  clanId: string,
  fromCharacterId: string,
  targetName: string
) {
  const { data: target } = await supabase
    .from('characters')
    .select('id, name')
    .ilike('name', targetName.trim())
    .limit(1)
    .maybeSingle()

  if (!target) return { error: 'Karakter bulunamadı.' }
  if (target.id === fromCharacterId) return { error: 'Kendine davet gönderemezsin.' }

  const { data: existingMember } = await supabase
    .from('clan_members')
    .select('id')
    .eq('character_id', target.id)
    .maybeSingle()

  if (existingMember) return { error: 'Bu karakter zaten bir boyda.' }

  const { error } = await supabase.from('clan_invites').insert({
    clan_id: clanId,
    from_character_id: fromCharacterId,
    to_character_id: target.id,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Bu karaktere zaten davet gönderildi.' }
    return { error: error.message }
  }
  return { ok: true, targetName: target.name }
}

export async function acceptClanInvite(
  supabase: SupabaseClient,
  inviteId: string,
  characterId: string
) {
  const { data: invite } = await supabase
    .from('clan_invites')
    .select('id, clan_id, to_character_id, status')
    .eq('id', inviteId)
    .maybeSingle()

  if (!invite || invite.to_character_id !== characterId || invite.status !== 'pending') {
    return { error: 'Davet bulunamadı.' }
  }

  const { data: clan } = await supabase
    .from('clans')
    .select('id, level')
    .eq('id', invite.clan_id)
    .single()

  const { count } = await supabase
    .from('clan_members')
    .select('*', { count: 'exact', head: true })
    .eq('clan_id', invite.clan_id)

  const cap = 10 + ((clan?.level ?? 1) - 1) * 3
  if ((count ?? 0) >= cap) return { error: 'Boy dolu.' }

  const { error: memberErr } = await supabase.from('clan_members').insert({
    clan_id: invite.clan_id,
    character_id: characterId,
    rank: 'member',
  })

  if (memberErr) return { error: memberErr.message }

  await supabase.from('clan_invites').update({ status: 'accepted' }).eq('id', inviteId)
  return { ok: true, clanId: invite.clan_id as string }
}

export async function rejectClanInvite(supabase: SupabaseClient, inviteId: string) {
  const { error } = await supabase.from('clan_invites').update({ status: 'rejected' }).eq('id', inviteId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function cancelClanInvite(supabase: SupabaseClient, inviteId: string) {
  const { error } = await supabase.from('clan_invites').delete().eq('id', inviteId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function kickClanMember(
  supabase: SupabaseClient,
  memberRowId: string
) {
  const { error } = await supabase.from('clan_members').delete().eq('id', memberRowId)
  if (error) return { error: error.message }
  return { ok: true }
}

export async function setClanMemberRank(
  supabase: SupabaseClient,
  memberRowId: string,
  rank: ClanRank
) {
  const { error } = await supabase.from('clan_members').update({ rank }).eq('id', memberRowId)
  if (error) return { error: error.message }
  return { ok: true }
}

export function inviteTargetName(row: ClanInviteRow) {
  return pickOne(row.to_character)?.name ?? pickOne(row.from_character)?.name ?? '…'
}
