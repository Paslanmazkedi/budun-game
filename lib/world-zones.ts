export type WorldZone = {
  id: string
  name: string
  description: string
  icon: string
  /** Harita üzerinde konum (%) */
  x: number
  y: number
  /** dungeon = parti odası, hub = geçiş, boss = dünya boss alanı */
  type: 'dungeon' | 'hub' | 'boss'
}

/** Göktürk Anadolu — minimal oyun bölgeleri (splash art üzerine yerleşir) */
export const WORLD_ZONES: WorldZone[] = [
  {
    id: 'otuken-ovasi',
    name: 'Ötüken Ovası',
    description: 'Oba yolunun başlangıcı, gezginler buluşur',
    icon: '🏕️',
    x: 28,
    y: 55,
    type: 'hub',
  },
  {
    id: 'kapı-gecidi',
    name: 'Kapı Geçidi',
    description: 'Zindan girişi — parti kur, odaya gir',
    icon: '⚔️',
    x: 48,
    y: 42,
    type: 'dungeon',
  },
  {
    id: 'gok-bori-zindani',
    name: 'Gök Börü Zindanı',
    description: 'Ekip zindanı — kudret ile ganimet',
    icon: '🐺',
    x: 68,
    y: 58,
    type: 'dungeon',
  },
  {
    id: 'demir-vadi',
    name: 'Demir Vadi',
    description: 'Craft malzemeleri ve örs yolu',
    icon: '🔨',
    x: 38,
    y: 68,
    type: 'hub',
  },
]

export const WORLD_BOSS = {
  id: 'dunya-boss',
  name: 'Haftalık Dünya Boss',
  description: 'Tüm oyuncular eş zamanlı katılır; ekip kudretine göre ganimet',
  icon: '🐉',
  mapX: 52,
  mapY: 28,
}

export function getWorldZone(id: string): WorldZone | undefined {
  return WORLD_ZONES.find((z) => z.id === id)
}
