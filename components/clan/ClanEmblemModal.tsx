'use client'

import { useState } from 'react'
import ClanEmblemPicker from '@/components/clan/ClanEmblemPicker'

type ClanEmblemModalProps = {
  clanLevel: number
  currentEmblem: string
  busy: boolean
  onClose: () => void
  onSave: (emblem: string) => void
}

export default function ClanEmblemModal({
  clanLevel,
  currentEmblem,
  busy,
  onClose,
  onSave,
}: ClanEmblemModalProps) {
  const [emblem, setEmblem] = useState(currentEmblem)

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-stone-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-stone-950 border border-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[min(88dvh,calc(100dvh-var(--nav-height)-0.5rem))] mb-[var(--nav-height)] sm:mb-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-stone-800 px-5 py-4">
          <p className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest">Boy simgesi</p>
          <h3 className="font-serif font-bold text-stone-100 text-lg mt-1">Totem seç</h3>
          <p className="text-[10px] font-mono text-stone-500 mt-1">
            Boy seviyesi yükseldikçe yeni simgeler açılır
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
          <div className="flex justify-center mb-4">
            <span className="text-6xl drop-shadow-lg">{emblem}</span>
          </div>
          <ClanEmblemPicker clanLevel={clanLevel} value={emblem} onChange={setEmblem} disabled={busy} />
        </div>

        <div className="shrink-0 border-t border-stone-800 bg-stone-950 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(emblem)}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm disabled:opacity-50"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-stone-700 text-stone-400 text-sm"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}