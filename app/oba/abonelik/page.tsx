import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import SubscriptionPanel from '@/components/premium/SubscriptionPanel'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'

export default async function ObaAbonelikPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.obaKlan}
        presetKey="oba-abonelik"
        title="Kut Paketleri"
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
        presetKey="oba-abonelik"
        title="Kut Paketleri"
        backHref="/"
        backLabel="Oba"
        showCharacterSwitcher={false}
      >
        <Link href="/characters" className="text-amber-500 text-sm font-mono">
          → Karakter seç
        </Link>
      </SceneShell>
    )
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.obaKlan}
      presetKey="oba-abonelik"
      title="Kut Paketleri"
      subtitle="Abonelik ve premium haklar"
      backHref="/"
      backLabel="Oba"
      mainClassName="max-w-3xl lg:max-w-4xl"
      showCharacterSwitcher={false}
    >
      <SubscriptionPanel />
    </SceneShell>
  )
}
