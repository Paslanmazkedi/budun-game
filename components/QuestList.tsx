'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Quest = {
  id: string
  name: string
  duration_seconds: number
  reward_xp: number
  reward_gold: number
}

type Character = {
  id: string
  name: string
  class: string
  level: number
  gold: number
  xp: number
} | null

type Notification = {
  id: string
  message: string
  type: 'success' | 'levelUp'
}

const QUEST_HINTS: Record<string, string> = {
  default: 'Bozkırda töreyi koru, ganimet ve şan kazan.',
}

function questHint(name: string) {
  const key = name.toLowerCase()
  if (key.includes('av')) return 'Vahşi av peşinde, cesaret ve çeviklik gerekir.'
  if (key.includes('keşif') || key.includes('kesif')) return 'Uzak diyarları keşfet, bilgi ve deneyim getir.'
  if (key.includes('koruma')) return 'Otağı ve yoldaşları koru, kutlu şan kazan.'
  return QUEST_HINTS.default
}

export default function QuestList({ quests, character }: { quests: Quest[]; character: Character }) {
  const [activeQuests, setActiveQuests] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [charData, setCharData] = useState(character)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const completingRef = useRef<Set<string>>(new Set())

  const isAnyQuestActive = Object.values(activeQuests).some((r) => r > 0)
  const activeQuestId = Object.keys(activeQuests).find((id) => activeQuests[id] > 0)
  const activeQuest = activeQuestId ? quests.find((q) => q.id === activeQuestId) : null

  function addNotification(message: string, type: 'success' | 'levelUp' = 'success') {
    const id = Math.random().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }

  const completeQuest = useCallback(async (questId: string) => {
    if (!charData || completingRef.current.has(questId)) return

    completingRef.current.add(questId)
    setActiveQuests((prev) => {
      const updated = { ...prev }
      delete updated[questId]
      return updated
    })

    const supabase = createClient()
    const quest = quests.find((q) => q.id === questId)
    if (!quest) {
      completingRef.current.delete(questId)
      return
    }

    const { data: logs } = await supabase
      .from('quest_log')
      .select('id')
      .eq('character_id', charData.id)
      .eq('quest_id', questId)
      .eq('status', 'active')
      .limit(1)

    if (!logs?.length) {
      completingRef.current.delete(questId)
      return
    }

    await supabase
      .from('quest_log')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', logs[0].id)

    const { data: lootItems } = await supabase
      .from('loot_table_items')
      .select('*, item_templates(*)')
      .eq('loot_table_id', '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea')

    let lootMessage = ''
    if (lootItems) {
      for (const loot of lootItems) {
        const roll = Math.random() * 100
        if (roll <= loot.drop_chance) {
          await supabase.from('character_items').insert({
            character_id: charData.id,
            item_template_id: loot.item_template_id,
          })
          lootMessage = ` · 🎁 ${loot.item_templates.name}`
          break
        }
      }
    }

    const newXp = (charData.xp || 0) + quest.reward_xp
    const newGold = (charData.gold || 0) + quest.reward_gold

    function calcLevel(totalXp: number) {
      let level = 1
      let remaining = totalXp
      while (true) {
        const needed = Math.floor(level * 50 * (1 + level * 0.15))
        if (remaining < needed) break
        remaining -= needed
        level++
        if (level >= 50) break
      }
      return level
    }

    const oldLevel = charData.level
    const newLevel = calcLevel(newXp)
    const leveledUp = newLevel > oldLevel

    await supabase
      .from('characters')
      .update({ xp: newXp, gold: newGold, level: newLevel })
      .eq('id', charData.id)

    setCharData((prev) =>
      prev ? { ...prev, xp: newXp, gold: newGold, level: newLevel } : prev
    )

    if (leveledUp) {
      addNotification(`Kutlu olsun! Seviye ${newLevel}`, 'levelUp')
    }
    addNotification(
      `${quest.name} tamamlandı · +${quest.reward_xp} XP · +${quest.reward_gold} Akçe${lootMessage}`,
      'success'
    )
    completingRef.current.delete(questId)
  }, [charData, quests])

  useEffect(() => {
    if (!charData) return
    const supabase = createClient()

    async function loadActiveQuests() {
      const { data } = await supabase
        .from('quest_log')
        .select('*')
        .eq('character_id', charData!.id)
        .eq('status', 'active')

      if (data) {
        const timers: Record<string, number> = {}
        data.forEach((log) => {
          const remaining = Math.max(0, new Date(log.ends_at).getTime() - Date.now())
          if (remaining > 0) timers[log.quest_id] = remaining
        })
        setActiveQuests(timers)
      }
    }

    loadActiveQuests()
    const interval = setInterval(() => {
      setActiveQuests((prev) => {
        const updated = { ...prev }
        let changed = false
        Object.keys(updated).forEach((k) => {
          if (updated[k] > 0) {
            updated[k] = Math.max(0, updated[k] - 1000)
            changed = true
          }
        })
        return changed ? updated : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [charData])

  useEffect(() => {
    Object.entries(activeQuests).forEach(([questId, remaining]) => {
      if (remaining === 0 && !completingRef.current.has(questId)) {
        completeQuest(questId)
      }
    })
  }, [activeQuests, completeQuest])

  async function sendToQuest(quest: Quest) {
    if (!charData || isAnyQuestActive) return
    setLoading(quest.id)
    const supabase = createClient()
    const now = new Date()
    const endsAt = new Date(now.getTime() + quest.duration_seconds * 1000)

    const { error } = await supabase.from('quest_log').insert({
      character_id: charData.id,
      quest_id: quest.id,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active',
    })

    if (!error) {
      setActiveQuests((prev) => ({ ...prev, [quest.id]: quest.duration_seconds * 1000 }))
      setExpandedId(null)
    }
    setLoading(null)
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function formatDuration(seconds: number) {
    if (seconds < 60) return `${seconds} sn`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m} dk ${s} sn` : `${m} dk`
  }

  return (
    <div className="relative space-y-4">
      <div className="fixed top-16 right-3 z-50 space-y-2 max-w-[min(100%,280px)]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-toast-in text-xs font-mono ${
              n.type === 'levelUp'
                ? 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
                : 'bg-stone-900/95 border-amber-500/40 text-amber-100'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {activeQuest && activeQuests[activeQuest.id] > 0 && (
        <div className="bg-cyan-950/40 border border-cyan-600/40 rounded-2xl p-4 animate-slide-up">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">Aktif Sefer</p>
              <h3 className="font-serif font-bold text-stone-100 mt-0.5">{activeQuest.name}</h3>
            </div>
            <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
              {formatTime(activeQuests[activeQuest.id])}
            </span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-cyan-900/40">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000"
              style={{
                width: `${Math.min(
                  100,
                  ((activeQuest.duration_seconds * 1000 - activeQuests[activeQuest.id]) /
                    (activeQuest.duration_seconds * 1000)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {isAnyQuestActive && !activeQuest && (
        <p className="text-xs font-mono text-stone-500 text-center py-2">
          Bir sefer devam ediyor...
        </p>
      )}

      <div className="space-y-3">
        {quests.map((quest, index) => {
          const remaining = activeQuests[quest.id] ?? 0
          const isActive = remaining > 0
          const isExpanded = expandedId === quest.id
          const progressPct = isActive
            ? Math.min(
                100,
                ((quest.duration_seconds * 1000 - remaining) / (quest.duration_seconds * 1000)) * 100
              )
            : 0

          return (
            <article
              key={quest.id}
              className={`rounded-2xl border overflow-hidden transition-all animate-slide-up ${
                isActive
                  ? 'border-cyan-600/40 bg-cyan-950/20'
                  : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : quest.id)}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                    isActive ? 'border-cyan-600/40 bg-cyan-950/40' : 'border-stone-700 bg-stone-950'
                  }`}
                >
                  📜
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-stone-200 text-sm truncate">{quest.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] font-mono">
                    <span className="text-stone-500">⏱ {formatDuration(quest.duration_seconds)}</span>
                    <span className="text-cyan-400">+{quest.reward_xp} XP</span>
                    <span className="text-amber-500">+{quest.reward_gold} 🪙</span>
                  </div>
                </div>
                <span className="text-stone-600 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-800/60 pt-3 space-y-3">
                  <p className="text-xs text-stone-500 leading-relaxed">{questHint(quest.name)}</p>
                  {isActive ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-cyan-400">
                        <span>Seferde...</span>
                        <span className="font-bold">{formatTime(remaining)}</span>
                      </div>
                      <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendToQuest(quest)}
                      disabled={loading === quest.id || isAnyQuestActive || !charData}
                      className={`w-full font-bold text-sm py-3 rounded-xl transition active:scale-[0.98] ${
                        isAnyQuestActive
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-500 text-stone-950 disabled:opacity-50'
                      }`}
                    >
                      {loading === quest.id
                        ? 'Yola çıkılıyor...'
                        : isAnyQuestActive
                          ? 'Başka sefer aktif'
                          : 'Sefere Gönder'}
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {quests.length === 0 && (
        <p className="text-center text-stone-600 font-mono text-sm py-12">
          Henüz görev tanımlanmamış.
        </p>
      )}
    </div>
  )
}
