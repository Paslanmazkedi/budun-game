'use client'

import type { InventoryItem } from '@/lib/inventory'
import { getPlaceholderItemStats, getItemSlotLabel } from '@/lib/item-stats'
import { getRarityClass, getRarityLabel } from '@/lib/inventory-slots'
import { resolveItemEmoji } from '@/lib/item-display'
import { normalizeBagId } from '@/lib/inventory-bags'
import { BAG_DEFINITIONS } from '@/lib/inventory-bags'

type ItemDetailPanelProps = {
  item: InventoryItem
  onClose?: () => void
  onEquip?: () => void
  onUnequip?: () => void
  onMoveToBag?: (bagId: string) => void
  unlockedBagIds: string[]
  currentBagId?: string
  compact?: boolean
}

export default function ItemDetailPanel({
  item,
  onClose,
  onEquip,
  onUnequip,
  onMoveToBag,
  unlockedBagIds,
  currentBagId,
  compact,
}: ItemDetailPanelProps) {
  const stats = getPlaceholderItemStats(item.template.rarity, item.template.slot)
  const bagLabel = BAG_DEFINITIONS.find((b) => b.id === normalizeBagId(item.bag_id))?.label
  const otherBags = BAG_DEFINITIONS.filter(
    (b) => unlockedBagIds.includes(b.id) && b.id !== normalizeBagId(item.bag_id ?? currentBagId)
  )

  return (
    <div
      className={`rounded-xl border bg-stone-950/95 backdrop-blur-md shadow-xl ${
        compact ? 'p-3' : 'p-4'
      } ${getRarityClass(item.template.rarity)} border-opacity-80`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl border flex items-center justify-center text-2xl lg:text-3xl ${getRarityClass(
            item.template.rarity
          )}`}
        >
          {resolveItemEmoji(item.template)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-sm lg:text-base leading-tight">
                {item.template.name}
              </h3>
              <p className="text-[10px] lg:text-xs font-mono text-stone-500 mt-1 uppercase tracking-wide">
                {getItemSlotLabel(item.template.slot)} · {getRarityLabel(item.template.rarity)}
                {bagLabel && !item.equipped_slot ? ` · ${bagLabel}` : ''}
                {item.equipped_slot ? ' · Kuşanılmış' : ''}
              </p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-stone-600 hover:text-stone-400 text-xs font-mono shrink-0 p-1"
                aria-label="Kapat"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-900/80 border border-stone-700/60 text-stone-300"
              >
                {s.label} {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {(onEquip || onUnequip || onMoveToBag) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-stone-800/80">
          {onEquip && !item.equipped_slot && (
            <button
              type="button"
              onClick={onEquip}
              className="text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg border border-amber-700/50 bg-amber-950/40 text-amber-400 hover:bg-amber-950/60"
            >
              Kuşan
            </button>
          )}
          {onUnequip && item.equipped_slot && (
            <button
              type="button"
              onClick={onUnequip}
              className="text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg border border-stone-600 bg-stone-900 text-stone-300 hover:bg-stone-800"
            >
              Çıkar
            </button>
          )}
          {onMoveToBag &&
            !item.equipped_slot &&
            otherBags.map((bag) => (
              <button
                key={bag.id}
                type="button"
                onClick={() => onMoveToBag(bag.id)}
                className="text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg border border-cyan-800/50 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/50"
              >
                → {bag.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
