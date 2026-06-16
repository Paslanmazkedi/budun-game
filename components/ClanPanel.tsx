'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import ClanOverviewSection from '@/components/clan/ClanOverviewSection'
import ClanMembersSection from '@/components/clan/ClanMembersSection'
import ClanHeaderCard from '@/components/clan/ClanHeaderCard'
import ClanEmblemPicker from '@/components/clan/ClanEmblemPicker'
import {
  acceptClanInvite,
  loadClanInvitesForClan,
  loadIncomingClanInvites,
  rejectClanInvite,
} from '@/lib/clan-social'
import {
  findClanRank,
  loadClanLeaderboard,
  loadClanTotals,
  syncClanScores,
} from '@/lib/clan-scores'
import {
  CLAN_CREATE_MIN_LEVEL,
  getClanMemberCap,
  isEmblemAllowedForLevel,
  type ClanLeaderboardRow,
  type ClanMemberRow,
  type ClanRow,
  type ClanScorePeriod,
  type ClanScoreTotals,
  emptyClanTotals,
} from '@/lib/clans'

type ClanPanelProps = {
  character: { id: string; name: string; level: number }
}

type ClanTab = 'overview' | 'members'

function pickChar<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

export default function ClanPanel({ character }: ClanPanelProps) {
  const [clan, setClan] = useState<ClanRow | null>(null)
  const [members, setMembers] = useState<ClanMemberRow[]>([])
  const [myRank, setMyRank] = useState<string | null>(null)
  const [invites, setInvites] = useState<Awaited<ReturnType<typeof loadClanInvitesForClan>>>([])
  const [incomingInvites, setIncomingInvites] = useState<
    Awaited<ReturnType<typeof loadIncomingClanInvites>>
  >([])
  const [achievementTotals, setAchievementTotals] = useState<ClanScoreTotals>(emptyClanTotals())
  const [achievementRank, setAchievementRank] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<ClanLeaderboardRow[]>([])
  const [scorePeriod, setScorePeriod] = useState<ClanScorePeriod>('weekly')
  const [tab, setTab] = useState<ClanTab>('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [createName, setCreateName] = useState('')
  const [createMotto, setCreateMotto] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createEmblem, setCreateEmblem] = useState('🏕️')
  const [joinName, setJoinName] = useState('')

  const loadAchievementData = useCallback(async (clanId: string) => {
    const supabase = createClient()
    try {
      await syncClanScores(supabase, clanId)
      const t = await loadClanTotals(supabase, clanId, 'all')
      const rank = await findClanRank(supabase, clanId, 'all')
      setAchievementTotals(t)
      setAchievementRank(rank)
    } catch {
      setAchievementTotals(emptyClanTotals())
      setAchievementRank(null)
    }
  }, [])

  const loadRankings = useCallback(async (period: ClanScorePeriod) => {
    const supabase = createClient()
    try {
      const board = await loadClanLeaderboard(supabase, period, 10)
      setLeaderboard(board)
    } catch {
      setLeaderboard([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const incoming = await loadIncomingClanInvites(supabase, character.id)
    setIncomingInvites(incoming)

    const { data: membership } = await supabase
      .from('clan_members')
      .select('clan_id, rank')
      .eq('character_id', character.id)
      .maybeSingle()

    if (!membership) {
      setClan(null)
      setMembers([])
      setMyRank(null)
      setInvites([])
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

    const clanInvites = await loadClanInvitesForClan(supabase, membership.clan_id)

    setClan(clanRow as ClanRow)
    setMembers((memberRows ?? []) as ClanMemberRow[])
    setInvites(clanInvites)
    setLoading(false)
  }, [character.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!clan?.id) return
    loadAchievementData(clan.id)
  }, [clan?.id, loadAchievementData])

  useEffect(() => {
    if (!clan?.id) return
    loadRankings(scorePeriod)
  }, [clan?.id, scorePeriod, loadRankings])

  async function createClan() {
    if (character.level < CLAN_CREATE_MIN_LEVEL) {
      setMessage(`Boy kurmak için seviye ${CLAN_CREATE_MIN_LEVEL} gerekir.`)
      return
    }
    if (!createName.trim()) {
      setMessage('Boy adı girin.')
      return
    }
    if (!isEmblemAllowedForLevel(createEmblem, 1)) {
      setMessage('Bu simge henüz kullanılamaz.')
      return
    }

    setBusy(true)
    setMessage(null)
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('clan_members')
      .select('id')
      .eq('character_id', character.id)
      .maybeSingle()

    if (existing) {
      setMessage('Zaten bir boydasın.')
      setBusy(false)
      return
    }

    const { data: clanRow, error } = await supabase
      .from('clans')
      .insert({
        name: createName.trim(),
        motto: createMotto.trim() || null,
        description: createDescription.trim() || null,
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
      setMessage(`Boy dolu (${cap}/${cap}).`)
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

  async function saveProfile(data: { description: string; motto: string; emblem: string }) {
    if (!clan) return
    if (!isEmblemAllowedForLevel(data.emblem, clan.level)) {
      setMessage('Bu simge boy seviyeniz için kilitli.')
      return
    }
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clans')
      .update({
        description: data.description.trim() || null,
        motto: data.motto.trim() || null,
        emblem: data.emblem,
      })
      .eq('id', clan.id)

    setMessage(error ? error.message : 'Boy bilgileri güncellendi.')
    setBusy(false)
    load()
  }

  async function handleAcceptInvite(inviteId: string) {
    setBusy(true)
    const supabase = createClient()
    const result = await acceptClanInvite(supabase, inviteId, character.id)
    setMessage(result.error ?? 'Davet kabul edildi — boya katıldın!')
    setBusy(false)
    load()
  }

  async function handleRejectInvite(inviteId: string) {
    setBusy(true)
    const supabase = createClient()
    const result = await rejectClanInvite(supabase, inviteId)
    if (result.error) setMessage(result.error)
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

      {incomingInvites.length > 0 && !clan && (
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 space-y-2">
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Boy davetleri</p>
          {incomingInvites.map((inv) => {
            const from = pickChar(inv.from_character)
            return (
              <div key={inv.id} className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="text-stone-300">{from?.name ?? '…'} davet etti</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="text-cyan-400"
                  >
                    Kabul
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRejectInvite(inv.id)}
                    className="text-stone-500"
                  >
                    Red
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {clan ? (
        <>
          <ClanHeaderCard
            clan={clan}
            memberCount={members.length}
            canEdit={
              clan.leader_character_id === character.id || myRank === 'leader'
            }
            busy={busy}
            onSaveProfile={saveProfile}
          />

          <div className="flex gap-1 p-1 rounded-xl bg-stone-900/60 border border-stone-800">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold transition ${
                tab === 'overview'
                  ? 'bg-amber-900/50 text-amber-300'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Özet
            </button>
            <button
              type="button"
              onClick={() => setTab('members')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold transition ${
                tab === 'members'
                  ? 'bg-cyan-900/50 text-cyan-300'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Üyeler
            </button>
          </div>

          {tab === 'overview' ? (
            <ClanOverviewSection
              clan={clan}
              achievementTotals={achievementTotals}
              achievementRank={achievementRank}
              leaderboard={leaderboard}
              scorePeriod={scorePeriod}
              onScorePeriodChange={setScorePeriod}
            />
          ) : (
            <ClanMembersSection
              clanId={clan.id}
              characterId={character.id}
              myRank={myRank}
              members={members}
              invites={invites}
              busy={busy}
              onRefresh={load}
              onMessage={setMessage}
              onLeave={leaveClan}
            />
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4 space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Boy Kur</h3>
            <p className="text-[10px] font-mono text-stone-500">
              Seviye {CLAN_CREATE_MIN_LEVEL}+ · Başlangıç {getClanMemberCap(1)} üye
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
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Kısa açıklama (isteğe bağlı)"
              rows={2}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <ClanEmblemPicker clanLevel={1} value={createEmblem} onChange={setCreateEmblem} />
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
            <p className="text-[10px] font-mono text-stone-500">
              Ad ile katıl veya üstteki daveti kabul et
            </p>
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
