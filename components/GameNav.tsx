'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NAV_ITEMS, isNavActive } from '@/lib/nav-routes'
import { NavIcon } from '@/components/icons/NavIcons'

export default function GameNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = activePath ?? pathname

  return (
    <nav className="game-nav-fixed" aria-label="Oyun navigasyonu">
      <div className="game-nav-inner border-t border-amber-900/20 bg-stone-950/98 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.9)]">
        <div className="max-w-xl mx-auto flex items-center justify-between px-0.5 h-[var(--nav-height)]">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(current, item.cluster)
            const iconColor = active ? 'text-amber-400' : 'text-stone-400'

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`game-nav-item flex flex-col items-center justify-center flex-1 max-w-[64px] h-full rounded-xl transition-colors duration-200 active:scale-95 ${
                  item.center ? 'max-w-[72px]' : ''
                }`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {item.center ? (
                  <span
                    className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-colors ${iconColor} ${
                      active
                        ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'bg-stone-900 border-stone-600'
                    }`}
                  >
                    <NavIcon id={item.icon} className="w-6 h-6" />
                  </span>
                ) : (
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${iconColor} ${
                      active
                        ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-stone-900/80 border-stone-800'
                    }`}
                  >
                    <NavIcon id={item.icon} className="w-5 h-5" />
                  </span>
                )}
                <span
                  className={`text-[7px] font-mono mt-1 tracking-wide leading-none text-center ${
                    active ? 'text-amber-400 font-bold' : 'text-stone-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
