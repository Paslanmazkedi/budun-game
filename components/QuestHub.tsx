'use client'

import { useState } from 'react'
import QuestList from '@/components/QuestList'
import QuestJournal from '@/components/QuestJournal'
import type { QuestRow } from '@/lib/quest-config'
import type { QuestJournalEntry } from '@/lib/quest-log'

type QuestHubProps = {
  quests: QuestRow[]
  character: {
    id: string
    name: string
    class: string
    level: number
    gold: number
    xp: number
  }
  initialJournal?: QuestJournalEntry[]
}

type TabId = 'send' | 'journal'

export default function QuestHub({ quests, character, initialJournal = [] }: QuestHubProps) {
  const [tab, setTab] = useState<TabId>('send')
  const [journalRefresh, setJournalRefresh] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl border border-stone-800 bg-stone-950/60">
        <button
          type="button"
          onClick={() => setTab('send')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition ${
            tab === 'send'
              ? 'bg-amber-600 text-stone-950'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          Sefere Gönder
        </button>
        <button
          type="button"
          onClick={() => setTab('journal')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wide transition ${
            tab === 'journal'
              ? 'bg-stone-800 text-amber-400 border border-stone-700'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          Sefer Defteri
        </button>
      </div>

      {tab === 'send' ? (
        <QuestList
          quests={quests}
          character={character}
          onQuestCompleted={() => {
            setJournalRefresh((k) => k + 1)
          }}
        />
      ) : (
        <QuestJournal
          characterId={character.id}
          initialEntries={initialJournal}
          refreshKey={journalRefresh}
        />
      )}
    </div>
  )
}
