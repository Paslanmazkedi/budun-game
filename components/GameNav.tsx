'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NAV_ITEMS, isNavActive } from '@/lib/nav-routes'

export default function GameNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = activePath ?? pathname

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-auto"
      aria-label="Oyun navigasyonu"
    >
      <div className="border-t border-amber-900/20 bg-stone-950/98 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.9)] safe-bottom">
        <div className="max-w-lg mx-auto flex items-end justify-around px-1 pt-1.5 pb-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(current, item.cluster)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[52px] rounded-xl transition-all duration-200 active:scale-95 ${
                  item.center ? '-mt-2' : ''
                }`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {item.center ? (
                  <span
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                      active
                        ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'bg-stone-900 border-stone-600 hover:border-amber-700/50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </span>
                ) : (
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
                      active
                        ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                        : 'bg-stone-900/80 border-stone-800'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </span>
                )}
                <span
                  className={`text-[8px] font-mono mt-1 tracking-wide leading-none ${
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
