'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  characterBaseImage,
  normalizeGender,
} from '@/lib/game-assets'
import {
  computePowerScore,
  genderLabel,
  type GameCharacter,
} from '@/lib/characters'
import {
  adjustCharacterStat,
  canDecreaseCharacterStat,
  canIncreaseCharacterStat,
  deriveVitals,
  getRemainingStatPoints,
  type CharacterStats,
} from '@/lib/character-stats'
import {
  buildSheetData,
  hasStatChanges,
  pendingPowerScore,
  statsFromCharacter,
} from '@/lib/character-sheet'

function PanelFrame({
  title,
  children,
  className = '',
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-stone-900/60 border border-stone-700/80 rounded-sm shadow-inner ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(41,37,36,0.9) 0%, rgba(12,10,9,0.95) 100%)',
      }}
    >
      {title && (
        <div className="px-3 py-2 border-b border-stone-700/60 bg-stone-950/40">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
            {title}
          </h3>
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  )
}

function StatSlider({
  label,
  value,
  max,
  color,
  onDecrease,
  onIncrease,
  canDec,
  canInc,
}: {
  label: string
  value: number
  max: number
  color: string
  onDecrease: () => void
  onIncrease: () => void
  canDec: boolean
  canInc: boolean
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-stone-500 uppercase tracking-wider">{label}</span>
        <span className="text-stone-300 font-bold">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrease}
          disabled={!canDec}
          className="w-6 h-6 rounded border border-stone-700 bg-stone-950 text-stone-400 text-xs disabled:opacity-30 hover:border-stone-500 transition"
        >
          −
        </button>
        <div className="flex-1 h-3 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden relative">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-stone-400/50"
            style={{ left: `${pct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canInc}
          className="w-6 h-6 rounded border border-stone-700 bg-stone-950 text-stone-400 text-xs disabled:opacity-30 hover:border-amber-700/50 transition"
        >
          +
        </button>
      </div>
    </div>
  )
}

function VitalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-stone-600 w-8 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <span className="text-[9px] font-mono text-stone-500 w-8 text-right">{value}</span>
    </div>
  )
}

export default function CharacterSheet({ character: initial }: { character: GameCharacter }) {
  const router = useRouter()
  const supabase = createClient()
  const sheet = buildSheetData(initial)

  const [character, setCharacter] = useState(initial)
  const [stats, setStats] = useState<CharacterStats>(() => statsFromCharacter(initial))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const gender = normalizeGender(character.gender)
  const vitals = deriveVitals(stats, character.level)
  const vitalMax = Math.max(vitals.health, vitals.stamina, vitals.spirit, 100)
  const remaining = getRemainingStatPoints(stats, character.level)
  const dirty = hasStatChanges(character, stats)

  const statRows: {
    key: keyof CharacterStats
    label: string
    color: string
    bar: string
  }[] = [
    { key: 'strength', label: 'Güç', color: 'text-red-400', bar: 'bg-red-600' },
    { key: 'agility', label: 'Çeviklik', color: 'text-emerald-400', bar: 'bg-emerald-600' },
    { key: 'intelligence', label: 'Zeka', color: 'text-cyan-400', bar: 'bg-cyan-600' },
  ]

  const saveStats = async () => {
    if (!dirty) return
    setSaving(true)
    setMessage(null)

    const powerScore = computePowerScore(stats)
    const { error } = await supabase
      .from('characters')
      .update({
        strength: stats.strength,
        agility: stats.agility,
        intelligence: stats.intelligence,
        power_score: powerScore,
      })
      .eq('id', character.id)

    if (error) {
      if (error.message.includes('power_score')) {
        const retry = await supabase
          .from('characters')
          .update({
            strength: stats.strength,
            agility: stats.agility,
            intelligence: stats.intelligence,
          })
          .eq('id', character.id)
        if (retry.error) {
          setMessage(retry.error.message)
          setSaving(false)
          return
        }
      } else {
        setMessage(error.message)
        setSaving(false)
        return
      }
    }

    const updated = {
      ...character,
      strength: stats.strength,
      agility: stats.agility,
      intelligence: stats.intelligence,
      power_score: powerScore,
    }
    setCharacter(updated)
    setMessage('Nitelikler kaydedildi.')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-3 py-2">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        {/* Sol — kimlik, yaşam gücü, nitelikler */}
        <div className="lg:col-span-4 space-y-3 order-1">
          <PanelFrame>
            <div className="space-y-3">
              <div>
                <h2 className="text-xl font-serif font-black text-stone-100 truncate">{character.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-amber-400 px-2 py-0.5 rounded">
                    Lv. {character.level}
                  </span>
                  <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-stone-400 px-2 py-0.5 rounded">
                    {character.class}
                  </span>
                  <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-stone-500 px-2 py-0.5 rounded">
                    {genderLabel(character.gender)}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-stone-600 mt-2">
                  Savaş Kudreti:{' '}
                  <span className="text-amber-400 font-bold">{pendingPowerScore(stats)}</span>
                </p>
              </div>

              <div className="border-t border-stone-700/60 pt-3 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-stone-500 mb-2">
                  Yaşam Gücü
                </p>
                <VitalBar label="Can" value={vitals.health} max={vitalMax} color="bg-red-700" />
                <VitalBar label="Güç" value={vitals.stamina} max={vitalMax} color="bg-emerald-700" />
                <VitalBar label="Ruh" value={vitals.spirit} max={vitalMax} color="bg-cyan-700" />
              </div>
            </div>
          </PanelFrame>

          <PanelFrame title="Nitelik Dağıtımı">
            <div className="mb-3 flex justify-between items-center text-[10px] font-mono">
              <span className="text-stone-500">Kullanılabilir Puan</span>
              <span className={remaining === 0 ? 'text-emerald-500' : 'text-amber-400 font-bold'}>
                {remaining}
              </span>
            </div>
            <div className="space-y-3">
              {statRows.map((row) => (
                <StatSlider
                  key={row.key}
                  label={row.label}
                  value={stats[row.key]}
                  max={Math.max(20, stats[row.key] + remaining)}
                  color={row.bar}
                  onDecrease={() =>
                    setStats((s) => adjustCharacterStat(s, character.level, row.key, -1))
                  }
                  onIncrease={() =>
                    setStats((s) => adjustCharacterStat(s, character.level, row.key, 1))
                  }
                  canDec={canDecreaseCharacterStat(stats, row.key)}
                  canInc={canIncreaseCharacterStat(stats, character.level, row.key)}
                />
              ))}
            </div>
            {dirty && (
              <button
                type="button"
                onClick={saveStats}
                disabled={saving}
                className="w-full mt-4 text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 px-4 py-2.5 rounded-xl transition active:scale-95"
              >
                {saving ? 'Kaydediliyor...' : remaining > 0 ? `Kaydet (${remaining} puan)` : 'Kaydet'}
              </button>
            )}
          </PanelFrame>
        </div>

        {/* Orta — tek karakter görseli */}
        <div className="lg:col-span-5 flex flex-col min-h-[280px] sm:min-h-[360px] lg:min-h-[520px] order-2">
          <div
            className="flex-1 border border-stone-700/80 rounded-sm relative overflow-hidden flex items-end justify-center min-h-[280px]"
            style={{
              background:
                'linear-gradient(180deg, #1c1917 0%, #292524 40%, #0c0a09 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_80%,rgba(245,158,11,0.15),transparent_60%)]" />
            <img
              src={characterBaseImage(gender)}
              alt={character.name}
              className="relative z-10 max-h-[92%] max-w-[92%] object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter contrast-110"
            />
          </div>
        </div>

        {/* Sağ — klan, beceriler */}
        <div className="lg:col-span-3 space-y-3 order-3">
          <PanelFrame title="Kutlu Nişanlar">
            <div className="grid grid-cols-4 gap-2">
              {sheet.skills.slice(0, 4).map((skill) => (
                <div
                  key={skill.id}
                  title={skill.name}
                  className={`aspect-square border rounded-sm flex items-center justify-center text-lg ${
                    skill.unlocked
                      ? 'border-amber-800/40 bg-amber-950/20'
                      : 'border-stone-800 bg-stone-950/40 opacity-40'
                  }`}
                >
                  {skill.icon}
                </div>
              ))}
            </div>
          </PanelFrame>

          <PanelFrame title="Boy & Klan">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 border border-amber-900/40 bg-amber-950/20 rounded-sm flex items-center justify-center text-2xl shrink-0">
                {sheet.clan.emblem}
              </div>
              <div className="min-w-0">
                <p className="font-serif font-bold text-stone-200">{sheet.clan.name}</p>
                <p className="text-[10px] font-mono text-amber-500/80 mt-0.5">{sheet.clan.rank}</p>
                <p className="text-[10px] font-mono text-stone-500 mt-1 italic">
                  &ldquo;{sheet.clan.motto}&rdquo;
                </p>
                <p className="text-[10px] font-mono text-stone-600 mt-2">
                  Kut Etkisi:{' '}
                  <span className="text-amber-500">{sheet.clan.influence.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </PanelFrame>

          <PanelFrame title="Beceriler">
            <div className="space-y-2">
              {sheet.skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`flex items-center gap-3 p-2 rounded-sm border ${
                    skill.unlocked
                      ? 'border-stone-700 bg-stone-950/50'
                      : 'border-stone-800 bg-stone-950/20 opacity-50'
                  }`}
                >
                  <span className="text-lg w-8 text-center">{skill.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs font-bold text-stone-300 truncate">{skill.name}</span>
                      <span className="text-[9px] font-mono text-stone-500 shrink-0">
                        {skill.unlocked ? `Lv.${skill.level}/${skill.maxLevel}` : 'Kilitli'}
                      </span>
                    </div>
                    <p className="text-[9px] text-stone-600 mt-0.5 line-clamp-1">{skill.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}
