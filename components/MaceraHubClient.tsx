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
          Sefer ve cenk — aksiyon burada başlar
        </p>
      </header>

      <div className="relative flex-1 flex items-center justify-center px-4 pb-8">
        {/* Gelecekte splash art üzerine SVG ikonlar yerleştirilecek */}
        <div className="relative w-full max-w-lg aspect-[4/5] max-h-[min(70vh,560px)]">
          {MACERA_DESTINATIONS.map((dest) => (
            <button
              key={dest.href}
              type="button"
              onClick={() => router.push(dest.href)}
              className={`absolute z-20 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 bg-stone-950/75 backdrop-blur-md transition-all active:scale-95 hover:border-amber-500/50 ${
                dest.position === 'left'
                  ? 'left-0 top-[18%] border-amber-900/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]'
                  : 'right-0 top-[18%] border-red-900/40 hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]'
              }`}
              aria-label={dest.label}
            >
              <span className="text-4xl drop-shadow-lg">{dest.icon}</span>
              <span className="text-xs font-serif font-bold text-stone-200">{dest.label}</span>
              <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
                {dest.description}
              </span>
            </button>
          ))}

          <div className="absolute inset-x-0 bottom-[12%] text-center pointer-events-none">
            <p className="text-[9px] font-mono text-stone-600 uppercase tracking-[0.25em]">
              Bozkır seni bekliyor
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
