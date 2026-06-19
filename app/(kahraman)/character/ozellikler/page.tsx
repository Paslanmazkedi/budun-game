import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import CharacterOzellikler from '@/components/CharacterOzellikler'
import {
  fetchCharacterEquipmentBonuses,
  getActiveCharacterContext,
} from '@/lib/character-server'

export default async function CharacterOzelliklerPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <div>
        <p className="text-stone-500 font-mono text-sm mb-4">Önce bir karakter oluşturmalısın.</p>
        <Link href="/characters" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
          → Karakter seç
        </Link>
      </div>
    )
  }

  const equipmentBonuses = await fetchCharacterEquipmentBonuses(supabase, character.id)

  return <CharacterOzellikler character={character} equipmentBonuses={equipmentBonuses} />
}
