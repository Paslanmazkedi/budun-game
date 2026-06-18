'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  KAHRAMAN_NAV_ITEMS,
  NAV_ITEMS,
  isKahramanNavActive,
  isKahramanPath,
  isNavActive,
  type KahramanNavItem,
  type MainNavItem,
} from '@/lib/nav-routes'
import NavEmojiIcon from '@/components/icons/NavEmojiIcon'
import { NavHeybeIcon } from '@/components/icons/NavIcons'

function NavIconContent({
  item,
  center,
}: {
  item: KahramanNavItem
  center: boolean
}) {
  if (item.svgIcon === 'heybe') {
    return (
      <NavHeybeIcon
        className={center ? 'w-6 h-6 text-stone-200' : 'w-[1.35rem] h-[1.35rem] text-stone-300'}
      />
    )
  }

  return <NavEmojiIcon emoji={item.emoji ?? '❓'} center={center} />
}

export default function GameNav({ activePath }: { activePath?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = activePath ?? pathname
  const kahramanMode = isKahramanPath(current)

  return (
    <nav
      className="game-nav-fixed"
      aria-label={kahramanMode ? 'Kahraman navigasyonu' : 'Oyun navigasyonu'}
    >
      <div className="game-nav-inner">
        <div className="game-nav-bar">
          {kahramanMode
            ? KAHRAMAN_NAV_ITEMS.map((item) => {
                const active = isKahramanNavActive(current, item.cluster)
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
                      <NavIconContent item={item} center={isCenter} />
                    </span>
                    <span className="game-nav-label">{item.label}</span>
                  </button>
                )
              })
            : NAV_ITEMS.map((item: MainNavItem) => {
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
