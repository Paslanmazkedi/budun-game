import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import FriendsPanel from '@/components/FriendsPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function ObaArkadasPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.obaKlan} presetKey="oba-arkadas" title="Arkadaşlar" backHref="/" backLabel="Oba">
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)
  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.obaKlan} presetKey="oba-arkadas" title="Arkadaşlar" backHref="/" backLabel="Oba">
        <Link href="/characters" className="text-amber-500 text-sm font-mono">→ Karakter seç</Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.obaKlan}
      presetKey="oba-arkadas"
      title="Arkadaşlar"
      subtitle="Ekle, kabul et — parti davetleri için"
      backHref="/"
      backLabel="Oba"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <FriendsPanel character={character} />
    </SceneShell>
  )
}
