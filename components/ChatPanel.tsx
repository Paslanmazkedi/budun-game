'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  CHAT_CHANNEL_MAX_MESSAGES,
  CHAT_MAX_LENGTH,
  CHAT_SEND_COOLDOWN_MS,
  formatChatTime,
  type ChatChannelType,
  type ChatMessageRow,
} from '@/lib/chat'
import { pickOne } from '@/lib/friends'

type ChatPanelProps = {
  channelType: ChatChannelType
  channelId: string
  characterId: string
  title?: string
}

export default function ChatPanel({
  channelType,
  channelId,
  characterId,
  title = 'Sohbet',
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const lastSendRef = useRef(0)

  const loadMessages = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_messages')
      .select('id, channel_type, channel_id, character_id, body, created_at, characters(name)')
      .eq('channel_type', channelType)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(CHAT_CHANNEL_MAX_MESSAGES)

    const rows = (data ?? []) as ChatMessageRow[]
    setMessages(rows.reverse())
  }, [channelType, channelId])

  useEffect(() => {
    loadMessages()
    const supabase = createClient()
    const channel = supabase
      .channel(`${channelType}-chat-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    const poll = setInterval(loadMessages, 5000)
    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [channelType, channelId, loadMessages])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function sendMessage() {
    const body = text.trim()
    if (!body || busy) return

    const now = Date.now()
    if (now - lastSendRef.current < CHAT_SEND_COOLDOWN_MS) return
    lastSendRef.current = now

    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('chat_messages').insert({
      channel_type: channelType,
      channel_id: channelId,
      character_id: characterId,
      body: body.slice(0, CHAT_MAX_LENGTH),
    })
    if (!error) setText('')
    setBusy(false)
    loadMessages()
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50 overflow-hidden">
      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
        {title}
      </p>
      <div
        ref={listRef}
        className="h-40 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <p className="text-[10px] font-mono text-stone-600 text-center py-4">
            Henüz mesaj yok — ilk yazan sen ol.
          </p>
        ) : (
          messages.map((m) => {
            const ch = pickOne(m.characters)
            const mine = m.character_id === characterId
            return (
              <div key={m.id} className={`text-xs ${mine ? 'text-cyan-300/90' : 'text-stone-400'}`}>
                <span className="font-mono text-[10px] text-stone-600">
                  {formatChatTime(m.created_at)}
                </span>
                <span className="font-bold text-stone-300 ml-1.5">{ch?.name ?? '…'}</span>
                <span className="ml-1">{m.body}</span>
              </div>
            )
          })
        )}
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-stone-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Mesaj yaz…"
          maxLength={CHAT_MAX_LENGTH}
          className="flex-1 min-w-0 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono"
        />
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={sendMessage}
          className="shrink-0 px-3 py-2 rounded-lg bg-stone-800 text-cyan-400 text-[10px] font-mono font-bold disabled:opacity-40"
        >
          Gönder
        </button>
      </div>
    </div>
  )
}
