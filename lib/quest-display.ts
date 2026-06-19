/**
 * Görev mimarisi (Idle + D&D)
 *
 * Katmanlar:
 * 1. Sefer (standard) — zamanlı idle görevler, tek karakter. Seviye ölçekli ödül.
 * 2. Bonus — sınırlı süreli, yüksek drop. Random spawn değil; DB'de zaman penceresi.
 * 3. Farm — harita alanı + parti boyutu. İleride aktif savaşta kill sayacı / % ilerleme.
 * 4. Level gate — kilidi açılana kadar listede gri; gizlenmez.
 *
 * Random görev havuzu yerine: seviye + farm_zone + quest_type ile katalog.
 * Farm kasması: uzun süre + parti + (gelecek) objective_progress JSON.
 */

import { getFarmZone } from '@/lib/farm-zones'
import {
  isTestQuest,
  normalizeQuestDifficulty,
  normalizeQuestType,
  type QuestRow,
} from '@/lib/quest-config'

export type QuestAvailability = 'available' | 'locked' | 'hidden'

export type QuestSectionId = 'test' | 'campaign' | 'bonus' | 'farm' | 'locked'

export type QuestFilterId = 'all' | 'campaign' | 'farm' | 'bonus'

export type QuestLevelScope = 'suitable' | 'preview' | 'all'

export type QuestDifficultyFilter = 'all' | 'easy' | 'normal' | 'hard'

export type QuestSection = {
  id: QuestSectionId
  title: string
  subtitle: string
  quests: QuestRow[]
  defaultOpen: boolean
}

export const QUEST_FILTER_LABELS: Record<QuestFilterId, string> = {
  all: 'Hepsi',
  campaign: 'Seferler',
  farm: 'Farm',
  bonus: 'Bonus',
}

export const QUEST_LEVEL_SCOPE_LABELS: Record<QuestLevelScope, string> = {
  suitable: 'Seviyeme uygun',
  preview: 'Yakında',
  all: 'Tümü',
}

export const QUEST_DIFFICULTY_FILTER_LABELS: Record<QuestDifficultyFilter, string> = {
  all: 'Tüm zorluk',
  easy: 'Kolay',
  normal: 'Normal',
  hard: 'Zor',
}

/** Görevin önerilen minimum seviyesi */
export function getQuestMinLevel(quest: QuestRow): number {
  if (quest.min_level && quest.min_level > 0) return quest.min_level

  const type = normalizeQuestType(quest.quest_type)
  if (type === 'farm' && quest.farm_zone_id) {
    return getFarmZone(quest.farm_zone_id)?.minCharacterLevel ?? 1
  }

  const diff = normalizeQuestDifficulty(quest.difficulty)
  if (diff === 'hard') return 8
  if (diff === 'normal') return 3
  return 1
}

/** Bu seviyenin üstünde “kolay” içerik gizlenir */
export function getQuestMaxLevel(quest: QuestRow): number {
  const diff = normalizeQuestDifficulty(quest.difficulty)
  if (diff === 'easy') return 7
  if (diff === 'normal') return 14
  return 99
}

export function matchesDifficultyFilter(
  quest: QuestRow,
  filter: QuestDifficultyFilter
): boolean {
  if (filter === 'all' || isTestQuest(quest)) return true
  return normalizeQuestDifficulty(quest.difficulty) === filter
}

export function matchesLevelScope(
  quest: QuestRow,
  characterLevel: number,
  scope: QuestLevelScope
): boolean {
  if (isTestQuest(quest)) return true

  const availability = getQuestAvailability(quest, characterLevel)
  if (availability === 'hidden') return false

  const minLevel = getQuestMinLevel(quest)
  const maxLevel = getQuestMaxLevel(quest)

  if (scope === 'all') return true

  if (scope === 'suitable') {
    if (availability === 'locked') return false
    if (characterLevel > maxLevel + 2) return false
    return true
  }

  if (scope === 'preview') {
    if (availability === 'available' && characterLevel <= maxLevel + 2) return false
    return minLevel <= characterLevel + 4
  }

  return true
}

export type QuestListFilters = {
  typeTab: QuestFilterId
  levelScope: QuestLevelScope
  difficulty: QuestDifficultyFilter
  farmZoneId?: string | null
}

