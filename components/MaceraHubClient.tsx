'use client'

import { useRouter } from 'next/navigation'
import { MACERA_DESTINATIONS } from '@/lib/nav-routes'

export default function MaceraHubClient() {
  const router = useRouter()

  return (
    <div className="relative flex-1 flex flex-col min-h-[calc(100dvh-var(--nav-height))]">
      <header className="relative z-20 px-4 pt-4 pb-2 safe-top">
        <p className="text-[10px] font-mono text-amber-500/80 uppercase tracking-[0.2em]">Yolculuk</p>
        <h1 className="text-2xl font-serif font-black text-stone-100 mt-1">Macera</h1>
        <p className="text-[10px] font-mono text-stone-500 mt-1 uppercase tracking-widest">
          Sefer, parti ve farm — aksiyon burada
        </p>
      </header>

      <div className="relative flex-1 px-4 pb-8 z-20">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto pt-4">
          {MACERA_DESTINATIONS.map((dest) => (
            <button
              key={dest.href}
              type="button"
              onClick={() => router.push(dest.href)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-stone-950/75 backdrop-blur-md transition-all active:scale-95 hover:border-amber-500/50 min-h-[120px] ${
                dest.tone === 'combat'
                  ? 'border-red-900/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]'
                  : dest.tone === 'social'
                    ? 'border-cyan-900/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                    : 'border-amber-900/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]'
              }`}
            >
              <span className="text-3xl">{dest.icon}</span>
              <span className="text-xs font-serif font-bold text-stone-200">{dest.label}</span>
              <span className="text-[9px] font-mono text-stone-500 text-center leading-snug">
                {dest.description}
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-[9px] font-mono text-stone-600 uppercase tracking-[0.2em] mt-8">
          Boy / klan → Oba menüsü
        </p>
      </div>
    </div>
  )
}
