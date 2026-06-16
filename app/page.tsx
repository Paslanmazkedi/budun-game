'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  setActiveCharacterId,
} from '@/lib/active-character-client'

export default function DashboardHome() {
  const supabase = createClient()
  const router = useRouter()
  const [character, setCharacter] = useState<GameCharacter | null>(null)
  const [mountSlug, setMountSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [obaPanelOpen, setObaPanelOpen] = useState(false)

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
          setActiveCharacterId(active.id)
        }
        setCharacter(active)

        const { data: mountRow } = await supabase
          .from('character_items')
          .select('item_templates(slug)')
          .eq('character_id', active.id)
          .eq('equipped_slot', 'mount')
          .maybeSingle()

        const tpl = mountRow?.item_templates as { slug?: string } | { slug?: string }[] | null
        const slug = Array.isArray(tpl) ? tpl[0]?.slug : tpl?.slug
        setMountSlug(slug ?? null)
      }

      setLoading(false)
    }
    loadCharacters()
  }, [supabase, router])

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

      <ObaTopHud character={character} />

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
