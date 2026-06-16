'use client'

import Link from 'next/link'
import { useState } from 'react'
import ContentLootButton from '@/components/ContentLootButton'
import type { ContentLootSource } from '@/lib/content-loot'
import type { WorldZone } from '@/lib/world-zones'

/** Mock — ileride gerçek oda / presence API */
const MOCK_PLAYERS = [
  { id: '1', name: 'Börü Khan', power: 2840, inParty: false },
  { id: '2', name: 'Ayşe Hatun', power: 2650, inParty: true },
  { id: '3', name: 'Temür Alp', power: 2410, inParty: false },
]

function zoneLootSource(zone: WorldZone): ContentLootSource | null {
  if (zone.id === 'kapı-gecidi' || zone.id === 'kapi-gecidi') return 'dungeon'
  if (zone.id === 'gok-bori-zindani') return 'group_dungeon'
  return null
}

const LOOT_HINT: Record<ContentLootSource, string> = {
  dungeon: 'Nadir eşyalar bu zindandan düşer.',
  group_dungeon: 'Nadir ve Üstün eşyalar grup zindanından düşer.',
  world_boss: 'Eşsiz eşyalar haftalık dünya boss katılımcılarına verilir.',
  quest: '',
}

export default function WorldZoneRoom({
  zone,
  characterId,
}: {
  zone: WorldZone
  characterId?: string | null
}) {
  const [message, setMessage] = useState<string | null>(null)
  const lootSource = zoneLootSource(zone)
  const isDungeon = zone.type === 'dungeon'

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{zone.icon}</span>
        <div>
          <h2 className="text-lg font-serif font-bold text-stone-100">{zone.name}</h2>
          <p className="text-[10px] font-mono text-stone-500 mt-1">{zone.description}</p>
          {lootSource && (
            <p className="text-[10px] font-mono text-cyan-500/80 mt-2">{LOOT_HINT[lootSource]}</p>
          )}
          <p className="text-[10px] font-mono text-amber-500/80 mt-1">
            Odada ~{MOCK_PLAYERS.length} oyuncu (örnek)
          </p>
        </div>
      </div>

      {isDungeon && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMessage('Parti kurma yakında — ekip kudreti ile zindan')}
            className="text-xs font-mono font-bold bg-amber-600 hover:bg-amber-500 text-stone-950 py-3 rounded-xl transition active:scale-95"
          >
            Parti Kur
          </button>
          <button
            type="button"
            onClick={() => setMessage('Odaya katılma yakında')}
            className="text-xs font-mono font-bold border border-stone-700 text-stone-300 hover:border-amber-700/50 py-3 rounded-xl transition active:scale-95"
          >
            Odaya Katıl
          </button>
        </div>
      )}

      {characterId && lootSource && (
        <ContentLootButton characterId={characterId} source={lootSource} />
      )}

      {message && (
        <p className="text-xs font-mono text-amber-200/90 bg-amber-950/30 border border-amber-900/40 rounded-xl px-3 py-2">
          {message}
        </p>
      )}

      <div className="bg-stone-900/50 border border-stone-800 rounded-xl overflow-hidden">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest px-3 py-2 border-b border-stone-800">
          Bölgedeki oyuncular
        </p>
        <ul className="divide-y divide-stone-800/80">
          {MOCK_PLAYERS.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-xs font-mono">
              <span className="text-stone-300 flex-1 truncate">{p.name}</span>
              <span className="text-amber-500 font-bold">{p.power}</span>
              {p.inParty && (
                <span className="text-[9px] text-cyan-500/80 border border-cyan-900/40 px-1.5 py-0.5 rounded">
                  Partide
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dunya"
        className="block text-center text-[10px] font-mono text-stone-500 hover:text-amber-400 transition py-2"
      >
        ← Dünya haritası
      </Link>
    </div>
  )
}
