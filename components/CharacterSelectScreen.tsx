'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  characterBaseImage,
  characterHeadImage,
  normalizeGender,
  OTAG_BACKGROUND,
} from '@/lib/game-assets'
import {
  buildCharacterSlots,
  canCreateAnotherCharacter,
  computePowerScore,
  genderLabel,
  validateCharacterName,
  CHARACTER_NAME_MAX_LENGTH,
  type GameCharacter,
} from '@/lib/characters'
import {
  DEFAULT_STATS,
  getRemainingBonusPoints,
  adjustStat,
  type CharacterStats,
  STAT_MIN,
  STAT_MAX,
  STAT_BONUS_POOL,
} from '@/lib/character-stats'
import { getActiveCharacterId, syncActiveCharacterId } from '@/lib/active-character-client'
import { signOutToLogin } from '@/lib/auth-client'
import { grantStarterItems } from '@/lib/grant-starter-items'

const GENDERS = {
  er: { label: 'Er', heads: ['er-head-1', 'er-head-2', 'er-head-3'] },
  hatun: { label: 'Hatun', heads: ['hatun-head-1', 'hatun-head-2'] },
}

type View = 'select' | 'create'

function StatAllocator({
  stats,
  onChange,
}: {
  stats: CharacterStats
  onChange: (stats: CharacterStats) => void
}) {
  const remaining = getRemainingBonusPoints(stats)
  const rows: { key: keyof CharacterStats; label: string; color: string }[] = [
    { key: 'strength', label: 'Güç', color: 'bg-red-500' },
    { key: 'agility', label: 'Çeviklik', color: 'bg-emerald-500' },
    { key: 'intelligence', label: 'Zeka', color: 'bg-cyan-500' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
        <span className="text-stone-500">Nitelik Dağıtımı</span>
        <span className={remaining === 0 ? 'text-emerald-500' : 'text-amber-500'}>
          {remaining} / {STAT_BONUS_POOL} puan kaldı
        </span>
      </div>
      {rows.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-stone-400 w-20 shrink-0">{label}</span>
          <button
            type="button"
            onClick={() => onChange(adjustStat(stats, key, -1))}
            disabled={stats[key] <= STAT_MIN}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-sm transition"
          >
            −
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-stone-500">{STAT_MIN}–{STAT_MAX}</span>
              <span className="text-stone-200 font-bold">{stats[key]}</span>
            </div>
            <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all`}
                style={{ width: `${((stats[key] - STAT_MIN) / (STAT_MAX - STAT_MIN)) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(adjustStat(stats, key, 1))}
            disabled={stats[key] >= STAT_MAX || remaining <= 0}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 text-sm transition"
          >
            +
          </button>
        </div>
      ))}
    </div>
  )
}

