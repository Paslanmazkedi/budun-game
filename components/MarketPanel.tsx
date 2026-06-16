'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GameCharacter } from '@/lib/characters'
import { serializeInventoryItems, type InventoryItem } from '@/lib/inventory'
import { getRarityClass, getRarityLabel } from '@/lib/inventory-slots'
import { resolveItemEmoji, resolveItemIconUrl } from '@/lib/item-display'
import { resolveMountIcon } from '@/lib/mount-assets'
import ItemEmoji from '@/components/ItemEmoji'
import MarketFilterBar from '@/components/MarketFilterBar'
import {
  getSlotLabel,
  type MarketListing,
  type MarketMode,
} from '@/lib/market'
import {
  matchesMarketFilters,
  type MarketSubtypeId,
} from '@/lib/market-filters'
import type { ItemRarityId } from '@/lib/item-rarity'
import {
  MARKET_LISTING_TTL_HOURS,
  canListOnMarket,
  formatMarketExpiresIn,
  formatMarketListedAt,
  isMaterialSlot,
  isMaterialSlug,
} from '@/lib/market-trade'
import {
  buyMarketListing,
  cancelMarketListing,
  createMarketListing,
  fetchActiveMarketListings,
  fetchCharacterBagItems,
} from '@/lib/market-api'

type SellTab = 'inventory' | 'listings'

type MarketPanelProps = {
  character: GameCharacter
  initialItems: InventoryItem[]
}

