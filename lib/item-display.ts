import { findPhase1Item } from '@/lib/item-catalog'
import { slotFallbackEmoji } from '@/lib/inventory-slots'

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
