'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { InventoryItem } from '@/lib/inventory'
import {
  getItemSlotTypeName,
  getItemStatLines,
  getItemComparableStats,
  getRarityBracketLabel,
} from '@/lib/item-stats'
import { normalizeRarityId } from '@/lib/item-rarity'
import { resolveItemEmoji, resolveItemIconUrl } from '@/lib/item-display'
import ItemEmoji from '@/components/ItemEmoji'

export type TooltipAnchorRect = {
  top: number
  left: number
  width: number
  height: number
}

type ItemTooltipPopupProps = {
  item: InventoryItem
  anchor: TooltipAnchorRect
  /** Kuşanılan eşya — sadece stat renklendirme için */
  compareItem?: InventoryItem | null
  pinned?: boolean
  onClose?: () => void
  onEquip?: () => void
  onUnequip?: () => void
  canEquip?: boolean
}

const RARITY_NAME_CLASS: Record<string, string> = {
  COMMON: 'text-stone-200',
  NORMAL: 'text-stone-100',
  RARE: 'text-cyan-300',
  HIGH: 'text-violet-300',
  UNIQUE: 'text-amber-300',
}

function getBottomReservedPx(): number {
  if (typeof document === 'undefined') return 96
  const root = document.documentElement
  const nav =
    parseFloat(getComputedStyle(root).getPropertyValue('--nav-height')) || 80
  return nav + 16
}

function computePopupPosition(
  anchor: TooltipAnchorRect,
  tw: number,
  th: number
): { top: number; left: number } {
  const margin = 8
  const gap = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxBottom = vh - getBottomReservedPx()

  let left = anchor.left + anchor.width + gap
  if (left + tw > vw - margin) {
    left = anchor.left - tw - gap
  }
  if (left < margin) {
    left = Math.max(margin, Math.min(anchor.left, vw - tw - margin))
  }

  let top = anchor.top - th - gap
  if (top < margin) top = anchor.top + anchor.height + gap
  if (top + th > maxBottom) top = maxBottom - th
  if (top < margin) top = margin

  return { top, left }
}

function buildStatDiffMap(
  item: InventoryItem,
  compareItem?: InventoryItem | null
): Map<string, number> | undefined {
  if (!compareItem || compareItem.id === item.id || item.equipped_slot) return undefined

  const newStats = getItemComparableStats(
    item.template.rarity,
    item.template.slot,
    item.template.name
  )
  const oldStats = getItemComparableStats(
    compareItem.template.rarity,
    compareItem.template.slot,
    compareItem.template.name
  )
  const oldMap = new Map(oldStats.map((s) => [s.label, s.value]))
  return new Map(newStats.map((s) => [s.label, s.value - (oldMap.get(s.label) ?? 0)]))
}

export default function ItemTooltipPopup({
  item,
  anchor,
  compareItem,
  pinned = false,
  onClose,
  onEquip,
  onUnequip,
  canEquip = false,
}: ItemTooltipPopupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: anchor.top, left: anchor.left })

  const rarityId = normalizeRarityId(item.template.rarity)
  const statDiffMap = buildStatDiffMap(item, compareItem)
  const comparableStats = getItemComparableStats(
    item.template.rarity,
    item.template.slot,
    item.template.name
  )
  const metaLines = getItemStatLines(
    item.template.rarity,
    item.template.slot,
    item.template.name
  ).filter((l) => l.kind === 'rarity' || l.kind === 'warning' || l.kind === 'flavor')

  const showEquip = pinned && !item.equipped_slot && onEquip && canEquip
  const showUnequip = pinned && item.equipped_slot && onUnequip

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { offsetWidth: tw, offsetHeight: th } = el
    setPos(computePopupPosition(anchor, tw, th))
  }, [anchor, item.id, pinned, showEquip, showUnequip, compareItem?.id])

  return (
    <div
      ref={ref}
      className="fixed z-[80] w-[min(248px,calc(100vw-20px))] pointer-events-none animate-slide-up"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label="Eşya bilgisi"
    >
      <div
        className="relative rounded-xl border border-stone-600/70 bg-stone-950/97 backdrop-blur-md shadow-[0_8px_28px_rgba(0,0,0,0.8)] px-3 py-2.5 text-left font-mono pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {pinned && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-md text-stone-500 hover:text-stone-200 hover:bg-stone-800/80 transition text-sm leading-none"
            aria-label="Kapat"
          >
            ✕
          </button>
        )}

        <div className="flex items-start gap-2 pr-6 mb-2">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-stone-900/80 border border-stone-700/50 flex items-center justify-center overflow-hidden">
            <ItemEmoji
              emoji={resolveItemEmoji(item.template)}
              imageUrl={resolveItemIconUrl(item.template)}
              rarity={item.template.rarity}
              size="tooltip"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`font-serif font-bold text-[13px] leading-snug ${RARITY_NAME_CLASS[rarityId] ?? 'text-amber-200'}`}
            >
              {item.template.name}
            </p>
            <p className="text-[11px] text-amber-200/85 leading-snug">
              {getRarityBracketLabel(item.template.rarity)}
            </p>
            <p className="text-[11px] text-stone-400">{getItemSlotTypeName(item.template.slot)}</p>
          </div>
        </div>

        <div className="space-y-0.5 rounded-lg bg-stone-900/55 border border-stone-800/55 px-2 py-1.5 mb-2">
          {comparableStats.map((stat) => {
            const diff = statDiffMap?.get(stat.label)
            const valueClass =
              diff === undefined || diff === 0
                ? 'text-stone-100'
                : diff > 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
            return (
              <div
                key={stat.label}
                className="flex items-baseline justify-between gap-2 text-[11px] leading-snug"
              >
                <span className="text-stone-400 shrink-0">{stat.label}</span>
                <span className={`font-semibold tabular-nums ${valueClass}`}>
                  {stat.value}
                  {diff !== undefined && diff !== 0 && (
                    <span className="text-[10px] font-medium ml-1 opacity-95">
                      ({diff > 0 ? '+' : ''}{diff})
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>

        {metaLines.length > 0 && (
          <div className="space-y-0.5 mb-2">
            {metaLines.map((line, i) => (
              <p
                key={i}
                className={
                  line.kind === 'rarity'
                    ? 'text-amber-300 text-[10px]'
                    : line.kind === 'warning'
                      ? 'text-yellow-300/90 text-[10px]'
                      : 'text-stone-500 text-[10px] italic leading-snug'
                }
              >
                {line.text}
              </p>
            ))}
          </div>
        )}

        {showEquip && (
          <button
            type="button"
            onClick={onEquip}
            className="w-full text-xs font-mono uppercase px-3 py-2 rounded-lg border border-amber-600/70 bg-amber-950/65 text-amber-200 hover:bg-amber-950/85 transition font-bold tracking-wide"
          >
            Kuşan
          </button>
        )}

        {showUnequip && (
          <button
            type="button"
            onClick={onUnequip}
            className="w-full text-xs font-mono uppercase px-3 py-2 rounded-lg border border-stone-600 bg-stone-900 text-stone-300 hover:bg-stone-800 transition"
          >
            Çıkar
          </button>
        )}
      </div>
    </div>
  )
}
