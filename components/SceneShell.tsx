'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GameNav from '@/components/GameNav'
import GameChatDock from '@/components/GameChatDock'
import CharacterSwitcher from '@/components/CharacterSwitcher'
import SceneBackground from '@/components/SceneBackground'
import type { ScenePreset } from '@/lib/game-assets'
import {
  GAME_SHELL_HEADER_INNER,
  GAME_SHELL_MAIN_INNER,
  GAME_SHELL_MAIN_NARROW,
} from '@/lib/game-layout'

type SceneShellProps = {
  preset: ScenePreset
  presetKey?: string
  title?: string
  subtitle?: string
  headerExtra?: React.ReactNode
  backHref?: string
  backLabel?: string
  children: React.ReactNode
  mainClassName?: string
  immersive?: boolean
  showCharacterSwitcher?: boolean
}

export default function SceneShell({
  preset,
  presetKey,
  title,
  subtitle,
  headerExtra,
  backHref,
  backLabel = 'Geri',
  children,
  mainClassName = GAME_SHELL_MAIN_NARROW,
  immersive = false,
  showCharacterSwitcher = true,
}: SceneShellProps) {
  const pathname = usePathname()

  return (
    <div className="relative h-[100dvh] flex flex-col overflow-hidden bg-stone-950 text-stone-100 antialiased animate-page-enter">
      <SceneBackground preset={preset} presetKey={presetKey} className="fixed inset-0 z-0" />

      {immersive ? (
        <div className="relative z-10 flex-1 flex flex-col min-h-0 pb-[var(--nav-height)]">
          {children}
        </div>
      ) : (
        <>
          <header className="shrink-0 z-40 border-b border-stone-900/60 bg-stone-950/90 backdrop-blur-xl">
            <div className={`${GAME_SHELL_HEADER_INNER} space-y-2`}>
              {showCharacterSwitcher && <CharacterSwitcher compact />}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2">
                  {backHref && (
                    <Link
                      href={backHref}
                      className="shrink-0 mt-0.5 text-stone-500 hover:text-amber-400 text-xs font-mono px-2 py-1 rounded-lg border border-stone-800 transition"
                    >
                      ← {backLabel}
                    </Link>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h1 className="text-lg font-serif font-black tracking-wide text-amber-500 uppercase truncate">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {headerExtra && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">{headerExtra}</div>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 game-scroll min-h-0">
            <div className={`${GAME_SHELL_MAIN_INNER} ${mainClassName}`}>{children}</div>
          </main>
        </>
      )}

      <GameNav activePath={pathname} />
      <GameChatDock />
    </div>
  )
}
