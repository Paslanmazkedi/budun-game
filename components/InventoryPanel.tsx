'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import CharacterWithMount from '@/components/CharacterWithMount'
import { normalizeGender } from '@/lib/game-assets'
import type { GameCharacter } from '@/lib/characters'
import type { InventoryItem } from '@/lib/inventory'
import { serializeInventoryItems } from '@/lib/inventory'
import ItemContextMenu, { type ContextMenuState } from '@/components/inventory/ItemContextMenu'
import ItemTooltipPopup, { type TooltipAnchorRect } from '@/components/inventory/ItemTooltipPopup'
import {
  BAG_DEFINITIONS,
  BAG_SLOT_COUNT,
  DEFAULT_BAG_ID,
  countBagItems,
  getBagUnlockLevel,
  getUnlockedBagIdsFromLevel,
  isBagUnlocked,
  normalizeBagId,
  type BagId,
} from '@/lib/inventory-bags'
import {
  COSMETIC_SLOTS,
  LEFT_EQUIP_SLOTS,
  RIGHT_EQUIP_SLOTS,
  getRarityClass,
  itemMatchesEquipSlot,
  findEmptyEquipSlotId,
  getMatchingEquipSlotIds,
  normalizeEquippedSlotId,
  equippedSlotDbValues,
  type EquipSlotDef,
} from '@/lib/inventory-slots'
import { resolveItemEmoji, resolveItemIconUrl } from '@/lib/item-display'
import ItemEmoji from '@/components/ItemEmoji'
import { dismantleInventoryItem } from '@/lib/market-api'
import { canDismantleItem, isMaterialSlot } from '@/lib/market-trade'

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
  const [activeBag, setActiveBag] = useState<BagId>(DEFAULT_BAG_ID)
  const [bagUnlockLevel, setBagUnlockLevel] = useState(getBagUnlockLevel(character))
  const [gold, setGold] = useState(Number(character.gold))
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [dropBagId, setDropBagId] = useState<BagId | null>(null)
  const [dropSlotId, setDropSlotId] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  const gender = normalizeGender(character.gender)
  const unlockedBagIds = getUnlockedBagIdsFromLevel(bagUnlockLevel)
  const charCtx = { ...character, bag_unlock_level: bagUnlockLevel }

  const equippedBySlot = useMemo(() => {
    const map: Record<string, InventoryItem> = {}
    items.forEach((item) => {
      if (item.equipped_slot) {
        const slotId = normalizeEquippedSlotId(item.equipped_slot)
        if (slotId) map[slotId] = item
      }
    })
    return map
  }, [items])

  const bagItemsInActive = useMemo(
    () =>
      items.filter(
        (item) => !item.equipped_slot && normalizeBagId(item.bag_id) === activeBag
      ),
    [items, activeBag]
  )

  const totalBagItems = items.filter((item) => !item.equipped_slot).length
  const totalCapacity = bagUnlockLevel * BAG_SLOT_COUNT
  const emptyBagSlots = Math.max(0, BAG_SLOT_COUNT - bagItemsInActive.length)

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
    setBusy(false)
    return true
  }

  async function unequipItem(itemId: string) {
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
    setBusy(false)
    return true
  }

  async function moveItemToBag(itemId: string, targetBag: BagId) {
    const item = items.find((i) => i.id === itemId)
    if (!item) return false

    if (!isBagUnlocked(charCtx, targetBag)) {
      showMsg('Bu çanta kilitli.')
      return false
    }

    const current = normalizeBagId(item.bag_id)
    if (current === targetBag && !item.equipped_slot) {
      setActiveBag(targetBag)
      return true
    }

    if (!item.equipped_slot && countBagItems(items, targetBag) >= BAG_SLOT_COUNT) {
      showMsg('Hedef çanta dolu (30/30).')
      return false
    }

    setBusy(true)
    const payload: { bag_id: BagId; equipped_slot?: null } = { bag_id: targetBag }
    if (item.equipped_slot) payload.equipped_slot = null

    const { data, error } = await supabase
      .from('character_items')
      .update(payload)
      .eq('id', itemId)
      .eq('character_id', character.id)
      .select('id, bag_id, equipped_slot')
      .maybeSingle()

    if (error) {
      showMsg(
        error.message.includes('bag_id')
          ? 'Çanta transferi için bag_id kolonu gerekli.'
          : error.message
      )
      setBusy(false)
      return false
    }

    if (!data || normalizeBagId(data.bag_id) !== targetBag) {
      showMsg('Çanta taşıma kaydedilemedi. rls-character-items.sql dosyasını çalıştırın.')
      setBusy(false)
      return false
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, bag_id: targetBag, equipped_slot: item.equipped_slot ? null : i.equipped_slot }
          : i
      )
    )
    setActiveBag(targetBag)
    setContextMenu(null)
    showMsg(`${BAG_DEFINITIONS.find((b) => b.id === targetBag)?.label} çantasına taşındı.`)
    setBusy(false)
    return true
  }

  async function unlockBag(bagId: BagId) {
    const def = BAG_DEFINITIONS.find((b) => b.id === bagId)
    if (!def || !def.unlockGold) return

    if (bagUnlockLevel >= def.unlockLevel) {
      setActiveBag(bagId)
      return
    }

    if (gold < def.unlockGold) {
      showMsg(`Yeterli akçe yok (${def.unlockGold} gerekli).`)
      return
    }

    setBusy(true)
    const newGold = gold - def.unlockGold
    const { error } = await supabase
      .from('characters')
      .update({ bag_unlock_level: def.unlockLevel, gold: newGold })
      .eq('id', character.id)

    if (error) {
      showMsg(error.message)
      setBusy(false)
      return
    }

    setBagUnlockLevel(def.unlockLevel)
    setGold(newGold)
    setActiveBag(bagId)
    showMsg(`${def.label} açıldı!`)
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

  function handleSlotDoubleClick(slotId: string) {
    const equipped = equippedBySlot[slotId]
    if (!equipped || busy) return
    closeItemTooltip()
    unequipItem(equipped.id)
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

  function SlotButton({ slot, compact }: { slot: EquipSlotDef; compact?: boolean }) {
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
        onDoubleClick={() => handleSlotDoubleClick(slot.id)}
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
        className={`relative rounded-xl border flex items-center justify-center transition-all active:scale-95 shrink-0 overflow-hidden ${
          compact ? 'w-12 h-12 lg:w-14 lg:h-14' : 'w-12 h-12 lg:w-14 lg:h-14'
        } ${
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
          />
        ) : (
          <span className="font-mono font-bold text-[7px] lg:text-[8px] text-stone-500">
            {slot.label}
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
        <span className="text-stone-500 px-2 py-1">
          Heybe {totalBagItems}/{totalCapacity}
        </span>
        <span className="text-stone-600 px-2 py-1 hidden sm:inline">
          {selectMode
            ? 'Çoklu seçim: parçalanabilir eşyalara tıkla'
            : 'Tık = bilgi · çift tık = kuşan · sağ tık = menü'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,520px)_1fr] gap-5 lg:gap-6 items-start">
        {/* Teçhizat — slotlar karakterin iki yanında */}
        <div className="bg-gradient-to-b from-stone-900/50 to-stone-950/80 border border-stone-800 rounded-2xl p-4 lg:p-5 xl:sticky xl:top-2">
          <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-3">Teçhizat</p>

          <div className="mx-auto max-w-[520px]">
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4">
              <div className="flex flex-col gap-2 bg-stone-950/80 p-2 rounded-xl border border-stone-800/80 shrink-0">
                {LEFT_EQUIP_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} />
                ))}
              </div>

              <div className="flex-1 min-w-0 flex justify-center items-end self-stretch py-1 sm:py-2">
                <CharacterWithMount
                  gender={gender}
                  characterName={character.name}
                  variant="inventory"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2 bg-stone-950/80 p-2 rounded-xl border border-stone-800/80 shrink-0">
                <span className="text-[8px] font-mono text-stone-600 text-center uppercase tracking-wide">
                  Takı
                </span>
                {RIGHT_EQUIP_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} compact />
                ))}
              </div>
            </div>

            <div className="mt-4 bg-amber-950/15 border border-amber-800/35 rounded-xl p-3">
              <p className="text-[9px] lg:text-[10px] font-mono text-amber-600/90 text-center uppercase tracking-widest mb-2">
                Premium · Kostüm
              </p>
              <div className="flex justify-center gap-2 lg:gap-3">
                {COSMETIC_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} compact />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Heybe */}
        <div className="bg-stone-900/30 border border-stone-800 rounded-2xl p-4 lg:p-6 min-h-[320px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-800 pb-3 mb-4">
            <h2 className="text-sm lg:text-base font-mono font-bold text-stone-300 uppercase tracking-widest">
              Heybe
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
                {bagItemsInActive.length} / {BAG_SLOT_COUNT}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {BAG_DEFINITIONS.map((bag) => {
              const unlocked = bag.unlockLevel <= bagUnlockLevel
              const isActive = activeBag === bag.id
              const isDrop = dropBagId === bag.id
              return (
                <button
                  key={bag.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (unlocked) setActiveBag(bag.id)
                    else unlockBag(bag.id)
                  }}
                  onDragOver={(e) => {
                    if (!dragItemId || !unlocked) return
                    e.preventDefault()
                    setDropBagId(bag.id)
                  }}
                  onDragLeave={() => setDropBagId((id) => (id === bag.id ? null : id))}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDropBagId(null)
                    if (dragItemId) moveItemToBag(dragItemId, bag.id)
                    setDragItemId(null)
                  }}
                  className={`flex-1 min-w-0 py-3 px-2 rounded-xl border text-xs font-mono uppercase tracking-wide transition ${
                    isDrop && unlocked
                      ? 'border-cyan-500 bg-cyan-950/40 ring-2 ring-cyan-500/30'
                      : isActive && unlocked
                        ? 'border-amber-600/50 bg-amber-950/40 text-amber-400'
                        : unlocked
                          ? 'border-stone-700 bg-stone-900/50 text-stone-400 hover:text-stone-200'
                          : 'border-stone-800 bg-stone-950/50 text-stone-600 hover:border-amber-800/40'
                  }`}
                >
                  <span className="block text-xl lg:text-2xl">{unlocked ? bag.icon : '🔒'}</span>
                  <span className="block truncate mt-1">{bag.label}</span>
                  {!unlocked && bag.unlockGold && (
                    <span className="block text-[10px] text-amber-600/80 mt-0.5">
                      {bag.unlockGold} 🪙
                    </span>
                  )}
                  {unlocked && dragItemId && (
                    <span className="block text-[9px] text-cyan-500/80 mt-0.5 normal-case">
                      bırak = taşı
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {bagItemsInActive.length > BAG_SLOT_COUNT && (
            <p className="text-xs font-mono text-amber-500/90 bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2 mb-3">
              Çanta dolu ({bagItemsInActive.length}/{BAG_SLOT_COUNT}). Başka çantaya taşıyın.
            </p>
          )}

          {!isBagUnlocked(charCtx, activeBag) ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-stone-700 bg-stone-950/40">
              <p className="text-stone-500 font-mono text-sm mb-2">Bu çanta kilitli.</p>
              <button
                type="button"
                onClick={() => unlockBag(activeBag)}
                className="text-sm font-mono text-amber-500 hover:text-amber-400"
              >
                Satın almak için dokun
              </button>
            </div>
          ) : (
            <div className="max-h-[min(420px,55vh)] lg:max-h-[min(480px,60vh)] overflow-y-auto game-scroll pr-1">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-6 gap-2 lg:gap-2.5 @container/bag">
                {bagItemsInActive.map((item) => {
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
                      setDropBagId(null)
                      setDropSlotId(null)
                    }}
                    className={`relative aspect-square min-h-[56px] sm:min-h-[64px] lg:min-h-[76px] rounded-xl border p-0 overflow-hidden transition select-none touch-manipulation [container-type:size] ${
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
                    />
                    {(item.quantity ?? 1) > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 min-w-[1.25rem] px-1 py-0.5 rounded-md bg-stone-950/90 border border-stone-700 text-[9px] font-mono font-bold text-amber-400 leading-none">
                        {item.quantity}
                      </span>
                    )}
                  </button>
                  )
                })}
                {Array.from({ length: emptyBagSlots }).map((_, i) => (
                  <div
                    key={`empty-${activeBag}-${i}`}
                    className="aspect-square min-h-[56px] sm:min-h-[64px] lg:min-h-[76px] rounded-xl border border-stone-800/50 bg-stone-950/30"
                  />
                ))}
              </div>
            </div>
          )}

          {bagItemsInActive.length === 0 && items.length === 0 && (
            <p className="text-center text-stone-600 font-mono text-sm mt-8">
              Heybe boş. Görevlerden ganimet topla.
            </p>
          )}
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
        onMoveToBag={(bagId) => contextItem && moveItemToBag(contextItem.id, bagId)}
        onDismantle={() => contextItem && dismantleItem(contextItem.id)}
        unlockedBagIds={unlockedBagIds}
        currentBagId={
          contextItem
            ? normalizeBagId(contextItem.bag_id ?? activeBag)
            : activeBag
        }
        canEquip={contextItem ? canEquipItem(contextItem) : false}
        canDismantle={contextItem ? canDismantleInventoryItem(contextItem) : false}
      />
    </div>
  )
}
