'use client'

import { useState } from 'react'
import {
  CLAN_RANK_LABELS,
  type ClanMemberRow,
  type ClanRank,
} from '@/lib/clans'
import { inviteTargetName, type ClanInviteRow } from '@/lib/clan-social'
import { loadAcceptedFriends } from '@/lib/friends'
import { createClient } from '@/lib/supabase-browser'

type PickChar = { name: string; level: number }

function pickChar<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

type ClanMembersSectionProps = {
  clanId: string
  characterId: string
  myRank: string | null
  members: ClanMemberRow[]
  invites: ClanInviteRow[]
  busy: boolean
  onRefresh: () => void
  onMessage: (msg: string) => void
  onLeave: () => void
}

export default function ClanMembersSection({
  clanId,
  characterId,
  myRank,
  members,
  invites,
  busy,
  onRefresh,
  onMessage,
  onLeave,
}: ClanMembersSectionProps) {
  const canManage = myRank === 'leader' || myRank === 'officer'
  const isLeader = myRank === 'leader'

  const [inviteName, setInviteName] = useState('')
  const [friendTargets, setFriendTargets] = useState<Array<{ id: string; name: string }>>([])
  const [showFriends, setShowFriends] = useState(false)

  async function loadFriends() {
    const supabase = createClient()
    const friends = await loadAcceptedFriends(supabase, characterId)
    setFriendTargets(friends.filter((f) => f.id !== characterId))
    setShowFriends(true)
  }

  async function sendInvite(name: string) {
    if (!name.trim()) return
    const supabase = createClient()
    const { data: target } = await supabase
      .from('characters')
      .select('id, name')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle()

    if (!target) {
      onMessage('Karakter bulunamadı.')
      return
    }
    if (target.id === characterId) {
      onMessage('Kendine davet gönderemezsin.')
      return
    }
    if (members.some((m) => m.character_id === target.id)) {
      onMessage('Bu karakter zaten boyda.')
      return
    }

    const { error } = await supabase.from('clan_invites').insert({
      clan_id: clanId,
      from_character_id: characterId,
      to_character_id: target.id,
      status: 'pending',
    })

    if (error) {
      onMessage(error.code === '23505' ? 'Zaten davet gönderildi.' : error.message)
    } else {
      onMessage(`${target.name} davet edildi.`)
      setInviteName('')
      onRefresh()
    }
  }

  async function cancelInvite(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clan_invites').delete().eq('id', id)
    if (error) onMessage(error.message)
    else onRefresh()
  }

  async function kickMember(memberRowId: string, name: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clan_members').delete().eq('id', memberRowId)
    if (error) onMessage(error.message)
    else {
      onMessage(`${name} boydan çıkarıldı.`)
      onRefresh()
    }
  }

  async function changeRank(memberRowId: string, rank: ClanRank, name: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clan_members').update({ rank }).eq('id', memberRowId)
    if (error) onMessage(error.message)
    else {
      onMessage(`${name} → ${CLAN_RANK_LABELS[rank]}`)
      onRefresh()
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-3 space-y-3">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
            Davet gönder
          </p>
          <div className="flex gap-2">
            <input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Karakter adı"
              className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => sendInvite(inviteName)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-stone-950 text-xs font-bold shrink-0"
            >
              Davet
            </button>
          </div>
          <button
            type="button"
            onClick={loadFriends}
            className="text-[10px] font-mono text-cyan-500"
          >
            Arkadaş listesinden seç →
          </button>
          {showFriends && friendTargets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {friendTargets.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => sendInvite(f.name)}
                  className="px-2 py-1 rounded-lg border border-stone-700 text-[10px] font-mono text-stone-300 hover:border-cyan-800"
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {canManage && invites.length > 0 && (
        <div className="rounded-xl border border-stone-800 overflow-hidden">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
            Bekleyen davetler
          </p>
          <ul className="divide-y divide-stone-800/80">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-3 py-2 text-xs font-mono">
                <span className="text-stone-400">{inviteTargetName(inv)}</span>
                <button
                  type="button"
                  onClick={() => cancelInvite(inv.id)}
                  className="text-red-400/80 text-[10px]"
                >
                  İptal
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-stone-800 overflow-hidden">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
          Üyeler ({members.length})
        </p>
        <ul className="divide-y divide-stone-800/80">
          {members.map((m) => {
            const ch = pickChar(m.characters) as PickChar | null
            const isSelf = m.character_id === characterId
            const isClanLeader = m.rank === 'leader'
            const canKick = canManage && !isSelf && !isClanLeader
            const canPromote = isLeader && !isSelf && !isClanLeader

            return (
              <li key={m.id} className="px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="min-w-0">
                    <span className="text-stone-300">{ch?.name ?? '…'}</span>
                    {isSelf && <span className="text-stone-600 ml-1">(sen)</span>}
                  </div>
                  <span className="text-stone-500 shrink-0">
                    {CLAN_RANK_LABELS[m.rank as ClanRank] ?? m.rank}
                    {ch?.level != null && ` · ${ch.level}`}
                  </span>
                </div>
                {(canKick || canPromote) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {canPromote && m.rank === 'member' && (
                      <button
                        type="button"
                        onClick={() => changeRank(m.id, 'officer', ch?.name ?? '…')}
                        className="px-2 py-0.5 rounded border border-stone-700 text-[9px] text-cyan-400"
                      >
                        Subay yap
                      </button>
                    )}
                    {canPromote && m.rank === 'officer' && (
                      <button
                        type="button"
                        onClick={() => changeRank(m.id, 'member', ch?.name ?? '…')}
                        className="px-2 py-0.5 rounded border border-stone-700 text-[9px] text-stone-400"
                      >
                        Savaşçı yap
                      </button>
                    )}
                    {canKick && (
                      <button
                        type="button"
                        onClick={() => kickMember(m.id, ch?.name ?? '…')}
                        className="px-2 py-0.5 rounded border border-red-900/50 text-[9px] text-red-400"
                      >
                        Çıkar
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {myRank !== 'leader' && (
        <button
          type="button"
          disabled={busy}
          onClick={onLeave}
          className="w-full py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono hover:border-red-900/50 hover:text-red-300"
        >
          Boydan Ayrıl
        </button>
      )}

      {myRank === 'leader' && (
        <p className="text-[10px] font-mono text-stone-600 text-center">
          Hakan ayrılmadan önce boyu devretmeli veya dağıtmalı (yakında).
        </p>
      )}
    </div>
  )
}
