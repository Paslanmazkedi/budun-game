'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  type GameCharacter,
  genderLabel,
  canCreateAnotherCharacter,
  MAX_CHARACTERS_PER_ACCOUNT,
} from '@/lib/characters'
import { syncActiveCharacterId } from '@/lib/active-character-client'

type CharacterRosterProps = {
  characters: GameCharacter[]
  activeCharacterId: string
  onSwitch?: (character: GameCharacter) => void
}

export default function CharacterRoster({
  characters,
  activeCharacterId,
  onSwitch,
}: CharacterRosterProps) {
  const router = useRouter()
  const canCreate = canCreateAnotherCharacter(characters)

  async function handleSwitch(char: GameCharacter) {
    if (char.id === activeCharacterId) return
    await syncActiveCharacterId(char.id)
    onSwitch?.(char)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
        Karakterler ({characters.length}/{MAX_CHARACTERS_PER_ACCOUNT})
      </p>

      <div className="space-y-1.5">
        {characters.map((char) => {
          const isActive = char.id === activeCharacterId
          return (
            <button
              key={char.id}
              type="button"
              onClick={() => handleSwitch(char)}
              className={`w-full text-left text-xs py-2.5 px-3 rounded-lg border transition flex justify-between items-center gap-2 ${
                isActive
                  ? 'bg-amber-600/10 border-amber-600/40 text-amber-400 font-bold'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              <span className="truncate">
                {char.name}{' '}
                <span className="text-stone-500 font-normal">
                  Lv.{char.level} · {genderLabel(char.gender)}
                </span>
              </span>
              {isActive && (
                <span className="text-[10px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-mono shrink-0">
                  Aktif
                </span>
              )}
            </button>
          )
        })}
      </div>

      <Link
        href="/characters"
        className="w-full flex items-center justify-center gap-2 text-xs py-2.5 px-3 rounded-lg border border-stone-800 bg-stone-950 text-stone-400 hover:text-amber-400 hover:border-amber-800/50 transition font-mono"
      >
        Karakter Seçim Ekranı
      </Link>

      {canCreate && (
        <Link
          href="/characters?mode=create"
          className="w-full flex items-center gap-2 text-xs py-2 px-3 text-stone-600 hover:text-amber-500 transition font-mono"
        >
          ➕ Yeni karakter oluştur
        </Link>
      )}
    </div>
  )
}

export function ActiveCharacterBadge({ character }: { character: GameCharacter }) {
  return (
    <Link
      href="/characters"
      className="text-xs font-mono text-stone-400 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-lg hover:border-amber-800/50 transition"
    >
      <span className="text-amber-500">{character.name}</span>
      <span className="text-stone-600 mx-1">·</span>
      <span>Lv.{character.level}</span>
      <span className="text-stone-600 mx-1">·</span>
      <span>{genderLabel(character.gender)}</span>
    </Link>
  )
}