export default function MarketPanel({ character, initialItems }: MarketPanelProps) {
  const router = useRouter()
  const [mode, setMode] = useState<MarketMode>('buy')
  const [sellTab, setSellTab] = useState<SellTab>('inventory')
  const [weaponFilter, setWeaponFilter] = useState<MarketSubtypeId[] | null>(null)
  const [armorFilter, setArmorFilter] = useState<MarketSubtypeId[] | null>(null)
  const [accessoryFilter, setAccessoryFilter] = useState<MarketSubtypeId[] | null>(null)
  const [selectedRarities, setSelectedRarities] = useState<ItemRarityId[]>([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [allListings, setAllListings] = useState<MarketListing[]>([])
  const [myListings, setMyListings] = useState<MarketListing[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialItems)
  const [loading, setLoading] = useState(true)
  const [gold, setGold] = useState(Number(character.gold))
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null)
  const [sellTarget, setSellTarget] = useState<InventoryItem | null>(null)
  const [sellPrice, setSellPrice] = useState('')

  const listedItemIds = useMemo(
    () => new Set(myListings.map((l) => l.characterItemId)),
    [myListings]
  )

  const bagItems = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          !item.equipped_slot &&
          !listedItemIds.has(item.id) &&
          !isMaterialSlot(item.template.slot) &&
          !isMaterialSlug(item.template.slug)
      ),
    [inventoryItems, listedItemIds]
  )

  const materialStacks = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          !item.equipped_slot &&
          (isMaterialSlot(item.template.slot) || isMaterialSlug(item.template.slug))
      ),
    [inventoryItems]
  )

  const reloadInventory = useCallback(async () => {
    const rows = await fetchCharacterBagItems(character.id)
    setInventoryItems(
      serializeInventoryItems(
        rows as Array<{
          id: string
          equipped_slot?: string | null
          bag_id?: string | null
          quantity?: number | null
          item_templates: InventoryItem['template'] | InventoryItem['template'][] | null
        }>
      )
    )
  }, [character.id])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const active = await fetchActiveMarketListings()
      setAllListings(active)
      setMyListings(active.filter((l) => l.sellerCharacterId === character.id))
      await reloadInventory()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Pazar yüklenemedi'
      if (msg.includes('market_listings') || msg.includes('does not exist')) {
        showMsgStatic('Pazar tabloları henüz kurulmamış — Supabase SQL çalıştırın.')
      } else {
        showMsgStatic(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [character.id, reloadInventory])

  useEffect(() => {
    refresh()
  }, [refresh])

  function showMsgStatic(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(null), 4000)
  }

  function showMsg(text: string) {
    showMsgStatic(text)
  }

  const filterState = useMemo(
    () => ({
      weapon: weaponFilter,
      armor: armorFilter,
      accessory: accessoryFilter,
      rarities: selectedRarities,
    }),
    [weaponFilter, armorFilter, accessoryFilter, selectedRarities]
  )

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allListings.filter((listing) => {
      if (
        !matchesMarketFilters(
          listing.slot,
          listing.rarity,
          filterState,
          listing.slug
        )
      ) {
        return false
      }
      if (!q) return true
      return (
        listing.itemName.toLowerCase().includes(q) ||
        listing.sellerName.toLowerCase().includes(q) ||
        getSlotLabel(listing.slot).toLowerCase().includes(q)
      )
    })
  }, [allListings, filterState, search])

  const filteredMyListings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return myListings.filter((listing) => {
      if (
        !matchesMarketFilters(
          listing.slot,
          listing.rarity,
          filterState,
          listing.slug
        )
      ) {
        return false
      }
      if (!q) return true
      return listing.itemName.toLowerCase().includes(q)
    })
  }, [myListings, filterState, search])

  const filteredSellItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bagItems.filter((item) => {
      if (
        !matchesMarketFilters(
          item.template.slot,
          item.template.rarity,
          filterState,
          item.template.slug
        )
      ) {
        return false
      }
      if (!q) return true
      return (
        item.template.name.toLowerCase().includes(q) ||
        getSlotLabel(item.template.slot).toLowerCase().includes(q)
      )
    })
  }, [bagItems, filterState, search])

  async function handleBuyAttempt(listing: MarketListing) {
    if (listing.sellerCharacterId === character.id) {
      showMsg('Kendi ilanını satın alamazsın.')
      return
    }
    if (gold < listing.price) {
      showMsg('Yeterli akçe yok.')
      return
    }
    setBusy(true)
    try {
      await buyMarketListing(listing.id, character.id)
      setGold((g) => g - listing.price)
      showMsg(`${listing.itemName} satın alındı — heybe güncellendi.`)
      setSelectedListing(null)
      await refresh()
      router.refresh()
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'Satın alma başarısız')
    } finally {
      setBusy(false)
    }
  }

  async function handleSellAttempt() {
    const price = Number(sellPrice)
    if (!sellTarget || !price || price < 1) {
      showMsg('Geçerli bir fiyat gir.')
      return
    }
    if (!canListOnMarket(sellTarget.template.rarity)) {
      showMsg('Bağlı eşya pazarda satılamaz.')
      return
    }
    setBusy(true)
    try {
      await createMarketListing(sellTarget.id, price)
      showMsg(`İlan verildi — ${MARKET_LISTING_TTL_HOURS} saat listede kalacak.`)
      setSellTarget(null)
      setSellPrice('')
      setSellTab('listings')
      await refresh()
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'İlan verilemedi')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancelListing(listing: MarketListing) {
    setBusy(true)
    try {
      await cancelMarketListing(listing.id)
      showMsg('İlan iptal edildi.')
      await refresh()
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'İptal başarısız')
    } finally {
      setBusy(false)
    }
  }

  function handleSellItemClick(item: InventoryItem) {
    if (!canListOnMarket(item.template.rarity)) {
      showMsg('Bağlı veya üstün eşya pazarda satılamaz.')
      return
    }
    setSellTarget(item)
    setSellPrice('')
  }

  const mainContent = (
    <>
      <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 px-3 py-2 text-[10px] font-mono text-stone-500 leading-relaxed">
        {mode === 'buy'
          ? `Tüm aktif ilanlar — kendi ilanların “Senin ilan” olarak görünür. ${MARKET_LISTING_TTL_HOURS} saat sonra kalkar.`
          : sellTab === 'inventory'
            ? 'Listeden eşyaya tıkla — ilan fiyatı gir ve satışa çıkar.'
            : 'Aktif ilanlarını buradan takip edip iptal edebilirsin.'}
      </div>

      {materialStacks.length > 0 && mode === 'sell' && sellTab === 'inventory' && (
        <section className="space-y-2">
          <h3 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
            Malzemeler (Heybe)
          </h3>
          <div className="flex flex-wrap gap-2">
            {materialStacks.map((item) => {
              const qty = item.quantity ?? 1
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 rounded-xl px-2.5 py-2 max-w-full"
                >
                  <ItemIconFrame rarity={item.template.rarity} size="sm">
                    <ItemEmoji
                      emoji={resolveItemEmoji(item.template)}
                      imageUrl={resolveItemIconUrl(item.template)}
                      rarity={item.template.rarity}
                      size="bag"
                    />
                  </ItemIconFrame>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-stone-300 truncate">
                      {item.template.name}
                    </p>
                    <p className="text-[10px] font-mono text-amber-500/90">× {qty}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {message && (
        <div className="text-center text-xs font-mono text-amber-400 bg-amber-950/30 border border-amber-800/40 rounded-xl py-2 px-3 animate-slide-up">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-center text-stone-500 font-mono text-sm py-8">Pazar yükleniyor…</p>
      ) : mode === 'buy' ? (
        <div className="space-y-2 lg:overflow-y-auto lg:game-scroll lg:max-h-[calc(100vh-var(--nav-height)-14rem)] lg:pr-1">
          {filteredListings.length === 0 ? (
            <EmptyState text="Bu kategoride ilan yok. İlk ilanı sen ver!" />
          ) : (
            filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isOwn={listing.sellerCharacterId === character.id}
                onSelect={() => setSelectedListing(listing)}
              />
            ))
          )}
        </div>
      ) : sellTab === 'listings' ? (
        <div className="space-y-2 lg:overflow-y-auto lg:game-scroll lg:max-h-[calc(100vh-var(--nav-height)-14rem)] lg:pr-1">
          {filteredMyListings.length === 0 ? (
            <EmptyState
              text={
                myListings.length === 0
                  ? 'Aktif ilan yok — Envanter sekmesinden ilan ver.'
                  : 'Filtreye uygun aktif ilan yok.'
              }
            />
          ) : (
            filteredMyListings.map((listing) => (
              <MyListingCard
                key={listing.id}
                listing={listing}
                onCancel={() => handleCancelListing(listing)}
                busy={busy}
              />
            ))
          )}
        </div>
      ) : (
        <SellItemList
          items={filteredSellItems}
          emptyText={
            bagItems.length === 0
              ? 'Satılabilir eşya yok — kuşanılmış veya ilanda.'
              : 'Bu filtreye uygun eşya yok.'
          }
          onItemClick={handleSellItemClick}
        />
      )}
    </>
  )

  return (
    <div className="space-y-4">
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
          Alış
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('sell')
            setSellTab('inventory')
            setSelectedListing(null)
          }}
          className={`flex-1 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider transition-colors ${
            mode === 'sell'
              ? 'border-amber-600/60 bg-amber-950/40 text-amber-400'
              : 'border-stone-800 bg-stone-900/50 text-stone-500 hover:text-stone-300'
          }`}
        >
          Satış
        </button>
      </div>

      {mode === 'sell' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSellTab('inventory')}
            className={`flex-1 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-colors ${
              sellTab === 'inventory'
                ? 'border-stone-600 bg-stone-800/80 text-stone-100'
                : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
            }`}
          >
            Envanter
          </button>
          <button
            type="button"
            onClick={() => setSellTab('listings')}
            className={`flex-1 py-2 rounded-xl border text-[10px] font-mono uppercase tracking-wider transition-colors ${
              sellTab === 'listings'
                ? 'border-stone-600 bg-stone-800/80 text-stone-100'
                : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
            }`}
          >
            Aktif İlanlar {myListings.length > 0 ? `(${myListings.length})` : ''}
          </button>
        </div>
      )}

      <div className="lg:hidden">
        <MarketFilterBar
          search={search}
          onSearchChange={setSearch}
          weaponFilter={weaponFilter}
          onWeaponFilterChange={setWeaponFilter}
          armorFilter={armorFilter}
          onArmorFilterChange={setArmorFilter}
          accessoryFilter={accessoryFilter}
          onAccessoryFilterChange={setAccessoryFilter}
          rarities={selectedRarities}
          onRaritiesChange={setSelectedRarities}
        />
      </div>

      {/* PC: sol filtre + sağ içerik */}
      <div className="lg:flex lg:gap-4 lg:items-stretch lg:min-h-[calc(100vh-var(--nav-height)-11rem)]">
        <aside className="hidden lg:flex lg:flex-col lg:w-56 shrink-0">
          <MarketFilterBar
            layout="sidebar"
            search={search}
            onSearchChange={setSearch}
            weaponFilter={weaponFilter}
            onWeaponFilterChange={setWeaponFilter}
            armorFilter={armorFilter}
            onArmorFilterChange={setArmorFilter}
            accessoryFilter={accessoryFilter}
            onAccessoryFilterChange={setAccessoryFilter}
            rarities={selectedRarities}
            onRaritiesChange={setSelectedRarities}
          />
        </aside>
        <div className="lg:flex-1 lg:min-w-0 space-y-3">{mainContent}</div>
      </div>

      {selectedListing && (
        <MarketModal onClose={() => setSelectedListing(null)}>
          <div className="space-y-4">
            {selectedListing.sellerCharacterId === character.id && (
              <p className="text-[10px] font-mono text-amber-500/90 text-center bg-amber-950/30 border border-amber-800/40 rounded-lg py-1.5">
                Bu senin ilan — satın alamazsın
              </p>
            )}
            <div className="flex items-start gap-3">
              <ItemIconFrame rarity={selectedListing.rarity} size="lg">
                <ItemEmoji
                  emoji={listingEmoji(selectedListing)}
                  imageUrl={listingIconUrl(selectedListing)}
                  rarity={selectedListing.rarity}
                  size="bag"
                />
              </ItemIconFrame>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-amber-400 text-lg leading-tight">
                  {selectedListing.itemName}
                </h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mt-1">
                  {getSlotLabel(selectedListing.slot)} · {getRarityLabel(selectedListing.rarity)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg px-3 py-2">
                <span className="text-stone-500 block text-[10px] uppercase">Satıcı</span>
                <span className="text-stone-300">{selectedListing.sellerName}</span>
              </div>
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg px-3 py-2">
                <span className="text-stone-500 block text-[10px] uppercase">İlan</span>
                <span className="text-stone-300">{formatMarketListedAt(selectedListing.createdAt)}</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-stone-600 text-center">
              {formatMarketExpiresIn(selectedListing.expiresAt)}
            </p>

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
                disabled={
                  busy ||
                  gold < selectedListing.price ||
                  selectedListing.sellerCharacterId === character.id
                }
                className="flex-1 py-2.5 rounded-xl border border-amber-700/60 bg-amber-950/50 text-amber-400 text-xs font-mono uppercase hover:bg-amber-950/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedListing.sellerCharacterId === character.id
                  ? 'Senin ilan'
                  : busy
                    ? '…'
                    : 'Satın Al'}
              </button>
            </div>
          </div>
        </MarketModal>
      )}

      {sellTarget && (
        <MarketModal
          onClose={() => setSellTarget(null)}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSellTarget(null)}
                className="flex-1 py-3 rounded-xl border border-stone-700 text-stone-400 text-xs font-mono uppercase"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSellAttempt}
                disabled={busy}
                className="flex-1 py-3 rounded-xl border border-amber-700/60 bg-amber-950/50 text-amber-400 text-xs font-mono uppercase hover:bg-amber-950/70 disabled:opacity-40"
              >
                {busy ? '…' : 'İlan Ver'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ItemIconFrame rarity={sellTarget.template.rarity} size="md">
                <ItemEmoji
                  emoji={resolveItemEmoji(sellTarget.template)}
                  imageUrl={resolveItemIconUrl(sellTarget.template)}
                  rarity={sellTarget.template.rarity}
                  size="bag"
                />
              </ItemIconFrame>
              <div>
                <h3 className="font-serif font-bold text-stone-200">{sellTarget.template.name}</h3>
                <p className="text-[10px] font-mono text-stone-500 uppercase">
                  {getSlotLabel(sellTarget.template.slot)} · {getRarityLabel(sellTarget.template.rarity)}
                </p>
              </div>
            </div>

            <p className="text-[10px] font-mono text-stone-600">
              İlan {MARKET_LISTING_TTL_HOURS} saat sonra otomatik kalkar.
            </p>

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
          </div>
        </MarketModal>
      )}
    </div>
  )
}

