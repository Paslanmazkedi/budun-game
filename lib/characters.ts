import { normalizeGender } from '@/lib/game-assets'

export const ACTIVE_CHARACTER_COOKIE = 'budun_active_character'
export const MAX_CHARACTERS_PER_ACCOUNT = 3
export const CHARACTER_NAME_MIN_LENGTH = 2
export const CHARACTER_NAME_MAX_LENGTH = 15

export function validateCharacterName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < CHARACTER_NAME_MIN_LENGTH || trimmed.length > CHARACTER_NAME_MAX_LENGTH) {
    return `Karakter adı ${CHARACTER_NAME_MIN_LENGTH}–${CHARACTER_NAME_MAX_LENGTH} karakter olmalı.`
  }
  return null
}

export type GameCharacter = {
  id: string
  user_id: string
  name: string
  gender: string
  class: string
  level: number
  xp: number
  gold: number
  strength?: number
  agility?: number
  intelligence?: number
  power_score?: number
  /** @deprecated inventory_slot_capacity kullanın */
  bag_unlock_level?: number
  /** Taşınabilir max heybe slotu (20–96) */
  inventory_slot_capacity?: number
  /** UI grid görünür slot sayısı (<= capacity) */
  inventory_display_slots?: number
}

export function genderLabel(gender: string) {
  return normalizeGender(gender) === 'hatun' ? 'Hatun' : 'Er'
}

export function resolveActiveCharacter(
  characters: GameCharacter[],
  preferredId?: string | null
): GameCharacter | null {
  if (!characters.length) return null
  if (preferredId) {
    const match = characters.find((c) => c.id === preferredId)
    if (match) return match
  }
  return characters[0]
}

export function canCreateAnotherCharacter(chars: GameCharacter[]) {
  return chars.length < MAX_CHARACTERS_PER_ACCOUNT
}

export function computePowerScore(stats: {
  strength: number
  agility: number
  intelligence: number
}) {
  return stats.strength * 3 + stats.agility * 2 + stats.intelligence * 2
}

export function getCharacterStats(character: GameCharacter) {
  return {
    strength: character.strength ?? 5,
    agility: character.agility ?? 5,
    intelligence: character.intelligence ?? 5,
  }
}

import type { EquipmentBonuses } from '@/lib/equipment-stats'
import {
  computeEffectivePower,
  EMPTY_EQUIPMENT_BONUSES,
} from '@/lib/equipment-stats'

export function getCharacterPower(
  character: GameCharacter,
  equipmentBonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
) {
  const hasEquipmentBonus = Object.values(equipmentBonuses).some((v) => v > 0)
  if (!hasEquipmentBonus && character.power_score != null) {
    return character.power_score
  }
  return computeEffectivePower(character, equipmentBonuses)
}

/** Savunma özeti — taban + ekipman savunması */
export function computeDefenseScore(
  character: GameCharacter,
  equipmentBonuses: EquipmentBonuses = EMPTY_EQUIPMENT_BONUSES
) {
  const base = Math.floor(
    getCharacterStats(character).strength * 2 +
      getCharacterStats(character).agility +
      (character.level ?? 1) * 3
  )
  return base + equipmentBonuses.defense
}

export function xpTargetForLevel(level: number) {
  return Math.floor(level * 50 * (1 + level * 0.15))
}

/** BDO tarzı slot listesi: dolu karakterler + boş slotlar */
export function buildCharacterSlots(chars: GameCharacter[]) {
  const slots: Array<{ type: 'character'; character: GameCharacter } | { type: 'empty' }> =
    chars.map((c) => ({ type: 'character', character: c }))
  while (slots.length < MAX_CHARACTERS_PER_ACCOUNT) {
    slots.push({ type: 'empty' })
  }
  return slots
}
