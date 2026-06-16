'use client'

import { usePathname } from 'next/navigation'
import GameNav from '@/components/GameNav'
import GameChatDock from '@/components/GameChatDock'
import CharacterHubTabs from '@/components/CharacterHubTabs'
import SceneBackground from '@/components/SceneBackground'
import { SCENE_PRESETS } from '@/lib/game-assets'
import { GAME_SHELL_HEADER_INNER, GAME_SHELL_MAIN_INNER } from '@/lib/game-layout'

export default function CharacterHubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isKimlikPage = pathname === '/character'

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden bg-stone-950 text-stone-100 antialiased animate-page-enter">
      <SceneBackground preset={SCENE_PRESETS.kahraman} presetKey="kahraman" className="fixed inset-0 z-0" />

      <header className="shrink-0 z-40 border-b border-stone-900/60 bg-stone-950/90 backdrop-blur-xl">
        <div className={GAME_SHELL_HEADER_INNER}>
          <h1 className="text-lg font-serif font-black tracking-wide text-amber-500 uppercase">
            Kahraman
          </h1>
          <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
            Künye, heybe ve özellikler
          </p>
        </div>
      </header>

      <div
        className={`shrink-0 z-30 border-b border-stone-900/60 bg-stone-950/95 backdrop-blur-xl ${isKimlikPage ? 'lg:hidden' : ''}`}
      >
        <div className={`${GAME_SHELL_HEADER_INNER} !py-2.5 max-w-lg mx-auto lg:max-w-none`}>
          <CharacterHubTabs />
        </div>
      </div>

      <main
        className={`flex-1 relative z-10 game-scroll min-h-0 ${
          isKimlikPage ? 'lg:overflow-hidden overflow-y-auto' : 'overflow-y-auto overflow-x-hidden'
        }`}
      >
        <div
          className={`${GAME_SHELL_MAIN_INNER} ${
            isKimlikPage
              ? 'lg:!pt-3 lg:!pb-3 lg:h-[calc(100dvh-var(--nav-height)-4.5rem)] lg:flex lg:flex-col lg:min-h-0'
              : ''
          }`}
        >
          {children}
        </div>
      </main>

      <GameNav activePath={pathname} />
      <GameChatDock />
    </div>
  )
}
