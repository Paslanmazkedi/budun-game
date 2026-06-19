import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import QuestJournal from '@/components/QuestJournal'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'
import { QUEST_JOURNAL_SELECT, serializeQuestJournalRows, type QuestJournalEntry } from '@/lib/quest-log'

export default async function SeferDefteriPage() {
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
    return (
      <SceneShell
        preset={SCENE_PRESETS.maceraQuests}
        presetKey="sefer-defteri"
        title="Cenk Defteri"
        subtitle="Tamamlanan seferler ve ödüller"
      >
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <SceneShell
        preset={SCENE_PRESETS.maceraQuests}
        presetKey="sefer-defteri"
        title="Cenk Defteri"
        subtitle="Tamamlanan seferler ve ödüller"
      >
        <p className="text-stone-500 font-mono text-sm mb-4">Önce bir karakter oluşturmalısın.</p>
        <Link href="/characters" className="text-amber-500 hover:text-amber-400 text-sm font-mono">
          → Karakter seç
        </Link>
      </SceneShell>
    )
  }

  let initialJournal: QuestJournalEntry[] = []

  const { data: journalRaw, error: journalError } = await supabase
    .from('quest_log')
    .select(QUEST_JOURNAL_SELECT)
    .eq('character_id', character.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  if (!journalError && journalRaw) {
    initialJournal = serializeQuestJournalRows(journalRaw)
  } else {
    const { data: fallback } = await supabase
      .from('quest_log')
      .select(
        'id, quest_id, status, started_at, ends_at, completed_at, reward_xp_granted, reward_gold_granted, loot_item_template_id, quests(name, difficulty)'
      )
      .eq('character_id', character.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50)

    initialJournal = serializeQuestJournalRows(fallback ?? [])
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraQuests}
      presetKey="sefer-defteri"
      title="Cenk Defteri"
      subtitle="Tamamlanan seferler — satıra dokun, detayı genişlet"
      mainClassName="max-w-lg lg:max-w-none"
    >
      <QuestJournal
        characterId={character.id}
        initialEntries={initialJournal}
        variant="accordion"
      />
    </SceneShell>
  )
}
