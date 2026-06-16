import type { SupabaseClient } from '@supabase/supabase-js'
import type { ItemTemplateDef } from '@/lib/item-catalog'
import { ALL_PHASE1_ITEMS } from '@/lib/item-catalog'
import {
  type ContentLootSource,
  getCatalogForSource,
  getDefaultDropRate,
  getLootTableId,
} from '@/lib/content-loot'
import { pickWeightedLootItem, type LootTableRow } from '@/lib/quest-loot'

export type GrantLootResult = {
  granted: boolean
  item: ItemTemplateDef | null
  error?: string
}

export type GrantLootOptions = {
  lootTableId: string
  dropRatePercent: number
  catalog?: ItemTemplateDef[]
  bagId?: string
}

/** Seviye hesabı — QuestList ile paylaşılır */
export function calcCharacterLevel(totalXp: number) {
  let level = 1
  let remaining = totalXp
  while (true) {
    const needed = Math.floor(level * 50 * (1 + level * 0.15))
    if (remaining < needed) break
    remaining -= needed
    level++
    if (level >= 50) break
  }
  return level
}

export async function fetchLootTableRows(
  supabase: SupabaseClient,
  lootTableId: string
): Promise<LootTableRow[]> {
  const { data, error } = await supabase
    .from('loot_table_items')
    .select('item_template_id, drop_chance, item_templates(*)')
    .eq('loot_table_id', lootTableId)

  if (error) throw new Error(error.message)
  return (data ?? []) as LootTableRow[]
}

export async function grantRandomLoot(
  supabase: SupabaseClient,
  characterId: string,
  options: GrantLootOptions
): Promise<GrantLootResult> {
  const catalog = options.catalog ?? ALL_PHASE1_ITEMS
  const roll = Math.random() * 100
  if (roll > options.dropRatePercent) {
    return { granted: false, item: null }
  }

  let rows: LootTableRow[]
  try {
    rows = await fetchLootTableRows(supabase, options.lootTableId)
  } catch (err) {
    return {
      granted: false,
      item: null,
      error: err instanceof Error ? err.message : 'Loot tablosu okunamadı.',
    }
  }

  if (!rows.length) {
    return { granted: false, item: null, error: 'Loot tablosu boş.' }
  }

  const picked = pickWeightedLootItem(rows, catalog)
  if (!picked) {
    return { granted: false, item: null, error: 'Uygun eşya seçilemedi.' }
  }

  const { error } = await supabase.from('character_items').insert({
    character_id: characterId,
    item_template_id: picked.id,
    bag_id: options.bagId ?? 'bag1',
  })

  if (error) {
    return { granted: false, item: null, error: error.message }
  }

  return { granted: true, item: picked }
}

/** Zindan / grup zindan / dünya boss — ileride UI buradan çağırır */
export async function grantContentSourceLoot(
  supabase: SupabaseClient,
  characterId: string,
  source: ContentLootSource,
  dropRateOverride?: number
): Promise<GrantLootResult> {
  return grantRandomLoot(supabase, characterId, {
    lootTableId: getLootTableId(source),
    dropRatePercent: dropRateOverride ?? getDefaultDropRate(source),
    catalog: getCatalogForSource(source),
  })
}

export type QuestRewardGrantInput = {
  characterId: string
  questLogId: string
  rewardXp: number
  rewardGold: number
  lootTableId: string
  itemDropRate: number
  newXp: number
  newGold: number
  newLevel: number
  lootItemTemplateId?: string | null
}

async function updateQuestLogCompleted(
  supabase: SupabaseClient,
  questLogId: string,
  input: QuestRewardGrantInput
) {
  const fullPayload = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    reward_xp_granted: input.rewardXp,
    reward_gold_granted: input.rewardGold,
    loot_item_template_id: input.lootItemTemplateId ?? null,
  }

  const { data, error } = await supabase
    .from('quest_log')
    .update(fullPayload)
    .eq('id', questLogId)
    .select('id, status')
    .maybeSingle()

  if (!error && data?.status === 'completed') return

  const minimalPayload = {
    status: 'completed',
    completed_at: new Date().toISOString(),
  }

  const retry = await supabase
    .from('quest_log')
    .update(minimalPayload)
    .eq('id', questLogId)
    .select('id, status')
    .maybeSingle()

  if (retry.error) {
    throw new Error(retry.error.message)
  }

  if (!retry.data || retry.data.status !== 'completed') {
    throw new Error(
      'Görev kaydı güncellenemedi. rls-quests.sql dosyasını çalıştırın.'
    )
  }
}

/** Görev ödülü: quest_log’a kayıt + karakter güncelle */
export async function persistQuestCompletion(
  supabase: SupabaseClient,
  input: QuestRewardGrantInput
) {
  await updateQuestLogCompleted(supabase, input.questLogId, input)

  const { data, error } = await supabase
    .from('characters')
    .update({ xp: input.newXp, gold: input.newGold, level: input.newLevel })
    .eq('id', input.characterId)
    .select('id, xp, gold, level')
    .maybeSingle()

  if (error) throw new Error(error.message)

  if (!data) {
    throw new Error('Karakter ödülü kaydedilemedi. Giriş ve yetki kontrol edin.')
  }
}
