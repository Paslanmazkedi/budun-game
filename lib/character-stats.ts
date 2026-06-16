export const STAT_MIN = 5
export const STAT_MAX = 12
export const STAT_BONUS_POOL = 9
export const STAT_POINTS_PER_LEVEL = 2

export type CharacterStats = {
  strength: number
  agility: number
  intelligence: number
}

export const DEFAULT_STATS: CharacterStats = {
  strength: STAT_MIN,
  agility: STAT_MIN,
  intelligence: STAT_MIN,
}

/** Oluşturma + seviye ilerlemesiyle toplam stat bütçesi */
export function getMaxStatTotal(level: number) {
  return STAT_MIN * 3 + STAT_BONUS_POOL + (level - 1) * STAT_POINTS_PER_LEVEL
}

export function getRemainingStatPoints(stats: CharacterStats, level: number) {
  return getMaxStatTotal(level) - (stats.strength + stats.agility + stats.intelligence)
}

export function getUsedBonusPoints(stats: CharacterStats) {
  return (
    stats.strength - STAT_MIN +
    stats.agility - STAT_MIN +
    stats.intelligence - STAT_MIN
  )
}

export function getRemainingBonusPoints(stats: CharacterStats) {
  return STAT_BONUS_POOL - getUsedBonusPoints(stats)
}

export function canIncreaseStat(stats: CharacterStats, key: keyof CharacterStats) {
  return stats[key] < STAT_MAX && getRemainingBonusPoints(stats) > 0
}

export function canDecreaseStat(stats: CharacterStats, key: keyof CharacterStats) {
  return stats[key] > STAT_MIN
}

export function adjustStat(
  stats: CharacterStats,
  key: keyof CharacterStats,
  delta: 1 | -1
): CharacterStats {
  const next = { ...stats }
  if (delta === 1 && canIncreaseStat(stats, key)) {
    next[key] += 1
  } else if (delta === -1 && canDecreaseStat(stats, key)) {
    next[key] -= 1
  }
  return next
}

/** Karakter özeti ekranı — seviye bazlı stat dağıtımı */
export function canIncreaseCharacterStat(
  stats: CharacterStats,
  level: number,
  key: keyof CharacterStats
) {
  return getRemainingStatPoints(stats, level) > 0
}

export function canDecreaseCharacterStat(stats: CharacterStats, key: keyof CharacterStats) {
  return stats[key] > STAT_MIN
}

export function adjustCharacterStat(
  stats: CharacterStats,
  level: number,
  key: keyof CharacterStats,
  delta: 1 | -1
): CharacterStats {
  const next = { ...stats }
  if (delta === 1 && canIncreaseCharacterStat(stats, level, key)) {
    next[key] += 1
  } else if (delta === -1 && canDecreaseCharacterStat(stats, key)) {
    next[key] -= 1
  }
  return next
}

export function deriveVitals(stats: CharacterStats, level: number) {
  return {
    health: stats.strength * 12 + level * 8,
    stamina: stats.agility * 10 + level * 4,
    spirit: stats.intelligence * 10 + level * 4,
  }
}
