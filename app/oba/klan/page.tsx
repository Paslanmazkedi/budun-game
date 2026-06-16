import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import ClanPanel from '@/components/ClanPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function ObaKlanPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.obaKlan} presetKey="oba-klan" title="Boy / Klan" showCharacterSwitcher={false}>
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)
  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.obaKlan} presetKey="oba-klan" title="Boy / Klan" showCharacterSwitcher={false}>
        <Link href="/characters" className="text-amber-500 text-sm font-mono">→ Karakter seç</Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.obaKlan}
      presetKey="oba-klan"
      title="Boy / Klan"
      showCharacterSwitcher={false}
      mainClassName="max-w-lg lg:max-w-none"
    >
      <ClanPanel character={character} />
    </SceneShell>
  )
}
