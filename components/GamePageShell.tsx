import GameNav from '@/components/GameNav'
import CharacterSwitcher from '@/components/CharacterSwitcher'

type GamePageShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  headerExtra?: React.ReactNode
  mainClassName?: string
  showCharacterSwitcher?: boolean
}

export default function GamePageShell({
  title,
  subtitle,
  children,
  headerExtra,
  mainClassName = 'max-w-5xl',
  showCharacterSwitcher = true,
}: GamePageShellProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 antialiased pb-[var(--nav-height)] animate-page-enter">
      <header className="sticky top-0 z-40 border-b border-stone-900/80 bg-stone-950/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
          {showCharacterSwitcher && (
            <CharacterSwitcher compact />
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg font-serif font-black tracking-wide text-amber-500 uppercase truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
            {headerExtra && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">{headerExtra}</div>
            )}
          </div>
        </div>
      </header>
      <main className={`${mainClassName} mx-auto px-4 py-4 md:py-6 w-full game-scroll`}>
        {children}
      </main>
      <GameNav />
    </div>
  )
}
