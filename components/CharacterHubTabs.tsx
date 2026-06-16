'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KAHRAMAN_TABS } from '@/lib/nav-routes'
import HubTabEmojiIcon from '@/components/icons/HubTabEmojiIcon'

type CharacterHubTabsProps = {
  className?: string
  variant?: 'default' | 'vertical'
}

export default function CharacterHubTabs({
  className = '',
  variant = 'default',
}: CharacterHubTabsProps) {
  const pathname = usePathname()

  const linkBase =
    variant === 'vertical'
      ? 'flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-lg text-center transition active:scale-[0.97]'
      : 'flex-1 flex flex-col items-center justify-center gap-1 min-h-[3.25rem] py-2 px-2 rounded-lg text-center transition active:scale-[0.97]'

  const activeCls =
    'bg-amber-600/28 text-amber-300 border border-amber-700/50 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
  const idleCls =
    'text-stone-500 border border-transparent hover:bg-stone-800/50 hover:text-stone-300'

  if (variant === 'vertical') {
    return (
      <nav
        className={`flex flex-col gap-1.5 p-1.5 bg-stone-900/92 border border-stone-800 rounded-xl shrink-0 w-[5.5rem] ${className}`}
        aria-label="Kahraman sekmeleri"
      >
        {KAHRAMAN_TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${linkBase} ${active ? activeCls : idleCls}`}
              aria-current={active ? 'page' : undefined}
            >
              <HubTabEmojiIcon emoji={tab.emoji} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wide leading-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      className={`flex gap-2 p-1.5 bg-stone-900/90 border border-stone-800 rounded-xl ${className}`}
      aria-label="Kahraman sekmeleri"
    >
      {KAHRAMAN_TABS.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${linkBase} ${active ? activeCls : idleCls}`}
            aria-current={active ? 'page' : undefined}
          >
            <HubTabEmojiIcon emoji={tab.emoji} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide leading-tight">
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
