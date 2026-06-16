'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import OtagHudClient from '@/components/OtagHudClient'
import OtagSideMenuTrigger from '@/components/OtagSideMenuTrigger'
import ObaTopHud from '@/components/ObaTopHud'
import GameNav from '@/components/GameNav'
import GameChatDock from '@/components/GameChatDock'
import {
  characterBaseImage,
  normalizeGender,
  OTAG_BACKGROUND,
  MOUNT_YUND,
} from '@/lib/game-assets'
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

  const silhouettePath = characterBaseImage(normalizeGender(character.gender))

  return (
    <div className="relative h-[100dvh] w-full bg-stone-950 text-stone-100 overflow-hidden animate-page-enter">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src={OTAG_BACKGROUND} alt="" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950/95" />
      </div>

      <div className="absolute inset-x-0 bottom-[var(--nav-height)] h-[52vh] max-h-[480px] z-10 w-full pointer-events-none select-none">
        <div className="hidden md:flex relative w-full h-full max-w-5xl mx-auto items-end justify-center">
          <div className="absolute left-[46%] bottom-0 w-[42%] h-[88%] z-0">
            <Image src={MOUNT_YUND} alt="" fill unoptimized className="object-contain object-bottom drop-shadow-[0_20px_35px_rgba(0,0,0,0.95)]" />
          </div>
          <div className="absolute left-[18%] bottom-0 w-[42%] h-full z-10">
            <img src={silhouettePath} alt={character.name} className="h-full w-full object-contain object-bottom drop-shadow-[0_25px_40px_rgba(0,0,0,1)]" />
          </div>
        </div>
        <div className="relative w-full h-full flex items-end md:hidden">
          <div className="absolute right-[-10px] bottom-0 w-[68%] h-[84%] z-0">
            <Image src={MOUNT_YUND} alt="" fill unoptimized className="object-contain object-bottom drop-shadow-[0_25px_30px_rgba(0,0,0,0.95)]" />
          </div>
          <div className="absolute left-[-40px] bottom-0 w-[68%] h-full z-10">
            <img src={silhouettePath} alt={character.name} className="h-full w-full object-contain object-left-bottom drop-shadow-[0_30px_35px_rgba(0,0,0,1)]" />
          </div>
        </div>
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
