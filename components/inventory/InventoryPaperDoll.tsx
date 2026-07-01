import type { ReactNode } from 'react'
import CharacterWithMount from '@/components/CharacterWithMount'
import {
  ALL_EQUIP_SLOTS,
  type EquipSlotDef,
} from '@/lib/inventory-slots'

/** Sol kolon — silah / zırh / destek / kozmetik */
const FLANK_LEFT_SLOT_IDS = [
  'weapon',
  'armor_set',
  'offhand',
  'mount',
  'cloak',
  'costume',
] as const

/** Sağ kolon — takılar */
const FLANK_RIGHT_SLOT_IDS = [
  'amulet',
  'earring1',
  'earring2',
  'ring1',
  'ring2',
  'belt',
] as const

type InventoryPaperDollProps = {
  gender: string
  characterName: string
  renderSlot: (slot: EquipSlotDef) => ReactNode
}

function flankSlots(ids: readonly string[]): EquipSlotDef[] {
  const byId = Object.fromEntries(ALL_EQUIP_SLOTS.map((s) => [s.id, s]))
  return ids.map((id) => byId[id]).filter(Boolean) as EquipSlotDef[]
}

export default function InventoryPaperDoll({
  gender,
  characterName,
  renderSlot,
}: InventoryPaperDollProps) {
  const leftSlots = flankSlots(FLANK_LEFT_SLOT_IDS)
  const rightSlots = flankSlots(FLANK_RIGHT_SLOT_IDS)

  return (
    <div className="inventory-flank-doll">
      <div className="inventory-flank-col inventory-flank-col--left">
        {leftSlots.map((slot) => (
          <div key={slot.id} className="inventory-flank-slot">
            {renderSlot(slot)}
          </div>
        ))}
      </div>

      <div className="inventory-flank-char">
        <div className="inventory-flank-char-glow" aria-hidden />
        <CharacterWithMount
          gender={gender}
          characterName={characterName}
          variant="inventory"
          className="w-full h-full"
        />
      </div>

      <div className="inventory-flank-col inventory-flank-col--right">
        {rightSlots.map((slot) => (
          <div key={slot.id} className="inventory-flank-slot">
            {renderSlot(slot)}
          </div>
        ))}
      </div>
    </div>
  )
}
