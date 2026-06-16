'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { characterBaseImage, normalizeGender } from '@/lib/game-assets'
import type { GameCharacter } from '@/lib/characters'
import type { InventoryItem } from '@/lib/inventory'
import {
  BAG_SLOT_COUNT,
  COSMETIC_SLOTS,
  LEFT_EQUIP_SLOTS,
  RIGHT_EQUIP_SLOTS,
  getRarityClass,
  itemIcon,
  itemMatchesEquipSlot,
  type EquipSlotDef,
} from '@/lib/inventory-slots'

type InventoryPanelProps = {
  character: GameCharacter
  initialItems: InventoryItem[]
}

export default function InventoryPanel({ character, initialItems }: InventoryPanelProps) {
  const supabase = createClient()
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const gender = normalizeGender(character.gender)
  const silhouette = characterBaseImage(gender)

  const equippedBySlot = useMemo(() => {
    const map: Record<string, InventoryItem> = {}
    items.forEach((item) => {
      if (item.equipped_slot) map[item.equipped_slot] = item
    })
    return map
  }, [items])

  const bagItems = items.filter((item) => !item.equipped_slot)
  const emptyBagSlots = Math.max(0, BAG_SLOT_COUNT - bagItems.length)

  const selectedItem = items.find((i) => i.id === selectedId)

  function showMsg(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(null), 3000)
  }

  async function equipItem(itemId: string, slotId: string) {
    const item = items.find((i) => i.id === itemId)
    if (!item || !itemMatchesEquipSlot(item.template.slot, slotId)) {
      showMsg('Bu eşya bu slota uygun değil.')
      return
    }

    setBusy(true)
    const previousInSlot = items.find((i) => i.equipped_slot === slotId)

    const { error } = await supabase
      .from('character_items')
      .update({ equipped_slot: slotId })
      .eq('id', itemId)
      .eq('character_id', character.id)

    if (error) {
      showMsg(error.message.includes('equipped_slot')
        ? 'Teçhizat kaydı için veritabanı güncellemesi gerekli (equipped_slot kolonu).'
        : error.message)
      setBusy(false)
      return
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) return { ...i, equipped_slot: slotId }
        if (previousInSlot && i.id === previousInSlot.id) return { ...i, equipped_slot: null }
        if (i.equipped_slot === slotId && i.id !== itemId) return { ...i, equipped_slot: null }
        return i
      })
    )
    setSelectedId(null)
    setActiveSlot(null)
    showMsg(`${item.template.name} kuşanıldı.`)
    setBusy(false)
  }

  async function unequipItem(itemId: string) {
    setBusy(true)
    const { error } = await supabase
      .from('character_items')
      .update({ equipped_slot: null })
      .eq('id', itemId)
      .eq('character_id', character.id)

    if (error) {
      showMsg(error.message)
      setBusy(false)
      return
    }

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, equipped_slot: null } : i))
    )
    setSelectedId(null)
    setBusy(false)
  }

  function handleSlotClick(slotId: string) {
    if (busy) return
    const equipped = equippedBySlot[slotId]

    if (selectedItem) {
      if (itemMatchesEquipSlot(selectedItem.template.slot, slotId)) {
        equipItem(selectedItem.id, slotId)
      } else {
        showMsg('Seçili eşya bu slota uygun değil.')
      }
      return
    }

    if (equipped) {
      unequipItem(equipped.id)
      return
    }

    setActiveSlot(activeSlot === slotId ? null : slotId)
  }

  function handleBagItemClick(item: InventoryItem) {
    if (busy) return
    if (activeSlot) {
      equipItem(item.id, activeSlot)
      return
    }
    setSelectedId(selectedId === item.id ? null : item.id)
  }

  function SlotButton({ slot, compact }: { slot: EquipSlotDef; compact?: boolean }) {
    const equipped = equippedBySlot[slot.id]
    const canAccept =
      selectedItem && itemMatchesEquipSlot(selectedItem.template.slot, slot.id)
    const isActive = activeSlot === slot.id

    return (
      <button
        type="button"
        onClick={() => handleSlotClick(slot.id)}
        disabled={busy}
        className={`rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 ${
          compact ? 'w-11 h-11' : 'w-14 h-14'
        } ${
          equipped
            ? `${getRarityClass(equipped.template.rarity)} shadow-md`
            : canAccept
              ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
              : isActive
                ? 'border-cyan-600 bg-cyan-950/30'
                : 'border-stone-800 bg-stone-950/80 hover:border-amber-700/50'
        }`}
        title={equipped ? `${equipped.template.name} — çıkar` : slot.label}
      >
        {equipped ? (
          <>
            <span className="text-base">{itemIcon(equipped.template.slot)}</span>
            <span className="text-[7px] font-mono truncate w-full px-0.5 leading-tight">
              {equipped.template.name}
            </span>
          </>
        ) : (
          <span className={`font-mono font-bold ${compact ? 'text-[7px]' : 'text-[8px]'} text-stone-500`}>
            {slot.label}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="text-xs font-mono text-amber-200 bg-amber-950/40 border border-amber-900/40 rounded-xl px-3 py-2 animate-slide-up">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-[10px] font-mono">
        <span className="text-stone-600 px-2 py-2">🪙 {Number(character.gold).toLocaleString()} Akçe</span>
        {selectedItem && (
          <span className="text-amber-500 px-2 py-2">
            Seçili: {selectedItem.template.name} — slota dokun
          </span>
        )}
        {activeSlot && !selectedItem && (
          <span className="text-cyan-400 px-2 py-2">Heybeden eşya seç</span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Teçhizat + karakter */}
        <div className="bg-gradient-to-b from-stone-900/40 to-stone-950/60 border border-stone-800 rounded-2xl p-4 min-h-[420px] md:min-h-[520px] relative overflow-hidden">
          <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-3">Teçhizat</p>

          <div className="absolute inset-x-0 top-12 bottom-28 flex items-center justify-center pointer-events-none z-0 px-4">
            <img
              src={silhouette}
              alt={character.name}
              className="max-h-[320px] md:max-h-[400px] object-contain object-bottom drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
            />
          </div>

          <div className="relative z-10 flex flex-col h-full min-h-[380px] md:min-h-[480px]">
            <div className="flex justify-between items-start flex-1 pt-2">
              <div className="flex flex-col gap-2 bg-stone-950/70 backdrop-blur-sm p-2 rounded-xl border border-stone-800/80">
                {LEFT_EQUIP_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} />
                ))}
              </div>
              <div className="flex flex-col gap-2 bg-stone-950/70 backdrop-blur-sm p-2 rounded-xl border border-stone-800/80">
                <span className="text-[8px] font-mono text-stone-600 text-center uppercase">Takı</span>
                {RIGHT_EQUIP_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} compact />
                ))}
              </div>
            </div>

            <div className="mt-4 bg-stone-950/85 backdrop-blur-sm border border-stone-800 rounded-xl p-3">
              <p className="text-[8px] font-mono text-stone-500 text-center uppercase tracking-widest mb-2">
                Premium / Kostüm
              </p>
              <div className="flex justify-center gap-3">
                {COSMETIC_SLOTS.map((slot) => (
                  <SlotButton key={slot.id} slot={slot} compact />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Heybe */}
        <div className="bg-stone-900/30 border border-stone-800 rounded-2xl p-4 min-h-[320px]">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-4">
            <h2 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest">
              Heybe
            </h2>
            <span className="text-[10px] font-mono text-stone-500 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
              {bagItems.length} / {BAG_SLOT_COUNT}
            </span>
          </div>

          <p className="text-[10px] font-mono text-stone-600 mb-3">
            Eşyaya dokun → slota dokun. Kuşanılmış eşyaya dokun → çıkar.
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {bagItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleBagItemClick(item)}
                disabled={busy}
                className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-center text-center transition active:scale-95 ${
                  getRarityClass(item.template.rarity)
                } ${selectedId === item.id ? 'ring-2 ring-amber-500 scale-105' : ''}`}
              >
                <span className="text-lg">{itemIcon(item.template.slot)}</span>
                <span className="text-[8px] font-mono font-bold truncate w-full mt-0.5 leading-tight">
                  {item.template.name}
                </span>
              </button>
            ))}
            {Array.from({ length: emptyBagSlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-xl border border-stone-800/50 bg-stone-950/30"
              />
            ))}
          </div>

          {bagItems.length === 0 && items.length === 0 && (
            <p className="text-center text-stone-600 font-mono text-sm mt-8">
              Heybe boş. Görevlerden ganimet topla.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
