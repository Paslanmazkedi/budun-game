import { findPhase1Item } from '@/lib/item-catalog'
import { slotFallbackEmoji } from '@/lib/inventory-slots'
import { resolveMountIcon } from '@/lib/mount-assets'

export type ItemTemplateView = {
  name?: string
  slug?: string | null
  emoji?: string | null
  icon?: string | null
  slot?: string
  rarity?: string
}

export function resolveItemEmoji(template: ItemTemplateView) {
  if (template.emoji) return template.emoji
  if (template.icon) return template.icon
  const fromCatalog = findPhase1Item(template.slug ?? template.name ?? '')
  if (fromCatalog) return fromCatalog.emoji
  return slotFallbackEmoji(template.slot ?? 'MISC')
}

/** Özel slot ikonu (binek tulparicon vb.) — varsa emoji CDN yerine kullanılır */
export function resolveItemIconUrl(template: ItemTemplateView): string | null {
  if (template.icon?.startsWith('/')) return template.icon
  const mountIcon = resolveMountIcon(template.slug)
  if (mountIcon) return mountIcon
  return null
}
