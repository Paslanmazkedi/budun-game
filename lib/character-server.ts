import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVE_CHARACTER_COOKIE,
  type GameCharacter,
  resolveActiveCharacter,
} from '@/lib/characters'

export async function fetchUserCharacters(
  supabase: SupabaseClient,
  userId: string
): Promise<GameCharacter[]> {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return (data ?? []) as GameCharacter[]
}

export async function getActiveCharacterContext(
  supabase: SupabaseClient,
  userId: string
) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTIVE_CHARACTER_COOKIE)?.value
  const preferredId = raw ? decodeURIComponent(raw) : undefined
  const characters = await fetchUserCharacters(supabase, userId)
  const active = resolveActiveCharacter(characters, preferredId)
  return { characters, active }
}
