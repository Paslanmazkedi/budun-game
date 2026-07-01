import type { GameCharacter } from '@/lib/characters'

export type BagId = 'bag1' | 'bag2' | 'bag3'

/** Her çantadaki slot sayısı */
export const BAG_SLOT_COUNT = 30

export type BagDefinition = {
  id: BagId
  label: string
  icon: string
  unlockGold: number | null
  unlockLevel: number
}

export const BAG_DEFINITIONS: BagDefinition[] = [
  { id: 'bag1', label: 'Çanta I', icon: '🎒', unlockGold: null, unlockLevel: 1 },
  { id: 'bag2', label: 'Çanta II', icon: '📦', unlockGold: 800, unlockLevel: 2 },
  { id: 'bag3', label: 'Çanta III', icon: '🧳', unlockGold: 2000, unlockLevel: 3 },
]

export const DEFAULT_BAG_ID: BagId = 'bag1'

export function normalizeBagId(value?: string | null): BagId {
  if (value === 'bag2' || value === 'bag3') return value
  return 'bag1'
}

export function getBagUnlockLevel(character: GameCharacter): number {
  const level = character.bag_unlock_level
  if (typeof level === 'number' && level >= 1 && level <= 3) return level
  return 1
}

export function getUnlockedBagIds(character: GameCharacter): BagId[] {
  const level = getBagUnlockLevel(character)
  return BAG_DEFINITIONS.filter((b) => b.unlockLevel <= level).map((b) => b.id)
}

export function getTotalBagCapacity(character: GameCharacter): number {
  return getUnlockedBagIds(character).length * BAG_SLOT_COUNT
}

/** Birleşik heybe kapasitesi (çanta sekmesi yok) */
export function getUnifiedInventoryCapacity(unlockLevel: number): number {
  const level = Math.min(3, Math.max(1, unlockLevel))
  return level * BAG_SLOT_COUNT
}

export function getNextBagUnlock(unlockLevel: number): BagDefinition | null {
  const next = BAG_DEFINITIONS.find((b) => b.unlockLevel === unlockLevel + 1)
  return next ?? null
}

export function isBagUnlocked(character: GameCharacter, bagId: BagId): boolean {
  return getUnlockedBagIds(character).includes(bagId)
}

export function getBagDefinition(bagId: BagId) {
  return BAG_DEFINITIONS.find((b) => b.id === bagId)
}

export function countBagItems(
  items: Array<{ equipped_slot?: string | null; bag_id?: string | null }>,
  bagId: BagId
) {
  return items.filter(
    (i) => !i.equipped_slot && normalizeBagId(i.bag_id) === bagId
  ).length
}

export function getUnlockedBagIdsFromLevel(level: number): BagId[] {
  return BAG_DEFINITIONS.filter((b) => b.unlockLevel <= level).map((b) => b.id)
}
