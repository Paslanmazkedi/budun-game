'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import ChatPanel from '@/components/ChatPanel'
import { getActiveCharacterId } from '@/lib/active-character-client'
import { getPartyActivityLabel } from '@/lib/parties'
import { isKahramanPath } from '@/lib/nav-routes'

type ChatTab = 'party' | 'clan'

type ChatContext = {
  characterId: string
  partyId: string | null
  clanId: string | null
  partySubtitle: string | null
  clanName: string | null
}

const HIDDEN_PREFIXES = ['/login', '/auth/', '/create-character']
const POPUP_BOTTOM_MOBILE = 'calc(var(--nav-height) + 4.25rem)'

const PARTY_LINKS = [
  { href: '/party', icon: '👥', label: 'Parti', hint: 'Kur, bul, katıl' },
  { href: '/oba/klan', icon: '🏛️', label: 'Boy', hint: 'Klan ve totem' },
]

export default function GameChatDock() {
  const pathname = usePathname()
  const [chatOpen, setChatOpen] = useState(false)
  const [partyMenuOpen, setPartyMenuOpen] = useState(false)
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

  if (isKahramanPath(pathname)) {
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
        : 'Partide değilsin — alttaki Parti menüsünden katıl'
      : hasClan
        ? ctx.clanName
        : 'Boyda değilsin — Parti menüsünden Boy sayfasına git'

  function openChat() {
    if (!chatOpen) refresh()
    setPartyMenuOpen(false)
    setChatOpen((v) => !v)
  }

  function openPartyMenu() {
    setChatOpen(false)
    setPartyMenuOpen((v) => !v)
  }

  return (
    <>
      {partyMenuOpen && (
        <div
          className="fixed inset-0 z-[104]"
          onClick={() => setPartyMenuOpen(false)}
          aria-hidden
        />
      )}

      {partyMenuOpen && (
        <div
          className="fixed z-[105] left-3 w-[min(100%,280px)] rounded-2xl border border-stone-700/80 bg-stone-950/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-chat-slide-up lg:left-[5.25rem] lg:bottom-[var(--nav-height)]"
          style={{ bottom: POPUP_BOTTOM_MOBILE }}
        >
          <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest px-3 pt-3 pb-1">
            Sosyal
          </p>
          <div className="p-2 space-y-1">
            {PARTY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setPartyMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border border-stone-800 bg-stone-900/50 hover:border-cyan-800/40 hover:bg-stone-900 transition active:scale-[0.98]"
              >
                <span className="text-xl w-9 text-center shrink-0">{link.icon}</span>
                <div className="min-w-0">
                  <span className="text-sm font-serif font-bold text-stone-200 block">
                    {link.label}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">{link.hint}</span>
                </div>
                <span className="text-stone-600 text-sm shrink-0">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {chatOpen && (
        <div
          className="fixed inset-x-2 z-[105] max-w-md mx-auto flex flex-col rounded-2xl border border-stone-700/80 bg-stone-950/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.65)] overflow-hidden animate-chat-slide-up"
          style={{ bottom: 'calc(var(--nav-height) + 4.25rem)', maxHeight: 'min(52vh, 420px)' }}
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
                onClick={() => setChatOpen(false)}
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

      <div className="game-chat-dock-fabs">
        <button
          type="button"
          onClick={openPartyMenu}
          className={`game-chat-dock-fab ${
            partyMenuOpen
              ? 'border-cyan-600/60 bg-cyan-950/90 text-cyan-300 shadow-cyan-950/40'
              : 'border-stone-600 bg-stone-950/90 text-stone-300 shadow-black/50 hover:border-cyan-700/50 hover:text-cyan-400'
          }`}
          aria-label={partyMenuOpen ? 'Parti menüsünü kapat' : 'Parti ve boy menüsü'}
          aria-expanded={partyMenuOpen}
        >
          👥
        </button>
        <button
          type="button"
          onClick={openChat}
          className={`game-chat-dock-fab ${
            chatOpen
              ? 'border-amber-600/60 bg-amber-950/90 text-amber-300 shadow-amber-950/40'
              : 'border-stone-600 bg-stone-950/90 text-stone-300 shadow-black/50 hover:border-amber-700/50 hover:text-amber-400'
          }`}
          aria-label={chatOpen ? 'Sohbeti kapat' : 'Sohbeti aç'}
          aria-expanded={chatOpen}
        >
          💬
        </button>
      </div>
    </>
  )
}
