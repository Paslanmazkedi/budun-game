'use client'

import QuestList from '@/components/QuestList'
import type { QuestRow } from '@/lib/quest-config'

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
}

export default function QuestHub({ quests, character }: QuestHubProps) {
  return <QuestList quests={quests} character={character} />
}
