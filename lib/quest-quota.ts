import { isTestQuest, type QuestRow } from '@/lib/quest-config'

/** Haftalık sefer hakkı — abonelik tier ile artırılabilir (ileride) */
export const WEEKLY_QUEST_LIMIT_FREE = 7
export const WEEKLY_QUEST_LIMIT_SUBSCRIBER = 14

export type QuestQuotaTier = 'free' | 'subscriber'

export function getWeeklyQuestLimit(tier: QuestQuotaTier = 'free'): number {
  return tier === 'subscriber' ? WEEKLY_QUEST_LIMIT_SUBSCRIBER : WEEKLY_QUEST_LIMIT_FREE
}

/** Pazartesi 00:00 (yerel saat) — haftalık sıfırlama */
export function getWeekStartDate(now = new Date()): Date {
  const d = new Date(now)
  const day = d.getDay()
  const daysFromMonday = day === 0 ? 6 : day - 1
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysFromMonday)
  return d
}

export function getWeekStartIso(now = new Date()): string {
  return getWeekStartDate(now).toISOString()
}

export function getWeekResetLabel(now = new Date()): string {
  const start = getWeekStartDate(now)
  const next = new Date(start)
  next.setDate(next.getDate() + 7)
  const diffMs = next.getTime() - now.getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  if (days > 0) return `${days} gün ${hours} saat sonra sıfırlanır`
  return `${hours} saat sonra sıfırlanır`
}

/** Test seferi haftalık kotaya sayılmaz */
export function countsTowardWeeklyQuota(quest: QuestRow): boolean {
  return !isTestQuest(quest)
}

export type WeeklyQuotaState = {
  used: number
  limit: number
  remaining: number
  resetLabel: string
}

export function buildWeeklyQuotaState(
  completedThisWeek: number,
  tier: QuestQuotaTier = 'free'
): WeeklyQuotaState {
  const limit = getWeeklyQuestLimit(tier)
  const used = Math.min(completedThisWeek, limit)
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetLabel: getWeekResetLabel(),
  }
}

export function canStartQuestWithQuota(
  quest: QuestRow,
  quota: WeeklyQuotaState
): boolean {
  if (!countsTowardWeeklyQuota(quest)) return true
  return quota.remaining > 0
}
