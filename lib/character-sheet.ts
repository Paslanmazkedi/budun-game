import type { GameCharacter } from '@/lib/characters'
import type { CharacterStats } from '@/lib/character-stats'
import { computePowerScore } from '@/lib/characters'

export type CharacterSheetData = {
  character: GameCharacter
  clan: {
    name: string
    rank: string
    influence: number
    motto: string
    emblem: string
  }
  skills: Array<{
    id: string
    name: string
    icon: string
    level: number
    maxLevel: number
    description: string
    unlocked: boolean
  }>
  equipmentSlots: Array<{ id: string; label: string; icon: string }>
}

export const DEFAULT_CLAN = {
  name: 'Ötüken Muhafızları',
  rank: 'Savaşçı',
  influence: 1450,
  motto: 'Töre neyse o kılınır.',
  emblem: '🏕️',
}

export const EQUIPMENT_SLOT_LABELS = [
  { id: 'helmet', label: 'Miğfer', icon: '⛑️' },
  { id: 'armor', label: 'Zırh', icon: '🛡️' },
  { id: 'gloves', label: 'Eldiven', icon: '🧤' },
  { id: 'boots', label: 'Çizme', icon: '🥾' },
  { id: 'weapon', label: 'Pusat', icon: '🗡️' },
  { id: 'offhand', label: 'Yan El', icon: '🛡️' },
  { id: 'cloak', label: 'Pelerin', icon: '🧣' },
  { id: 'amulet', label: 'Muska', icon: '📿' },
  { id: 'ring', label: 'Yüzük', icon: '💍' },
]

export function buildSkillsForCharacter(level: number) {
  return [
    {
      id: 'bozkir-hucumu',
      name: 'Bozkır Hücumu',
      icon: '⚔️',
      level: level >= 3 ? Math.min(3, Math.floor(level / 3)) : 0,
      maxLevel: 5,
      description: 'Düşmana ani bir cenk darbesi indirir.',
      unlocked: level >= 3,
    },
    {
      id: 'tore-kalkani',
      name: 'Töre Kalkanı',
      icon: '🛡️',
      level: level >= 5 ? 1 : 0,
      maxLevel: 3,
      description: 'Kısa süreliğine alınan hasarı azaltır.',
      unlocked: level >= 5,
    },
    {
      id: 'kut-nefesi',
      name: 'Kut Nefesi',
      icon: '✨',
      level: level >= 7 ? 1 : 0,
      maxLevel: 3,
      description: 'Ruh gücünü yeniler, sefer dayanıklılığını artırır.',
      unlocked: level >= 7,
    },
    {
      id: 'gokboru-cagrisi',
      name: 'Gökbörü Çağrısı',
      icon: '🐺',
      level: level >= 10 ? 1 : 0,
      maxLevel: 1,
      description: 'Boyunun kutlu ruhunu çağırır.',
      unlocked: level >= 10,
    },
  ]
}

export function statsFromCharacter(character: GameCharacter): CharacterStats {
  return {
    strength: character.strength ?? 5,
    agility: character.agility ?? 5,
    intelligence: character.intelligence ?? 5,
  }
}

export function hasStatChanges(
  character: GameCharacter,
  pending: CharacterStats
) {
  return (
    pending.strength !== (character.strength ?? 5) ||
    pending.agility !== (character.agility ?? 5) ||
    pending.intelligence !== (character.intelligence ?? 5)
  )
}

export function buildSheetData(character: GameCharacter): CharacterSheetData {
  return {
    character,
    clan: DEFAULT_CLAN,
    skills: buildSkillsForCharacter(character.level),
    equipmentSlots: EQUIPMENT_SLOT_LABELS,
  }
}

export function pendingPowerScore(stats: CharacterStats) {
  return computePowerScore(stats)
}
