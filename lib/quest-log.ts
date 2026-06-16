import { getPhase1ItemById } from '@/lib/item-catalog'
import { getQuestDifficultyDef } from '@/lib/quest-config'
import { getRarityLabel } from '@/lib/item-rarity'

export type QuestJournalEntry = {
  id: string
  questId: string
  questName: string
  difficultyLabel: string
  difficultyBadgeClass: string
  status: string
  startedAt: string
  endsAt: string
  completedAt: string | null
  durationSeconds: number
  rewardXp: number | null
  rewardGold: number | null
  loot: {
    id: string
    name: string
    emoji: string
    rarity: string
    rarityLabel: string
  } | null
}

type RawQuestLogRow = {
  id: string
  quest_id: string
  status: string
  started_at: string
  ends_at: string
  completed_at?: string | null
  reward_xp_granted?: number | null
  reward_gold_granted?: number | null
  loot_item_template_id?: string | null
  quests?: { name: string; difficulty?: string | null } | { name: string; difficulty?: string | null }[] | null
  item_templates?: {
    id: string
    name: string
    emoji?: string | null
    rarity: string
  } | {
    id: string
    name: string
    emoji?: string | null
    rarity: string
  }[] | null
}

function pickRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export function calcQuestDurationSeconds(
  startedAt: string,
  completedAt: string | null | undefined,
  endsAt: string
) {
  const start = new Date(startedAt).getTime()
  const endMs = completedAt
    ? new Date(completedAt).getTime()
    : new Date(endsAt).getTime()
  return Math.max(0, Math.round((endMs - start) / 1000))
}

export function formatQuestDuration(seconds: number) {
  if (seconds < 60) return `${seconds} sn`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m} dk ${s} sn` : `${m} dk`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} sa ${rm} dk` : `${h} sa`
}

export function formatJournalDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function serializeQuestJournalRows(rows: RawQuestLogRow[]): QuestJournalEntry[] {
  return rows.map((row) => {
    const quest = pickRelation(row.quests)
    const itemRow = pickRelation(row.item_templates)
    const catalogItem = row.loot_item_template_id
      ? getPhase1ItemById(row.loot_item_template_id)
      : null
    const diff = getQuestDifficultyDef(quest?.difficulty)
    const completedAt = row.completed_at ?? null

    const lootFromDb = itemRow
    const loot = row.loot_item_template_id
      ? {
          id: row.loot_item_template_id,
          name: lootFromDb?.name ?? catalogItem?.name ?? 'Eşya',
          emoji: lootFromDb?.emoji ?? catalogItem?.emoji ?? '🎁',
          rarity: lootFromDb?.rarity ?? catalogItem?.rarity ?? 'COMMON',
          rarityLabel: getRarityLabel(lootFromDb?.rarity ?? catalogItem?.rarity ?? 'COMMON'),
        }
      : null

    return {
      id: row.id,
      questId: row.quest_id,
      questName: quest?.name ?? 'Bilinmeyen Sefer',
      difficultyLabel: diff.label,
      difficultyBadgeClass: diff.badgeClass,
      status: row.status,
      startedAt: row.started_at,
      endsAt: row.ends_at,
      completedAt,
      durationSeconds: calcQuestDurationSeconds(row.started_at, completedAt, row.ends_at),
      rewardXp: row.reward_xp_granted ?? null,
      rewardGold: row.reward_gold_granted ?? null,
      loot,
    }
  })
}

export const QUEST_JOURNAL_SELECT = `
  id,
  quest_id,
  status,
  started_at,
  ends_at,
  completed_at,
  reward_xp_granted,
  reward_gold_granted,
  loot_item_template_id,
  quests (name, difficulty),
  item_templates:loot_item_template_id (id, name, emoji, rarity)
`
