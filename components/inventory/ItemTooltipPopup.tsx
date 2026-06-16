'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { InventoryItem } from '@/lib/inventory'
import {
  getItemSlotTypeName,
  getItemStatLines,
  getRarityBracketLabel,
} from '@/lib/item-stats'
import { normalizeRarityId } from '@/lib/item-rarity'
import { resolveItemEmoji } from '@/lib/item-display'
import ItemEmoji from '@/components/ItemEmoji'
import { EMOJI_BACKEND_LABEL, getEmojiBackend } from '@/lib/emoji-styles'

export type TooltipAnchorRect = {
  top: number
  left: number
  width: number
  height: number
}

type ItemTooltipPopupProps = {
  item: InventoryItem
  anchor: TooltipAnchorRect
  onClose?: () => void
}

const RARITY_NAME_CLASS: Record<string, string> = {
  COMMON: 'text-stone-300',
  NORMAL: 'text-stone-100',
  RARE: 'text-cyan-300',
  HIGH: 'text-violet-300',
  UNIQUE: 'text-amber-300',
}

export default function ItemTooltipPopup({ item, anchor, onClose }: ItemTooltipPopupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: anchor.top, left: anchor.left })

  const rarityId = normalizeRarityId(item.template.rarity)
  const statLines = getItemStatLines(
    item.template.rarity,
    item.template.slot,
    item.template.name
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const margin = 8
    const gap = 6
    const tw = el.offsetWidth
    const th = el.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = anchor.left - tw - gap
    if (left < margin) {
      left = anchor.left + anchor.width + gap
    }
    if (left + tw > vw - margin) {
      left = Math.max(margin, vw - tw - margin)
    }

    let top = anchor.top
    if (top + th > vh - margin) {
      top = vh - th - margin
    }
    if (top < margin) top = margin

    setPos({ top, left })
  }, [anchor, item.id])

  return (
    <div
      ref={ref}
      className="fixed z-[80] w-[min(240px,calc(100vw-16px))] pointer-events-none animate-slide-up"
      style={{ top: pos.top, left: pos.left }}
      role="tooltip"
    >
      <div
        className="rounded-sm border border-stone-600/80 bg-black/88 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.85)] px-3 py-2.5 text-left font-mono text-[11px] leading-[1.45] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2 mb-2">
          <ItemEmoji
            emoji={resolveItemEmoji(item.template)}
            rarity={item.template.rarity}
            size="tooltip"
          />
          <span className="text-[9px] text-stone-500 uppercase">
            {EMOJI_BACKEND_LABEL[getEmojiBackend(item.template.rarity)]}
          </span>
        </div>
        <p
          className={`font-serif font-bold text-[13px] leading-tight mb-0.5 ${RARITY_NAME_CLASS[rarityId] ?? 'text-amber-200'}`}
        >
          {item.template.name}
        </p>
        <p className="text-amber-200/90 text-[11px] mb-1">
          {getRarityBracketLabel(item.template.rarity)}
        </p>
        <p className="text-stone-200 text-[11px] mb-2">
          {getItemSlotTypeName(item.template.slot)}
        </p>

        <div className="space-y-0.5">
          {statLines.map((line, i) => (
            <p
              key={`${line.kind}-${i}`}
              className={
                line.kind === 'bonus'
                  ? 'text-emerald-400'
                  : line.kind === 'rarity'
                    ? 'text-amber-300 mt-1'
                    : line.kind === 'warning'
                      ? 'text-yellow-300 mt-1'
                      : line.kind === 'flavor'
                        ? 'text-stone-300 text-[10px] mt-2 italic leading-snug'
                        : 'text-stone-100'
              }
            >
              {line.text}
            </p>
          ))}
        </div>

        {item.equipped_slot && (
          <p className="text-cyan-400/90 text-[10px] mt-2 border-t border-stone-700/60 pt-2">
            Kuşanılmış · çift tık veya sürükle = çıkar
          </p>
        )}

        {!item.equipped_slot && (
          <p className="text-stone-500 text-[10px] mt-2 border-t border-stone-700/60 pt-2">
            Çift tık = kuşan · sürükle = slot / çanta
          </p>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-[10px] text-stone-500 hover:text-stone-300 pointer-events-auto"
          >
            Kapat
          </button>
        )}
      </div>
    </div>
  )
}
