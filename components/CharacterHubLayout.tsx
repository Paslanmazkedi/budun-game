'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GameNav from '@/components/GameNav'
import CharacterSwitcher from '@/components/CharacterSwitcher'
import SceneBackground from '@/components/SceneBackground'
import { KAHRAMAN_TABS } from '@/lib/nav-routes'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default function CharacterHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100 antialiased pb-[var(--nav-height)] animate-page-enter">
      <SceneBackground preset={SCENE_PRESETS.kahraman} presetKey="kahraman" className="fixed inset-0 z-0" />

      <header className="sticky top-0 z-40 border-b border-stone-900/60 bg-stone-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <CharacterSwitcher compact />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-serif font-black tracking-wide text-amber-500 uppercase">
                Kahraman
              </h1>
              <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
                Karnet ve teçhizat
              </p>
            </div>
            <nav
              className="flex gap-1 p-1 bg-stone-900/80 border border-stone-800 rounded-xl"
              aria-label="Kahraman sekmeleri"
            >
              {KAHRAMAN_TABS.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wide transition ${
                      active
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-700/40'
                        : 'text-stone-500 hover:text-stone-300 border border-transparent'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-6 w-full game-scroll">
        {children}
      </main>

      <GameNav activePath={pathname} />
    </div>
  )
}
