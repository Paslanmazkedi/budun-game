import type { SupabaseClient } from '@supabase/supabase-js'
import { CLAN_RANK_LABELS, type ClanRank } from '@/lib/clans'

export type CharacterClanSummary = {
  name: string
  emblem: string
  motto: string
  rank: string
  influence: number
  level: number
}

export async function loadCharacterClanSummary(
  supabase: SupabaseClient,
  characterId: string
): Promise<CharacterClanSummary | null> {
  const { data: membership } = await supabase
    .from('clan_members')
    .select('rank, clan_id')
    .eq('character_id', characterId)
    .maybeSingle()

  if (!membership?.clan_id) return null

  const { data: clan } = await supabase
    .from('clans')
    .select('name, emblem, motto, level')
    .eq('id', membership.clan_id)
    .maybeSingle()

  if (!clan) return null

  const { data: scoreRows } = await supabase
    .from('clan_member_scores')
    .select('honor_pts')
    .eq('clan_id', membership.clan_id)
    .eq('period_type', 'all')
    .eq('period_key', 'all')

  const influence = (scoreRows ?? []).reduce((sum, row) => sum + Number(row.honor_pts ?? 0), 0)
  const rankKey = membership.rank as ClanRank

  return {
    name: clan.name as string,
    emblem: (clan.emblem as string) ?? '🏕️',
    motto: (clan.motto as string) ?? '',
    rank: CLAN_RANK_LABELS[rankKey] ?? membership.rank,
    influence,
    level: (clan.level as number) ?? 1,
  }
}
