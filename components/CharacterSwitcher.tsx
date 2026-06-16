'use client'

import { useEffect, useState, useRef } from 'react'
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

type CharacterSwitcherProps = {
  /** Otağ ekranında sadece avatar + isim */
  compact?: boolean
  /** Dropdown sağa hizalı (Oba üst bar) */
  alignRight?: boolean
  onSwitch?: (char: GameCharacter) => void
}

export default function CharacterSwitcher({ compact = false, alignRight = false, onSwitch }: CharacterSwitcherProps) {
  const router = useRouter()
  const supabase = createClient()
  const [characters, setCharacters] = useState<GameCharacter[]>([])
  const [active, setActive] = useState<GameCharacter | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
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
      const current = resolveActiveCharacter(chars, preferred)
      if (current) {
        setActive(current)
        if (!preferred || preferred !== current.id) setActiveCharacterId(current.id)
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const switchTo = (char: GameCharacter) => {
    setActiveCharacterId(char.id)
    setActive(char)
    setOpen(false)
    onSwitch?.(char)
    router.refresh()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setOpen(false)
    await signOutToLogin()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="h-10 w-32 bg-stone-900/60 border border-stone-800 rounded-xl animate-pulse" />
    )
  }

  if (!active) {
    return (
      <Link
        href="/characters"
        className="text-xs font-mono text-amber-500 border border-amber-900/40 px-3 py-2 rounded-xl"
      >
        Karakter seç
      </Link>
    )
  }

  const gender = normalizeGender(active.gender)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-stone-950/80 backdrop-blur border border-stone-800 hover:border-amber-800/40 rounded-xl transition active:scale-[0.98] ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="w-8 h-8 rounded-lg border border-stone-700 bg-stone-900 overflow-hidden shrink-0">
          <img src={characterBaseImage(gender)} alt="" className="w-full h-full object-contain p-0.5" />
        </div>
        <div className="min-w-0 text-left">
          <p className={`font-serif font-bold text-amber-500 truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {active.name}
          </p>
          {!compact && (
            <p className="text-[10px] font-mono text-stone-500">
              Lv.{active.level} · {genderLabel(active.gender)}
            </p>
          )}
        </div>
        <span className="text-stone-600 text-xs shrink-0 ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-stone-950 border border-stone-800 rounded-xl shadow-2xl z-[200] overflow-hidden animate-slide-up ${
            alignRight ? 'right-0 left-auto' : 'left-0'
          }`}
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-stone-800 bg-stone-900/80">
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Karakter Değiştir</p>
          </div>
          <div className="p-2 space-y-1 max-h-56 overflow-y-auto game-scroll">
            {characters.map((char) => {
              const isActive = char.id === active.id
              const g = normalizeGender(char.gender)
              return (
                <button
                  key={char.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => switchTo(char)}
                  className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition ${
                    isActive
                      ? 'bg-amber-500/10 border border-amber-600/30'
                      : 'hover:bg-stone-900 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg border border-stone-700 bg-stone-900 overflow-hidden shrink-0">
                    <img src={characterBaseImage(g)} alt="" className="w-full h-full object-contain p-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-amber-400' : 'text-stone-200'}`}>
                      {char.name}
                    </p>
                    <p className="text-[10px] font-mono text-stone-500">
                      Lv.{char.level} · {genderLabel(char.gender)}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-mono text-amber-500 shrink-0">Aktif</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="p-2 border-t border-stone-800 space-y-1">
            {userEmail && (
              <p className="px-2 py-1.5 text-[9px] font-mono text-stone-600 truncate border-b border-stone-800/80 mb-1">
                {userEmail}
              </p>
            )}
            {canCreateAnotherCharacter(characters) && (
              <Link
                href="/characters?mode=create"
                onClick={() => setOpen(false)}
                className="block text-center text-[10px] font-mono py-2 text-stone-500 hover:text-amber-400 transition"
              >
                + Yeni karakter oluştur
              </Link>
            )}
            <Link
              href="/characters"
              onClick={() => setOpen(false)}
              className="block text-center text-[10px] font-mono py-2 text-stone-600 hover:text-stone-400 transition"
            >
              Karakter seçim ekranı
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-center text-[10px] font-mono py-2.5 rounded-lg border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-900/40 transition disabled:opacity-50"
            >
              {loggingOut ? 'Çıkış yapılıyor...' : 'Hesap değiştir · Çıkış'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
