'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import ChatPanel from '@/components/ChatPanel'
import { getActiveCharacterId } from '@/lib/active-character-client'
import { getPartyActivityLabel } from '@/lib/parties'

type ChatTab = 'party' | 'clan'

type ChatContext = {
  characterId: string
  partyId: string | null
  clanId: string | null
  partySubtitle: string | null
  clanName: string | null
}

const HIDDEN_PREFIXES = ['/login', '/auth/', '/create-character']

export default function GameChatDock() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ChatTab>('party')
  const [ctx, setCtx] = useState<ChatContext | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setCtx(null)
      setLoading(false)
      return
    }

    const charId = getActiveCharacterId()
    if (!charId) {
      setCtx(null)
      setLoading(false)
      return
    }

    const { data: char } = await supabase
      .from('characters')
      .select('id')
      .eq('id', charId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!char) {
      setCtx(null)
      setLoading(false)
      return
    }

    const { data: membership } = await supabase
      .from('party_members')
      .select('party_id')
      .eq('character_id', char.id)
      .maybeSingle()

    let partySubtitle: string | null = null
    if (membership?.party_id) {
      const { data: party } = await supabase
        .from('parties')
        .select('activity_tag')
        .eq('id', membership.party_id)
        .maybeSingle()
      const activity = getPartyActivityLabel(party?.activity_tag ?? null)
      partySubtitle = activity ?? 'Aktif parti'
    }

    const { data: clanMem } = await supabase
      .from('clan_members')
      .select('clan_id')
      .eq('character_id', char.id)
      .maybeSingle()

    let clanName: string | null = null
    if (clanMem?.clan_id) {
      const { data: clan } = await supabase
        .from('clans')
        .select('name')
        .eq('id', clanMem.clan_id)
        .maybeSingle()
      clanName = clan?.name ?? null
    }

    setCtx({
      characterId: char.id,
      partyId: membership?.party_id ?? null,
      clanId: clanMem?.clan_id ?? null,
      partySubtitle,
      clanName,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('active') || e.key?.includes('character')) refresh()
    }
    window.addEventListener('storage', onStorage)
    const interval = setInterval(refresh, 15000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [refresh, pathname])

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return null
  }

  if (loading || !ctx) return null

  const hasParty = !!ctx.partyId
  const hasClan = !!ctx.clanId
  const activeChannelId = tab === 'party' ? ctx.partyId : ctx.clanId
  const canChat = tab === 'party' ? hasParty : hasClan

  const partyTabLabel = hasParty ? 'Aktif parti' : 'Parti'
  const clanTabLabel = hasClan && ctx.clanName ? ctx.clanName : 'Boy'

  const statusLine =
    tab === 'party'
      ? hasParty
        ? ctx.partySubtitle
        : 'Partide değilsin — Macera → Parti'
      : hasClan
        ? ctx.clanName
        : 'Boyda değilsin — Oba → Boy'

  return (
    <>
      {open && (
        <div
          className="fixed inset-x-2 z-[105] max-w-md mx-auto flex flex-col rounded-2xl border border-stone-700/80 bg-stone-950/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.65)] overflow-hidden animate-chat-slide-up"
          style={{ bottom: 'calc(var(--nav-height) + 3.5rem)', maxHeight: 'min(52vh, 420px)' }}
        >
          <div className="shrink-0 border-b border-stone-800 bg-stone-900/80">
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => setTab('party')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors ${
                  tab === 'party'
                    ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800/50'
                    : 'text-stone-500 border border-transparent hover:text-stone-300'
                }`}
              >
                👥 {partyTabLabel}
              </button>
              <button
                type="button"
                onClick={() => setTab('clan')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors truncate ${
                  tab === 'clan'
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-800/50'
                    : 'text-stone-500 border border-transparent hover:text-stone-300'
                }`}
              >
                🏛️ {clanTabLabel}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 w-8 h-8 rounded-lg border border-stone-700 text-stone-500 hover:text-stone-300 text-xs"
                aria-label="Sohbeti kapat"
              >
                ✕
              </button>
            </div>
            {statusLine && (
              <p className="text-[9px] font-mono text-stone-500 text-center px-3 pb-2 truncate">
                {statusLine}
              </p>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {!canChat || !activeChannelId ? (
              <p className="text-xs font-mono text-stone-500 text-center py-8 px-4">
                {tab === 'party'
                  ? 'Mesaj yazmak için bir partiye katıl.'
                  : 'Mesaj yazmak için bir boya katıl.'}
              </p>
            ) : (
              <ChatPanel
                channelType={tab}
                channelId={activeChannelId}
                characterId={ctx.characterId}
                dock
              />
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!open) refresh()
          setOpen((v) => !v)
        }}
        className={`fixed z-[105] right-3 w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center text-lg transition-all active:scale-95 ${
          open
            ? 'border-cyan-600/60 bg-cyan-950/90 text-cyan-300 shadow-cyan-950/40'
            : 'border-stone-600 bg-stone-950/90 text-stone-300 shadow-black/50 hover:border-cyan-700/50 hover:text-cyan-400'
        }`}
        style={{ bottom: 'calc(var(--nav-height) + 0.75rem)' }}
        aria-label={open ? 'Sohbeti kapat' : 'Sohbeti aç'}
        aria-expanded={open}
      >
        💬
      </button>
    </>
  )
}
