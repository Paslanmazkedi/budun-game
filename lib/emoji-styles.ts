import type { ItemRarityId } from '@/lib/item-rarity'
import { normalizeRarityId } from '@/lib/item-rarity'

/**
 * Nadirlik → emoji görsel seti
 * COMMON: cihaz varsayılanı (basit)
 * NORMAL: Google Noto ≈ Android 11
 * RARE: Twemoji (flat, canlı)
 * HIGH / UNIQUE: Microsoft Fluent (gösterişli)
 */
export type EmojiRenderBackend = 'native' | 'google-noto' | 'twemoji' | 'microsoft'

export const RARITY_EMOJI_BACKEND: Record<ItemRarityId, EmojiRenderBackend> = {
  COMMON: 'native',
  NORMAL: 'google-noto',
  RARE: 'twemoji',
  HIGH: 'microsoft',
  UNIQUE: 'microsoft',
}

export const EMOJI_BACKEND_LABEL: Record<EmojiRenderBackend, string> = {
  native: 'Standart',
  'google-noto': 'Noto / Android',
  twemoji: 'Twemoji',
  microsoft: 'Fluent',
}

/** Twemoji codepoint dönüşümü */
export function emojiToCodePoint(emoji: string): string {
  const parts: string[] = []
  let i = 0
  while (i < emoji.length) {
    const codePoint = emoji.codePointAt(i)!
    parts.push(codePoint.toString(16))
    i += codePoint > 0xffff ? 2 : 1
  }
  return parts.join('-').replace(/-fe0f/g, '')
}

export function getEmojiBackend(rarity: string): EmojiRenderBackend {
  return RARITY_EMOJI_BACKEND[normalizeRarityId(rarity)]
}

export function getEmojiImageUrl(emoji: string, backend: EmojiRenderBackend): string | null {
  if (!emoji || backend === 'native') return null

  const cp = emojiToCodePoint(emoji)
  const cpUnderscore = cp.replace(/-/g, '_')

  switch (backend) {
    case 'google-noto':
      return `https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.gif`
    case 'twemoji':
      return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`
    case 'microsoft':
      return `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=microsoft`
    default:
      return null
  }
}

export function getEmojiImageUrlForRarity(emoji: string, rarity: string) {
  return getEmojiImageUrl(emoji, getEmojiBackend(rarity))
}
