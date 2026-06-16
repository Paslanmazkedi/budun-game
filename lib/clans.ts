/** Boy (klan) — seviye ile büyüyen üye limiti */

export type ClanRank = 'leader' | 'officer' | 'member'

export const CLAN_RANK_LABELS: Record<ClanRank, string> = {
  leader: 'Hakan',
  officer: 'Subay',
  member: 'Savaşçı',
}

/** Seviye 1 = 10 üye, her seviye +3 */
export function getClanMemberCap(clanLevel: number) {
  const level = Math.max(1, clanLevel)
  return 10 + (level - 1) * 3
}

export const CLAN_CREATE_MIN_LEVEL = 5

export type ClanRow = {
  id: string
  name: string
  emblem: string
  motto: string | null
  leader_character_id: string
  level: number
  xp: number
  created_at?: string
}

export type ClanMemberRow = {
  id: string
  clan_id: string
  character_id: string
  rank: ClanRank
  joined_at: string
  characters?: { name: string; level: number } | { name: string; level: number }[] | null
}
