/** Boy (klan) — seviye, emblemler, puanlar */

export type ClanRank = 'leader' | 'officer' | 'member'

export const CLAN_RANK_LABELS: Record<ClanRank, string> = {
  leader: 'Hakan',
  officer: 'Subay',
  member: 'Savaşçı',
}

export const CLAN_CREATE_MIN_LEVEL = 5

/** Seviye 1 = 10 üye, her seviye +3 */
export function getClanMemberCap(clanLevel: number) {
  const level = Math.max(1, clanLevel)
  return 10 + (level - 1) * 3
}

export function canManageClanMembers(rank: string | null) {
  return rank === 'leader' || rank === 'officer'
}

export function canEditClanProfile(rank: string | null) {
  return rank === 'leader'
}

export type ClanEmblemTier = 'basic' | 'standard' | 'premium' | 'animated'

export type ClanEmblemOption = {
  id: string
  emoji: string
  label: string
  minClanLevel: number
  tier: ClanEmblemTier
  /** Seviye 10+ — gelecekte GIF totem desteği */
  animated?: boolean
}

export const CLAN_EMBLEM_TIER_LABELS: Record<ClanEmblemTier, string> = {
  basic: 'Temel',
  standard: 'Seçkin',
  premium: 'Kaliteli',
  animated: 'Hareketli Totem',
}

/** Seviye ile açılan boy simgeleri */
export const CLAN_EMBLEM_CATALOG: ClanEmblemOption[] = [
  { id: 'camp', emoji: '🏕️', label: 'Oba', minClanLevel: 1, tier: 'basic' },
  { id: 'horse', emoji: '🐎', label: 'At', minClanLevel: 1, tier: 'basic' },
  { id: 'bow', emoji: '🏹', label: 'Yay', minClanLevel: 1, tier: 'basic' },
  { id: 'shield', emoji: '🛡️', label: 'Kalkan', minClanLevel: 1, tier: 'basic' },
  { id: 'axe', emoji: '🪓', label: 'Balta', minClanLevel: 2, tier: 'basic' },
  { id: 'wolf', emoji: '🐺', label: 'Kurt', minClanLevel: 2, tier: 'basic' },
  { id: 'fire', emoji: '🔥', label: 'Alev', minClanLevel: 3, tier: 'basic' },
  { id: 'moon', emoji: '🌙', label: 'Ay', minClanLevel: 3, tier: 'basic' },
  { id: 'eagle', emoji: '🦅', label: 'Kartal', minClanLevel: 5, tier: 'standard' },
  { id: 'lion', emoji: '🦁', label: 'Arslan', minClanLevel: 5, tier: 'standard' },
  { id: 'sword', emoji: '⚔️', label: 'Kılıç', minClanLevel: 6, tier: 'standard' },
  { id: 'spear', emoji: '🗡️', label: 'Mızrak', minClanLevel: 6, tier: 'standard' },
  { id: 'crown', emoji: '👑', label: 'Taç', minClanLevel: 8, tier: 'premium' },
  { id: 'gem', emoji: '💎', label: 'Mücevher', minClanLevel: 8, tier: 'premium' },
  { id: 'star', emoji: '⭐', label: 'Yıldız', minClanLevel: 9, tier: 'premium' },
  { id: 'totem-bear', emoji: '🐻', label: 'Ayı Totemi', minClanLevel: 10, tier: 'animated', animated: true },
  { id: 'totem-dragon', emoji: '🐉', label: 'Ejder Totemi', minClanLevel: 10, tier: 'animated', animated: true },
  { id: 'totem-phoenix', emoji: '🦤', label: 'Anka Totemi', minClanLevel: 12, tier: 'animated', animated: true },
  { id: 'totem-storm', emoji: '⛈️', label: 'Fırtına Totemi', minClanLevel: 12, tier: 'animated', animated: true },
]

export function emblemsForClanLevel(level: number) {
  return CLAN_EMBLEM_CATALOG.filter((e) => e.minClanLevel <= level)
}

export function isEmblemAllowedForLevel(emblem: string, level: number) {
  const allowed = emblemsForClanLevel(level)
  return allowed.some((e) => e.emoji === emblem)
}

export function emblemOptionForEmoji(emoji: string) {
  return CLAN_EMBLEM_CATALOG.find((e) => e.emoji === emoji)
}