function ItemIconFrame({
  rarity,
  size = 'md',
  children,
}: {
  rarity: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}) {
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-14 h-14' : 'w-12 h-12'
  return (
    <div
      className={`relative shrink-0 rounded-xl border overflow-hidden flex items-center justify-center [container-type:size] ${sizeClass} ${getRarityClass(
        rarity
      )}`}
    >
      {children}
    </div>
  )
}

function listingEmoji(listing: MarketListing) {
  return listing.emoji ?? resolveItemEmoji({ slot: listing.slot, emoji: listing.emoji })
}

function listingIconUrl(listing: MarketListing) {
  return resolveMountIcon(listing.slug) ?? null
}

function ListingCard({
  listing,
  isOwn,
  onSelect,
}: {
  listing: MarketListing
  isOwn?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border border-stone-800/80 bg-stone-900/40 text-left transition-colors hover:bg-stone-800/40`}
    >
      <ItemIconFrame rarity={listing.rarity} size="sm">
        <ItemEmoji
          emoji={listingEmoji(listing)}
          imageUrl={listingIconUrl(listing)}
          rarity={listing.rarity}
          size="bag"
        />
      </ItemIconFrame>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-serif font-bold text-sm text-stone-100 truncate">{listing.itemName}</span>
          {isOwn && (
            <span className="text-[8px] font-mono uppercase text-amber-500 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
              Senin ilan
            </span>
          )}
          <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0">
            {getRarityLabel(listing.rarity)}
          </span>
        </div>
        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
          {getSlotLabel(listing.slot)} · {listing.sellerName} · {formatMarketListedAt(listing.createdAt)}
        </p>
        <p className="text-[9px] font-mono text-stone-600 mt-0.5">
          {formatMarketExpiresIn(listing.expiresAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-mono font-bold text-amber-400">🪙 {listing.price.toLocaleString()}</span>
      </div>
    </button>
  )
}

function MyListingCard({
  listing,
  onCancel,
  busy,
}: {
  listing: MarketListing
  onCancel: () => void
  busy: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-stone-800/80 bg-stone-900/40"
    >
      <ItemIconFrame rarity={listing.rarity} size="sm">
        <ItemEmoji
          emoji={listingEmoji(listing)}
          imageUrl={listingIconUrl(listing)}
          rarity={listing.rarity}
          size="bag"
        />
      </ItemIconFrame>
      <div className="min-w-0 flex-1">
        <span className="font-serif font-bold text-sm text-stone-100 block truncate">
          {listing.itemName}
        </span>
        <p className="text-[10px] font-mono text-stone-500 mt-0.5">
          🪙 {listing.price.toLocaleString()} · {formatMarketExpiresIn(listing.expiresAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="shrink-0 px-3 py-2 rounded-lg border border-stone-700 text-[10px] font-mono uppercase text-stone-400 hover:text-red-400 hover:border-red-900/40 disabled:opacity-40"
      >
        İptal
      </button>
    </div>
  )
}

function SellItemList({
  items,
  emptyText,
  onItemClick,
}: {
  items: InventoryItem[]
  emptyText: string
  onItemClick: (item: InventoryItem) => void
}) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />
  }

  return (
    <div className="space-y-2 lg:overflow-y-auto lg:game-scroll lg:max-h-[calc(100vh-var(--nav-height)-14rem)] lg:pr-1">
      {items.map((item) => {
        const listable = canListOnMarket(item.template.rarity)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item)}
            disabled={!listable}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border border-stone-800/80 bg-stone-900/40 text-left transition-colors ${
              listable
                ? 'hover:bg-stone-800/40 active:scale-[0.99]'
                : 'opacity-45 cursor-not-allowed'
            }`}
          >
            <ItemIconFrame rarity={item.template.rarity} size="sm">
              <ItemEmoji
                emoji={resolveItemEmoji(item.template)}
                imageUrl={resolveItemIconUrl(item.template)}
                rarity={item.template.rarity}
                size="bag"
              />
            </ItemIconFrame>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif font-bold text-sm text-stone-100 truncate">
                  {item.template.name}
                </span>
                {(item.quantity ?? 1) > 1 && (
                  <span className="text-[9px] font-mono text-amber-500 shrink-0">×{item.quantity}</span>
                )}
                <span className="text-[9px] font-mono uppercase text-stone-500 shrink-0">
                  {getRarityLabel(item.template.rarity)}
                </span>
              </div>
              <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                {getSlotLabel(item.template.slot)}
                {listable ? ' · Satışa çıkar' : ' · Pazarda satılamaz'}
              </p>
            </div>
          </button>
        )
      })}
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
  footer,
}: {
  children: React.ReactNode
  onClose: () => void
  footer?: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-stone-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-stone-950 border border-stone-800 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[min(88dvh,calc(100dvh-var(--nav-height)-0.5rem))] mb-[var(--nav-height)] sm:mb-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-stone-800 bg-stone-950 p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
