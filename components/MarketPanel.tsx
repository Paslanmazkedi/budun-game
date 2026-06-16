'use client'

import { useMemo, useState } from 'react'
import type { GameCharacter } from '@/lib/characters'
import type { InventoryItem } from '@/lib/inventory'
import { getRarityClass, getRarityLabel } from '@/lib/inventory-slots'
import { resolveItemEmoji } from '@/lib/item-display'
import ItemEmoji from '@/components/ItemEmoji'
import { findPhase1Item } from '@/lib/item-catalog'
import {
  MARKET_CATEGORIES,
  MOCK_MARKET_LISTINGS,
  getMarketCategory,
  getSlotLabel,
  listingMatchesCategory,
  type MarketCategory,
  type MarketListing,
  type MarketMode,
} from '@/lib/market'

type MarketPanelProps = {
  character: GameCharacter
  initialItems: InventoryItem[]
}

export default function MarketPanel({ character, initialItems }: MarketPanelProps) {
  const [mode, setMode] = useState<MarketMode>('buy')
  const [category, setCategory] = useState<MarketCategory>('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null)
  const [sellTarget, setSellTarget] = useState<InventoryItem | null>(null)
  const [sellPrice, setSellPrice] = useState('')

  const gold = Number(character.gold)

  const bagItems = useMemo(
    () => initialItems.filter((item) => !item.equipped_slot),
    [initialItems]
  )

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_MARKET_LISTINGS.filter((listing) => {
      if (!listingMatchesCategory(listing.slot, category)) return false
      if (!q) return true
      return (
        listing.itemName.toLowerCase().includes(q) ||
        listing.sellerName.toLowerCase().includes(q) ||
        getSlotLabel(listing.slot).toLowerCase().includes(q)
      )
    })
  }, [category, search])

  const filteredSellItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bagItems.filter((item) => {
      const cat = getMarketCategory(item.template.slot)
      if (category !== 'all' && cat !== category) return false
      if (!q) return true
      return (
        item.template.name.toLowerCase().includes(q) ||
        getSlotLabel(item.template.slot).toLowerCase().includes(q)
      )
    })
  }, [bagItems, category, search])

  function showMsg(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(null), 3200)
  }

  function handleBuyAttempt(listing: MarketListing) {
    if (gold < listing.price) {
      showMsg('Yeterli akçe yok.')
      return
    }
    showMsg('Satın alma işlemi yakında — ilan sistemi bağlanacak.')
    setSelectedListing(null)
  }

  function handleSellAttempt() {
    const price = Number(sellPrice)
    if (!sellTarget || !price || price < 1) {
      showMsg('Geçerli bir fiyat gir.')
      return
    }
    showMsg('İlan verme yakında — eşya pazara eklenecek.')
    setSellTarget(null)
    setSellPrice('')
  }

  return (
    <div className="space-y-4">
      {/* Mod: Alış / Satış */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('buy')
            setSellTarget(null)
            setSelectedListing(null)
          }}
          className={`flex-1 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors ${
            mode === 'buy'
              ? 'border-amber-600/60 bg-amber-950/40 text-amber-400'
              : 'border-stone-800 bg-stone-900/50 text-stone-500 hover:text-stone-300'
          }`}
        >
          İlanlar · Alış
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('sell')
            setSelectedListing(null)
          }}
          className={`flex-1 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors ${
            mode === 'sell'
              ? 'border-amber-600/60 bg-amber-950/40 text-amber-400'
              : 'border-stone-800 bg-stone-900/50 text-stone-500 hover:text-stone-300'
          }`}
        >
          Heybem · Satış
        </button>
      </div>

      {/* Kategori sekmeleri */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {MARKET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-colors ${
              category === cat.id
                ? 'border-stone-600 bg-stone-800/80 text-stone-100'
                : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Arama */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Eşya veya satıcı ara…"
          className="w-full bg-stone-900/80 border border-stone-800 rounded-xl px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700/50 font-mono"
        />
      </div>

      {/* Bilgi bandı */}
      <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 px-3 py-2 text-[10px] font-mono text-stone-500 leading-relaxed">
        {mode === 'buy'
          ? 'Oyuncu ilanlarını incele, akçe ile satın al. Takas için satıcıyla obada buluş (yakında).'
          : 'Heybedeki eşyayı fiyat belirleyerek ilana çıkar. Kuşanılmış eşyalar listede görünmez.'}
      </div>

      {message && (
        <div className="text-center text-xs font-mono text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-xl py-2 px-3 animate-slide-up">
          {message}
        </div>
      )}

      {/* Alış listesi */}
      {mode === 'buy' && (
        <div className="space-y-2">
          {filteredListings.length === 0 ? (
            <EmptyState text="Bu kategoride ilan yok." />
          ) : (
            filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={() => setSelectedListing(listing)}
              />
            ))
          )}
        </div>
      )}

      {/* Satış listesi */}
      {mode === 'sell' && (
        <div className="space-y-2">
          {filteredSellItems.length === 0 ? (
            <EmptyState
              text={
                bagItems.length === 0
                  ? 'Heybede satılabilir eşya yok.'
                  : 'Bu kategoride heybede eşya yok.'
              }
            />
          ) : (
            filteredSellItems.map((item) => (
              <SellItemCard
                key={item.id}
                item={item}
                onSell={() => {
                  setSellTarget(item)
                  setSellPrice('')
                }}
              />
            ))
          )}
        </div>
      )}

      {/* İlan detay modal */}
      {selectedListing && (
        <MarketModal onClose={() => setSelectedListing(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-14 h-14 rounded-xl border flex items-center justify-center text-2xl shrink-0 ${getRarityClass(
                  selectedListing.rarity
                )}`}
              >
                <ItemEmoji
                  emoji={listingEmoji(selectedListing)}
                  rarity={selectedListing.rarity}
                  size="bag"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-amber-400 text-lg leading-tight">
                  {selectedListing.itemName}
                </h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-1">
                  {getSlotLabel(selectedListing.slot)} · {getRarityLabel(selectedListing.rarity)}
                </p>
                {selectedListing.note && (
                  <p className="text-xs font-mono text-cyan-600/90 mt-2">{selectedListing.note}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg px-3 py-2">
                <span className="text-stone-500 block text-[10px] uppercase">Satıcı</span>
                <span className="text-stone-300">{selectedListing.sellerName}</span>
              </div>
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg px-3 py-2">
                <span className="text-stone-500 block text-[10px] uppercase">İlan</span>
                <span className="text-stone-300">{selectedListing.listedAt}</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-amber-950/20 border border-amber-800/30 rounded-xl px-4 py-3">
              <span className="text-xs font-mono text-stone-500 uppercase">Fiyat</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                🪙 {selectedListing.price.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono uppercase hover:bg-stone-800/50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleBuyAttempt(selectedListing)}
                disabled={gold < selectedListing.price}
                className="flex-1 py-2.5 rounded-xl border border-amber-700/60 bg-amber-950/50 text-amber-400 text-xs font-mono uppercase hover:bg-amber-950/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Satın Al
              </button>
            </div>
            <p className="text-[10px] font-mono text-stone-600 text-center">
              Doğrudan takas için satıcıyla obada buluş — mesaj sistemi yakında
            </p>
          </div>
        </MarketModal>
      )}

      {/* Satış modal */}
      {sellTarget && (
        <MarketModal onClose={() => setSellTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl ${getRarityClass(
                  sellTarget.template.rarity
                )}`}
              >
                <ItemEmoji
                  emoji={resolveItemEmoji(sellTarget.template)}
                  rarity={sellTarget.template.rarity}
                  size="slot"
                />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-200">{sellTarget.template.name}</h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase">
                  {getSlotLabel(sellTarget.template.slot)} · {getRarityLabel(sellTarget.template.rarity)}
                </p>
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                İlan fiyatı (akçe)
              </span>
              <input
                type="number"
                min={1}
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Örn. 150"
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2.5 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-700/50"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSellTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono uppercase"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSellAttempt}
                className="flex-1 py-2.5 rounded-xl border border-amber-700/60 bg-amber-950/50 text-amber-400 text-xs font-mono uppercase hover:bg-amber-950/70"
              >
                İlan Ver
              </button>
            </div>
          </div>
        </MarketModal>
      )}
    </div>
  )
}

