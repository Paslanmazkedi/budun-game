'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GameNav from '@/components/GameNav'
import CharacterSwitcher from '@/components/CharacterSwitcher'
import SceneBackground from '@/components/SceneBackground'
import type { ScenePreset } from '@/lib/game-assets'

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
  mainClassName = 'max-w-5xl',
  immersive = false,
  showCharacterSwitcher = true,
}: SceneShellProps) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100 antialiased pb-[var(--nav-height)] animate-page-enter">
      <SceneBackground preset={preset} presetKey={presetKey} className="fixed inset-0 z-0" />

      {immersive ? (
        <div className="relative z-10 min-h-[calc(100dvh-var(--nav-height))] flex flex-col">
          {children}
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-40 border-b border-stone-900/60 bg-stone-950/85 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
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
          <main className={`relative z-10 ${mainClassName} mx-auto px-4 py-4 md:py-6 w-full game-scroll`}>
            {children}
          </main>
        </>
      )}

      <GameNav activePath={pathname} />
    </div>
  )
}
