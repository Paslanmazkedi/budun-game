/** Sohbet kanalları */

export type ChatChannelType = 'party' | 'clan'

export type ChatMessageRow = {
  id: string
  channel_type: ChatChannelType
  channel_id: string
  character_id: string
  body: string
  created_at: string
  characters?: { name: string } | { name: string }[] | null
}

export const CHAT_MAX_LENGTH = 500

/** UI + DB trim trigger ile aynı — son N mesaj */
export const CHAT_CHANNEL_MAX_MESSAGES = 30

/** İstemci spam önleme (ms) — DB trigger yedek */
export const CHAT_SEND_COOLDOWN_MS = 2000

export function formatChatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
