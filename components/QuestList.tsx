'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { getCatalogForSource } from '@/lib/content-loot'
import {
  getQuestDifficultyDef,
  isQuestVisibleForCharacter,
  normalizeQuestDifficulty,
  normalizeQuestType,
  QUEST_TYPE_BADGE,
  QUEST_TYPE_LABELS,
  resolveQuestDropRate,
  resolveQuestLootTableId,
  type QuestRow,
} from '@/lib/quest-config'
import {
  calcCharacterLevel,
  grantRandomLoot,
  persistQuestCompletion,
} from '@/lib/reward-grants'

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

type ResultBanner = {
  message: string
  type: 'success' | 'error' | 'levelUp'
}

const QUEST_HINTS: Record<string, string> = {
  default: 'Bozkırda töreyi koru; Yaygın ve Normal eşyalar düşebilir.',
  test: 'Geliştirici test seferi — hızlı ödül ve yüksek düşme şansı.',
}

function questHint(quest: QuestRow) {
  const diff = normalizeQuestDifficulty(quest.difficulty)
  if (diff === 'test') return QUEST_HINTS.test
  const key = quest.name.toLowerCase()
  if (key.includes('av')) return 'Vahşi av peşinde; ganimet şansı orta.'
  if (key.includes('keşif') || key.includes('kesif')) return 'Uzak diyarları keşfet; daha uzun sefer, daha iyi ödül.'
  if (key.includes('koruma')) return 'Otağı koru; zor seferlerde düşme şansı yükselir.'
  return QUEST_HINTS.default
}

