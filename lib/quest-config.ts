import { LOOT_TABLE_IDS } from '@/lib/content-loot'

export type QuestDifficultyId = 'test' | 'easy' | 'normal' | 'hard'

export type QuestDifficultyDef = {
  id: QuestDifficultyId
  label: string
  badgeClass: string
  /** Varsayılan süre (sn) — DB’de override edilebilir */
  defaultDuration: number
  defaultXp: number
  defaultGold: number
  /** Eşya düşme şansı (%) */
  itemDropRate: number
}

export const QUEST_DIFFICULTIES: QuestDifficultyDef[] = [
  {
    id: 'test',
    label: 'Test',
    badgeClass: 'bg-stone-700 text-stone-300 border-stone-600',
    defaultDuration: 10,
    defaultXp: 5,
    defaultGold: 5,
    itemDropRate: 90,
  },
  {
    id: 'easy',
    label: 'Kolay',
    badgeClass: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50',
    defaultDuration: 60,
    defaultXp: 25,
    defaultGold: 15,
    itemDropRate: 50,
  },
  {
    id: 'normal',
    label: 'Normal',
    badgeClass: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50',
    defaultDuration: 180,
    defaultXp: 60,
    defaultGold: 40,
    itemDropRate: 62,
  },
  {
    id: 'hard',
    label: 'Zor',
    badgeClass: 'bg-violet-950/50 text-violet-400 border-violet-800/50',
    defaultDuration: 300,
    defaultXp: 120,
    defaultGold: 80,
    itemDropRate: 72,
  },
]

const DIFFICULTY_MAP = new Map(QUEST_DIFFICULTIES.map((d) => [d.id, d]))

export function normalizeQuestDifficulty(value: string | null | undefined): QuestDifficultyId {
  const v = value?.toLowerCase().trim()
  if (v === 'test' || v === 'easy' || v === 'normal' || v === 'hard') return v
  return 'normal'
}

export function getQuestDifficultyDef(id: string | null | undefined) {
  return DIFFICULTY_MAP.get(normalizeQuestDifficulty(id)) ?? DIFFICULTY_MAP.get('normal')!
}

export const DEFAULT_QUEST_LOOT_TABLE_ID = LOOT_TABLE_IDS.quest

export type QuestTypeId = 'standard' | 'bonus' | 'level_gate' | 'farm'

export const QUEST_TYPE_LABELS: Record<QuestTypeId, string> = {
  standard: 'Standart',
  bonus: 'Bonus',
  level_gate: 'Seviye',
  farm: 'Farm',
}

export const QUEST_TYPE_BADGE: Record<QuestTypeId, string> = {
  standard: 'bg-stone-800 text-stone-400 border-stone-700',
  bonus: 'bg-amber-950/60 text-amber-400 border-amber-700/50',
  level_gate: 'bg-violet-950/50 text-violet-400 border-violet-800/50',
  farm: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50',
}

export function normalizeQuestType(value: string | null | undefined): QuestTypeId {
  const v = value?.toLowerCase().trim()
  if (v === 'bonus' || v === 'level_gate' || v === 'farm' || v === 'standard') return v
  return 'standard'
}

export function isQuestVisibleForCharacter(
  quest: QuestRow,
  characterLevel: number,
  now = Date.now()
) {
  if (quest.is_active === false) return false
  const type = normalizeQuestType(quest.quest_type)
  if (type === 'level_gate' && characterLevel < (quest.min_level ?? 1)) return false
  if (type === 'bonus' && quest.available_until) {
    if (new Date(quest.available_until).getTime() < now) return false
  }
  if (quest.available_from && new Date(quest.available_from).getTime() > now) return false
  return true
}

export type QuestRow = {
  id: string
  name: string
  duration_seconds: number
  reward_xp: number
  reward_gold: number
  difficulty?: string | null
  description?: string | null
  loot_table_id?: string | null
  item_drop_rate?: number | null
  sort_order?: number | null
  is_active?: boolean | null
  quest_type?: string | null
  min_level?: number | null
  farm_zone_id?: string | null
  party_size_required?: number | null
  available_from?: string | null
  available_until?: string | null
}

export function resolveQuestDropRate(quest: QuestRow) {
  if (quest.item_drop_rate != null && quest.item_drop_rate > 0) return quest.item_drop_rate
  return getQuestDifficultyDef(quest.difficulty).itemDropRate
}

export function resolveQuestLootTableId(quest: QuestRow) {
  return quest.loot_table_id ?? DEFAULT_QUEST_LOOT_TABLE_ID
}
