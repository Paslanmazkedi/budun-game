'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ObaActivityList } from '@/components/ObaHotspots'

type Character = {
  xp?: number
  strength?: number
  agility?: number
  intelligence?: number
  power_score?: number
  level?: number
  gold?: number
  name?: string
}

const QUICK_LINKS = [
  { href: '/character', icon: '👤', label: 'Kahraman' },
  { href: '/macera', icon: '🗺️', label: 'Macera' },
  { href: '/market', icon: '⚖️', label: 'Pazar' },
]

export default function OtagHudClient({
  character,
  xpPercentage,
  nextLevelXpTarget,
  isOpen,
  onClose,
  onLogout,
}: {
  character: Character
  xpPercentage: number
  nextLevelXpTarget: number
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const router = useRouter()

  return (
    <>
      <div className="absolute bottom-[calc(var(--nav-height)+0.5rem)] left-3 right-3 md:left-5 md:right-auto md:w-72 z-[40] pointer-events-none">
        <div className="bg-stone-950/90 backdrop-blur-md border border-stone-800/80 rounded-xl px-3 py-2.5 shadow-xl">
          <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono">
            <span className="text-stone-500 uppercase tracking-wider">Deneyim</span>
            <span className="text-amber-500/90">
              {character?.xp ?? 0} / {Math.floor(nextLevelXpTarget)}
            </span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
            <div
              className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>
      </div>

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
              <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest">Oba Yönetimi</p>
              <p className="text-sm font-serif font-bold text-stone-200 mt-0.5">{character.name}</p>
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
              <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">Oba Aktiviteleri</h3>
              <ObaActivityList onNavigate={onClose} />
            </section>

            <section>
              <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">Hızlı Erişim</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_LINKS.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      onClose()
                      router.push(link.href)
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-800/40 transition active:scale-[0.98] text-left"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-xs font-bold text-stone-300">{link.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-stone-900/50 border border-stone-800 rounded-xl p-3 space-y-2">
              <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">Özet</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
                  <span className="text-stone-500 block text-[9px]">Güç</span>
                  <span className="text-red-400 font-bold">{character.strength ?? 5}</span>
                </div>
                <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
                  <span className="text-stone-500 block text-[9px]">Çeviklik</span>
                  <span className="text-emerald-400 font-bold">{character.agility ?? 5}</span>
                </div>
                <div className="bg-stone-950/60 rounded-lg p-2 border border-stone-800">
                  <span className="text-stone-500 block text-[9px]">Zeka</span>
                  <span className="text-cyan-400 font-bold">{character.intelligence ?? 5}</span>
                </div>
                <div className="bg-stone-950/60 rounded-lg p-2 border border-amber-900/30">
                  <span className="text-stone-500 block text-[9px]">Kudret</span>
                  <span className="text-amber-400 font-bold">{character.power_score ?? '—'}</span>
                </div>
              </div>
              <Link
                href="/character"
                onClick={onClose}
                className="block text-center text-[10px] font-mono text-amber-500/80 py-2 hover:text-amber-400 transition"
              >
                Kahraman karnesi →
              </Link>
            </section>
          </div>

          <div className="p-4 border-t border-stone-800 space-y-2">
            <Link
              href="/characters"
              onClick={onClose}
              className="block text-center text-xs font-mono py-2.5 rounded-xl border border-stone-700 text-stone-400 hover:text-amber-400 transition"
            >
              Karakter Seçim Ekranı
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-xs font-mono py-2.5 rounded-xl border border-stone-800 text-stone-500 hover:text-red-400 transition"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
