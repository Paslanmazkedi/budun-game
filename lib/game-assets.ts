/** Oyun görsel yolları — public/images altındaki asset'ler */

export const OTAG_BACKGROUND = '/images/backgrounds/otag-bg.png'
export const MOUNT_YUND = '/images/mounts/yund.png'

/** Sahne splash art — ileride SVG/PNG ile değiştirilecek */
export const MACERA_HUB_BG = '/images/backgrounds/macera-hub.png'
export const MACERA_QUESTS_BG = '/images/backgrounds/macera-quests.png'
export const MACERA_BATTLE_BG = '/images/backgrounds/macera-battle.png'
export const KAHRAMAN_HUB_BG = '/images/backgrounds/kahraman-hub.png'
export const OBA_CRAFT_BG = '/images/backgrounds/oba-craft.png'
export const OBA_KLAN_BG = '/images/backgrounds/oba-klan.png'
export const OBA_IKSIR_BG = '/images/backgrounds/oba-iksir.png'
export const MAP_BG = '/images/backgrounds/map-bozkir.png'
export const WORLD_MAP_BG = '/images/backgrounds/world-map.png'
export const LEADERBOARD_BG = '/images/backgrounds/siralama.png'

export function characterBaseImage(gender: 'er' | 'hatun') {
  return `/images/characters/${gender}-base.png`
}

export function characterHeadImage(headId: string) {
  return `/images/characters/${headId}.png`
}

export function normalizeGender(gender: string | null | undefined): 'er' | 'hatun' {
  return gender?.toLowerCase() === 'hatun' ? 'hatun' : 'er'
}

/** Sahne katmanı — Oba/Macera gibi çok katmanlı ekranlar için */
export type SceneLayer = {
  src?: string
  alt?: string
  className?: string
}

export type ScenePreset = {
  background: string
  backgroundClassName?: string
  overlayClassName?: string
  layers?: SceneLayer[]
}

export const SCENE_PRESETS: Record<string, ScenePreset> = {
  otag: {
    background: OTAG_BACKGROUND,
    backgroundClassName: 'object-cover opacity-90',
    overlayClassName: 'bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950/95',
  },
  maceraHub: {
    background: MACERA_HUB_BG,
    backgroundClassName: 'object-cover opacity-80',
    overlayClassName: 'bg-gradient-to-b from-stone-950/90 via-stone-950/40 to-stone-950/95',
  },
  maceraQuests: {
    background: MACERA_QUESTS_BG,
    backgroundClassName: 'object-cover opacity-75',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/50 to-stone-950/95',
  },
  maceraBattle: {
    background: MACERA_BATTLE_BG,
    backgroundClassName: 'object-cover opacity-75',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/50 to-stone-950/95',
  },
  kahraman: {
    background: KAHRAMAN_HUB_BG,
    backgroundClassName: 'object-cover opacity-60',
    overlayClassName: 'bg-gradient-to-b from-stone-950/90 via-stone-950/70 to-stone-950/95',
  },
  obaCraft: {
    background: OBA_CRAFT_BG,
    backgroundClassName: 'object-cover opacity-80',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/55 to-stone-950/95',
  },
  obaKlan: {
    background: OBA_KLAN_BG,
    backgroundClassName: 'object-cover opacity-80',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/55 to-stone-950/95',
  },
  obaIksir: {
    background: OBA_IKSIR_BG,
    backgroundClassName: 'object-cover opacity-80',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/55 to-stone-950/95',
  },
  map: {
    background: MAP_BG,
    backgroundClassName: 'object-cover opacity-75',
    overlayClassName: 'bg-gradient-to-b from-stone-950/88 via-stone-950/55 to-stone-950/95',
  },
  worldMap: {
    background: WORLD_MAP_BG,
    backgroundClassName: 'object-cover opacity-80',
    overlayClassName: 'bg-gradient-to-b from-stone-950/85 via-stone-950/50 to-stone-950/95',
  },
  leaderboard: {
    background: LEADERBOARD_BG,
    backgroundClassName: 'object-cover opacity-75',
    overlayClassName: 'bg-gradient-to-b from-stone-950/88 via-stone-950/55 to-stone-950/95',
  },
}