function listingEmoji(listing: MarketListing) {
  return findPhase1Item(listing.itemName)?.emoji ?? resolveItemEmoji({ slot: listing.slot })
}

function ListingCard({ listing, onSelect }: { listing: MarketListing; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:bg-stone-800/40 ${getRarityClass(
        listing.rarity
      )}`}
    >
      <span className="shrink-0 w-10 h-10 flex items-center justify-center">
        <ItemEmoji emoji={listingEmoji(listing)} rarity={listing.rarity} size="slot" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-sm text-stone-100 truncate">{listing.itemName}</span>
          <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0">
            {getRarityLabel(listing.rarity)}
          </span>
        </div>
        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
          {getSlotLabel(listing.slot)} · {listing.sellerName} · {listing.listedAt}
        </p>
        {listing.note && (
          <p className="text-[10px] font-mono text-cyan-700/80 mt-0.5">{listing.note}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-mono font-bold text-amber-400">🪙 {listing.price.toLocaleString()}</span>
      </div>
    </button>
  )
}

function SellItemCard({ item, onSell }: { item: InventoryItem; onSell: () => void }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${getRarityClass(item.template.rarity)}`}
    >
      <span className="shrink-0 w-10 h-10 flex items-center justify-center">
        <ItemEmoji
          emoji={resolveItemEmoji(item.template)}
          rarity={item.template.rarity}
          size="slot"
        />
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-serif font-bold text-sm text-stone-100 block truncate">
          {item.template.name}
        </span>
        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
          {getSlotLabel(item.template.slot)} · {getRarityLabel(item.template.rarity)}
        </p>
      </div>
      <button
        type="button"
        onClick={onSell}
        className="shrink-0 px-3 py-2 rounded-lg border border-amber-700/50 bg-amber-950/30 text-[10px] font-mono uppercase text-amber-400 hover:bg-amber-950/50"
      >
        İlan Ver
      </button>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 px-4 rounded-xl border border-dashed border-stone-800 bg-stone-900/30">
      <p className="text-stone-500 font-mono text-sm">{text}</p>
    </div>
  )
}

function MarketModal({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-2xl p-5 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
