'use client'

import { useMemo, useState } from 'react'
import { getNavEmojiImageSources } from '@/lib/emoji-styles'

type NavEmojiIconProps = {
  emoji: string
  center?: boolean
}

/**
 * Alt navigasyon — renkli emoji (Noto PNG → Twemoji → Fluent → native).
 */
export default function NavEmojiIcon({ emoji, center = false }: NavEmojiIconProps) {
  const sources = useMemo(() => getNavEmojiImageSources(emoji), [emoji])
  const [sourceIndex, setSourceIndex] = useState(0)

  const sizeClass = center ? 'game-nav-emoji-img--center' : 'game-nav-emoji-img--side'
  const nativeSizeClass = center ? 'game-nav-emoji-native--center' : 'game-nav-emoji-native--side'

  if (sourceIndex >= sources.length) {
    return (
      <span className={`game-nav-emoji-native ${nativeSizeClass}`} aria-hidden>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt=""
      draggable={false}
      className={`game-nav-emoji-img ${sizeClass}`}
      onError={() => setSourceIndex((i) => i + 1)}
    />
  )
}
