'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { normalizeGender } from '@/lib/game-assets'
import type { GameCharacter } from '@/lib/characters'
import type { InventoryItem } from '@/lib/inventory'
import { serializeInventoryItems } from '@/lib/inventory'
import ItemContextMenu, { type ContextMenuState } from '@/components/inventory/ItemContextMenu'
import ItemTooltipPopup, { type TooltipAnchorRect } from '@/components/inventory/ItemTooltipPopup'
import InventoryPaperDoll from '@/components/inventory/InventoryPaperDoll'
import InventoryExpandMenu from '@/components/inventory/InventoryExpandMenu'
import {
  expandInventoryDisplaySlots,
} from '@/lib/inventory-api'
import {
  fetchPlayerEntitlements,
  fetchPremiumWallet,
  purchasePremiumInventorySlots,
} from '@/lib/premium-api'
import {
  getAvailableSlotProducts,
  getCharacterBaseSlotCapacity,
  getEffectiveInventoryCapacity,
  getInventoryDisplaySlots,
  INVENTORY_SLOT_MAX,
  nextDisplaySlotsAfterRow,
  sumInventoryEntitlementBonus,
  toInventoryExpandOffer,
  type InventoryExpandOffer,
} from '@/lib/inventory-capacity'
import type { PremiumEntitlement } from '@/lib/premium-commerce'
import { getInventoryGridCols, INVENTORY_COLS_MOBILE } from '@/lib/inventory-grid'
import {
  ARMOR_SET_SLOT_ID,
  getRarityClass,
  isArmorSetEquipSlot,
  itemMatchesEquipSlot,
  findEmptyEquipSlotId,
  getMatchingEquipSlotIds,
  normalizeEquippedSlotId,
  equippedSlotDbValues,
  pickArmorSetDisplayItem,
  type EquipSlotDef,
} from '@/lib/inventory-slots'
import { resolveItemEmoji, resolveItemIconUrl } from '@/lib/item-display'
import ItemEmoji from '@/components/ItemEmoji'
import { dismantleInventoryItem } from '@/lib/market-api'
import { canDismantleItem, isMaterialSlot } from '@/lib/market-trade'
import { isMountEquipSlot, notifyEquipmentChanged } from '@/lib/equipped-mount'

type InventoryPanelProps = {
  character: GameCharacter
  initialItems: InventoryItem[]
}

const LONG_PRESS_MS = 480