export default function CharacterSelectScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [characters, setCharacters] = useState<GameCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<View>('select')

  const [createGender, setCreateGender] = useState<'er' | 'hatun'>('er')
  const [headIndex, setHeadIndex] = useState(0)
  const [name, setName] = useState('')
  const [stats, setStats] = useState<CharacterStats>(DEFAULT_STATS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCharacters = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const chars = (data ?? []) as GameCharacter[]
    setCharacters(chars)

    const preferred = getActiveCharacterId()
    const initial =
      chars.find((c) => c.id === preferred)?.id ??
      chars[0]?.id ??
      null
    setSelectedId(initial)

    if (searchParams.get('mode') === 'create' && canCreateAnotherCharacter(chars)) {
      setView('create')
    }

    setLoading(false)
  }, [supabase, searchParams])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const slots = buildCharacterSlots(characters)
  const selectedChar = characters.find((c) => c.id === selectedId)
  const canCreate = canCreateAnotherCharacter(characters)
  const headStyle = GENDERS[createGender].heads[headIndex]

  const enterWorld = async () => {
    if (!selectedChar) return
    await syncActiveCharacterId(selectedChar.id)
    router.push('/')
  }

  const openCreate = () => {
    setView('create')
    setCreateGender('er')
    setHeadIndex(0)
    setName('')
    setStats({ ...DEFAULT_STATS })
    setError(null)
  }

  const handleCreate = async () => {
    const nameError = validateCharacterName(name)
    if (nameError) {
      setError(nameError)
      return
    }
    const trimmed = name.trim()
    if (getRemainingBonusPoints(stats) > 0) {
      setError(`Kalan ${getRemainingBonusPoints(stats)} nitelik puanını dağıt.`)
      return
    }

    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Oturum bulunamadı.')
      setSaving(false)
      return
    }

    const powerScore = computePowerScore(stats)
    const payload = {
      user_id: user.id,
      name: trimmed,
      gender: createGender,
      class: 'Gökbörü',
      level: 1,
      xp: 0,
      gold: 100,
      strength: stats.strength,
      agility: stats.agility,
      intelligence: stats.intelligence,
      power_score: powerScore,
    }

    let result = await supabase.from('characters').insert(payload).select('id').single()
    if (result.error?.message?.includes('power_score')) {
      const { power_score: _, ...rest } = payload
      result = await supabase.from('characters').insert(rest).select('id').single()
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    if (result.data?.id) {
      await syncActiveCharacterId(result.data.id)
      await grantStarterItems(supabase, result.data.id)
    }
    router.push('/')
    router.refresh()
  }

  const handleLogout = async () => {
    await signOutToLogin()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500 font-mono text-sm">
        Bozkır hazırlanıyor...
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
        <header className="border-b border-stone-900 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-[0.2em]">Budun Online</p>
            <h1 className="text-xl font-serif font-bold text-amber-500">Yeni Karakter</h1>
          </div>
          <button
            type="button"
            onClick={() => setView('select')}
            className="text-xs font-mono text-stone-500 hover:text-stone-300 transition"
          >
            ← Karakter Seçimine Dön
          </button>
        </header>

        <div className="flex-1 grid lg:grid-cols-2 gap-0 max-w-6xl mx-auto w-full">
          <div className="relative flex items-center justify-center bg-stone-900/50 border-b lg:border-b-0 lg:border-r border-stone-800 min-h-[320px] p-8">
            <img
              src={characterBaseImage(createGender)}
              alt=""
              className="absolute max-h-[280px] object-contain opacity-90"
            />
            <img
              src={characterHeadImage(headStyle)}
              alt=""
              className="absolute max-h-[280px] object-contain"
            />
          </div>

          <div className="p-6 md:p-8 space-y-5 overflow-y-auto">
            <div className="flex gap-2">
              {(Object.keys(GENDERS) as Array<'er' | 'hatun'>).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setCreateGender(g)
                    setHeadIndex(0)
                  }}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition ${
                    createGender === g
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-stone-700 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  {GENDERS[g].label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setHeadIndex((i) =>
                    i <= 0 ? GENDERS[createGender].heads.length - 1 : i - 1
                  )
                }
                className="w-9 h-9 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                ‹
              </button>
              <img src={characterHeadImage(headStyle)} alt="" className="w-16 h-16 object-contain" />
              <button
                type="button"
                onClick={() =>
                  setHeadIndex((i) =>
                    i >= GENDERS[createGender].heads.length - 1 ? 0 : i + 1
                  )
                }
                className="w-9 h-9 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                ›
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block mb-2">
                Karakter Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={CHARACTER_NAME_MAX_LENGTH}
                placeholder="Adını yaz..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[9px] font-mono text-stone-600 mt-1.5">
                {name.length}/{CHARACTER_NAME_MAX_LENGTH} · en az 2 karakter
              </p>
            </div>

            <StatAllocator stats={stats} onChange={setStats} />

            {error && (
              <p className="text-red-400 text-xs font-mono bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-900/20"
            >
              {saving ? 'Oluşturuluyor...' : 'Karakteri Oluştur'}
            </button>

            <p className="text-[10px] text-stone-600 font-mono text-center">
              {characters.length}/{3} slot kullanılıyor · Her stat {STAT_MIN} ile başlar, +{STAT_BONUS_POOL} puan dağıt
            </p>
          </div>
        </div>
      </div>
    )
  }

  const previewGender = selectedChar
    ? normalizeGender(selectedChar.gender)
    : 'er'

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={OTAG_BACKGROUND}
          alt=""
          className="w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/70" />
      </div>

      <header className="relative z-10 border-b border-stone-800/80 px-4 md:px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-[0.25em]">Budun Online</p>
          <h1 className="text-2xl font-serif font-black text-amber-500 uppercase tracking-wider">
            Karakter Seçimi
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-mono text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-900/40 px-3 py-2 rounded-lg transition"
        >
          Hesap değiştir · Çıkış
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 md:px-8 py-6 gap-6">
        {/* Sol: Slot listesi (BDO tarzı) */}
        <aside className="lg:w-72 shrink-0 space-y-2">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-3 px-1">
            Karakterler ({characters.length}/{3})
          </p>

          {slots.map((slot, index) => {
            if (slot.type === 'character') {
              const char = slot.character
              const isSelected = char.id === selectedId
              const g = normalizeGender(char.gender)
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedId(char.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex gap-3 items-center ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-stone-950 border border-stone-700 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={characterBaseImage(g)}
                      alt=""
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-serif font-bold truncate ${isSelected ? 'text-amber-400' : 'text-stone-200'}`}>
                      {char.name}
                    </p>
                    <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                      Lv.{char.level} · {genderLabel(char.gender)} · {char.class}
                    </p>
                    <p className="text-[10px] font-mono text-stone-600 mt-0.5">
                      🪙 {Number(char.gold).toLocaleString()} Akçe
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-600 shrink-0">#{index + 1}</span>
                </button>
              )
            }

            return (
              <button
                key={`empty-${index}`}
                type="button"
                onClick={openCreate}
                disabled={!canCreate}
                className="w-full p-3 rounded-xl border border-dashed border-stone-700 bg-stone-900/30 hover:border-amber-700/50 hover:bg-amber-500/5 transition flex gap-3 items-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-lg border border-dashed border-stone-600 flex items-center justify-center text-stone-600 text-xl">
                  +
                </div>
                <div>
                  <p className="text-sm font-mono text-stone-500">Boş Slot</p>
                  <p className="text-[10px] font-mono text-stone-600">Yeni karakter oluştur</p>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Orta: Büyük önizleme */}
        <div className="flex-1 flex items-end justify-center min-h-[280px] lg:min-h-0 relative">
          {selectedChar ? (
            <img
              src={characterBaseImage(previewGender)}
              alt={selectedChar.name}
              className="max-h-[55vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            />
          ) : (
            <div className="text-center text-stone-600 font-mono text-sm py-20">
              {canCreate ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="text-amber-500 hover:text-amber-400 transition"
                >
                  + İlk karakterini oluştur
                </button>
              ) : (
                'Karakter seç'
              )}
            </div>
          )}
        </div>

        {/* Sağ: Detay + aksiyon */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-4">
          {selectedChar ? (
            <>
              <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
                <h2 className="text-2xl font-serif font-black text-stone-100">{selectedChar.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded">
                    Lv. {selectedChar.level}
                  </span>
                  <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                    {genderLabel(selectedChar.gender)}
                  </span>
                  <span className="text-[10px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                    {selectedChar.class}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-800">
                  {[
                    { label: 'Güç', val: selectedChar.strength ?? STAT_MIN, color: 'text-red-400' },
                    { label: 'Çeviklik', val: selectedChar.agility ?? STAT_MIN, color: 'text-emerald-400' },
                    { label: 'Zeka', val: selectedChar.intelligence ?? STAT_MIN, color: 'text-cyan-400' },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between text-xs font-mono">
                      <span className="text-stone-500">{s.label}</span>
                      <span className={`font-bold ${s.color}`}>{s.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-mono pt-1 border-t border-stone-800/80">
                    <span className="text-stone-500">Savaş Kudreti</span>
                    <span className="text-amber-500 font-bold">
                      {selectedChar.power_score ?? computePowerScore({
                        strength: selectedChar.strength ?? STAT_MIN,
                        agility: selectedChar.agility ?? STAT_MIN,
                        intelligence: selectedChar.intelligence ?? STAT_MIN,
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-amber-500/80 pt-1">
                  🪙 {Number(selectedChar.gold).toLocaleString()} Akçe
                </p>
              </div>

              <button
                type="button"
                onClick={enterWorld}
                className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold py-4 rounded-xl transition shadow-lg shadow-amber-900/30 text-sm tracking-wide"
              >
                Otağa Gir →
              </button>
            </>
          ) : (
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 text-center text-stone-500 text-sm font-mono">
              Listeden karakter seç veya yeni slot aç
            </div>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="w-full border border-stone-700 hover:border-amber-700/50 text-stone-400 hover:text-amber-400 font-mono text-xs py-3 rounded-xl transition"
            >
              + Yeni Karakter Oluştur
            </button>
          )}
        </aside>
      </main>
    </div>
  )
}
