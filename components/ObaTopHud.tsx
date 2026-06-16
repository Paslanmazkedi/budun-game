import Link from 'next/link'
import { AccountIcon } from '@/components/icons/AccountIcon'
import {
  computeDefenseScore,
  getCharacterPower,
  xpTargetForLevel,
  type GameCharacter,
} from '@/lib/characters'

type ObaTopHudProps = {
  character: GameCharacter
}

export default function ObaTopHud({ character }: ObaTopHudProps) {
  const level = character.level ?? 1
  const xp = character.xp ?? 0
  const xpTarget = xpTargetForLevel(level)
  const xpPct = Math.min(100, Math.floor((xp / xpTarget) * 100))
  const power = getCharacterPower(character)
  const defense = computeDefenseScore(character)

  return (
    <header className="absolute top-0 inset-x-0 z-[40] pointer-events-auto safe-top">
      <div className="px-3 pt-3 pb-3 md:px-5 bg-gradient-to-b from-stone-950/98 via-stone-950/85 to-transparent">
        <div className="w-full max-w-5xl lg:max-w-none lg:mx-0 flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 max-w-md">
              <div
                className="shrink-0 w-10 h-10 rounded-xl border-2 border-amber-700/50 bg-stone-950/90 flex flex-col items-center justify-center shadow-inner"
                aria-label={`Seviye ${level}`}
              >
                <span className="text-[7px] font-mono text-stone-500 uppercase leading-none">Sv</span>
                <span className="text-base font-serif font-black text-amber-400 leading-tight">{level}</span>
              </div>
              <div className="flex-1 min-w-0 bg-stone-950/90 backdrop-blur-md border border-stone-800/80 rounded-xl px-3 py-2 shadow-lg">
                <div className="flex justify-between items-center mb-1 text-[9px] font-mono">
                  <span className="text-stone-500 uppercase tracking-wider">Deneyim</span>
                  <span className="text-amber-500/90 tabular-nums">
                    {xp} / {xpTarget}
                  </span>
                </div>
                <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-950/45 border border-stone-800/50 backdrop-blur-sm">
                <span className="text-[7px] font-mono text-stone-500 uppercase tracking-wider">Güç</span>
                <span className="text-xs font-bold text-red-400/95 tabular-nums leading-none">{power}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-950/45 border border-stone-800/50 backdrop-blur-sm">
                <span className="text-[7px] font-mono text-stone-500 uppercase tracking-wider">Savunma</span>
                <span className="text-xs font-bold text-cyan-400/95 tabular-nums leading-none">{defense}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
            <Link
              href="/oba/hesap"
              className="w-11 h-11 rounded-xl border border-stone-700 bg-stone-950/90 backdrop-blur flex items-center justify-center text-amber-400/90 hover:text-amber-300 hover:border-amber-700/50 transition active:scale-[0.97]"
              aria-label={`Hesap — ${character.name}`}
            >
              <AccountIcon className="w-6 h-6" />
            </Link>
            <p className="text-[9px] font-serif font-bold text-amber-400/90 leading-tight truncate max-w-[5.5rem] text-center">
              {character.name}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
