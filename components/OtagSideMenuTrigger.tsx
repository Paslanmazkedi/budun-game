'use client'

import { ObaFaaliyetleriIcon } from '@/components/icons/ObaFaaliyetleriIcon'

export default function OtagSideMenuTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-0 top-[42%] z-[35] pointer-events-auto flex items-center gap-2 pl-3 pr-1.5 py-2.5 rounded-l-2xl bg-stone-950/88 backdrop-blur-md border border-stone-700/80 border-r-0 shadow-[-4px_0_24px_rgba(0,0,0,0.45)] hover:border-amber-700/50 hover:bg-stone-950/95 transition active:scale-[0.98]"
      aria-label="Oba faaliyetleri menüsünü aç"
    >
      <span className="text-stone-500 text-base leading-none shrink-0" aria-hidden>‹</span>
      <div className="flex items-center gap-2 min-w-0">
        <ObaFaaliyetleriIcon className="w-8 h-8 text-amber-300 shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
        <span className="text-[11px] font-mono font-bold text-stone-200 uppercase tracking-wide leading-tight max-w-[80px] sm:max-w-none">
          Oba Faaliyetleri
        </span>
      </div>
    </button>
  )
}
