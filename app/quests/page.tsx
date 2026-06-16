import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SceneShell from '@/components/SceneShell'
import QuestHub from '@/components/QuestHub'
import { getActiveCharacterContext } from '@/lib/character-server'
import { SCENE_PRESETS } from '@/lib/game-assets'
import { QUEST_JOURNAL_SELECT, serializeQuestJournalRows, type QuestJournalEntry } from '@/lib/quest-log'

export default async function QuestsPage() {
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
  const { data: questsRaw } = await supabase.from('quests').select('*')

  const quests = [...(questsRaw ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
  )

  if (!user) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Macera">
        <p className="text-stone-500 font-mono text-sm">Giriş yapmalısın.</p>
      </SceneShell>
    )
  }

  const { active: character } = await getActiveCharacterContext(supabase, user.id)

  if (!character) {
    return (
      <SceneShell preset={SCENE_PRESETS.maceraQuests} presetKey="macera-quests" title="Görevler" backHref="/macera" backLabel="Macera">
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
    .limit(40)

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
      .limit(40)
    initialJournal = serializeQuestJournalRows(fallback ?? [])
  }

  return (
    <SceneShell
      preset={SCENE_PRESETS.maceraQuests}
      presetKey="macera-quests"
      title="Bozkır Seferleri"
      subtitle="Görev seç, sefere gönder, ödül topla"
      backHref="/macera"
      backLabel="Macera"
      mainClassName="max-w-5xl"
      headerExtra={
        <div className="text-xs font-mono text-amber-500 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
          🪙 {Number(character.gold).toLocaleString()}
        </div>
      }
    >
      <QuestHub quests={quests} character={character} initialJournal={initialJournal} />
    </SceneShell>
  )
}