export default function InventoryPanel({ character, initialItems }: InventoryPanelProps) {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [tooltip, setTooltip] = useState<{
    itemId: string
    anchor: TooltipAnchorRect
  } | null>(null)
  const [tooltipPinned, setTooltipPinned] = useState(false)
  const [gridCols, setGridCols] = useState(INVENTORY_COLS_MOBILE)
  const [baseSlotCapacity, setBaseSlotCapacity] = useState(() =>
    getCharacterBaseSlotCapacity(character)
  )
  const [entitlements, setEntitlements] = useState<PremiumEntitlement[]>([])
  const [premiumBalance, setPremiumBalance] = useState(0)
  const [displaySlots, setDisplaySlots] = useState(() =>
    getInventoryDisplaySlots(character)
  )
  const [expandMenuOpen, setExpandMenuOpen] = useState(false)
  const expandBtnRef = useRef<HTMLButtonElement>(null)
  const [gold, setGold] = useState(Number(character.gold))
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [dropSlotId, setDropSlotId] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const gender = normalizeGender(character.gender)

  useEffect(() => {
    const syncGrid = () => {
      setGridCols(getInventoryGridCols(window.innerWidth))
    }
    syncGrid()
    window.addEventListener('resize', syncGrid)
    return () => window.removeEventListener('resize', syncGrid)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPremiumState() {
      const [walletRes, entRes] = await Promise.all([
        fetchPremiumWallet(supabase, character.user_id),
        fetchPlayerEntitlements(supabase, character.user_id),
      ])
      if (cancelled) return
      if (walletRes.wallet) {
        setPremiumBalance(walletRes.wallet.premium_balance)
      }
      if (!entRes.error) {
        setEntitlements(entRes.entitlements)
      }
    }

    void loadPremiumState()
    return () => {
      cancelled = true
    }
  }, [character.user_id, supabase])

  const slotBonus = useMemo(
    () => sumInventoryEntitlementBonus(entitlements),
    [entitlements]
  )

  const effectiveSlotCapacity = useMemo(
    () =>
      getEffectiveInventoryCapacity(
        { ...character, inventory_slot_capacity: baseSlotCapacity },
        entitlements
      ),
    [baseSlotCapacity, character, entitlements]
  )

  const expandOffers = useMemo(
    () =>
      getAvailableSlotProducts(baseSlotCapacity, slotBonus).map(toInventoryExpandOffer),
    [baseSlotCapacity, slotBonus]
  )

  const equippedBySlot = useMemo(() => {
    const map: Record<string, InventoryItem> = {}
    const armorPieces: InventoryItem[] = []

    items.forEach((item) => {
      if (!item.equipped_slot) return
      if (isArmorSetEquipSlot(item.equipped_slot)) {
        armorPieces.push(item)
        return
      }
      const slotId = normalizeEquippedSlotId(item.equipped_slot)
      if (slotId) map[slotId] = item
    })

    if (armorPieces.length > 0) {
      map[ARMOR_SET_SLOT_ID] = pickArmorSetDisplayItem(armorPieces)
    }

    return map
  }, [items])

  const bagItemsAll = useMemo(
    () => items.filter((item) => !item.equipped_slot),
    [items]
  )

  const totalBagItems = bagItemsAll.length
  const displayedCapacity = Math.min(displaySlots, effectiveSlotCapacity)
  const emptySlotCount = Math.max(0, displayedCapacity - totalBagItems)
  const canExpandDisplay = displaySlots < effectiveSlotCapacity
  const canPurchaseCapacity = expandOffers.length > 0
  const showExpandButton = canExpandDisplay || canPurchaseCapacity

  const tooltipItem = tooltip ? items.find((i) => i.id === tooltip.itemId) : null
  const contextItem = contextMenu ? items.find((i) => i.id === contextMenu.itemId) : null

  function anchorFrom(el: HTMLElement): TooltipAnchorRect {
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }

  function showItemTooltip(itemId: string, el: HTMLElement, pin: boolean) {
    setTooltip({ itemId, anchor: anchorFrom(el) })
    setTooltipPinned(pin)
  }

  function closeItemTooltip() {
    setTooltip(null)
    setTooltipPinned(false)
  }

  function showMsg(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(null), 3000)
  }

  function findEquipSlotForItem(item: InventoryItem): string | null {
    const empty = findEmptyEquipSlotId(item.template.slot, equippedBySlot)
    if (empty) return empty
    const slots = getMatchingEquipSlotIds(item.template.slot)
    return slots[0] ?? null
  }

  function canEquipItem(item: InventoryItem): boolean {
    if (item.equipped_slot) return false
    return getMatchingEquipSlotIds(item.template.slot).length > 0
  }

  function getCompareEquippedItem(item: InventoryItem): InventoryItem | null {
    if (item.equipped_slot) return null
    const slotId = findEquipSlotForItem(item)
    if (!slotId) return null
    return equippedBySlot[slotId] ?? null
  }

  function toggleItemSelection(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelectMode() {
    if (selectMode) exitSelectMode()
    else {
      closeItemTooltip()
      setSelectMode(true)
    }
  }

  async function equipItem(itemId: string, slotId: string) {
    const item = items.find((i) => i.id === itemId)
    if (!item || !itemMatchesEquipSlot(item.template.slot, slotId)) {
      showMsg('Bu eşya bu slota uygun değil.')
      return false
    }

    const qty = item.quantity ?? 1
    if (qty > 1 && item.item_template_id) {
      setBusy(true)
      const previousInSlot = items.find(
        (i) => normalizeEquippedSlotId(i.equipped_slot) === slotId
      )

      const { error: clearError } = await supabase
        .from('character_items')
        .update({ equipped_slot: null })
        .eq('character_id', character.id)
        .in('equipped_slot', equippedSlotDbValues(slotId))

      if (clearError) {
        showMsg(clearError.message)
        setBusy(false)
        return false
      }

      const { data: newRow, error: insertError } = await supabase
        .from('character_items')
        .insert({
          character_id: character.id,
          item_template_id: item.item_template_id,
          equipped_slot: slotId,
          bag_id: item.bag_id ?? 'bag1',
          quantity: 1,
        })
        .select('id, item_template_id, equipped_slot, bag_id, quantity, item_templates(*)')
        .single()

      if (insertError || !newRow) {
        showMsg(insertError?.message ?? 'Kuşanma başarısız.')
        setBusy(false)
        return false
      }

      const { error: decError } = await supabase
        .from('character_items')
        .update({ quantity: qty - 1 })
        .eq('id', itemId)
        .eq('character_id', character.id)

      if (decError) {
        showMsg(decError.message)
        setBusy(false)
        return false
      }

      const equippedCopy = serializeInventoryItems([newRow])[0]
      setItems((prev) => {
        const next = prev.map((i) => {
          if (i.id === itemId) return { ...i, quantity: qty - 1 }
          if (previousInSlot && i.id === previousInSlot.id) return { ...i, equipped_slot: null }
          return i
        })
        return [...next, equippedCopy]
      })
      closeItemTooltip()
      setContextMenu(null)
      showMsg(`${item.template.name} kuşanıldı.`)
      if (slotId === 'mount') notifyEquipmentChanged()
      setBusy(false)
      return true
    }

    setBusy(true)
    const previousInSlot = items.find(
      (i) => normalizeEquippedSlotId(i.equipped_slot) === slotId
    )

    const { error: clearError } = await supabase
      .from('character_items')
      .update({ equipped_slot: null })
      .eq('character_id', character.id)
      .in('equipped_slot', equippedSlotDbValues(slotId))

    if (clearError) {
      showMsg(
        clearError.message.includes('equipped_slot')
          ? 'Teçhizat kaydı için equipped_slot kolonu gerekli (add-equipped-slot.sql).'
          : clearError.message
      )
      setBusy(false)
      return false
    }

    const { data, error } = await supabase
      .from('character_items')
      .update({ equipped_slot: slotId })
      .eq('id', itemId)
      .eq('character_id', character.id)
      .select('id, equipped_slot')
      .maybeSingle()

    if (error) {
      showMsg(
        error.message.includes('equipped_slot')
          ? 'Teçhizat kaydı için equipped_slot kolonu gerekli (add-equipped-slot.sql).'
          : error.message
      )
      setBusy(false)
      return false
    }

    if (!data || data.equipped_slot !== slotId) {
      showMsg(
        'Kuşanma kaydedilemedi. Supabase\'de rls-character-items.sql çalıştırın veya girişi kontrol edin.'
      )
      setBusy(false)
      return false
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) return { ...i, equipped_slot: slotId }
        if (previousInSlot && i.id === previousInSlot.id) return { ...i, equipped_slot: null }
        if (
          normalizeEquippedSlotId(i.equipped_slot) === slotId &&
          i.id !== itemId
        ) {
          return { ...i, equipped_slot: null }
        }
        return i
      })
    )
    closeItemTooltip()
    setContextMenu(null)
    showMsg(`${item.template.name} kuşanıldı.`)
    if (slotId === 'mount') notifyEquipmentChanged()
    setBusy(false)
    return true
  }

  async function unequipItem(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    setBusy(true)
    const { data, error } = await supabase
      .from('character_items')
      .update({ equipped_slot: null })
      .eq('id', itemId)
      .eq('character_id', character.id)
      .select('id, equipped_slot')
      .maybeSingle()

    if (error) {
      showMsg(error.message)
      setBusy(false)
      return false
    }

    if (!data || data.equipped_slot !== null) {
      showMsg('Çıkarma kaydedilemedi. rls-character-items.sql dosyasını çalıştırın.')
      setBusy(false)
      return false
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, equipped_slot: null } : i))
    )
    closeItemTooltip()
    setContextMenu(null)
    if (isMountEquipSlot(item?.equipped_slot)) notifyEquipmentChanged()
    setBusy(false)
    return true
  }

  async function persistDisplayExpand(nextDisplay: number) {
    setBusy(true)
    const { inventory_display_slots, error } = await expandInventoryDisplaySlots(
      supabase,
      character.id,
      nextDisplay
    )
    if (error || !inventory_display_slots) {
      showMsg(error ?? 'Görünüm kaydedilemedi.')
      setBusy(false)
      return false
    }
    setDisplaySlots(inventory_display_slots)
    setBusy(false)
    return true
  }

  async function handleExpandDisplayRow() {
    const next = nextDisplaySlotsAfterRow(
      displaySlots,
      effectiveSlotCapacity,
      gridCols
    )
    if (next === displaySlots) return
    await persistDisplayExpand(next)
  }

  async function handlePurchaseSlots(offer: InventoryExpandOffer) {
    if (premiumBalance < offer.premiumCost) {
      showMsg(`Yeterli Kut Taşı yok (${offer.premiumCost} gerekli).`)
      return
    }

    setBusy(true)
    const { data, error } = await purchasePremiumInventorySlots(
      supabase,
      character.id,
      offer.id,
      baseSlotCapacity,
      slotBonus
    )
    if (error || !data?.inventory_slot_capacity) {
      showMsg(error ?? 'Satın alma başarısız.')
      setBusy(false)
      return
    }

    setBaseSlotCapacity(data.inventory_slot_capacity)
    setDisplaySlots(data.inventory_display_slots ?? displaySlots)
    setPremiumBalance(data.premium_balance)
    showMsg(`+${offer.slots} heybe slotu açıldı!`)
    setBusy(false)
  }

  function openContextMenu(e: React.MouseEvent | React.TouchEvent, item: InventoryItem) {
    e.preventDefault()
    const point =
      'touches' in e && e.touches[0]
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY }

    setContextMenu({
      x: point.x,
      y: point.y,
      itemId: item.id,
      isEquipped: Boolean(item.equipped_slot),
    })
    showItemTooltip(item.id, (e.currentTarget as HTMLElement) ?? document.body, true)
  }

  function handleBagItemClick(
    e: React.MouseEvent<HTMLButtonElement>,
    item: InventoryItem
  ) {
    if (busy || longPressTriggered.current) return

    if (selectMode) {
      if (!canDismantleInventoryItem(item)) {
        showMsg('Bu eşya parçalanamaz (kuşanılmış / üstün / eşsiz).')
        return
      }
      toggleItemSelection(item.id)
      return
    }

    if (tooltip?.itemId === item.id && tooltipPinned) {
      closeItemTooltip()
      return
    }
    showItemTooltip(item.id, e.currentTarget, true)
  }

  function handleBagItemDoubleClick(item: InventoryItem) {
    if (busy || item.equipped_slot) return
    closeItemTooltip()
    const slot = findEquipSlotForItem(item)
    if (slot) equipItem(item.id, slot)
  }

  function handleSlotClick(slotId: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (busy) return
    const equipped = equippedBySlot[slotId]
    if (equipped) {
      if (tooltip?.itemId === equipped.id && tooltipPinned) {
        closeItemTooltip()
      } else {
        showItemTooltip(equipped.id, e.currentTarget, true)
      }
    }
  }

  async function handleSlotDoubleClick(slotId: string) {
    if (busy) return
    closeItemTooltip()

    if (slotId === ARMOR_SET_SLOT_ID) {
      const all = items.filter((item) => isArmorSetEquipSlot(item.equipped_slot))
      if (all.length === 0) return
      for (const item of all) {
        await unequipItem(item.id)
      }
      return
    }

    const equipped = equippedBySlot[slotId]
    if (!equipped) return
    await unequipItem(equipped.id)
  }

  function canDismantleInventoryItem(item: InventoryItem): boolean {
    if (item.equipped_slot) return false
    if (isMaterialSlot(item.template.slot)) return false
    return canDismantleItem(item.template.rarity)
  }

  async function dismantleItem(itemId: string, options?: { silent?: boolean }): Promise<boolean> {
    const item = items.find((i) => i.id === itemId)
    if (!item || !canDismantleInventoryItem(item)) {
      if (!options?.silent) showMsg('Bu eşya parçalanamaz.')
      return false
    }

    if (!options?.silent) setBusy(true)
    try {
      const reward = await dismantleInventoryItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      if (!options?.silent) {
        closeItemTooltip()
        setContextMenu(null)
        showMsg(
          `${item.template.name} parçalandı — +${reward.amount} ${reward.material_name}`
        )
        setBusy(false)
      }
      return true
    } catch (err) {
      if (!options?.silent) {
        showMsg(err instanceof Error ? err.message : 'Parçalama başarısız.')
        setBusy(false)
      }
      return false
    }
  }

  async function dismantleSelectedItems() {
    const ids = [...selectedIds].filter((id) => {
      const item = items.find((i) => i.id === id)
      return item && canDismantleInventoryItem(item)
    })
    if (ids.length === 0) {
      showMsg('Parçalanacak eşya seçilmedi.')
      return
    }

    setBusy(true)
    let ok = 0
    for (const id of ids) {
      const success = await dismantleItem(id, { silent: true })
      if (success) ok++
    }
    setSelectedIds(new Set())
    setSelectMode(false)
    setBusy(false)
    showMsg(ok > 0 ? `${ok} eşya parçalandı.` : 'Parçalama başarısız.')
  }

  function handleEquipFromMenu() {
    if (!contextItem || contextItem.equipped_slot) return
    const slot = findEquipSlotForItem(contextItem)
    if (slot) equipItem(contextItem.id, slot)
    else showMsg('Uygun teçhizat slotu yok.')
  }

  function SlotButton({ slot }: { slot: EquipSlotDef; compact?: boolean }) {
    const equipped = equippedBySlot[slot.id]
    const isDrop = dropSlotId === slot.id
    const canDrop =
      dragItemId &&
      items.find((i) => i.id === dragItemId) &&
      itemMatchesEquipSlot(items.find((i) => i.id === dragItemId)!.template.slot, slot.id)

    return (
      <button
        type="button"
        onClick={(e) => handleSlotClick(slot.id, e)}
        onDoubleClick={() => void handleSlotDoubleClick(slot.id)}
        disabled={busy}
        draggable={equipped && !busy}
        onDragStart={(e) => {
          if (!equipped) return
          setDragItemId(equipped.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => {
          setDragItemId(null)
          setDropSlotId(null)
        }}
        onDragOver={(e) => {
          if (!dragItemId) return
          const dragItem = items.find((i) => i.id === dragItemId)
          if (dragItem && itemMatchesEquipSlot(dragItem.template.slot, slot.id)) {
            e.preventDefault()
            setDropSlotId(slot.id)
          }
        }}
        onDragLeave={() => setDropSlotId((s) => (s === slot.id ? null : s))}
        onDrop={(e) => {
          e.preventDefault()
          setDropSlotId(null)
          if (dragItemId) equipItem(dragItemId, slot.id)
          setDragItemId(null)
        }}
        onContextMenu={(e) => {
          if (equipped) openContextMenu(e, equipped)
        }}
        className={`inventory-flank-slot-btn relative rounded-lg border flex items-center justify-center transition-all active:scale-95 shrink-0 overflow-hidden ${
          equipped
            ? `${getRarityClass(equipped.template.rarity)} shadow-md`
            : isDrop && canDrop
              ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/40'
              : 'border-stone-800 bg-stone-950/80 hover:border-amber-700/50'
        }`}
        title={equipped ? equipped.template.name : slot.label}
      >
        {equipped ? (
          <ItemEmoji
            emoji={resolveItemEmoji(equipped.template)}
            imageUrl={resolveItemIconUrl(equipped.template)}
            rarity={equipped.template.rarity}
            size="slot"
            imgClassName="max-w-[78%] max-h-[78%]"
          />
        ) : (
          <span className="flex flex-col items-center justify-center gap-0.5 font-mono font-bold text-stone-500 text-center leading-none px-0.5">
            <span className="text-sm lg:text-base leading-none" aria-hidden>
              {slot.icon}
            </span>
            <span className="text-[6px] sm:text-[7px] lg:text-[8px] uppercase tracking-wide">{slot.label}</span>
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {message && (
        <p className="text-sm font-mono text-amber-200 bg-amber-950/40 border border-amber-900/40 rounded-xl px-4 py-2.5 animate-slide-up">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs lg:text-sm font-mono">
        <span className="text-stone-500 px-2 py-1">🪙 {gold.toLocaleString()} Akçe</span>
        <span className="text-violet-400/90 px-2 py-1">💠 {premiumBalance.toLocaleString()} Kut Taşı</span>
        <span className="text-stone-500 px-2 py-1">
          Heybe {totalBagItems}/{effectiveSlotCapacity}
          {slotBonus > 0 && (
            <span className="text-violet-400/80"> (+{slotBonus} premium)</span>
          )}
          {effectiveSlotCapacity < INVENTORY_SLOT_MAX && (
            <span className="text-stone-600"> · max {INVENTORY_SLOT_MAX}</span>
          )}
        </span>
        <span className="text-stone-600 px-2 py-1 hidden sm:inline">
          {selectMode
            ? 'Çoklu seçim: parçalanabilir eşyalara tıkla'
            : 'Tık = bilgi · çift tık = kuşan · sağ tık = menü'}
        </span>
      </div>

      <div className="inventory-dual-panel">
        {/* Teçhizat — karakter ortada, slotlar iki yanda */}
        <div className="inventory-panel-card inventory-panel-card--equip">
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2 sm:mb-3 shrink-0">
            Teçhizat
          </p>
          <div className="inventory-panel-body flex flex-1 items-center justify-center py-2 lg:py-3 min-h-[18rem] lg:min-h-[22rem]">
            <InventoryPaperDoll
              gender={gender}
              characterName={character.name}
              renderSlot={(slot) => <SlotButton key={slot.id} slot={slot} />}
            />
          </div>
        </div>

        {/* Heybe */}
        <div className="inventory-panel-card inventory-panel-card--bag">
          <div className="inventory-mobile-bag-divider lg:hidden shrink-0 mb-1" aria-hidden>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600/90 shrink-0">
              Heybe
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-800 pb-3 mb-3 shrink-0">
            <h2 className="text-sm lg:text-base font-mono font-bold text-stone-300 uppercase tracking-widest hidden lg:block">
              Heybe
            </h2>
            <h2 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-widest lg:hidden">
              Çanta
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={toggleSelectMode}
                className={`text-[10px] font-mono uppercase px-2.5 py-1.5 rounded-lg border transition ${
                  selectMode
                    ? 'border-cyan-600/50 bg-cyan-950/40 text-cyan-300'
                    : 'border-stone-700 bg-stone-900/60 text-stone-400 hover:text-stone-200'
                }`}
              >
                {selectMode ? 'Seçimi bitir' : 'Çoklu seçim'}
              </button>
              {selectMode && selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={dismantleSelectedItems}
                    className="text-[10px] font-mono uppercase px-2.5 py-1.5 rounded-lg border border-orange-700/50 bg-orange-950/40 text-orange-300 hover:bg-orange-950/60 transition"
                  >
                    Parçala ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[10px] font-mono px-2 py-1.5 text-stone-500 hover:text-stone-300"
                  >
                    Temizle
                  </button>
                </>
              )}
              <span className="text-xs font-mono text-stone-500 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                {totalBagItems} / {effectiveSlotCapacity}
              </span>
            </div>
          </div>

          {totalBagItems > effectiveSlotCapacity && (
            <p className="text-xs font-mono text-amber-500/90 bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2 mb-3 shrink-0">
              Heybe dolu ({totalBagItems}/{effectiveSlotCapacity}). Slot genişletin veya eşya bırakın.
            </p>
          )}

          <div className="inventory-panel-body">
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible game-scroll pr-0.5">
              <div
                className="inventory-bag-grid"
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
              >
                {bagItemsAll.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  const canSelect = canDismantleInventoryItem(item)
                  return (
                  <button
                    key={item.id}
                    type="button"
                    draggable={!busy && !selectMode}
                    onClick={(e) => handleBagItemClick(e, item)}
                    onDoubleClick={() => {
                      if (selectMode) return
                      handleBagItemDoubleClick(item)
                    }}
                    disabled={busy}
                    onMouseEnter={(e) => {
                      if (selectMode || tooltipPinned) return
                      showItemTooltip(item.id, e.currentTarget, false)
                    }}
                    onMouseLeave={() => {
                      if (selectMode || tooltipPinned) return
                      if (tooltip?.itemId === item.id) setTooltip(null)
                    }}
                    onContextMenu={(e) => openContextMenu(e, item)}
                    onTouchStart={(e) => {
                      longPressTriggered.current = false
                      longPressTimer.current = setTimeout(() => {
                        longPressTriggered.current = true
                        openContextMenu(e, item)
                      }, LONG_PRESS_MS)
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer.current) clearTimeout(longPressTimer.current)
                    }}
                    onTouchMove={() => {
                      if (longPressTimer.current) clearTimeout(longPressTimer.current)
                    }}
                    onDragStart={(e) => {
                      setDragItemId(item.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      setDragItemId(null)
                      setDropSlotId(null)
                    }}
                    className={`relative aspect-square w-full rounded-lg border p-0 overflow-hidden transition select-none touch-manipulation [container-type:size] ${
                      getRarityClass(item.template.rarity)
                    } ${tooltip?.itemId === item.id && tooltipPinned ? 'ring-2 ring-amber-500 scale-[1.03]' : ''} ${
                      isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''
                    } ${selectMode && !canSelect ? 'opacity-45' : ''} ${
                      dragItemId === item.id ? 'opacity-50' : 'active:scale-95'
                    }`}
                    aria-label={item.template.name}
                    aria-pressed={selectMode ? isSelected : undefined}
                  >
                    {selectMode && isSelected && (
                      <span
                        className="absolute top-0.5 left-0.5 z-10 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-stone-950 flex items-center justify-center leading-none"
                        aria-hidden
                      >
                        ✓
                      </span>
                    )}
                    <ItemEmoji
                      emoji={resolveItemEmoji(item.template)}
                      imageUrl={resolveItemIconUrl(item.template)}
                      rarity={item.template.rarity}
                      size="bag"
                      imgClassName="max-w-[80%] max-h-[80%]"
                    />
                    {(item.quantity ?? 1) > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 min-w-[1.25rem] px-1 py-0.5 rounded-md bg-stone-950/90 border border-stone-700 text-[9px] font-mono font-bold text-amber-400 leading-none">
                        {item.quantity}
                      </span>
                    )}
                  </button>
                  )
                })}
                {Array.from({ length: emptySlotCount }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square w-full rounded-lg border border-stone-800/50 bg-stone-950/30"
                  />
                ))}
                {showExpandButton && (
                  <div className="relative">
                    <button
                      ref={expandBtnRef}
                      type="button"
                      disabled={busy}
                      onClick={() => setExpandMenuOpen((open) => !open)}
                      className="inventory-expand-slot"
                      title="Heybe genişlet"
                      aria-expanded={expandMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="inventory-expand-slot__icon">+</span>
                      <span className="inventory-expand-slot__hint">Genişlet</span>
                    </button>
                    <InventoryExpandMenu
                      open={expandMenuOpen}
                      anchorRef={expandBtnRef}
                      canExpandDisplay={canExpandDisplay}
                      displayRowLabel={`+${gridCols} slot göster`}
                      offers={expandOffers}
                      premiumBalance={premiumBalance}
                      busy={busy}
                      onClose={() => setExpandMenuOpen(false)}
                      onExpandDisplay={() => void handleExpandDisplayRow()}
                      onPurchase={(offer) => void handlePurchaseSlots(offer)}
                    />
                  </div>
                )}
              </div>
            </div>

            {bagItemsAll.length === 0 && items.length === 0 && (
              <p className="text-center text-stone-600 font-mono text-sm mt-6 lg:mt-0 lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center lg:pointer-events-none">
                Heybe boş. Görevlerden ganimet topla.
              </p>
            )}
          </div>
        </div>
      </div>

      {tooltip && tooltipItem && (
        <ItemTooltipPopup
          item={tooltipItem}
          anchor={tooltip.anchor}
          compareItem={getCompareEquippedItem(tooltipItem)}
          pinned={tooltipPinned}
          onClose={tooltipPinned ? closeItemTooltip : undefined}
          onEquip={
            tooltipPinned &&
            !tooltipItem.equipped_slot &&
            canEquipItem(tooltipItem)
              ? () => {
                  const slot = findEquipSlotForItem(tooltipItem)
                  if (slot) equipItem(tooltipItem.id, slot)
                  else showMsg('Uygun teçhizat slotu yok.')
                }
              : undefined
          }
          onUnequip={
            tooltipPinned && tooltipItem.equipped_slot
              ? () => unequipItem(tooltipItem.id)
              : undefined
          }
          canEquip={canEquipItem(tooltipItem)}
        />
      )}

      <ItemContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onEquip={handleEquipFromMenu}
        onUnequip={() => contextItem && unequipItem(contextItem.id)}
        onDismantle={() => contextItem && dismantleItem(contextItem.id)}
        canEquip={contextItem ? canEquipItem(contextItem) : false}
        canDismantle={contextItem ? canDismantleInventoryItem(contextItem) : false}
      />
    </div>
  )
}
