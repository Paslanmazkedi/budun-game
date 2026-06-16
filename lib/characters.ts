import { normalizeGender } from '@/lib/game-assets'

export const ACTIVE_CHARACTER_COOKIE = 'budun_active_character'
export const MAX_CHARACTERS_PER_ACCOUNT = 3

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

/** BDO tarzı slot listesi: dolu karakterler + boş slotlar */
export function buildCharacterSlots(chars: GameCharacter[]) {
  const slots: Array<{ type: 'character'; character: GameCharacter } | { type: 'empty' }> =
    chars.map((c) => ({ type: 'character', character: c }))
  while (slots.length < MAX_CHARACTERS_PER_ACCOUNT) {
    slots.push({ type: 'empty' })
  }
  return slots
}
