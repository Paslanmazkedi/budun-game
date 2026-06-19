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
  farmZoneFilter?: string | null
): QuestSection[] {
  const buckets: Record<QuestSectionId, QuestRow[]> = {
    test: [],
    campaign: [],
    bonus: [],
    farm: [],
    locked: [],
  }

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
      buckets.locked.push(quest)
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
      subtitle: 'Geliştirici testi — tüm eşya havuzundan şans eseri drop. (Sonra kaldırılacak)',
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
    return sections.filter((s) => s.id === 'test' || s.id === 'campaign' || s.id === 'locked')
  }
  if (tab === 'farm') return sections.filter((s) => s.id === 'farm' || s.id === 'locked')
  if (tab === 'bonus') return sections.filter((s) => s.id === 'bonus')
  return sections
}

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
