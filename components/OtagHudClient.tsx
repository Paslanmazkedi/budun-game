'use client'

import { useRouter } from 'next/navigation'
import { ObaActivityList } from '@/components/ObaHotspots'
import { BOZKIR_LINKS } from '@/lib/nav-routes'

type Character = {
  name?: string
}

export default function OtagHudClient({
  character,
  isOpen,
  onClose,
}: {
  character: Character
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-stone-950/70 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Kapat"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-[60] bg-stone-950/98 border-l border-stone-800 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-3 border-b border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest">
                Oba Faaliyetleri
              </p>
              <p className="text-[9px] font-mono text-stone-600 mt-0.5">Demirci · İksir · Boy · Harita</p>
              <p className="text-sm font-serif font-bold text-stone-200 mt-1">{character.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-stone-700 text-stone-400 hover:text-stone-200 transition"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 game-scroll">
            <section>
              <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
                Otağ Alanları
              </h3>
              <ObaActivityList onNavigate={onClose} />
            </section>

            <section>
              <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">Bozkır</h3>
              <div className="grid grid-cols-1 gap-2">
                {BOZKIR_LINKS.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push(link.href)
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-800/40 transition active:scale-[0.98] text-left group"
                  >
                    <span className="text-2xl w-10 text-center shrink-0">{link.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-stone-200 block">{link.label}</span>
                      <span className="text-[10px] font-mono text-stone-500">{link.description}</span>
                    </div>
                    <span className="text-stone-600 group-hover:text-amber-500/80 text-sm shrink-0">›</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-stone-800">
            <p className="text-center text-[10px] font-mono text-stone-600">
              Karakter ve hesap ayarları için üstteki hesap simgesine dokun.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
