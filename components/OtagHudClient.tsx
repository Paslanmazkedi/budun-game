'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ObaActivityList } from '@/components/ObaHotspots'
import { BOZKIR_LINKS } from '@/lib/nav-routes'
import { signOutToLogin } from '@/lib/auth-client'

type Character = {
  xp?: number
  name?: string
}

export default function OtagHudClient({
  character,
  xpPercentage,
  nextLevelXpTarget,
  isOpen,
  onClose,
}: {
  character: Character
  xpPercentage: number
  nextLevelXpTarget: number
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    onClose()
    await signOutToLogin()
    router.push('/login')
  }

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
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-xs font-mono py-2.5 rounded-xl border border-stone-800 text-stone-500 hover:text-red-400 hover:border-red-900/40 transition disabled:opacity-50"
            >
              {loggingOut ? 'Çıkış yapılıyor...' : 'Hesap değiştir · Çıkış'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
