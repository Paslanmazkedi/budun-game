/** Parti — max 8 kişi */

export const PARTY_MAX_SIZE = 8

export type PartyStatus = 'open' | 'in_run' | 'closed'

export const PARTY_STATUS_LABELS: Record<PartyStatus, string> = {
  open: 'Açık',
  in_run: 'Seferde',
  closed: 'Kapalı',
}

/** Parti listesi / filtre — içerik ekibi select ile işaretler */
export const PARTY_ACTIVITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Alan belirtme' },
  { value: 'yosun-orman', label: '🌲 Yosun Tutmuş Orman' },
  { value: 'bozkir-avcilik', label: '🏹 Bozkır Avlak' },
  { value: 'eski-harabe', label: '🏚️ Eski Harabe' },
  { value: 'gorev', label: '📜 Görev / sefer' },
  { value: 'zindan', label: '🏰 Zindan' },
  { value: 'serbest', label: '🌤️ Serbest' },
]

export function getPartyActivityLabel(tag: string | null | undefined) {
  if (!tag) return null
  return PARTY_ACTIVITY_OPTIONS.find((o) => o.value === tag)?.label ?? tag
}

export type PartyRow = {
  id: string
  leader_character_id: string
  zone_id: string | null
  quest_id: string | null
  max_size: number
  status: PartyStatus
  is_public: boolean
  join_policy?: string | null
  description?: string | null
  activity_tag?: string | null
  created_at: string
  characters?: { name: string } | { name: string }[] | null
}

export type PartyMemberRow = {
  party_id: string
  character_id: string
  joined_at: string
  characters?: { name: string; level: number } | { name: string; level: number }[] | null
}

export function partySlotsUsed(count: number, max = PARTY_MAX_SIZE) {
  return `${count}/${max}`
}
