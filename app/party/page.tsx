import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import PartyPanel from '@/components/PartyPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function PartyPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraHub} presetKey="party" title="Parti" backHref="/macera" backLabel="Aksiyon">
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)
  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraHub} presetKey="party" title="Parti" backHref="/macera" backLabel="Aksiyon">
        <Link href="/characters" className="text-amber-500 text-sm font-mono">→ Karakter seç</Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraHub}
      presetKey="party"
      title="Parti"
      subtitle="Kur, bul, davet et"
      backHref="/macera"
      backLabel="Aksiyon"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <PartyPanel character={character} />
    </SceneShell>
  )
}
