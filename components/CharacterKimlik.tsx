'use client'

import CharacterWithMount from '@/components/CharacterWithMount'
import {
  genderLabel,
  getCharacterPower,
  type GameCharacter,
} from '@/lib/characters'
import { buildSheetData, statsFromCharacter } from '@/lib/character-sheet'
import {
  deriveEffectiveVitals,
  EMPTY_EQUIPMENT_BONUSES,
  type EquipmentBonuses,
} from '@/lib/equipment-stats'

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

function VitalBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-stone-600 w-8 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-stone-950 border border-stone-700 rounded-sm overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-stone-500 w-8 text-right">{value}</span>
    </div>
  )
}

function CharacterSummary({
  character,
  power,
  compact = false,
}: {
  character: GameCharacter
  power: number
  compact?: boolean
}) {
  return (
    <div className={compact ? 'text-center' : ''}>
      <h2
        className={`font-serif font-black text-stone-100 truncate ${
          compact ? 'text-2xl' : 'text-xl'
        }`}
      >
        {character.name}
      </h2>
      <div
        className={`flex flex-wrap gap-2 mt-2 ${compact ? 'justify-center' : ''}`}
      >
        <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-amber-400 px-2 py-0.5 rounded">
          Lv. {character.level}
        </span>
        <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-amber-500/90 px-2 py-0.5 rounded">
          Savaş Kudreti {power}
        </span>
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-stone-400 px-2 py-0.5 rounded">
            {character.class}
          </span>
          <span className="text-[10px] font-mono bg-stone-950/80 border border-stone-700 text-stone-500 px-2 py-0.5 rounded">
            {genderLabel(character.gender)}
          </span>
        </div>
      )}
    </div>
  )
}

function VitalsPanel({
  vitals,
  vitalMax,
}: {
  vitals: { health: number; stamina: number; spirit: number }
  vitalMax: number
}) {
  return (
    <PanelFrame title="Yaşam Gücü">
      <div className="space-y-2">
        <VitalBar label="Can" value={vitals.health} max={vitalMax} color="bg-red-700" />
        <VitalBar label="Güç" value={vitals.stamina} max={vitalMax} color="bg-emerald-700" />
        <VitalBar label="Ruh" value={vitals.spirit} max={vitalMax} color="bg-cyan-700" />
      </div>
    </PanelFrame>
  )
}

function TraitsPanel({
  character,
  power,
  vitals,
  vitalMax,
}: {
  character: GameCharacter
  power: number
  vitals: { health: number; stamina: number; spirit: number }
  vitalMax: number
}) {
  return (
    <PanelFrame>
      <div className="space-y-3">
        <CharacterSummary character={character} power={power} />
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
  )
}

function MedalsPanel({ skills }: { skills: ReturnType<typeof buildSheetData>['skills'] }) {
  return (
    <PanelFrame title="Kutlu Nişanlar">
      <div className="grid grid-cols-4 gap-2">
        {skills.slice(0, 4).map((skill) => (
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
  )
}

export default function CharacterKimlik({
  character,
  mountSlug,
  equipmentBonuses = EMPTY_EQUIPMENT_BONUSES,
}: {
  character: GameCharacter
  mountSlug?: string | null
  equipmentBonuses?: EquipmentBonuses
}) {
  const sheet = buildSheetData(character)
  const stats = statsFromCharacter(character)
  const vitals = deriveEffectiveVitals(stats, character.level, equipmentBonuses)
  const vitalMax = Math.max(vitals.health, vitals.stamina, vitals.spirit, 100)
  const power = getCharacterPower(character, equipmentBonuses)

  return (
    <>
      {/* Mobil — nick, seviye/kudret, sahne, yaşam gücü */}
      <div className="space-y-3 max-w-lg mx-auto lg:hidden">
        <PanelFrame>
          <CharacterSummary character={character} power={power} compact />
        </PanelFrame>

        <div className="border border-stone-700/80 rounded-sm relative overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950">
          <CharacterWithMount
            gender={character.gender}
            characterName={character.name}
            mountSlug={mountSlug}
            variant="kimlik"
            className="w-full"
          />
        </div>

        <VitalsPanel vitals={vitals} vitalMax={vitalMax} />

        <MedalsPanel skills={sheet.skills} />
      </div>

      {/* PC — sol: özellikler + nişan | sağ: sahne + sekmeler */}
      <div
        className="hidden lg:grid lg:grid-cols-[minmax(17rem,20rem)_1fr] lg:gap-6 xl:gap-8 lg:flex-1 lg:min-h-0 lg:h-full"
      >
        <aside className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 game-scroll">
          <TraitsPanel character={character} power={power} vitals={vitals} vitalMax={vitalMax} />
          <MedalsPanel skills={sheet.skills} />
        </aside>

        <div
          className="min-h-0 min-w-0 border border-stone-700/80 rounded-sm relative overflow-hidden bg-gradient-to-b from-stone-900 to-stone-950"
        >
          <CharacterWithMount
            gender={character.gender}
            characterName={character.name}
            mountSlug={mountSlug}
            variant="kimlik"
            className="w-full h-full min-h-0 kimlik-scene--hub-fill"
          />
        </div>
      </div>
    </>
  )
}
