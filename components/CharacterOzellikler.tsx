'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  computePowerScore,
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
          className="w-7 h-7 rounded border border-stone-700 bg-stone-950 text-stone-400 text-xs disabled:opacity-30 hover:border-stone-500 transition"
        >
          −
        </button>
        <div className="flex-1 h-3 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden relative">
          <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
        </div>
        <button
          type="button"
          onClick={onIncrease}
          disabled={!canInc}
          className="w-7 h-7 rounded border border-stone-700 bg-stone-950 text-stone-400 text-xs disabled:opacity-30 hover:border-amber-700/50 transition"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function CharacterOzellikler({ character: initial }: { character: GameCharacter }) {
  const router = useRouter()
  const supabase = createClient()
  const sheet = buildSheetData(initial)

  const [character, setCharacter] = useState(initial)
  const [stats, setStats] = useState<CharacterStats>(() => statsFromCharacter(initial))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const remaining = getRemainingStatPoints(stats, character.level)
  const dirty = hasStatChanges(character, stats)

  const statRows: {
    key: keyof CharacterStats
    label: string
    bar: string
  }[] = [
    { key: 'strength', label: 'Güç', bar: 'bg-red-600' },
    { key: 'agility', label: 'Çeviklik', bar: 'bg-emerald-600' },
    { key: 'intelligence', label: 'Zeka', bar: 'bg-cyan-600' },
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

    setCharacter({
      ...character,
      strength: stats.strength,
      agility: stats.agility,
      intelligence: stats.intelligence,
      power_score: powerScore,
    })
    setMessage('Nitelikler kaydedildi.')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full lg:max-w-none lg:mx-0">
      {message && (
        <p className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-3 py-2">
          {message}
        </p>
      )}

      <PanelFrame title="Nitelik Dağılımı">
        <p className="text-[10px] font-mono text-stone-500 mb-3">
          Savaş Kudreti:{' '}
          <span className="text-amber-400 font-bold">{pendingPowerScore(stats)}</span>
        </p>
        <div className="mb-3 flex justify-between items-center text-[10px] font-mono">
          <span className="text-stone-500">Kullanılabilir Puan</span>
          <span className={remaining === 0 ? 'text-emerald-500' : 'text-amber-400 font-bold'}>
            {remaining}
          </span>
        </div>
        <div className="space-y-4">
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
            className="w-full mt-4 text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 px-4 py-3 rounded-xl transition active:scale-95"
          >
            {saving ? 'Kaydediliyor...' : remaining > 0 ? `Kaydet (${remaining} puan)` : 'Kaydet'}
          </button>
        )}
      </PanelFrame>

      <PanelFrame title="Beceri Tablosu">
        <div className="space-y-2">
          {sheet.skills.map((skill) => (
            <div
              key={skill.id}
              className={`flex items-center gap-3 p-2.5 rounded-sm border ${
                skill.unlocked
                  ? 'border-stone-700 bg-stone-950/50'
                  : 'border-stone-800 bg-stone-950/20 opacity-50'
              }`}
            >
              <span className="text-xl w-9 text-center shrink-0">{skill.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-xs font-bold text-stone-300 truncate">{skill.name}</span>
                  <span className="text-[9px] font-mono text-stone-500 shrink-0">
                    {skill.unlocked ? `Sv.${skill.level}/${skill.maxLevel}` : 'Kilitli'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">{skill.description}</p>
              </div>
            </div>
          ))}
        </div>
      </PanelFrame>
    </div>
  )
}
