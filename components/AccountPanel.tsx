'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { characterBaseImage, normalizeGender } from '@/lib/game-assets'
import {
  canCreateAnotherCharacter,
  genderLabel,
  resolveActiveCharacter,
  type GameCharacter,
} from '@/lib/characters'
import { signOutToLogin } from '@/lib/auth-client'
import { getActiveCharacterId, setActiveCharacterId } from '@/lib/active-character-client'

type AccountPanelProps = {
  character: GameCharacter
}

export default function AccountPanel({ character }: AccountPanelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [characters, setCharacters] = useState<GameCharacter[]>([])
  const [active, setActive] = useState<GameCharacter>(character)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [friendName, setFriendName] = useState('')
  const [friendMessage, setFriendMessage] = useState<string | null>(null)
  const [friendBusy, setFriendBusy] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    setUserEmail(user.email ?? null)
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    const chars = (data ?? []) as GameCharacter[]
    setCharacters(chars)
    const preferred = getActiveCharacterId()
    const current = resolveActiveCharacter(chars, preferred) ?? character
    setActive(current)
    setLoading(false)
  }, [supabase, character])

  useEffect(() => {
    load()
  }, [load])

  const switchTo = (char: GameCharacter) => {
    setActiveCharacterId(char.id)
    setActive(char)
    router.refresh()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOutToLogin()
    router.push('/login')
    router.refresh()
  }

  const handleCoupon = () => {
    if (!couponCode.trim()) {
      setCouponMessage('Kupon kodu girin.')
      return
    }
    setCouponMessage('Kupon sistemi yakında aktif olacak.')
    setCouponCode('')
  }

  const sendFriendInvite = async () => {
    const name = friendName.trim()
    if (!name) {
      setFriendMessage('Karakter adı girin.')
      return
    }
    setFriendBusy(true)
    setFriendMessage(null)

    const { data: target } = await supabase
      .from('characters')
      .select('id, name')
      .ilike('name', name)
      .limit(1)
      .maybeSingle()

    if (!target) {
      setFriendMessage('Karakter bulunamadı.')
      setFriendBusy(false)
      return
    }

    if (target.id === active.id) {
      setFriendMessage('Kendine istek gönderemezsin.')
      setFriendBusy(false)
      return
    }

    const { error } = await supabase.from('character_friends').insert({
      requester_id: active.id,
      addressee_id: target.id,
      status: 'pending',
    })

    setFriendMessage(
      error ? error.message : `${target.name} için arkadaşlık isteği gönderildi.`
    )
    setFriendName('')
    setFriendBusy(false)
  }

  if (loading) {
    return <p className="text-stone-500 font-mono text-sm py-8 text-center">Hesap yükleniyor…</p>
  }

  return (
    <div className="space-y-5">
      {userEmail && (
        <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-1">Hesap</p>
          <p className="text-sm font-mono text-stone-300 truncate">{userEmail}</p>
        </section>
      )}

      <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">Karakterler</p>
          <Link
            href="/characters"
            className="text-[10px] font-mono text-stone-500 hover:text-amber-400 transition"
          >
            Seçim ekranı
          </Link>
        </div>
        <div className="space-y-1.5">
          {characters.map((char) => {
            const isActive = char.id === active.id
            const g = normalizeGender(char.gender)
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => switchTo(char)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition ${
                  isActive
                    ? 'bg-amber-500/10 border border-amber-600/30'
                    : 'hover:bg-stone-950 border border-transparent'
                }`}
              >
                <div className="w-9 h-9 rounded-lg border border-stone-700 bg-stone-950 overflow-hidden shrink-0">
                  <img src={characterBaseImage(g)} alt="" className="w-full h-full object-contain p-0.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${isActive ? 'text-amber-400' : 'text-stone-200'}`}>
                    {char.name}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    Lv.{char.level} · {genderLabel(char.gender)} · {char.class}
                  </p>
                </div>
                {isActive && (
                  <span className="text-[9px] font-mono text-amber-500 shrink-0">Aktif</span>
                )}
              </button>
            )
          })}
        </div>
        {canCreateAnotherCharacter(characters) && (
          <Link
            href="/characters?mode=create"
            className="block text-center text-xs font-mono py-2.5 rounded-xl border border-dashed border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-800/40 transition"
          >
            + Yeni karakter oluştur
          </Link>
        )}
      </section>

      <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">Arkadaş daveti</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Karakter adı"
            className="flex-1 min-w-0 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-700/50 outline-none"
          />
          <button
            type="button"
            onClick={sendFriendInvite}
            disabled={friendBusy}
            className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold transition disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
        {friendMessage && (
          <p className="text-[10px] font-mono text-stone-400">{friendMessage}</p>
        )}
        <Link
          href="/oba/arkadas"
          className="text-[10px] font-mono text-stone-500 hover:text-amber-400 transition"
        >
          → Arkadaş listesi ve bekleyen istekler
        </Link>
      </section>

      <section className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">Kupon kodu</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Kod girin"
            className="flex-1 min-w-0 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-700/50 outline-none uppercase"
          />
          <button
            type="button"
            onClick={handleCoupon}
            className="shrink-0 px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:border-amber-700/50 hover:text-amber-400 text-xs font-mono transition"
          >
            Uygula
          </button>
        </div>
        {couponMessage && (
          <p className="text-[10px] font-mono text-stone-400">{couponMessage}</p>
        )}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full text-sm font-mono py-3 rounded-xl border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-900/40 transition disabled:opacity-50"
      >
        {loggingOut ? 'Çıkış yapılıyor...' : 'Hesap değiştir · Çıkış'}
      </button>
    </div>
  )
}
