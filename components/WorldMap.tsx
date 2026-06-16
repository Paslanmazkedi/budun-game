'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentLootButton from '@/components/ContentLootButton'
import { WORLD_BOSS, WORLD_ZONES } from '@/lib/world-zones'

export default function WorldMap({ characterId }: { characterId?: string | null }) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono text-stone-500 leading-relaxed">
        Bölgelere yolculuk et, odadaki oyuncularla parti kur. Haftalık dünya boss için toplan.
      </p>

      <div className="bg-gradient-to-r from-red-950/40 to-stone-900/60 border border-red-900/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-3xl shrink-0">{WORLD_BOSS.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-red-400/90 uppercase tracking-widest">Haftalık</p>
            <p className="text-sm font-serif font-bold text-stone-100">{WORLD_BOSS.name}</p>
            <p className="text-[10px] font-mono text-stone-500 mt-1">{WORLD_BOSS.description}</p>
            <p className="text-[10px] font-mono text-amber-500/80 mt-1">
              Katılımcılara Eşsiz eşya (haftalık ödül havuzu)
            </p>
          </div>
        </div>
        {characterId ? (
          <ContentLootButton
            characterId={characterId}
            source="world_boss"
            label="Boss katılım ödülü (test)"
          />
        ) : (
          <p className="text-[10px] font-mono text-stone-600">Giriş yap ve karakter seç.</p>
        )}
      </div>

      <div
        className="relative rounded-2xl border border-stone-800 overflow-hidden min-h-[320px] sm:min-h-[380px]"
        role="application"
        aria-label="Dünya haritası"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950" />

        <button
          type="button"
          disabled
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-80"
          style={{ left: `${WORLD_BOSS.mapX}%`, top: `${WORLD_BOSS.mapY}%` }}
          title={WORLD_BOSS.name}
        >
          <span className="w-11 h-11 rounded-full border-2 border-red-700/60 bg-red-950/80 flex items-center justify-center text-xl shadow-lg shadow-red-900/30">
            {WORLD_BOSS.icon}
          </span>
          <span className="text-[7px] font-mono font-bold text-red-400/90 uppercase bg-stone-950/80 px-1 rounded">
            Boss
          </span>
        </button>

        {WORLD_ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => router.push(`/dunya/${encodeURIComponent(zone.id)}`)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group active:scale-95 transition"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            aria-label={zone.name}
          >
            <span
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center text-lg shadow-lg transition group-hover:scale-110 ${
                zone.type === 'dungeon'
                  ? 'border-amber-600/50 bg-stone-950/90 group-hover:border-amber-500'
                  : 'border-stone-600/50 bg-stone-950/85 group-hover:border-stone-500'
              }`}
            >
              {zone.icon}
            </span>
            <span className="text-[7px] font-mono font-bold text-stone-300 uppercase bg-stone-950/80 px-1 rounded max-w-[72px] truncate">
              {zone.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      <Link
        href="/siralama"
        className="block text-center text-[10px] font-mono text-stone-500 hover:text-amber-400 transition py-2"
      >
        → Kudret sıralaması
      </Link>
    </div>
  )
}
