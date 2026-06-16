import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getEarnedMedalIcons,
  type ClanLeaderboardRow,
  type ClanMemberScoreRow,
  type ClanScorePeriod,
  type ClanScoreTotals,
  emptyClanTotals,
  sumClanScores,
} from '@/lib/clans'

export function getMonthlyPeriodKey(date = new Date()) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** ISO hafta — PostgreSQL clan_weekly_period_key ile uyumlu */
export function getWeeklyPeriodKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const isoYear = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

export async function resolvePeriodKey(
  supabase: SupabaseClient,
  period: ClanScorePeriod
): Promise<string> {
  if (period === 'all') return 'all'
  if (period === 'weekly') {
    const { data } = await supabase.rpc('clan_weekly_period_key')
    return (data as string) ?? getWeeklyPeriodKey()
  }
  const { data } = await supabase.rpc('clan_monthly_period_key')
  return (data as string) ?? getMonthlyPeriodKey()
}

export async function syncClanScores(supabase: SupabaseClient, clanId: string) {
  const { error } = await supabase.rpc('sync_clan_scores_for_clan', { p_clan_id: clanId })
  if (error) throw new Error(error.message)
}

export async function loadClanMemberScores(
  supabase: SupabaseClient,
  clanId: string,
  period: ClanScorePeriod
): Promise<ClanMemberScoreRow[]> {
  const periodKey = await resolvePeriodKey(supabase, period)
  const { data, error } = await supabase
    .from('clan_member_scores')
    .select(
      'character_id, clan_id, period_type, period_key, wealth, power, defense, level_pts, quest_pts, boss_pts, honor_pts, fame_pts, synced_at'
    )
    .eq('clan_id', clanId)
    .eq('period_type', period)
    .eq('period_key', periodKey)

  if (error) throw new Error(error.message)
  return (data ?? []) as ClanMemberScoreRow[]
}

export async function loadClanTotals(
  supabase: SupabaseClient,
  clanId: string,
  period: ClanScorePeriod
): Promise<ClanScoreTotals> {
  const rows = await loadClanMemberScores(supabase, clanId, period)
  return sumClanScores(rows)
}

export async function loadClanTotalsMap(
  supabase: SupabaseClient,
  clanIds: string[],
  period: ClanScorePeriod
): Promise<Map<string, ClanScoreTotals>> {
  const map = new Map<string, ClanScoreTotals>()
  if (!clanIds.length) return map

  const periodKey = await resolvePeriodKey(supabase, period)
  const { data, error } = await supabase
    .from('clan_member_scores')
    .select(
      'clan_id, wealth, power, defense, level_pts, quest_pts, boss_pts, honor_pts, fame_pts'
    )
    .in('clan_id', clanIds)
    .eq('period_type', period)
    .eq('period_key', periodKey)

  if (error) throw new Error(error.message)

  const grouped = new Map<string, ClanMemberScoreRow[]>()
  for (const row of (data ?? []) as ClanMemberScoreRow[]) {
    const id = row.clan_id
    const list = grouped.get(id) ?? []
    list.push(row)
    grouped.set(id, list)
  }

  for (const id of clanIds) {
    map.set(id, sumClanScores(grouped.get(id) ?? []))
  }
  return map
}

export async function loadClanLeaderboard(
  supabase: SupabaseClient,
  period: ClanScorePeriod,
  limit = 10
): Promise<ClanLeaderboardRow[]> {
  const periodKey = await resolvePeriodKey(supabase, period)
  const { data: scoreRows, error } = await supabase
    .from('clan_member_scores')
    .select('clan_id, honor_pts')
    .eq('period_type', period)
    .eq('period_key', periodKey)

  if (error) throw new Error(error.message)

  const byClan = new Map<string, number>()
  for (const row of scoreRows ?? []) {
    const id = row.clan_id as string
    byClan.set(id, (byClan.get(id) ?? 0) + Number(row.honor_pts))
  }

  const sorted = [...byClan.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
  if (!sorted.length) return []

  const clanIds = sorted.map(([id]) => id)
  const { data: clans } = await supabase
    .from('clans')
    .select('id, name, emblem, level')
    .in('id', clanIds)

  const { data: memberCounts } = await supabase.from('clan_members').select('clan_id')

  const countMap = new Map<string, number>()
  for (const m of memberCounts ?? []) {
    const id = m.clan_id as string
    countMap.set(id, (countMap.get(id) ?? 0) + 1)
  }

  const clanMap = new Map((clans ?? []).map((c) => [c.id as string, c]))
  const totalsMap = await loadClanTotalsMap(supabase, clanIds, period)

  return sorted.map(([clanId, honor], idx) => {
    const c = clanMap.get(clanId)
    const rank = idx + 1
    const totals = totalsMap.get(clanId) ?? emptyClanTotals()
    return {
      clan_id: clanId,
      clan_name: (c?.name as string) ?? '…',
      emblem: (c?.emblem as string) ?? '🏕️',
      level: (c?.level as number) ?? 1,
      member_count: countMap.get(clanId) ?? 0,
      honor_pts: honor,
      rank,
      earned_medal_icons: getEarnedMedalIcons(totals, rank),
    }
  })
}

export async function findClanRank(
  supabase: SupabaseClient,
  clanId: string,
  period: ClanScorePeriod
): Promise<number | null> {
  const board = await loadClanLeaderboard(supabase, period, 500)
  const row = board.find((r) => r.clan_id === clanId)
  return row?.rank ?? null
}
