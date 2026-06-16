'use client'

export default function OtagSideMenuTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-0 bottom-[calc(var(--nav-height)+0.75rem)] z-[35] pointer-events-auto flex items-center gap-1.5 pl-2.5 pr-1.5 py-2.5 rounded-l-2xl bg-stone-950/88 backdrop-blur-md border border-stone-700/80 border-r-0 shadow-[-4px_0_24px_rgba(0,0,0,0.45)] hover:border-amber-700/50 hover:bg-stone-950/95 transition active:scale-[0.98]"
      aria-label="Oba faaliyetleri menüsünü aç"
    >
      <span className="text-stone-500 text-lg leading-none shrink-0" aria-hidden>‹</span>
      <span
        className="text-[26px] leading-none shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.35)]"
        aria-hidden
      >
        🏕️
      </span>
    </button>
  )
}
