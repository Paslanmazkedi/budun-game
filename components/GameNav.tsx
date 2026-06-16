'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NAV_ITEMS, isNavActive } from '@/lib/nav-routes'
import NavEmojiIcon from '@/components/icons/NavEmojiIcon'

export default function GameNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = activePath ?? pathname

  return (
    <nav className="game-nav-fixed" aria-label="Oyun navigasyonu">
      <div className="game-nav-inner">
        <div className="game-nav-bar">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(current, item.cluster)
            const isCenter = Boolean(item.center)

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`game-nav-item ${isCenter ? 'game-nav-item--center' : ''}`}
                data-active={active ? 'true' : 'false'}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                {active && <span className="game-nav-active-dot" aria-hidden />}
                <span
                  className={`game-nav-icon ${
                    isCenter ? 'game-nav-icon--center' : 'game-nav-icon--side'
                  }`}
                >
                  <NavEmojiIcon emoji={item.emoji} center={isCenter} />
                </span>
                <span className="game-nav-label">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
