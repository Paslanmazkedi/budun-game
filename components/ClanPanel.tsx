'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import ChatPanel from '@/components/ChatPanel'
import {
  CLAN_CREATE_MIN_LEVEL,
  CLAN_RANK_LABELS,
  getClanMemberCap,
  type ClanMemberRow,
  type ClanRow,
} from '@/lib/clans'

type ClanPanelProps = {
  character: { id: string; name: string; level: number }
}

function pickChar<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

export default function ClanPanel({ character }: ClanPanelProps) {
  const [clan, setClan] = useState<ClanRow | null>(null)
  const [members, setMembers] = useState<ClanMemberRow[]>([])
  const [myRank, setMyRank] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [createName, setCreateName] = useState('')
  const [createMotto, setCreateMotto] = useState('')
  const [createEmblem, setCreateEmblem] = useState('🏕️')
  const [joinName, setJoinName] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: membership } = await supabase
      .from('clan_members')
      .select('clan_id, rank')
      .eq('character_id', character.id)
      .maybeSingle()

    if (!membership) {
      setClan(null)
      setMembers([])
      setMyRank(null)
      setLoading(false)
      return
    }

    setMyRank(membership.rank)

    const { data: clanRow } = await supabase
      .from('clans')
      .select('*')
      .eq('id', membership.clan_id)
      .single()

    const { data: memberRows } = await supabase
      .from('clan_members')
      .select('id, clan_id, character_id, rank, joined_at, characters(name, level)')
      .eq('clan_id', membership.clan_id)
      .order('joined_at', { ascending: true })

    setClan(clanRow as ClanRow)
    setMembers((memberRows ?? []) as ClanMemberRow[])
    setLoading(false)
  }, [character.id])

  useEffect(() => {
    load()
  }, [load])

  async function createClan() {
    if (character.level < CLAN_CREATE_MIN_LEVEL) {
      setMessage(`Boy kurmak için seviye ${CLAN_CREATE_MIN_LEVEL} gerekir.`)
      return
    }
    if (!createName.trim()) {
      setMessage('Boy adı girin.')
      return
    }
    setBusy(true)
    setMessage(null)
    const supabase = createClient()

    const { data: clanRow, error } = await supabase
      .from('clans')
      .insert({
        name: createName.trim(),
        motto: createMotto.trim() || null,
        emblem: createEmblem.trim() || '🏕️',
        leader_character_id: character.id,
      })
      .select()
      .single()

    if (error || !clanRow) {
      setMessage(error?.message ?? 'Boy kurulamadı.')
      setBusy(false)
      return
    }

    const { error: memberError } = await supabase.from('clan_members').insert({
      clan_id: clanRow.id,
      character_id: character.id,
      rank: 'leader',
    })

    if (memberError) {
      setMessage(memberError.message)
      setBusy(false)
      return
    }

    setMessage(`"${clanRow.name}" boyu kuruldu!`)
    setBusy(false)
    load()
  }

  async function joinClan() {
    if (!joinName.trim()) {
      setMessage('Katılacağınız boy adını girin.')
      return
    }
    setBusy(true)
    const supabase = createClient()

    const { data: target } = await supabase
      .from('clans')
      .select('id, name, level')
      .ilike('name', joinName.trim())
      .limit(1)
      .maybeSingle()

    if (!target) {
      setMessage('Boy bulunamadı.')
      setBusy(false)
      return
    }

    const { count } = await supabase
      .from('clan_members')
      .select('*', { count: 'exact', head: true })
      .eq('clan_id', target.id)

    const cap = getClanMemberCap(target.level)
    if ((count ?? 0) >= cap) {
      setMessage(`Boy dolu (${cap}/${cap}). Seviye atladığında kapasite artar.`)
      setBusy(false)
      return
    }

    const { error } = await supabase.from('clan_members').insert({
      clan_id: target.id,
      character_id: character.id,
      rank: 'member',
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`${target.name} boyuna katıldın!`)
    }
    setBusy(false)
    load()
  }

  async function leaveClan() {
    if (myRank === 'leader') {
      setMessage('Hakan ayrılmadan önce boyu devretmeli veya dağıtmalı (yakında).')
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clan_members')
      .delete()
      .eq('character_id', character.id)
    setMessage(error ? error.message : 'Boydan ayrıldın.')
    setBusy(false)
    load()
  }

  if (loading) {
    return <p className="text-stone-500 font-mono text-sm py-8 text-center">Boy bilgisi yükleniyor...</p>
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-xs font-mono text-amber-200/90 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-2.5">
          {message}
        </p>
      )}

      {clan ? (
        <>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{clan.emblem}</span>
              <div>
                <h2 className="font-serif font-bold text-stone-100 text-lg">{clan.name}</h2>
                <p className="text-[10px] font-mono text-stone-500 mt-1">
                  Seviye {clan.level} · {members.length}/{getClanMemberCap(clan.level)} üye
                </p>
                {clan.motto && (
                  <p className="text-xs text-stone-400 mt-2 italic">{clan.motto}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-800 overflow-hidden">
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
              Üyeler
            </p>
            <ul className="divide-y divide-stone-800/80">
              {members.map((m) => {
                const ch = pickChar(m.characters)
                return (
                  <li key={m.id} className="flex items-center justify-between px-3 py-2 text-xs font-mono">
                    <span className="text-stone-300">{ch?.name ?? '…'}</span>
                    <span className="text-stone-500">
                      {CLAN_RANK_LABELS[m.rank as keyof typeof CLAN_RANK_LABELS] ?? m.rank}
                      {ch?.level != null && ` · ${ch.level}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {myRank !== 'leader' && (
            <button
              type="button"
              disabled={busy}
              onClick={leaveClan}
              className="w-full py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono hover:border-red-900/50 hover:text-red-300"
            >
              Boydan Ayrıl
            </button>
          )}

          <ChatPanel
            channelType="clan"
            channelId={clan.id}
            characterId={character.id}
            title="Boy sohbeti"
          />
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4 space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Boy Kur</h3>
            <p className="text-[10px] font-mono text-stone-500">
              Seviye {CLAN_CREATE_MIN_LEVEL}+ · Başlangıç {getClanMemberCap(1)} üye, seviye ile büyür
            </p>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Boy adı"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={createMotto}
              onChange={(e) => setCreateMotto(e.target.value)}
              placeholder="Töre sözü (isteğe bağlı)"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={createEmblem}
              onChange={(e) => setCreateEmblem(e.target.value)}
              placeholder="Emblem emoji"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={createClan}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm"
            >
              Boy Kur
            </button>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4 space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Boya Katıl</h3>
            <input
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Boy adı"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={joinClan}
              className="w-full py-3 rounded-xl border border-amber-700/50 text-amber-400 font-bold text-sm hover:bg-amber-950/30"
            >
              Katıl
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
