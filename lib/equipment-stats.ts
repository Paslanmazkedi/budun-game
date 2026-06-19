import type { CharacterStats } from '@/lib/character-stats'
import { deriveVitals } from '@/lib/character-stats'
import {
  computeDefenseScore,
  computePowerScore,
  getCharacterStats,
  type GameCharacter,
} from '@/lib/characters'
import { getItemComparableStats } from '@/lib/item-stats'
import type { InventoryItem } from '@/lib/inventory'

export type EquipmentBonuses = {
  strength: number
  agility: number
  intelligence: number
  health: number
  attack: number
  defense: number
}

export const EMPTY_EQUIPMENT_BONUSES: EquipmentBonuses = {
  strength: 0,
  agility: 0,
  intelligence: 0,
  health: 0,
  attack: 0,
  defense: 0,
}

const COSMETIC_EQUIP_SLOTS = new Set([
  'mount',
  'binek',
  'cloak',
  'pelerin',
  'costume',
  'kostum',
])

function addStatToBonuses(bonuses: EquipmentBonuses, label: string, value: number) {
  switch (label) {
    case 'Güç Bonusu':
    case 'Güç':
      bonuses.strength += value
      break
    case 'Çeviklik Bonusu':
      bonuses.agility += value
      break
    case 'Zeka Bonusu':
      bonuses.intelligence += value
      break
    case 'Can Bonusu':
      bonuses.health += value
      break
    case 'Saldırı':
      bonuses.attack += value
      break
    case 'Savunma':
      bonuses.defense += value
      break
    default:
      break
  }
}

/** Kuşanılmış eşyalardan toplam bonus — item tooltip statlarıyla aynı kaynak */
export function aggregateEquipmentBonuses(items: InventoryItem[]): EquipmentBonuses {
  const totals: EquipmentBonuses = { ...EMPTY_EQUIPMENT_BONUSES }

  for (const item of items) {
    if (!item.equipped_slot) continue
    const slotKey = item.equipped_slot.toLowerCase()
    if (COSMETIC_EQUIP_SLOTS.has(slotKey)) continue

    const stats = getItemComparableStats(
      item.template.rarity,
      item.template.slot,
      item.template.name
    )
    for (const stat of stats) {
      addStatToBonuses(totals, stat.label, stat.value)
    }
  }

  return totals
}

export function applyEquipmentToStats(
  base: CharacterStats,
  bonuses: EquipmentBonuses
): CharacterStats {
  return {
    strength: base.strength + bonuses.strength,
    agility: base.agility + bonuses.agility,
    intelligence: base.intelligence + bonuses.intelligence,
  }
}

export function computeEffectivePower(
  character: GameCharacter,
  bonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
): number {
  const baseStats = getCharacterStats(character)
  const effective = applyEquipmentToStats(baseStats, bonuses)
  return computePowerScore(effective) + bonuses.attack
}

export function computeEffectivePowerFromStats(
  stats: CharacterStats,
  bonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
): number {
  const effective = applyEquipmentToStats(stats, bonuses)
  return computePowerScore(effective) + bonuses.attack
}

export function computeEffectiveDefense(
  character: GameCharacter,
  bonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
): number {
  return computeDefenseScore(character) + bonuses.defense
}

export function deriveEffectiveVitals(
  baseStats: CharacterStats,
  level: number,
  bonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
) {
  const effective = applyEquipmentToStats(baseStats, bonuses)
  const vitals = deriveVitals(effective, level)
  return {
    ...vitals,
    health: vitals.health + bonuses.health,
  }
}

export function getEquippedItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => Boolean(item.equipped_slot))
}
