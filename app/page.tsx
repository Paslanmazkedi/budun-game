'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import OtagHudClient from '@/components/OtagHudClient'
import OtagSideMenuTrigger from '@/components/OtagSideMenuTrigger'
import ObaTopHud from '@/components/ObaTopHud'
import CharacterWithMount from '@/components/CharacterWithMount'
import GameNav from '@/components/GameNav'
import GameChatDock from '@/components/GameChatDock'
import { OTAG_BACKGROUND } from '@/lib/game-assets'
import {
  resolveActiveCharacter,
  type GameCharacter,
} from '@/lib/characters'
import {
  getActiveCharacterId,
  syncActiveCharacterId,
} from '@/lib/active-character-client'
import { aggregateEquipmentBonuses, EMPTY_EQUIPMENT_BONUSES, type EquipmentBonuses } from '@/lib/equipment-stats'
import { serializeInventoryItems } from '@/lib/inventory'
import {
  EQUIPMENT_CHANGED_EVENT,
  fetchEquippedMountSlug,
} from '@/lib/equipped-mount'

export default function DashboardHome() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [character, setCharacter] = useState<GameCharacter | null>(null)
  const [mountSlug, setMountSlug] = useState<string | null>(null)
  const [equipmentBonuses, setEquipmentBonuses] = useState<EquipmentBonuses>(EMPTY_EQUIPMENT_BONUSES)
  const [loading, setLoading] = useState(true)
  const [obaPanelOpen, setObaPanelOpen] = useState(false)

  const refreshMount = useCallback(
    async (characterId: string) => {
      const slug = await fetchEquippedMountSlug(supabase, characterId)
      setMountSlug(slug)
    },
    [supabase]
  )

  useEffect(() => {
    async function loadCharacters() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error || !data?.length) {
        router.push('/characters')
        return
      }

      const chars = data as GameCharacter[]
      const preferredId = getActiveCharacterId()
      const active = resolveActiveCharacter(chars, preferredId)
      if (active) {
        if (!preferredId || preferredId !== active.id) {
          await syncActiveCharacterId(active.id)
        }
        setCharacter(active)

        const { data: equippedRows } = await supabase
          .from('character_items')
          .select('id, equipped_slot, item_templates(name, rarity, slot, slug)')
          .eq('character_id', active.id)
          .not('equipped_slot', 'is', null)

        setEquipmentBonuses(
          aggregateEquipmentBonuses(serializeInventoryItems(equippedRows ?? []))
        )

        await refreshMount(active.id)
      }

      setLoading(false)
    }
    loadCharacters()
  }, [supabase, router, pathname, refreshMount])

  useEffect(() => {
    if (!character?.id) return
    const characterId = character.id

    function onEquipmentChanged() {
      void refreshMount(characterId)
    }

    window.addEventListener(EQUIPMENT_CHANGED_EVENT, onEquipmentChanged)
    return () => window.removeEventListener(EQUIPMENT_CHANGED_EVENT, onEquipmentChanged)
  }, [character?.id, refreshMount])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center animate-page-enter">
        <div className="text-stone-500 font-mono text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Otağ hazırlanıyor...
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="p-8 text-stone-500 font-mono bg-stone-950 min-h-screen">
        Karakter bulunamadı.
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full bg-stone-950 text-stone-100 overflow-hidden animate-page-enter">
      <div className="absolute inset-0 z-0 pointer-events-none bg-stone-950">
        <img
          src={OTAG_BACKGROUND}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950/95" />
      </div>

      <div className="absolute inset-x-0 bottom-[var(--nav-height)] h-[54vh] max-h-[540px] md:h-[52vh] md:max-h-[520px] z-10 w-full pointer-events-none select-none">
        <CharacterWithMount
          gender={character.gender}
          characterName={character.name}
          mountSlug={mountSlug}
          variant="hero"
          className="w-full h-full"
        />
      </div>

      <ObaTopHud character={character} equipmentBonuses={equipmentBonuses} />

      {!obaPanelOpen && <OtagSideMenuTrigger onOpen={() => setObaPanelOpen(true)} />}

      <OtagHudClient
        character={character}
        isOpen={obaPanelOpen}
        onClose={() => setObaPanelOpen(false)}
      />

      <GameNav />
      <GameChatDock />
    </div>
  )
}
