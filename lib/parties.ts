/** Parti — max 8 kişi */

export const PARTY_MAX_SIZE = 8

export type PartyStatus = 'open' | 'in_run' | 'closed'

export const PARTY_STATUS_LABELS: Record<PartyStatus, string> = {
  open: 'Açık',
  in_run: 'Seferde',
  closed: 'Kapalı',
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
  created_at: string
  characters?: { name: string } | { name: string }[] | null
}

export type PartyMemberRow = {
  party_id: string
  character_id: string
  joined_at: string
  characters?: { name: string; level: number } | { name: string; level: number }[] | null
}

export function partySlotsUsed(count: number, max: number) {
  return `${count}/${max}`
}
