'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  friendDisplayName,
  friendDisplayLevel,
  pickOne,
  type FriendRow,
} from '@/lib/friends'

type FriendsPanelProps = {
  character: { id: string; name: string; level: number }
}

export default function FriendsPanel({ character }: FriendsPanelProps) {
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [incoming, setIncoming] = useState<FriendRow[]>([])
  const [outgoing, setOutgoing] = useState<FriendRow[]>([])
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: rows } = await supabase
      .from('character_friends')
      .select(
        'id, requester_id, addressee_id, status, created_at, requester:requester_id(name, level), addressee:addressee_id(name, level)'
      )
      .or(`requester_id.eq.${character.id},addressee_id.eq.${character.id}`)
      .order('created_at', { ascending: false })

    const all = (rows ?? []) as FriendRow[]
    setFriends(all.filter((r) => r.status === 'accepted'))
    setIncoming(
      all.filter((r) => r.status === 'pending' && r.addressee_id === character.id)
    )
    setOutgoing(
      all.filter((r) => r.status === 'pending' && r.requester_id === character.id)
    )
    setLoading(false)
  }, [character.id])

  useEffect(() => {
    load()
  }, [load])

  async function sendRequest() {
    const name = searchName.trim()
    if (!name) {
      setMessage('Karakter adı girin.')
      return
    }
    setBusy(true)
    setMessage(null)
    const supabase = createClient()

    const { data: target } = await supabase
      .from('characters')
      .select('id, name')
      .ilike('name', name)
      .limit(1)
      .maybeSingle()

    if (!target) {
      setMessage('Karakter bulunamadı.')
      setBusy(false)
      return
    }

    if (target.id === character.id) {
      setMessage('Kendine istek gönderemezsin.')
      setBusy(false)
      return
    }

    const { error } = await supabase.from('character_friends').insert({
      requester_id: character.id,
      addressee_id: target.id,
      status: 'pending',
    })

    setMessage(error ? error.message : `${target.name} için arkadaşlık isteği gönderildi.`)
    setSearchName('')
    setBusy(false)
    load()
  }

  async function respondRequest(row: FriendRow, accept: boolean) {
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('character_friends')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', row.id)

    setMessage(error ? error.message : accept ? 'Arkadaş eklendi!' : 'İstek reddedildi.')
    setBusy(false)
    load()
  }

  async function removeFriend(row: FriendRow) {
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('character_friends').delete().eq('id', row.id)
    setMessage(error ? error.message : 'Arkadaşlık kaldırıldı.')
    setBusy(false)
    load()
  }

  if (loading) {
    return <p className="text-stone-500 font-mono text-sm py-8 text-center">Arkadaşlar yükleniyor…</p>
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-xs font-mono text-amber-200/90 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-2.5">
          {message}
        </p>
      )}

      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4 space-y-3">
        <h3 className="text-sm font-bold text-stone-200">Arkadaş Ekle</h3>
        <p className="text-[10px] font-mono text-stone-500">
          Karakter adıyla ara — parti davetleri için kullanılır
        </p>
        <div className="flex gap-2">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Karakter adı"
            className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={sendRequest}
            className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 text-stone-950 font-bold text-xs"
          >
            İstek
          </button>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="rounded-xl border border-cyan-900/40 overflow-hidden">
          <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
            Gelen istekler ({incoming.length})
          </p>
          <ul className="divide-y divide-stone-800/80">
            {incoming.map((row) => {
              const ch = pickOne(row.requester)
              return (
                <li key={row.id} className="px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-stone-300">
                    {ch?.name ?? '…'}
                    {ch?.level != null && ` · sv ${ch.level}`}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respondRequest(row, true)}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-800 text-cyan-100"
                    >
                      Kabul
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respondRequest(row, false)}
                      className="text-[10px] font-mono px-2 py-1 rounded border border-stone-700 text-stone-500"
                    >
                      Red
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-stone-800 overflow-hidden">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
          Arkadaşlar ({friends.length})
        </p>
        {friends.length === 0 ? (
          <p className="text-xs font-mono text-stone-600 px-3 py-4">Henüz arkadaş yok.</p>
        ) : (
          <ul className="divide-y divide-stone-800/80">
            {friends.map((row) => (
              <li key={row.id} className="px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-stone-300">
                  {friendDisplayName(row, character.id)}
                  {friendDisplayLevel(row, character.id) != null &&
                    ` · sv ${friendDisplayLevel(row, character.id)}`}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeFriend(row)}
                  className="text-[10px] font-mono text-stone-500 hover:text-red-400"
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {outgoing.length > 0 && (
        <p className="text-[10px] font-mono text-stone-600 text-center">
          Bekleyen istek: {outgoing.map((r) => friendDisplayName(r, character.id)).join(', ')}
        </p>
      )}
    </div>
  )
}
