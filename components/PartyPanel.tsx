'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { loadAcceptedFriends } from '@/lib/friends'
import { pickOne } from '@/lib/friends'
import {
  canJoinParty,
  JOIN_POLICY_BADGE,
  JOIN_POLICY_LABELS,
  PARTY_CREATE_POLICY_OPTIONS,
  normalizeJoinPolicy,
  type PartyJoinPolicy,
} from '@/lib/party-social'
import {
  getPartyActivityLabel,
  PARTY_ACTIVITY_OPTIONS,
  PARTY_MAX_SIZE,
  PARTY_STATUS_LABELS,
  partySlotsUsed,
  type PartyMemberRow,
  type PartyRow,
} from '@/lib/parties'

type PartyPanelProps = {
  character: { id: string; name: string; level: number }
}

type BrowseParty = PartyRow & { memberCount?: number; leaderName?: string }

type InviteTarget = { id: string; name: string; level?: number | null }

export default function PartyPanel({ character }: PartyPanelProps) {
  const [myParty, setMyParty] = useState<PartyRow | null>(null)
  const [myMembers, setMyMembers] = useState<PartyMemberRow[]>([])
  const [browseParties, setBrowseParties] = useState<BrowseParty[]>([])
  const [pendingInvites, setPendingInvites] = useState<
    Array<{ id: string; party_id: string; party?: PartyRow | null; fromName?: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'create' | 'browse'>('browse')

  const [activityTag, setActivityTag] = useState('')
  const [joinPolicy, setJoinPolicy] = useState<PartyJoinPolicy>('public')
  const [browseActivity, setBrowseActivity] = useState('')
  const [selectedPreInviteIds, setSelectedPreInviteIds] = useState<Set<string>>(new Set())

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
        .order('joined_at', { ascending: true })

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
              const ch = pickOne(
                m.characters as { name: string; level: number } | { name: string; level: number }[] | null
              )
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
        .limit(40)

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

      const friends = await loadAcceptedFriends(supabase, character.id)
      setFriendTargets(friends.filter((f) => f.id !== character.id))

      const { data: myClanBrowse } = await supabase
        .from('clan_members')
        .select('clan_id')
        .eq('character_id', character.id)
        .maybeSingle()

      if (myClanBrowse?.clan_id) {
        const { data: clanMembers } = await supabase
          .from('clan_members')
          .select('character_id, characters(name, level)')
          .eq('clan_id', myClanBrowse.clan_id)

        setClanTargets(
          (clanMembers ?? [])
            .map((m) => {
              const ch = pickOne(
                m.characters as { name: string; level: number } | { name: string; level: number }[] | null
              )
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
    }

    setLoading(false)
  }, [character.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (joinPolicy === 'friends' && friendTargets.length > 0) {
      setSelectedPreInviteIds(new Set(friendTargets.map((f) => f.id)))
    } else {
      setSelectedPreInviteIds(new Set())
    }
  }, [joinPolicy, friendTargets])

  const filteredBrowse = useMemo(() => {
    if (!browseActivity) return browseParties
    return browseParties.filter((p) => p.activity_tag === browseActivity)
  }, [browseParties, browseActivity])

  function showMsg(text: string) {
    setMessage(text)
  }

  function pickNextLeader(members: PartyMemberRow[], currentLeaderId: string) {
    const sorted = [...members]
      .filter((m) => m.character_id !== currentLeaderId)
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    return sorted[0]?.character_id ?? null
  }

  async function createParty() {
    setBusy(true)
    setMessage(null)
    const supabase = createClient()
    const listed = joinPolicy !== 'invite_only'

    const { data: party, error } = await supabase
      .from('parties')
      .insert({
        leader_character_id: character.id,
        max_size: PARTY_MAX_SIZE,
        status: 'open',
        is_public: listed,
        join_policy: joinPolicy,
        description: null,
        activity_tag: activityTag || null,
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

    if (joinPolicy === 'friends' && selectedPreInviteIds.size > 0) {
      for (const toId of selectedPreInviteIds) {
        await supabase.from('party_invites').upsert(
          {
            party_id: party.id,
            from_character_id: character.id,
            to_character_id: toId,
            status: 'pending',
          },
          { onConflict: 'party_id,to_character_id' }
        )
      }
    }

    setActivityTag('')
    showMsg(
      joinPolicy === 'friends' && selectedPreInviteIds.size > 0
        ? `Parti kuruldu — ${selectedPreInviteIds.size} davet gönderildi.`
        : 'Parti kuruldu!'
    )
    setBusy(false)
    load()
  }

  async function joinParty(party: BrowseParty) {
    setBusy(true)
    const supabase = createClient()

    if ((party.memberCount ?? 0) >= PARTY_MAX_SIZE) {
      showMsg('Parti dolu (max 8).')
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

  /** Üye: çık. Lider + başka üye varsa liderliği devreder. */
  async function leaveParty() {
    if (!myParty) return
    setBusy(true)
    const supabase = createClient()

    if (isLeader) {
      const nextLeader = pickNextLeader(myMembers, character.id)
      if (nextLeader) {
        await supabase
          .from('parties')
          .update({ leader_character_id: nextLeader })
          .eq('id', myParty.id)
        await supabase.from('party_members').delete().eq('character_id', character.id)
        showMsg('Liderliği devrettin ve partiden ayrıldın.')
      } else {
        await supabase.from('parties').delete().eq('id', myParty.id)
        showMsg('Partiden ayrıldın — parti kapandı.')
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

  /** Lider: herkesi çıkar, parti kaydını sil. */
  async function disbandParty() {
    if (!myParty || !isLeader) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('parties').delete().eq('id', myParty.id)
    showMsg(error ? error.message : 'Parti dağıtıldı.')
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

  const partyTitle =
    getPartyActivityLabel(myParty?.activity_tag) ??
    (myParty?.description ? 'Özel parti' : 'Parti')

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
            <div>
              <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">Aktif parti</p>
              <p className="text-lg font-serif font-bold text-stone-100 mt-0.5">{partyTitle}</p>
              {myParty.description && (
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">{myParty.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-stone-700 text-stone-400">
                  {PARTY_STATUS_LABELS[myParty.status as keyof typeof PARTY_STATUS_LABELS]}
                </span>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-cyan-800/50 text-cyan-400">
                  {partySlotsUsed(myMembers.length)}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${JOIN_POLICY_BADGE[normalizeJoinPolicy(myParty.join_policy)]}`}
                >
                  {JOIN_POLICY_LABELS[normalizeJoinPolicy(myParty.join_policy)]}
                </span>
              </div>
            </div>

            {isLeader && (
              <div className="flex flex-wrap gap-1.5">
                {PARTY_CREATE_POLICY_OPTIONS.map((opt) => (
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

          <p className="text-[10px] font-mono text-stone-600 text-center py-1">
            💬 Sohbet — alt sağdaki düğme (parti / boy sekmeleri)
          </p>

          <div className="space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={leaveParty}
              className="w-full py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono hover:border-stone-600"
            >
              {isLeader && myMembers.length > 1
                ? 'Partiden ayrıl (liderliği devret)'
                : 'Partiden ayrıl'}
            </button>
            {isLeader && myMembers.length > 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={disbandParty}
                className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-400/90 text-xs font-mono hover:bg-red-950/20"
              >
                Partiyi dağıt (herkes çıkar)
              </button>
            )}
          </div>
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

          <p className="text-[10px] font-mono text-stone-600 text-center">
            Parti kapasitesi: {PARTY_MAX_SIZE} kişi
          </p>

          {pendingInvites.length > 0 && (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 overflow-hidden">
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest px-3 py-2 border-b border-amber-900/30">
                Parti davetleri ({pendingInvites.length})
              </p>
              <ul className="divide-y divide-stone-800/80">
                {pendingInvites.map((inv) => {
                  const p = inv.party
                  const label = p ? getPartyActivityLabel(p.activity_tag) : null
                  return (
                    <li key={inv.id} className="px-3 py-3 space-y-2">
                      <p className="text-xs font-mono text-stone-300">
                        <span className="text-amber-400">{inv.fromName ?? '…'}</span> davet etti
                      </p>
                      <p className="text-[10px] font-mono text-stone-500">
                        {label ?? 'Parti'}
                        {p?.description ? ` · ${p.description}` : ''}
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
              <label className="block text-[10px] font-mono text-stone-500">
                Hedef / alan (isteğe bağlı)
                <select
                  value={activityTag}
                  onChange={(e) => setActivityTag(e.target.value)}
                  className="mt-1 w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                >
                  {PARTY_ACTIVITY_OPTIONS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Parti türü
                </p>
                <div className="flex gap-2">
                  {PARTY_CREATE_POLICY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJoinPolicy(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl border text-center transition-all ${
                        joinPolicy === opt.value
                          ? 'border-cyan-600 bg-cyan-950/40'
                          : 'border-stone-800 bg-stone-900/40'
                      }`}
                    >
                      <p className="text-xs font-bold text-stone-200">{opt.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-stone-600 mt-1.5 text-center">
                  {PARTY_CREATE_POLICY_OPTIONS.find((o) => o.value === joinPolicy)?.hint}
                </p>
              </div>

              {joinPolicy === 'friends' && (
                <div className="rounded-xl border border-stone-800 bg-stone-900/30 p-3 space-y-2">
                  <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
                    Arkadaşları davet et
                  </p>
                  {friendTargets.length === 0 ? (
                    <p className="text-[10px] font-mono text-stone-600 text-center py-2">
                      Arkadaş yok —{' '}
                      <Link href="/oba/arkadas" className="text-cyan-500 hover:text-cyan-400">
                        ekle
                      </Link>
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {friendTargets.map((t) => {
                        const selected = selectedPreInviteIds.has(t.id)
                        return (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPreInviteIds((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(t.id)) next.delete(t.id)
                                  else next.add(t.id)
                                  return next
                                })
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                                selected
                                  ? 'border-cyan-700 bg-cyan-950/30 text-cyan-300'
                                  : 'border-stone-800 text-stone-500'
                              }`}
                            >
                              <span>
                                {t.name}
                                {t.level != null && ` · sv ${t.level}`}
                              </span>
                              <span className="text-[10px]">{selected ? '✓ davet' : '—'}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}

              {joinPolicy === 'clan' && (
                <p className="text-[10px] font-mono text-amber-500/80 bg-amber-950/20 border border-amber-900/30 rounded-xl px-3 py-2.5 text-center">
                  {clanTargets.length > 0
                    ? `Boy üyeleri (${clanTargets.length}) partini görebilir ve katılabilir.`
                    : 'Boyda değilsen — Oba → Boy — önce katıl.'}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={createParty}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-stone-100 font-bold text-sm shadow-lg shadow-cyan-950/40"
              >
                Partiyi kur
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-stone-800">
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
                  Açık partiler
                </p>
                <select
                  value={browseActivity}
                  onChange={(e) => setBrowseActivity(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono"
                >
                  <option value="">Tüm alanlar</option>
                  {PARTY_ACTIVITY_OPTIONS.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {filteredBrowse.length === 0 ? (
                <p className="text-xs font-mono text-stone-600 px-3 py-6 text-center">
                  {browseParties.length === 0 ? 'Liste boş — ilk partiyi sen kur.' : 'Filtreye uygun parti yok.'}
                </p>
              ) : (
                <ul className="divide-y divide-stone-800/80">
                  {filteredBrowse.map((p) => {
                    const policy = normalizeJoinPolicy(p.join_policy)
                    const full = (p.memberCount ?? 0) >= PARTY_MAX_SIZE
                    const label = getPartyActivityLabel(p.activity_tag)
                    return (
                      <li key={p.id} className="px-3 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-200 truncate">
                              {label ?? 'Parti'}
                            </p>
                            {p.description && (
                              <p className="text-[10px] font-mono text-stone-400 mt-0.5 line-clamp-2">
                                {p.description}
                              </p>
                            )}
                            <p className="text-[10px] font-mono text-stone-500 mt-1">
                              Lider: {p.leaderName} · {partySlotsUsed(p.memberCount ?? 0)}
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
                          {full ? 'Dolu (8/8)' : 'Katıl'}
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