export function filterQuestsForList(
  quests: QuestRow[],
  characterLevel: number,
  filters: QuestListFilters
): QuestRow[] {
  return quests.filter((quest) => {
    if (quest.is_active === false) return false
    if (!matchesLevelScope(quest, characterLevel, filters.levelScope)) return false
    if (!matchesDifficultyFilter(quest, filters.difficulty)) return false

    if (filters.farmZoneId && normalizeQuestType(quest.quest_type) === 'farm') {
      if (quest.farm_zone_id !== filters.farmZoneId) return false
    }

    const type = normalizeQuestType(quest.quest_type)
    if (filters.typeTab === 'campaign') {
      if (isTestQuest(quest)) return true
      return type === 'standard' || type === 'level_gate'
    }
    if (filters.typeTab === 'farm') return type === 'farm' || isTestQuest(quest)
    if (filters.typeTab === 'bonus') return type === 'bonus'

    return true
  })
}

export function getQuestAvailability(
  quest: QuestRow,
  characterLevel: number,
  now = Date.now()
): QuestAvailability {
  if (quest.is_active === false) return 'hidden'

  const type = normalizeQuestType(quest.quest_type)

  if (type === 'bonus' && quest.available_until) {
    if (new Date(quest.available_until).getTime() < now) return 'hidden'
  }
  if (quest.available_from && new Date(quest.available_from).getTime() > now) {
    return 'hidden'
  }

  if (type === 'level_gate' && characterLevel < (quest.min_level ?? 1)) {
    return 'locked'
  }

  if (quest.min_level && characterLevel < quest.min_level && type !== 'standard') {
    return 'locked'
  }

  if (type === 'farm' && quest.farm_zone_id) {
    const zone = getFarmZone(quest.farm_zone_id)
    if (zone && characterLevel < zone.minCharacterLevel) return 'locked'
  }

  return 'available'
}

export function getQuestLockReason(quest: QuestRow, characterLevel: number): string | null {
  if (getQuestAvailability(quest, characterLevel) !== 'locked') return null

  const type = normalizeQuestType(quest.quest_type)
  if (type === 'level_gate' || quest.min_level) {
    return `Seviye ${quest.min_level ?? '?'} gerekir (Sen: ${characterLevel})`
  }
  if (quest.farm_zone_id) {
    const zone = getFarmZone(quest.farm_zone_id)
    if (zone) return `${zone.name} — min. seviye ${zone.minCharacterLevel}`
  }
  return 'Henüz uygun değilsin'
}

export function groupQuestsIntoSections(
  quests: QuestRow[],
  characterLevel: number,
  options?: { farmZoneFilter?: string | null; showLocked?: boolean }
): QuestSection[] {
  const buckets: Record<QuestSectionId, QuestRow[]> = {
    test: [],
    campaign: [],
    bonus: [],
    farm: [],
    locked: [],
  }

  const farmZoneFilter = options?.farmZoneFilter
  const showLocked = options?.showLocked ?? false

  const sorted = [...quests].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
  )

  for (const quest of sorted) {
    if (isTestQuest(quest)) {
      buckets.test.push(quest)
      continue
    }

    const availability = getQuestAvailability(quest, characterLevel)
    if (availability === 'hidden') continue

    if (farmZoneFilter && normalizeQuestType(quest.quest_type) === 'farm') {
      if (quest.farm_zone_id !== farmZoneFilter) continue
    }

    if (availability === 'locked') {
      if (showLocked) buckets.locked.push(quest)
      continue
    }

    const type = normalizeQuestType(quest.quest_type)
    if (type === 'farm') buckets.farm.push(quest)
    else if (type === 'bonus') buckets.bonus.push(quest)
    else buckets.campaign.push(quest)
  }

  const sections: QuestSection[] = []

  if (buckets.test.length) {
    sections.push({
      id: 'test',
      title: 'Test Seferi',
      subtitle: 'Sandbox — tüm eşya havuzu (test sonrası kaldırılacak)',
      quests: buckets.test,
      defaultOpen: true,
    })
  }

  if (buckets.campaign.length) {
    sections.push({
      id: 'campaign',
      title: 'Bozkır Seferleri',
      subtitle: 'Zamanlı görevler — bir seferde tek aktif görev',
      quests: buckets.campaign,
      defaultOpen: true,
    })
  }

  if (buckets.bonus.length) {
    sections.push({
      id: 'bonus',
      title: 'Bonus Fırsatlar',
      subtitle: 'Sınırlı süre — ekstra ganimet şansı',
      quests: buckets.bonus,
      defaultOpen: false,
    })
  }

  if (buckets.farm.length) {
    sections.push({
      id: 'farm',
      title: 'Farm Alanları',
      subtitle: 'Harita kasması — parti boyutu gerekir (ileride aktif savaş + ilerleme)',
      quests: buckets.farm,
      defaultOpen: Boolean(farmZoneFilter),
    })
  }

  if (buckets.locked.length) {
    sections.push({
      id: 'locked',
      title: 'Kilitli Seferler',
      subtitle: 'Seviye atladıkça açılır',
      quests: buckets.locked,
      defaultOpen: false,
    })
  }

  return sections
}