export type ClanRow = {
  id: string
  name: string
  emblem: string
  motto: string | null
  description: string | null
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

export type ClanScorePeriod = 'all' | 'weekly' | 'monthly'

export const CLAN_SCORE_PERIOD_LABELS: Record<ClanScorePeriod, string> = {
  all: 'Tüm zamanlar',
  weekly: 'Bu hafta',
  monthly: 'Bu ay',
}

export type ClanMemberScoreRow = {
  character_id: string
  clan_id: string
  period_type: ClanScorePeriod
  period_key: string
  wealth: number
  power: number
  defense: number
  level_pts: number
  quest_pts: number
  boss_pts: number
  honor_pts: number
  fame_pts: number
  synced_at?: string
}

export type ClanScoreTotals = {
  wealth: number
  power: number
  defense: number
  level_pts: number
  quest_pts: number
  boss_pts: number
  honor_pts: number
  fame_pts: number
}

export function emptyClanTotals(): ClanScoreTotals {
  return {
    wealth: 0,
    power: 0,
    defense: 0,
    level_pts: 0,
    quest_pts: 0,
    boss_pts: 0,
    honor_pts: 0,
    fame_pts: 0,
  }
}

export function sumClanScores(rows: ClanMemberScoreRow[]): ClanScoreTotals {
  const t = emptyClanTotals()
  for (const r of rows) {
    t.wealth += Number(r.wealth)
    t.power += r.power
    t.defense += r.defense
    t.level_pts += r.level_pts
    t.quest_pts += r.quest_pts
    t.boss_pts += r.boss_pts
    t.honor_pts += r.honor_pts
    t.fame_pts += r.fame_pts
  }
  return t
}

export type ClanLeaderboardRow = {
  clan_id: string
  clan_name: string
  emblem: string
  level: number
  member_count: number
  honor_pts: number
  rank: number
  earned_medal_icons: string[]
}

export function getEarnedMedals(
  totals: ClanScoreTotals,
  clanRank: number | null
): ClanMedalDef[] {
  return CLAN_MEDAL_CATALOG.filter((m) => isClanMedalEarned(m, totals, clanRank))
}

export function getEarnedMedalIcons(totals: ClanScoreTotals, clanRank: number | null): string[] {
  return getEarnedMedals(totals, clanRank).map((m) => m.icon)
}

export const CLAN_SCORE_CATEGORY_LABELS = {
  wealth: 'Akçe',
  power: 'Güç',
  defense: 'Savunma',
  level_pts: 'Seviye',
  quest_pts: 'Görevler',
  boss_pts: 'Boss',
  honor_pts: 'Şan',
  fame_pts: 'Şöhret',
} as const

/** Boy vitrininde gösterilen madalyalar — puan eşikleri */
export type ClanMedalDef = {
  id: string
  icon: string
  label: string
  hint: string
  metric: keyof ClanScoreTotals | 'rank_top3' | 'rank_top1'
  threshold: number
}

export const CLAN_MEDAL_CATALOG: ClanMedalDef[] = [
  { id: 'honor-bronze', icon: '🥉', label: 'Şan Yüzüğü', hint: '500 şan', metric: 'honor_pts', threshold: 500 },
  { id: 'honor-silver', icon: '🥈', label: 'Altın Şan', hint: '2.000 şan', metric: 'honor_pts', threshold: 2000 },
  { id: 'honor-gold', icon: '🥇', label: 'Efsane Boy', hint: '10.000 şan', metric: 'honor_pts', threshold: 10000 },
  { id: 'wealth', icon: '💰', label: 'Zengin Oba', hint: '50.000 akçe', metric: 'wealth', threshold: 50000 },
  { id: 'power', icon: '⚔️', label: 'Cenk Ustası', hint: '500 güç', metric: 'power', threshold: 500 },
  { id: 'defense', icon: '🛡️', label: 'Kale Boyu', hint: '300 savunma', metric: 'defense', threshold: 300 },
  { id: 'quests', icon: '📜', label: 'Sefer Ustası', hint: '20 görev', metric: 'quest_pts', threshold: 20 },
  { id: 'boss', icon: '🐉', label: 'Boss Avcısı', hint: '5 boss', metric: 'boss_pts', threshold: 5 },
  { id: 'fame', icon: '🌟', label: 'Şöhretli', hint: '100 şöhret', metric: 'fame_pts', threshold: 100 },
  { id: 'rank-top3', icon: '🏆', label: 'Üç Büyük', hint: 'Sıralama #3', metric: 'rank_top3', threshold: 3 },
  { id: 'rank-top1', icon: '👑', label: 'Hakanlar', hint: 'Sıralama #1', metric: 'rank_top1', threshold: 1 },
]

export function isClanMedalEarned(
  medal: ClanMedalDef,
  totals: ClanScoreTotals,
  clanRank: number | null
): boolean {
  if (medal.metric === 'rank_top3') return clanRank != null && clanRank <= 3
  if (medal.metric === 'rank_top1') return clanRank === 1
  return totals[medal.metric] >= medal.threshold
}

export function clanMedalProgress(
  medal: ClanMedalDef,
  totals: ClanScoreTotals,
  clanRank: number | null
): number {
  if (medal.metric === 'rank_top3') {
    if (clanRank == null) return 0
    return clanRank <= 3 ? 100 : Math.max(0, 100 - (clanRank - 3) * 15)
  }
  if (medal.metric === 'rank_top1') {
    if (clanRank == null) return 0
    return clanRank === 1 ? 100 : Math.max(0, 100 - (clanRank - 1) * 20)
  }
  const v = totals[medal.metric]
  if (v >= medal.threshold) return 100
  return Math.min(99, Math.floor((v / medal.threshold) * 100))
}

