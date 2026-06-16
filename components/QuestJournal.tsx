'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import ItemEmoji from '@/components/ItemEmoji'
import { getRarityClass } from '@/lib/item-rarity'
import {
  formatJournalDate,
  formatQuestDuration,
  QUEST_JOURNAL_SELECT,
  serializeQuestJournalRows,
  type QuestJournalEntry,
} from '@/lib/quest-log'

type QuestJournalProps = {
  characterId: string
  initialEntries?: QuestJournalEntry[]
  refreshKey?: number
}

export default function QuestJournal({
  characterId,
  initialEntries = [],
  refreshKey = 0,
}: QuestJournalProps) {
  const [entries, setEntries] = useState<QuestJournalEntry[]>(initialEntries)
  const [loading, setLoading] = useState(!initialEntries.length)
  const [error, setError] = useState<string | null>(null)

  const loadJournal = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('quest_log')
      .select(QUEST_JOURNAL_SELECT)
      .eq('character_id', characterId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(40)

    if (fetchError) {
      // FK hint yoksa item join düşebilir — quests ile tekrar dene
      const fallback = await supabase
        .from('quest_log')
        .select(
          'id, quest_id, status, started_at, ends_at, completed_at, reward_xp_granted, reward_gold_granted, loot_item_template_id, quests(name, difficulty)'
        )
        .eq('character_id', characterId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(40)

      if (fallback.error) {
        setError(fallback.error.message)
        setLoading(false)
        return
      }

      setEntries(serializeQuestJournalRows(fallback.data ?? []))
      setLoading(false)
      return
    }

    setEntries(serializeQuestJournalRows(data ?? []))
    setLoading(false)
  }, [characterId])

  useEffect(() => {
    loadJournal()
  }, [loadJournal, refreshKey])

  const totalXp = entries.reduce((s, e) => s + (e.rewardXp ?? 0), 0)
  const totalGold = entries.reduce((s, e) => s + (e.rewardGold ?? 0), 0)
  const lootCount = entries.filter((e) => e.loot).length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-800 bg-stone-900/40 px-4 py-3">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-2">
          Sefer özeti (son {entries.length} kayıt)
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          <span className="text-cyan-400">+{totalXp} XP</span>
          <span className="text-amber-500">+{totalGold} 🪙</span>
          <span className="text-stone-400">🎁 {lootCount} eşya</span>
        </div>
      </div>

      {loading && (
        <p className="text-center text-stone-500 font-mono text-sm py-8">Sefer defteri yükleniyor...</p>
      )}

      {error && (
        <p className="text-red-300/90 text-xs font-mono bg-red-950/30 border border-red-900/40 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-center text-stone-600 font-mono text-sm py-12">
          Henüz tamamlanan sefer yok. Bir göreve gönderildiğinde ödüller burada görünür.
        </p>
      )}

      {!loading && entries.length > 0 && (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden"
            >
              <div className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl border border-stone-700 bg-stone-950 flex items-center justify-center text-lg shrink-0">
                  📜
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-stone-200 text-sm">{entry.questName}</h4>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${entry.difficultyBadgeClass}`}
                    >
                      {entry.difficultyLabel}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-stone-500 mt-1">
                    {entry.completedAt
                      ? `Dönüş: ${formatJournalDate(entry.completedAt)}`
                      : 'Tamamlandı'}
                    {' · '}
                    Süre: {formatQuestDuration(entry.durationSeconds)}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono">
                    {entry.rewardXp != null && (
                      <span className="text-cyan-400/90">+{entry.rewardXp} XP</span>
                    )}
                    {entry.rewardGold != null && (
                      <span className="text-amber-500/90">+{entry.rewardGold} 🪙</span>
                    )}
                    {!entry.rewardXp && !entry.rewardGold && (
                      <span className="text-stone-600">Ödül kaydı yok (eski sefer)</span>
                    )}
                  </div>

                  {entry.loot && (
                    <div
                      className={`mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2 ${getRarityClass(entry.loot.rarity)}`}
                    >
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                        <ItemEmoji emoji={entry.loot.emoji} rarity={entry.loot.rarity} size="tooltip" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-200 truncate">{entry.loot.name}</p>
                        <p className="text-[9px] font-mono text-stone-500">{entry.loot.rarityLabel}</p>
                      </div>
                    </div>
                  )}

                  {!entry.loot && entry.status === 'completed' && (
                    <p className="text-[10px] font-mono text-stone-600 mt-2">Bu seferde eşya düşmedi.</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
