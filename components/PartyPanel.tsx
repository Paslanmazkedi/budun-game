'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import ChatPanel from '@/components/ChatPanel'
import { loadAcceptedFriends } from '@/lib/friends'
import { FARM_ZONES, getFarmZone } from '@/lib/farm-zones'
import { pickOne } from '@/lib/friends'
import {
  canJoinParty,
  JOIN_POLICY_BADGE,
  JOIN_POLICY_LABELS,
  JOIN_POLICY_OPTIONS,
  normalizeJoinPolicy,
  type PartyJoinPolicy,
} from '@/lib/party-social'
import {
  PARTY_MAX_SIZE,
  PARTY_STATUS_LABELS,
  partySlotsUsed,
  type PartyMemberRow,
  type PartyRow,
} from '@/lib/parties'

type PartyPanelProps = {
  character: { id: string; name: string; level: number }
  initialZoneId?: string | null
}

type BrowseParty = PartyRow & { memberCount?: number; leaderName?: string }

type InviteTarget = { id: string; name: string; level?: number | null }

export default function PartyPanel({ character, initialZoneId }: PartyPanelProps) {
  const [myParty, setMyParty] = useState<PartyRow | null>(null)
  const [myMembers, setMyMembers] = useState<PartyMemberRow[]>([])
  const [browseParties, setBrowseParties] = useState<BrowseParty[]>([])
  const [pendingInvites, setPendingInvites] = useState<
    Array<{ id: string; party_id: string; party?: PartyRow | null; fromName?: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'create' | 'browse'>(initialZoneId ? 'create' : 'browse')

  const [zoneId, setZoneId] = useState(initialZoneId ?? '')
  const [maxSize, setMaxSize] = useState(
    initialZoneId ? getFarmZone(initialZoneId)?.partySize ?? 4 : 4
  )
  const [joinPolicy, setJoinPolicy] = useState<PartyJoinPolicy>('public')

  const [inviteTab, setInviteTab] = useState<'friends' | 'clan'>('friends')
  const [friendTargets, setFriendTargets] = useState<InviteTarget[]>([])
  const [clanTargets, setClanTargets] = useState<InviteTarget[]>([])

  const isLeader = myParty?.leader_character_id === character.id

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: membership } = await supabase
      .from('party_members')
      .select('party_id')
      .eq('character_id', character.id)
      .maybeSingle()

    if (membership) {
      const { data: party } = await supabase
        .from('parties')
        .select('*')
        .eq('id', membership.party_id)
        .single()

      const { data: members } = await supabase
        .from('party_members')
        .select('party_id, character_id, joined_at, characters(name, level)')
        .eq('party_id', membership.party_id)

      setMyParty(party as PartyRow)
      setMyMembers((members ?? []) as PartyMemberRow[])
      setBrowseParties([])
      setPendingInvites([])

      const friends = await loadAcceptedFriends(supabase, character.id)
      setFriendTargets(friends.filter((f) => f.id !== character.id))

      const { data: myClan } = await supabase
        .from('clan_members')
        .select('clan_id')
        .eq('character_id', character.id)
        .maybeSingle()

      if (myClan?.clan_id) {
        const { data: clanMembers } = await supabase
          .from('clan_members')
          .select('character_id, characters(name, level)')
          .eq('clan_id', myClan.clan_id)

        setClanTargets(
          (clanMembers ?? [])
            .map((m) => {
              const ch = pickOne(m.characters as { name: string; level: number } | { name: string; level: number }[] | null)
              return {
                id: m.character_id as string,
                name: ch?.name ?? '…',
                level: ch?.level,
              }
            })
            .filter((t) => t.id !== character.id)
        )
      } else {
        setClanTargets([])
      }
    } else {
      setMyParty(null)
      setMyMembers([])

      const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .eq('status', 'open')
        .neq('join_policy', 'invite_only')
        .order('created_at', { ascending: false })
        .limit(30)

      const enriched: BrowseParty[] = []
      for (const p of parties ?? []) {
        const party = p as PartyRow
        const { count } = await supabase
          .from('party_members')
          .select('*', { count: 'exact', head: true })
          .eq('party_id', party.id)

        const { data: leader } = await supabase
          .from('characters')
          .select('name')
          .eq('id', party.leader_character_id)
          .maybeSingle()

        enriched.push({
          ...party,
          memberCount: count ?? 0,
          leaderName: leader?.name ?? '…',
        })
      }
      setBrowseParties(enriched)

      const { data: invites } = await supabase
        .from('party_invites')
        .select('id, party_id, from_character_id')
        .eq('to_character_id', character.id)
        .eq('status', 'pending')

      const inviteRows: Array<{
        id: string
        party_id: string
        party?: PartyRow | null
        fromName?: string
      }> = []
      for (const inv of invites ?? []) {
        const { data: party } = await supabase.from('parties').select('*').eq('id', inv.party_id).maybeSingle()
        const { data: fromCh } = await supabase
          .from('characters')
          .select('name')
          .eq('id', inv.from_character_id)
          .maybeSingle()
        inviteRows.push({
          id: inv.id as string,
          party_id: inv.party_id as string,
          party: party as PartyRow | null,
          fromName: fromCh?.name,
        })
      }
      setPendingInvites(inviteRows)
    }

    setLoading(false)
  }, [character.id])

  useEffect(() => {
    load()
  }, [load])

  function showMsg(text: string) {
    setMessage(text)
  }

  async function createParty() {
    setBusy(true)
    setMessage(null)
    const supabase = createClient()
    const size = Math.min(PARTY_MAX_SIZE, Math.max(1, maxSize))
    const listed = joinPolicy !== 'invite_only'

    const { data: party, error } = await supabase
      .from('parties')
      .insert({
        leader_character_id: character.id,
        zone_id: zoneId || null,
        max_size: size,
        status: 'open',
        is_public: listed,
        join_policy: joinPolicy,
      })
      .select()
      .single()

    if (error || !party) {
      showMsg(error?.message ?? 'Parti kurulamadı.')
      setBusy(false)
      return
    }

    await supabase.from('party_members').insert({
      party_id: party.id,
      character_id: character.id,
    })

    showMsg('Parti kuruldu!')
    setBusy(false)
    load()
  }

  async function joinParty(party: BrowseParty) {
    setBusy(true)
    const supabase = createClient()

    if ((party.memberCount ?? 0) >= party.max_size) {
      showMsg('Parti dolu.')
      setBusy(false)
      return
    }

    const check = await canJoinParty(supabase, party, character.id)
    if (!check.ok) {
      showMsg(check.reason)
      setBusy(false)
      return
    }

    const { error } = await supabase.from('party_members').insert({
      party_id: party.id,
      character_id: character.id,
    })

    if (!error) {
      await supabase
        .from('party_invites')
        .update({ status: 'accepted' })
        .eq('party_id', party.id)
        .eq('to_character_id', character.id)
    }

    showMsg(error ? error.message : 'Partiye katıldın!')
    setBusy(false)
    load()
  }

  async function leaveParty() {
    setBusy(true)
    const supabase = createClient()

    if (myParty?.leader_character_id === character.id) {
      const others = myMembers.filter((m) => m.character_id !== character.id)
      if (others.length > 0) {
        await supabase
          .from('parties')
          .update({ leader_character_id: others[0].character_id })
          .eq('id', myParty.id)
        await supabase.from('party_members').delete().eq('character_id', character.id)
        showMsg('Liderliği devrettin ve partiden ayrıldın.')
      } else {
        await supabase.from('parties').delete().eq('id', myParty.id)
        showMsg('Parti dağıtıldı.')
      }
    } else {
      const { error } = await supabase
        .from('party_members')
        .delete()
        .eq('character_id', character.id)
      showMsg(error ? error.message : 'Partiden ayrıldın.')
    }

    setBusy(false)
    load()
  }

  async function kickMember(targetId: string) {
    if (!myParty || !isLeader || targetId === character.id) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('party_members')
      .delete()
      .eq('party_id', myParty.id)
      .eq('character_id', targetId)
    showMsg(error ? error.message : 'Üye partiden atıldı.')
    setBusy(false)
    load()
  }

  async function inviteToParty(targetId: string) {
    if (!myParty) return
    setBusy(true)
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('party_members')
      .select('character_id')
      .eq('party_id', myParty.id)
      .eq('character_id', targetId)
      .maybeSingle()

    if (existing) {
      showMsg('Zaten partide.')
      setBusy(false)
      return
    }

    const { error } = await supabase.from('party_invites').upsert(
      {
        party_id: myParty.id,
        from_character_id: character.id,
        to_character_id: targetId,
        status: 'pending',
      },
      { onConflict: 'party_id,to_character_id' }
    )

    showMsg(error ? error.message : 'Davet gönderildi!')
    setBusy(false)
  }

  async function updateJoinPolicy(policy: PartyJoinPolicy) {
    if (!myParty || !isLeader) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('parties')
      .update({
        join_policy: policy,
        is_public: policy !== 'invite_only',
      })
      .eq('id', myParty.id)
    showMsg(error ? error.message : 'Katılım kuralı güncellendi.')
    setBusy(false)
    load()
  }

  if (loading) {
    return <p className="text-stone-500 font-mono text-sm py-8 text-center">Parti yükleniyor…</p>
  }

  const memberIds = new Set(myMembers.map((m) => m.character_id))
  const inviteTargets =
    inviteTab === 'friends'
      ? friendTargets.filter((t) => !memberIds.has(t.id))
      : clanTargets.filter((t) => !memberIds.has(t.id))

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-xs font-mono text-amber-200/90 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-2.5">
          {message}
        </p>
      )}

      {myParty ? (
        <>
          <div className="rounded-2xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/40 to-stone-950/60 p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Aktif parti</p>
                <p className="text-lg font-serif font-bold text-stone-100 mt-0.5">
                  {myParty.zone_id
                    ? `${getFarmZone(myParty.zone_id)?.icon ?? '🗺️'} ${getFarmZone(myParty.zone_id)?.name ?? myParty.zone_id}`
                    : 'Serbest sefer'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-stone-700 text-stone-400">
                    {PARTY_STATUS_LABELS[myParty.status as keyof typeof PARTY_STATUS_LABELS]}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-cyan-800/50 text-cyan-400">
                    {partySlotsUsed(myMembers.length, myParty.max_size)}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${JOIN_POLICY_BADGE[normalizeJoinPolicy(myParty.join_policy)]}`}
                  >
                    {JOIN_POLICY_LABELS[normalizeJoinPolicy(myParty.join_policy)]}
                  </span>
                </div>
              </div>
              {myParty.zone_id && (
                <Link
                  href={`/quests?farm=${myParty.zone_id}`}
                  className="text-[10px] font-mono text-amber-500 hover:text-amber-400 shrink-0"
                >
                  Farm →
                </Link>
              )}
            </div>

            {isLeader && (
              <div className="flex flex-wrap gap-1.5">
                {JOIN_POLICY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={busy}
                    onClick={() => updateJoinPolicy(opt.value)}
                    className={`text-[9px] font-mono px-2 py-1 rounded-lg border transition-colors ${
                      normalizeJoinPolicy(myParty.join_policy) === opt.value
                        ? 'border-cyan-600 bg-cyan-950/50 text-cyan-300'
                        : 'border-stone-700 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-stone-800 overflow-hidden">
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
              Üyeler
            </p>
            <ul className="divide-y divide-stone-800/80">
              {myMembers.map((m) => {
                const ch = pickOne(m.characters)
                const isMe = m.character_id === character.id
                const isPartyLeader = m.character_id === myParty.leader_character_id
                return (
                  <li key={m.character_id} className="flex items-center justify-between px-3 py-2.5 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-stone-200 truncate">
                        {ch?.name ?? '…'}
                        {isPartyLeader && (
                          <span className="text-amber-500 ml-1.5 text-[10px]">★ lider</span>
                        )}
                        {isMe && <span className="text-stone-500 ml-1 text-[10px]">(sen)</span>}
                      </p>
                      {ch?.level != null && (
                        <p className="text-[10px] font-mono text-stone-600">Seviye {ch.level}</p>
                      )}
                    </div>
                    {isLeader && !isMe && !isPartyLeader && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => kickMember(m.character_id)}
                        className="text-[10px] font-mono text-red-400/80 hover:text-red-300 shrink-0"
                      >
                        At
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/30 p-3 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInviteTab('friends')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold ${
                  inviteTab === 'friends'
                    ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800/50'
                    : 'text-stone-500 border border-stone-800'
                }`}
              >
                Arkadaşlar
              </button>
              <button
                type="button"
                onClick={() => setInviteTab('clan')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold ${
                  inviteTab === 'clan'
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-800/50'
                    : 'text-stone-500 border border-stone-800'
                }`}
              >
                Boy
              </button>
            </div>
            {inviteTargets.length === 0 ? (
              <p className="text-[10px] font-mono text-stone-600 text-center py-2">
                {inviteTab === 'friends'
                  ? 'Davet için arkadaş ekle → Oba → Arkadaşlar'
                  : 'Boy üyesi yok veya hepsi partide'}
              </p>
            ) : (
              <ul className="space-y-1">
                {inviteTargets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-xs font-mono text-stone-400">
                      {t.name}
                      {t.level != null && ` · sv ${t.level}`}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => inviteToParty(t.id)}
                      className="text-[10px] font-mono font-bold px-3 py-1 rounded-lg bg-stone-800 text-cyan-400"
                    >
                      Davet
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/oba/arkadas"
              className="block text-center text-[10px] font-mono text-stone-500 hover:text-amber-500"
            >
              Arkadaş listesi →
            </Link>
          </div>

          <ChatPanel
            channelType="party"
            channelId={myParty.id}
            characterId={character.id}
            title="Parti sohbeti"
          />

          <button
            type="button"
            disabled={busy}
            onClick={leaveParty}
            className="w-full py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono hover:border-red-900/50 hover:text-red-300"
          >
            {isLeader && myMembers.length > 1 ? 'Liderliği devret ve ayrıl' : 'Partiden ayrıl'}
          </button>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold border ${
                tab === 'create'
                  ? 'border-cyan-700 bg-cyan-950/40 text-cyan-300'
                  : 'border-stone-800 text-stone-500'
              }`}
            >
              Parti kur
            </button>
            <button
              type="button"
              onClick={() => setTab('browse')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-mono font-bold border ${
                tab === 'browse'
                  ? 'border-cyan-700 bg-cyan-950/40 text-cyan-300'
                  : 'border-stone-800 text-stone-500'
              }`}
            >
              Parti bul
            </button>
          </div>

          {pendingInvites.length > 0 && (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 overflow-hidden">
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest px-3 py-2 border-b border-amber-900/30">
                Parti davetleri ({pendingInvites.length})
              </p>
              <ul className="divide-y divide-stone-800/80">
                {pendingInvites.map((inv) => {
                  const p = inv.party
                  const zone = p?.zone_id ? getFarmZone(p.zone_id) : null
                  return (
                    <li key={inv.id} className="px-3 py-3 space-y-2">
                      <p className="text-xs font-mono text-stone-300">
                        <span className="text-amber-400">{inv.fromName ?? '…'}</span> davet etti
                      </p>
                      <p className="text-[10px] font-mono text-stone-500">
                        {zone ? `${zone.icon} ${zone.name}` : 'Serbest'} · davetli parti
                      </p>
                      {p && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            joinParty({
                              ...p,
                              memberCount: 0,
                              leaderName: inv.fromName,
                            })
                          }
                          className="w-full py-2 rounded-lg text-[10px] font-mono font-bold bg-amber-800/50 text-amber-200"
                        >
                          Daveti kabul et
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {tab === 'create' ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Farm alanı
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setZoneId('')
                      setMaxSize(4)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !zoneId
                        ? 'border-cyan-600 bg-cyan-950/30'
                        : 'border-stone-800 bg-stone-900/40 hover:border-stone-600'
                    }`}
                  >
                    <span className="text-2xl">🌤️</span>
                    <p className="text-xs font-bold text-stone-200 mt-1">Serbest</p>
                    <p className="text-[9px] font-mono text-stone-500">Özel boyut</p>
                  </button>
                  {FARM_ZONES.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setZoneId(z.id)
                        setMaxSize(z.partySize)
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        zoneId === z.id
                          ? 'border-cyan-600 bg-cyan-950/30'
                          : 'border-stone-800 bg-stone-900/40 hover:border-stone-600'
                      }`}
                    >
                      <span className="text-2xl">{z.icon}</span>
                      <p className="text-xs font-bold text-stone-200 mt-1 truncate">{z.name}</p>
                      <p className="text-[9px] font-mono text-stone-500">{z.partySize} kişi</p>
                    </button>
                  ))}
                </div>
              </div>

              {!zoneId && (
                <label className="block text-[10px] font-mono text-stone-500">
                  Max üye (1–{PARTY_MAX_SIZE})
                  <input
                    type="number"
                    min={1}
                    max={PARTY_MAX_SIZE}
                    value={maxSize}
                    onChange={(e) => setMaxSize(Number(e.target.value))}
                    className="mt-1 w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              )}

              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Kim katılabilir?
                </p>
                <div className="space-y-2">
                  {JOIN_POLICY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJoinPolicy(opt.value)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        joinPolicy === opt.value
                          ? 'border-cyan-600 bg-cyan-950/30'
                          : 'border-stone-800 bg-stone-900/40'
                      }`}
                    >
                      <p className="text-xs font-bold text-stone-200">{opt.label}</p>
                      <p className="text-[9px] font-mono text-stone-500 mt-0.5">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={createParty}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-stone-100 font-bold text-sm shadow-lg shadow-cyan-950/40"
              >
                Partiyi kur · {maxSize} slot
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-800 overflow-hidden">
              <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
                Açık partiler — herkes görebilir
              </p>
              {browseParties.length === 0 ? (
                <p className="text-xs font-mono text-stone-600 px-3 py-6 text-center">
                  Liste boş — ilk partiyi sen kur.
                </p>
              ) : (
                <ul className="divide-y divide-stone-800/80">
                  {browseParties.map((p) => {
                    const zone = p.zone_id ? getFarmZone(p.zone_id) : null
                    const policy = normalizeJoinPolicy(p.join_policy)
                    const full = (p.memberCount ?? 0) >= p.max_size
                    return (
                      <li key={p.id} className="px-3 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-200 truncate">
                              {zone ? `${zone.icon} ${zone.name}` : 'Serbest parti'}
                            </p>
                            <p className="text-[10px] font-mono text-stone-500">
                              Lider: {p.leaderName} · {p.memberCount}/{p.max_size}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${JOIN_POLICY_BADGE[policy]}`}
                          >
                            {JOIN_POLICY_LABELS[policy]}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={busy || full}
                          onClick={() => joinParty(p)}
                          className="w-full py-2 rounded-lg text-[10px] font-mono font-bold bg-stone-800 text-cyan-400 disabled:opacity-40"
                        >
                          {full ? 'Dolu' : 'Katıl'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
