import type { ItemRarityId } from '@/lib/item-rarity'
import { normalizeRarityId } from '@/lib/item-rarity'

/**
 * Nadirlik → emoji görsel seti
 *
 * COMMON   — cihaz varsayılanı (statik)
 * NORMAL   — Twemoji (düz, statik)
 * RARE     — Google Noto ≈ Android 11 (statik PNG, mavi çerçeve)
 * HIGH     — Microsoft Fluent (statik)
 * UNIQUE   — Google Noto GIF (hareketli, sarı çerçeve — özel ikonlar hariç)
 */
export type EmojiRenderBackend = 'native' | 'google-noto' | 'twemoji' | 'microsoft'

export const RARITY_EMOJI_BACKEND: Record<ItemRarityId, EmojiRenderBackend> = {
  COMMON: 'native',
  NORMAL: 'twemoji',
  RARE: 'google-noto',
  HIGH: 'microsoft',
  UNIQUE: 'google-noto',
}

/** Bu nadirliklerde Noto GIF (hareketli) kullanılır */
export const ANIMATED_EMOJI_RARITIES: ReadonlySet<ItemRarityId> = new Set(['UNIQUE'])

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

export function isAnimatedEmojiRarity(rarity: string): boolean {
  return ANIMATED_EMOJI_RARITIES.has(normalizeRarityId(rarity))
}

export function getEmojiImageUrl(
  emoji: string,
  backend: EmojiRenderBackend,
  animated = false
): string | null {
  if (!emoji || backend === 'native') return null

  const cp = emojiToCodePoint(emoji)

  switch (backend) {
    case 'google-noto':
      return animated
        ? `https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.gif`
        : `https://fonts.gstatic.com/s/e/notoemoji/latest/${cp}/512.png`
    case 'twemoji':
      return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`
    case 'microsoft':
      return `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=microsoft`
    default:
      return null
  }
}

export function getEmojiImageUrlForRarity(emoji: string, rarity: string) {
  const backend = getEmojiBackend(rarity)
  const animated = isAnimatedEmojiRarity(rarity)
  return getEmojiImageUrl(emoji, backend, animated)
}

/** Alt navigasyon — renkli Android 11 (Noto statik PNG; GIF birçok emoji için yok) */
export function getNavEmojiImageSources(emoji: string): string[] {
  const sources: string[] = []
  const noto = getEmojiImageUrl(emoji, 'google-noto', false)
  if (noto) sources.push(noto)
  const twemoji = getEmojiImageUrl(emoji, 'twemoji', false)
  if (twemoji) sources.push(twemoji)
  const microsoft = getEmojiImageUrl(emoji, 'microsoft', false)
  if (microsoft) sources.push(microsoft)
  return sources
}
