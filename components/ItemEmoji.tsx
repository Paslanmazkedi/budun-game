'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { getEmojiImageUrlForRarity, getEmojiBackend, isAnimatedEmojiRarity } from '@/lib/emoji-styles'
import { resolveMountIconSlotStyle } from '@/lib/mount-assets'
import { normalizeRarityId } from '@/lib/item-rarity'

type ItemEmojiProps = {
  emoji: string
  rarity?: string
  /** Özel ikon (binek tulparicon vb.) — emoji CDN yerine */
  imageUrl?: string | null
  className?: string
  imgClassName?: string
  /** Heybe hücresi gibi büyük gösterim */
  size?: 'slot' | 'bag' | 'tooltip'
}

const WRAPPER_CLASS = {
  slot: 'relative w-full h-full min-w-0 min-h-0 overflow-hidden flex items-center justify-center',
  bag: 'absolute inset-0 overflow-hidden flex items-center justify-center',
  tooltip: 'w-8 h-8 shrink-0 overflow-hidden flex items-center justify-center',
}

const IMG_CLASS = {
  slot: 'max-w-[85%] max-h-[85%] w-auto h-auto object-contain pointer-events-none',
  bag: 'max-w-[92%] max-h-[92%] w-auto h-auto object-contain pointer-events-none',
  tooltip: 'max-w-8 max-h-8 w-auto h-auto object-contain pointer-events-none',
}

const NATIVE_CLASS = {
  slot: 'text-xl leading-none select-none',
  bag: 'inventory-bag-emoji-native leading-none select-none',
  tooltip: 'text-2xl leading-none select-none',
}

const GLOW_CLASS = {
  UNIQUE: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]',
  HIGH: 'drop-shadow-[0_0_6px_rgba(167,139,250,0.35)]',
}

export default function ItemEmoji({
  emoji,
  rarity = 'COMMON',
  imageUrl = null,
  className = '',
  imgClassName = '',
  size = 'bag',
}: ItemEmojiProps) {
  const [failed, setFailed] = useState(false)
  const backend = getEmojiBackend(rarity)
  const emojiSrc = getEmojiImageUrlForRarity(emoji, rarity)
  const useCustomIcon = Boolean(imageUrl) && !failed
  const src = useCustomIcon ? imageUrl : emojiSrc
  const iconSlotStyle = useCustomIcon && imageUrl ? resolveMountIconSlotStyle(imageUrl, size) : null
  const rarityId = normalizeRarityId(rarity)

  const glow =
    rarityId === 'UNIQUE' ? GLOW_CLASS.UNIQUE : rarityId === 'HIGH' ? GLOW_CLASS.HIGH : ''

  const wrapperClass = `${WRAPPER_CLASS[size]} ${className}`

  if (!src || (!useCustomIcon && (backend === 'native' || !emojiSrc || failed))) {
    return (
      <span className={`${wrapperClass} ${NATIVE_CLASS[size]} ${glow}`} aria-hidden>
        {emoji}
      </span>
    )
  }

  return (
    <span className={wrapperClass} aria-hidden>
      <img
        src={src}
        alt=""
        draggable={false}
        className={
          iconSlotStyle
            ? `item-custom-icon pointer-events-none ${glow} ${imgClassName}`
            : `${IMG_CLASS[size]} ${glow} ${isAnimatedEmojiRarity(rarity) ? 'item-emoji-animated' : ''} ${imgClassName}`
        }
        style={
          iconSlotStyle
            ? ({
                '--icon-max': iconSlotStyle.maxSize,
                '--icon-scale': iconSlotStyle.scale,
                '--icon-tx': iconSlotStyle.translateX,
                '--icon-ty': iconSlotStyle.translateY,
                '--icon-fit': iconSlotStyle.objectFit,
                objectPosition: iconSlotStyle.objectPosition,
              } as CSSProperties)
            : undefined
        }
        onError={() => setFailed(true)}
      />
    </span>
  )
}
