import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import AccountPanel from '@/components/AccountPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function ObaHesapPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.obaKlan}
        presetKey="oba-hesap"
        title="Hesap"
        backHref="/"
        backLabel="Oba"
        showCharacterSwitcher={false}
      >
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)
  if (!character) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.obaKlan}
        presetKey="oba-hesap"
        title="Hesap"
        backHref="/"
        backLabel="Oba"
        showCharacterSwitcher={false}
      >
        <Link href="/characters" className="text-amber-500 text-sm font-mono">→ Karakter seç</Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.obaKlan}
      presetKey="oba-hesap"
      title="Hesap"
      subtitle="Karakter, davet, kupon ve çıkış"
      backHref="/"
      backLabel="Oba"
      mainClassName="max-w-lg lg:max-w-none"
      showCharacterSwitcher={false}
    >
      <AccountPanel character={character} />
    </SceneShell>
  )
}
