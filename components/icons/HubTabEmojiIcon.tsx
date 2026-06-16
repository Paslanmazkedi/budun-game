'use client'

import { useMemo, useState } from 'react'
import { getNavEmojiImageSources } from '@/lib/emoji-styles'

type HubTabEmojiIconProps = {
  emoji: string
  className?: string
}

/** Kahraman hub sekmeleri — Google Noto (Android 11) renkli emoji */
export default function HubTabEmojiIcon({ emoji, className = '' }: HubTabEmojiIconProps) {
  const sources = useMemo(() => getNavEmojiImageSources(emoji), [emoji])
  const [sourceIndex, setSourceIndex] = useState(0)

  if (sourceIndex >= sources.length) {
    return (
      <span className={`hub-tab-emoji-native leading-none ${className}`} aria-hidden>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt=""
      draggable={false}
      className={`hub-tab-emoji-img pointer-events-none ${className}`}
      onError={() => setSourceIndex((i) => i + 1)}
    />
  )
}
