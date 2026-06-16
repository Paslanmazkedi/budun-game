/** Harita farm alanları — parti boyutu slot mantığı */

export type FarmZone = {
  id: string
  name: string
  description: string
  icon: string
  /** Önerilen / minimum parti boyutu */
  partySize: number
  maxPartySize: number
  minCharacterLevel: number
  mapX: number
  mapY: number
}

export const FARM_ZONES: FarmZone[] = [
  {
    id: 'yosun-orman',
    name: 'Yosun Tutmuş Orman',
    description: 'Farm alanı — küçük ekip (3 kişi) ile sefer',
    icon: '🌲',
    partySize: 3,
    maxPartySize: 3,
    minCharacterLevel: 1,
    mapX: 22,
    mapY: 38,
  },
  {
    id: 'bozkir-avcilik',
    name: 'Bozkır Avlak',
    description: 'Orta ekip (4 kişi) — daha iyi ganimet şansı',
    icon: '🏹',
    partySize: 4,
    maxPartySize: 4,
    minCharacterLevel: 5,
    mapX: 62,
    mapY: 35,
  },
  {
    id: 'eski-harabe',
    name: 'Eski Harabe',
    description: 'Büyük ekip (8 kişi) — zor farm, nadir düşüş',
    icon: '🏚️',
    partySize: 8,
    maxPartySize: 8,
    minCharacterLevel: 10,
    mapX: 75,
    mapY: 72,
  },
]

export function getFarmZone(id: string) {
  return FARM_ZONES.find((z) => z.id === id)
}
