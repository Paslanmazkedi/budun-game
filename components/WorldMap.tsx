'use client'

import { useRouter } from 'next/navigation'
import { WORLD_BOSS, WORLD_ZONES } from '@/lib/world-zones'
import { WORLD_MAP_BG } from '@/lib/game-assets'

export default function WorldMap() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono text-stone-500 leading-relaxed">
        Bölgelere yolculuk et, odadaki oyuncularla parti kur. Haftalık dünya boss için toplan.
      </p>

      {/* Haftalık dünya boss */}
      <div className="bg-gradient-to-r from-red-950/40 to-stone-900/60 border border-red-900/40 rounded-xl p-4 flex items-center gap-4">
        <span className="text-3xl shrink-0">{WORLD_BOSS.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono text-red-400/90 uppercase tracking-widest">Haftalık</p>
          <p className="text-sm font-serif font-bold text-stone-100">{WORLD_BOSS.name}</p>
          <p className="text-[10px] font-mono text-stone-500 mt-1">{WORLD_BOSS.description}</p>
        </div>
        <button
          type="button"
          disabled
          className="shrink-0 text-[10px] font-mono font-bold uppercase px-3 py-2 rounded-lg border border-stone-700 text-stone-600"
        >
          Yakında
        </button>
      </div>

      {/* Statik dünya haritası */}
      <div
        className="relative rounded-2xl border border-stone-800 overflow-hidden min-h-[320px] sm:min-h-[380px]"
        role="application"
        aria-label="Dünya haritası"
      >
        <img
          src={WORLD_MAP_BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/20 to-stone-950/80" />

        {/* Dünya boss işaretçisi */}
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
            onClick={() => router.push(`/dunya/${zone.id}`)}
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
            <span className="text-[7px] sm:text-[8px] font-mono font-bold text-stone-300 uppercase bg-stone-950/85 px-1.5 py-0.5 rounded border border-stone-800/80 max-w-[72px] truncate">
              {zone.name}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[10px] font-mono text-stone-600 text-center">
        Görsel: Göktürk Anadolu splash — <code className="text-stone-500">public/images/backgrounds/world-map.png</code>
      </p>
    </div>
  )
}
