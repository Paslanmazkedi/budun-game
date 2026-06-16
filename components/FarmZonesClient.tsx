'use client'

import { useRouter } from 'next/navigation'
import { FARM_ZONES } from '@/lib/farm-zones'

export default function FarmZonesClient() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono text-stone-500 leading-relaxed">
        Harita farm slotları — parti boyutuna göre alan seç, parti kur, göreve gönder.
      </p>

      <div className="relative rounded-2xl border border-stone-800 min-h-[280px] bg-stone-950/60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 to-stone-950" />
        {FARM_ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => router.push(`/party?zone=${encodeURIComponent(zone.id)}`)}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group active:scale-95 transition"
            style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
          >
            <span className="w-11 h-11 rounded-full border-2 border-emerald-700/50 bg-stone-950/90 flex items-center justify-center text-xl group-hover:border-emerald-500">
              {zone.icon}
            </span>
            <span className="text-[8px] font-mono font-bold text-emerald-400/90 bg-stone-950/80 px-1 rounded max-w-[72px] truncate">
              {zone.name.split(' ')[0]}
            </span>
            <span className="text-[7px] font-mono text-stone-500">{zone.partySize} kişi</span>
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {FARM_ZONES.map((zone) => (
          <li
            key={zone.id}
            className="rounded-xl border border-stone-800 bg-stone-900/40 p-4 flex items-center gap-3"
          >
            <span className="text-2xl">{zone.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-200">{zone.name}</p>
              <p className="text-[10px] font-mono text-stone-500 mt-0.5">{zone.description}</p>
              <p className="text-[10px] font-mono text-emerald-500/80 mt-1">
                {zone.partySize} kişilik · min sv {zone.minCharacterLevel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/party?zone=${encodeURIComponent(zone.id)}`)}
              className="shrink-0 text-[10px] font-mono font-bold px-3 py-2 rounded-lg bg-emerald-900/40 text-emerald-400 border border-emerald-800/40"
            >
              Parti
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