export default function QuestList({
  quests,
  character,
  onQuestCompleted,
}: {
  quests: QuestRow[]
  character: Character
  onQuestCompleted?: () => void
}) {
  /** questId → bitiş zamanı (ms) */
  const [questEndsAt, setQuestEndsAt] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [resultBanner, setResultBanner] = useState<ResultBanner | null>(null)
  const [charData, setCharData] = useState(character)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const completingRef = useRef<Set<string>>(new Set())
  const questsRef = useRef(quests)
  const charDataRef = useRef(charData)
  const completionTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  questsRef.current = quests
  charDataRef.current = charData

  const sortedQuests = [...quests]
    .filter((q) => isQuestVisibleForCharacter(q, charData?.level ?? character?.level ?? 1))
    .sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
    )

  function getRemaining(questId: string) {
    const ends = questEndsAt[questId]
    if (!ends) return 0
    return Math.max(0, ends - Date.now())
  }

  const isAnyQuestActive = Object.keys(questEndsAt).some((id) => getRemaining(id) > 0)
  const activeQuestId = Object.keys(questEndsAt).find((id) => getRemaining(id) > 0)
  const activeQuest = activeQuestId ? sortedQuests.find((q) => q.id === activeQuestId) : null

  function addNotification(message: string, type: 'success' | 'levelUp' = 'success') {
    const id = Math.random().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 6000)
  }

  function showResult(message: string, type: ResultBanner['type'] = 'success') {
    setResultBanner({ message, type })
    addNotification(message, type === 'levelUp' ? 'levelUp' : 'success')
  }

  function clearQuestTimer(questId: string) {
    const t = completionTimersRef.current[questId]
    if (t) {
      clearTimeout(t)
      delete completionTimersRef.current[questId]
    }
  }

  function scheduleCompletion(questId: string, delayMs: number) {
    clearQuestTimer(questId)
    const ms = Math.max(0, delayMs)
    completionTimersRef.current[questId] = setTimeout(() => {
      delete completionTimersRef.current[questId]
      completeQuest(questId)
    }, ms)
  }

  async function completeQuest(questId: string) {
    const char = charDataRef.current
    if (!char || completingRef.current.has(questId)) return

    completingRef.current.add(questId)
    clearQuestTimer(questId)
    setQuestEndsAt((prev) => {
      const next = { ...prev }
      delete next[questId]
      return next
    })

    const supabase = createClient()
    const questList = [...questsRef.current].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
    )
    const quest = questList.find((q) => q.id === questId)

    try {
      if (!quest) {
        showResult('Görev tanımı bulunamadı. seed-quests.sql çalıştırın.', 'error')
        return
      }

      const { data: logs, error: logSelectError } = await supabase
        .from('quest_log')
        .select('id')
        .eq('character_id', char.id)
        .eq('quest_id', questId)
        .eq('status', 'active')
        .limit(1)

      if (logSelectError) {
        showResult(`Görev kaydı okunamadı: ${logSelectError.message}`, 'error')
        return
      }

      if (!logs?.length) {
        showResult('Aktif görev kaydı bulunamadı (zaten tamamlanmış olabilir).', 'error')
        return
      }

      const questLogId = logs[0].id
      const dropRate = resolveQuestDropRate(quest)
      const lootTableId = resolveQuestLootTableId(quest)
      const questCatalog = getCatalogForSource('quest')

      const lootResult = await grantRandomLoot(supabase, char.id, {
        lootTableId,
        dropRatePercent: dropRate,
        catalog: questCatalog,
      })

      const newXp = (char.xp || 0) + quest.reward_xp
      const newGold = (char.gold || 0) + quest.reward_gold
      const oldLevel = char.level ?? 1
      const newLevel = calcCharacterLevel(newXp)
      const leveledUp = newLevel > oldLevel

      await persistQuestCompletion(supabase, {
        characterId: char.id,
        questLogId,
        rewardXp: quest.reward_xp,
        rewardGold: quest.reward_gold,
        lootTableId,
        itemDropRate: dropRate,
        newXp,
        newGold,
        newLevel,
        lootItemTemplateId: lootResult.item?.id ?? null,
      })

      setCharData((prev) =>
        prev ? { ...prev, xp: newXp, gold: newGold, level: newLevel } : prev
      )

      const lootMessage = lootResult.item
        ? ` · ${lootResult.item.emoji} ${lootResult.item.name}`
        : lootResult.error
          ? ` · (eşya: ${lootResult.error})`
          : ''

      if (leveledUp) {
        showResult(`Kutlu olsun! Seviye ${newLevel}`, 'levelUp')
      }
      showResult(
        `${quest.name} tamamlandı · +${quest.reward_xp} XP · +${quest.reward_gold} Akçe${lootMessage}`,
        'success'
      )
      onQuestCompleted?.()
    } catch (err) {
      console.error('[QuestList] completeQuest failed:', err)
      showResult(
        err instanceof Error ? err.message : 'Görev ödülü kaydedilemedi.',
        'error'
      )
    } finally {
      completingRef.current.delete(questId)
    }
  }

  useEffect(() => {
    return () => {
      Object.values(completionTimersRef.current).forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (!charData) return
    const supabase = createClient()

    async function loadActiveQuests() {
      const { data, error } = await supabase
        .from('quest_log')
        .select('*')
        .eq('character_id', charData!.id)
        .eq('status', 'active')

      if (error) {
        showResult(`Aktif görevler yüklenemedi: ${error.message}`, 'error')
        return
      }

      if (!data?.length) return

      const endsMap: Record<string, number> = {}
      data.forEach((log) => {
        const ends = new Date(log.ends_at).getTime()
        endsMap[log.quest_id] = ends
        scheduleCompletion(log.quest_id, ends - Date.now())
      })
      setQuestEndsAt(endsMap)
    }

    loadActiveQuests()
  }, [charData?.id])

  useEffect(() => {
    const hasRunning = Object.keys(questEndsAt).some((id) => getRemaining(id) > 0)
    if (!hasRunning) return
    const interval = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(interval)
  }, [questEndsAt, tick])

  async function sendToQuest(quest: QuestRow) {
    if (!charData || isAnyQuestActive) return

    const questType = normalizeQuestType(quest.quest_type)
    if (questType === 'farm' && quest.party_size_required) {
      const supabase = createClient()
      const { data: membership } = await supabase
        .from('party_members')
        .select('party_id')
        .eq('character_id', charData.id)
        .maybeSingle()

      if (!membership) {
        showResult('Farm görevi için önce parti kur (Macera → Parti).', 'error')
        return
      }

      const { count } = await supabase
        .from('party_members')
        .select('*', { count: 'exact', head: true })
        .eq('party_id', membership.party_id)

      if ((count ?? 0) < quest.party_size_required) {
        showResult(
          `Bu alan için en az ${quest.party_size_required} kişilik parti gerekir (şu an ${count ?? 0}).`,
          'error'
        )
        return
      }
    }

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
      const endsMs = endsAt.getTime()
      setQuestEndsAt((prev) => ({ ...prev, [quest.id]: endsMs }))
      scheduleCompletion(quest.id, quest.duration_seconds * 1000)
      setExpandedId(null)
      setResultBanner(null)
    } else {
      showResult(`Göreve başlanamadı: ${error.message}`, 'error')
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
      <div className="rounded-xl border border-stone-800 bg-stone-900/40 px-4 py-3 text-[11px] font-mono text-stone-500 leading-relaxed">
        <p className="text-stone-400 mb-1">Ganimet kaynakları</p>
        <p>📜 Görev → Yaygın / Normal · ⚔️ Zindan → Nadir · 🐺 Grup zindan → Nadir / Üstün · 🐉 Haftalık boss → Eşsiz</p>
      </div>

      {resultBanner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-mono animate-slide-up ${
            resultBanner.type === 'levelUp'
              ? 'bg-cyan-950/50 border-cyan-600/50 text-cyan-200'
              : resultBanner.type === 'error'
                ? 'bg-red-950/40 border-red-800/50 text-red-200'
                : 'bg-amber-950/40 border-amber-700/50 text-amber-100'
          }`}
        >
          {resultBanner.message}
        </div>
      )}

      <div className="fixed top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-[min(100%,320px)] z-[110] space-y-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-toast-in text-xs font-mono pointer-events-auto ${
              n.type === 'levelUp'
                ? 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
                : 'bg-stone-900/95 border-amber-500/40 text-amber-100'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {activeQuest && getRemaining(activeQuest.id) > 0 && (
        <div className="bg-cyan-950/40 border border-cyan-600/40 rounded-2xl p-4 animate-slide-up">
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <p className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider">Aktif Sefer</p>
              <h3 className="font-serif font-bold text-stone-100 mt-0.5">{activeQuest.name}</h3>
            </div>
            <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
              {formatTime(getRemaining(activeQuest.id))}
            </span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden border border-cyan-900/40">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  ((activeQuest.duration_seconds * 1000 - getRemaining(activeQuest.id)) /
                    (activeQuest.duration_seconds * 1000)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedQuests.map((quest, index) => {
          const remaining = getRemaining(quest.id)
          const isActive = remaining > 0
          const isExpanded = expandedId === quest.id
          const diff = getQuestDifficultyDef(quest.difficulty)
          const questType = normalizeQuestType(quest.quest_type)
          const dropRate = resolveQuestDropRate(quest)
          const progressPct = isActive
            ? Math.min(
                100,
                ((quest.duration_seconds * 1000 - remaining) / (quest.duration_seconds * 1000)) * 100
              )
            : 0

          if (quest.is_active === false) return null

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
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-stone-200 text-sm truncate">{quest.name}</h4>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${diff.badgeClass}`}
                    >
                      {diff.label}
                    </span>
                    {questType !== 'standard' && (
                      <span
                        className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${QUEST_TYPE_BADGE[questType]}`}
                      >
                        {QUEST_TYPE_LABELS[questType]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] font-mono">
                    <span className="text-stone-500">⏱ {formatDuration(quest.duration_seconds)}</span>
                    <span className="text-cyan-400">+{quest.reward_xp} XP</span>
                    <span className="text-amber-500">+{quest.reward_gold} 🪙</span>
                    <span className="text-stone-500">🎁 {dropRate}%</span>
                  </div>
                </div>
                <span className="text-stone-600 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-stone-800/60 pt-3 space-y-3">
                  {quest.description && (
                    <p className="text-xs text-stone-400 leading-relaxed">{quest.description}</p>
                  )}
                  <p className="text-xs text-stone-500 leading-relaxed">{questHint(quest)}</p>
                  {isActive ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono text-cyan-400">
                        <span>Seferde...</span>
                        <span className="font-bold">{formatTime(remaining)}</span>
                      </div>
                      <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-300"
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

      {sortedQuests.length === 0 && (
        <p className="text-center text-stone-600 font-mono text-sm py-12">
          Henüz görev tanımlanmamış. Supabase&apos;de seed-quests.sql çalıştırın.
        </p>
      )}
    </div>
  )
}
