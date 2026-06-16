import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import CharacterSheet from '@/components/CharacterSheet'
import { getActiveCharacterContext } from '@/lib/character-server'

export default async function CharacterPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  return <CharacterSheet character={character} />
}