export function filterSectionsByTab(
  sections: QuestSection[],
  tab: QuestFilterId
): QuestSection[] {
  if (tab === 'all') return sections
  if (tab === 'campaign') {
    return sections.filter((s) =>
      s.id === 'test' || s.id === 'campaign' || s.id === 'locked'
    )
  }
  if (tab === 'farm') {
    return sections.filter((s) => s.id === 'test' || s.id === 'farm' || s.id === 'locked')
  }
  if (tab === 'bonus') return sections.filter((s) => s.id === 'bonus')
  return sections
}

/** Test kartı — sade vurgu, göz yormayan */
export const TEST_QUEST_CARD_CLASS =
  'border border-dashed border-stone-600/70 bg-stone-900/60'
export const TEST_QUEST_BADGE_CLASS =
  'border-stone-600/80 bg-stone-800/80 text-stone-400'
export const TEST_QUEST_SECTION_CLASS = 'border-stone-700/60 bg-stone-900/40'

/** Idle sefer sırasında gösterilecek D&D tarzı ilerleme metni */
export function getQuestProgressFlavor(quest: QuestRow, progressPct: number): string {
  const pct = Math.round(progressPct)
  const type = normalizeQuestType(quest.quest_type)
  const diff = normalizeQuestDifficulty(quest.difficulty)

  if (type === 'farm') {
    if (pct < 20) return 'Alana giriş yaptın — grup saf hattını kuruyor.'
    if (pct < 45) return 'Düşman dalgası geliyor — ilk skirmish başladı.'
    if (pct < 70) return 'Yarı yolu geçtin — ganimet izleri yoğunlaşıyor.'
    if (pct < 95) return 'Son baskın — alanı temizliyorsun.'
    return 'Sefer tamamlanmak üzere — dönüş yolu açıldı.'
  }

  if (diff === 'test') {
    return `Test koşusu — ${pct}% (sandbox ödül havuzu aktif)`
  }

  const name = quest.name.toLowerCase()
  if (name.includes('av')) {
    if (pct < 30) return 'İz sürüyorsun — av belirtileri taze.'
    if (pct < 60) return 'Sürüyü buldun — çatışma başladı.'
    return 'Av sona eriyor — ganimet toplanıyor.'
  }
  if (name.includes('kervan')) {
    if (pct < 40) return 'Kervanı koruyorsun — gece nöbeti.'
    return 'Kervan güvende — son viraj.'
  }
  if (name.includes('keşif') || name.includes('kesif')) {
    if (pct < 35) return 'Haritayı açıyorsun — yeni izler.'
    if (pct < 70) return 'Uzak diyara ulaştın — keşif devam.'
    return 'Keşif raporu tamamlanıyor.'
  }

  if (pct < 25) return 'Yola çıktın — bozkır sessiz.'
  if (pct < 55) return 'Sefer ortasında — töre seni koruyor.'
  if (pct < 85) return 'Dönüş yolundasın — ganimet çantası ağırlaşıyor.'
  return 'Oba\'ya varmak üzere.'
}

export { isTestQuest }
