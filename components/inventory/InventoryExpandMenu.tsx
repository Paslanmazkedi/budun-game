'use client'

import type { RefObject } from 'react'
import type { InventoryExpandOffer } from '@/lib/inventory-capacity'
import { formatPremiumCost } from '@/lib/premium-commerce'

type InventoryExpandMenuProps = {
  open: boolean
  anchorRef: RefObject<HTMLButtonElement | null>
  canExpandDisplay: boolean
  displayRowLabel: string
  offers: InventoryExpandOffer[]
  premiumBalance: number
  busy: boolean
  onClose: () => void
  onExpandDisplay: () => void
  onPurchase: (offer: InventoryExpandOffer) => void
}

export default function InventoryExpandMenu({
  open,
  canExpandDisplay,
  displayRowLabel,
  offers,
  premiumBalance,
  busy,
  onClose,
  onExpandDisplay,
  onPurchase,
}: InventoryExpandMenuProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[55]" onClick={onClose} aria-hidden />
      <div
        className="absolute z-[60] bottom-full right-0 mb-1.5 min-w-[168px] rounded-xl border border-stone-700 bg-stone-950/98 shadow-2xl py-1 animate-slide-up"
        role="menu"
      >
        {canExpandDisplay && (
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              onExpandDisplay()
              onClose()
            }}
            className="w-full text-left px-3 py-2 text-xs font-mono text-stone-200 hover:bg-stone-800 hover:text-amber-300 transition disabled:opacity-50"
          >
            {displayRowLabel}
            <span className="block text-[10px] text-stone-500 normal-case mt-0.5">
              Ücretsiz · kaydedilir
            </span>
          </button>
        )}
        {offers.length > 0 && (
          <p className="px-3 py-1.5 text-[10px] font-mono text-violet-300/90 border-t border-stone-800/80">
            Kut Taşı: {premiumBalance.toLocaleString()} 💠
          </p>
        )}
        {offers.map((offer) => {
          const affordable = premiumBalance >= offer.premiumCost
          return (
            <button
              key={offer.id}
              type="button"
              role="menuitem"
              disabled={busy || !affordable}
              onClick={() => {
                onPurchase(offer)
                onClose()
              }}
              className="w-full text-left px-3 py-2 text-xs font-mono text-violet-200 hover:bg-violet-950/40 transition disabled:opacity-50 border-t border-stone-800/80 first:border-t-0"
            >
              {offer.label}
              <span className="block text-[10px] text-violet-400/90 mt-0.5">
                {formatPremiumCost(offer.premiumCost)}
              </span>
            </button>
          )
        })}
        {offers.length === 0 && !canExpandDisplay && (
          <p className="px-3 py-2 text-[10px] font-mono text-stone-500">
            Maksimum kapasiteye ulaşıldı.
          </p>
        )}
      </div>
    </>
  )
}
