'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { getCatalogForSource } from '@/lib/content-loot'
import { ALL_PHASE1_ITEMS } from '@/lib/item-catalog'
import { getFarmZone } from '@/lib/farm-zones'
import {
  getQuestDifficultyDef,
  isTestQuest,
  normalizeQuestType,
  QUEST_TYPE_BADGE,
  QUEST_TYPE_LABELS,
  resolveQuestDropRate,
  resolveQuestLootTableId,
  type QuestRow,
} from '@/lib/quest-config'
import {
  filterSectionsByTab,
  getQuestLockReason,
  getQuestProgressFlavor,
  groupQuestsIntoSections,
  QUEST_FILTER_LABELS,
  type QuestFilterId,
  type QuestSection,
} from '@/lib/quest-display'
import {
  calcCharacterLevel,
  grantRandomCatalogLoot,
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

type Notification = { id: string; message: string; type: 'success' | 'levelUp' }
type ResultBanner = { message: string; type: 'success' | 'error' | 'levelUp' }

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

function sectionAccent(sectionId: QuestSection['id']) {
  switch (sectionId) {
    case 'test':
      return 'border-fuchsia-500/50 bg-fuchsia-950/15'
    case 'bonus':
      return 'border-amber-700/40 bg-amber-950/10'
    case 'farm':
      return 'border-emerald-700/40 bg-emerald-950/10'
    case 'locked':
      return 'border-stone-800 bg-stone-950/30'
    default:
      return 'border-stone-800 bg-stone-900/30'
  }
}

function QuestCard({
  quest,
  isTest,
  locked,
  lockReason,
  isActive,
  isExpanded,
  isAnyQuestActive,
  loading,
  remaining,
  charData,
  onToggle,
  onStart,
}: {
  quest: QuestRow
  isTest: boolean
  locked: boolean
  lockReason: string | null
  isActive: boolean
  isExpanded: boolean
  isAnyQuestActive: boolean
  loading: boolean
  remaining: number
  charData: Character
  onToggle: () => void
  onStart: () => void
}) {
  const diff = getQuestDifficultyDef(quest.difficulty)
  const questType = normalizeQuestType(quest.quest_type)
  const dropRate = resolveQuestDropRate(quest)
  const zone = quest.farm_zone_id ? getFarmZone(quest.farm_zone_id) : null
  const progressPct = isActive
    ? Math.min(
        100,
        ((quest.duration_seconds * 1000 - remaining) / (quest.duration_seconds * 1000)) * 100
      )
    : 0

  return (
    <article
      className={`rounded-xl border overflow-hidden transition-all ${
        isTest
          ? 'border-2 border-dashed border-fuchsia-500/60 bg-fuchsia-950/25 shadow-[0_0_24px_rgba(217,70,239,0.08)]'
          : locked
            ? 'border-stone-800/80 bg-stone-950/40 opacity-70'
            : isActive
              ? 'border-cyan-600/40 bg-cyan-950/20'
              : 'border-stone-800 bg-stone-900/50 hover:border-stone-700'
      }`}
    >
      <button
        type="button"
        onClick={() => !locked && onToggle()}
        disabled={locked}
        className="w-full text-left p-3.5 flex items-start gap-3"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border ${
            isTest
              ? 'border-fuchsia-500/50 bg-fuchsia-950/50'
              : isActive
                ? 'border-cyan-600/40 bg-cyan-950/40'
                : 'border-stone-700 bg-stone-950'
          }`}
        >
          {isTest ? '🧪' : questType === 'farm' ? zone?.icon ?? '🌲' : '📜'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className={`font-bold text-sm truncate ${locked ? 'text-stone-500' : 'text-stone-200'}`}>
              {quest.name}
            </h4>
            {isTest && (
              <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border border-fuchsia-500/60 bg-fuchsia-950/60 text-fuchsia-300">
                DEV
              </span>
            )}
            {!isTest && (
              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${diff.badgeClass}`}>
                {diff.label}
              </span>
            )}
            {questType !== 'standard' && !isTest && (
              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${QUEST_TYPE_BADGE[questType]}`}>
                {QUEST_TYPE_LABELS[questType]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px] font-mono text-stone-500">
            <span>⏱ {formatDuration(quest.duration_seconds)}</span>
            <span className="text-cyan-400/90">+{quest.reward_xp} XP</span>
            <span className="text-amber-500/90">+{quest.reward_gold} 🪙</span>
            <span>🎁 {dropRate}%</span>
            {zone && <span>{zone.icon} {zone.name}</span>}
          </div>

          {locked && lockReason && (
            <p className="text-[10px] text-stone-600 mt-1">🔒 {lockReason}</p>
          )}

          {isActive && (
            <p className="text-[10px] text-cyan-400/90 mt-1.5 leading-snug">
              {getQuestProgressFlavor(quest, progressPct)} ({Math.round(progressPct)}%)
            </p>
          )}
        </div>

        {!locked && (
          <span className="text-stone-600 text-[10px] shrink-0 pt-1">{isExpanded ? '▲' : '▼'}</span>
        )}
      </button>

      {isExpanded && !locked && (
        <div className="px-3.5 pb-3.5 border-t border-stone-800/60 pt-2.5 space-y-2.5">
          {quest.description && (
            <p className="text-[11px] text-stone-400 leading-relaxed">{quest.description}</p>
          )}
          {isTest && (
            <p className="text-[10px] font-mono text-fuchsia-300/80 leading-relaxed">
              Sandbox: tüm eşya kataloğundan rastgele drop (test sonrası kaldırılacak).
            </p>
          )}
          {isActive ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-cyan-400">
                <span>Seferde</span>
                <span className="font-bold tabular-nums">{formatTime(remaining)}</span>
              </div>
              <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isTest ? 'bg-fuchsia-500' : 'bg-cyan-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStart}
              disabled={loading || isAnyQuestActive || !charData}
              className={`w-full font-bold text-xs py-2.5 rounded-lg transition active:scale-[0.98] ${
                isTest
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-50'
                  : isAnyQuestActive
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-500 text-stone-950 disabled:opacity-50'
              }`}
            >
              {loading ? 'Yola çıkılıyor...' : isAnyQuestActive ? 'Başka sefer aktif' : 'Sefere Gönder'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function QuestSectionBlock({
  section,
  characterLevel,
  questEndsAt,
  expandedId,
  setExpandedId,
  loading,
  isAnyQuestActive,
  charData,
  onStart,
  getRemaining,
}: {
  section: QuestSection
  characterLevel: number
  questEndsAt: Record<string, number>
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  loading: string | null
  isAnyQuestActive: boolean
  charData: Character
  onStart: (quest: QuestRow) => void
  getRemaining: (id: string) => number
}) {
  const [open, setOpen] = useState(section.defaultOpen)
  const isTestSection = section.id === 'test'

  if (!section.quests.length) return null

  return (
    <section className={`rounded-2xl border ${sectionAccent(section.id)} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <h3
            className={`text-sm font-serif font-bold ${
              isTestSection ? 'text-fuchsia-300' : 'text-stone-200'
            }`}
          >
            {section.title}
            <span className="ml-2 text-[10px] font-mono text-stone-500">({section.quests.length})</span>
          </h3>
          <p className="text-[10px] text-stone-500 mt-0.5">{section.subtitle}</p>
        </div>
        <span className="text-stone-600 text-xs shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {section.quests.map((quest) => {
            const remaining = getRemaining(quest.id)
            const isActive = remaining > 0
            const locked = section.id === 'locked'
            return (
              <QuestCard
                key={quest.id}
                quest={quest}
                isTest={isTestQuest(quest)}
                locked={locked}
                lockReason={getQuestLockReason(quest, characterLevel)}
                isActive={isActive}
                isExpanded={isTestSection || expandedId === quest.id || isActive}
                isAnyQuestActive={isAnyQuestActive}
                loading={loading === quest.id}
                remaining={remaining}
                charData={charData}
                onToggle={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                onStart={() => onStart(quest)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

function QuestListInner({
  quests,
  character,
  onQuestCompleted,
}: {
  quests: QuestRow[]
  character: Character
  onQuestCompleted?: () => void
}) {
  const searchParams = useSearchParams()
  const farmFilter = searchParams.get('farm')

  const [questEndsAt, setQuestEndsAt] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [resultBanner, setResultBanner] = useState<ResultBanner | null>(null)
  const [charData, setCharData] = useState(character)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<QuestFilterId>(farmFilter ? 'farm' : 'all')
  const [, setTick] = useState(0)

  const completingRef = useRef<Set<string>>(new Set())
  const questsRef = useRef(quests)
  const charDataRef = useRef(charData)
  const completionTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  questsRef.current = quests
  charDataRef.current = charData

  const characterLevel = charData?.level ?? character?.level ?? 1
  const visibleQuests = quests.filter((q) => q.is_active !== false)
  const sections = filterSectionsByTab(
    groupQuestsIntoSections(visibleQuests, characterLevel, farmFilter),
    filterTab
  )

  function getRemaining(questId: string) {
    const ends = questEndsAt[questId]
    if (!ends) return 0
    return Math.max(0, ends - Date.now())
  }

  const isAnyQuestActive = Object.keys(questEndsAt).some((id) => getRemaining(id) > 0)
  const activeQuestId = Object.keys(questEndsAt).find((id) => getRemaining(id) > 0)
  const activeQuest = activeQuestId ? visibleQuests.find((q) => q.id === activeQuestId) : null

  function addNotification(message: string, type: 'success' | 'levelUp' = 'success') {
    const id = Math.random().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 6000)
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
    completionTimersRef.current[questId] = setTimeout(() => {
      delete completionTimersRef.current[questId]
      completeQuest(questId)
    }, Math.max(0, delayMs))
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
    const quest = questsRef.current.find((q) => q.id === questId)

    try {
      if (!quest) {
        showResult('Görev tanımı bulunamadı.', 'error')
        return
      }

      const { data: logs, error: logSelectError } = await supabase
        .from('quest_log')
        .select('id')
        .eq('character_id', char.id)
        .eq('quest_id', questId)
        .eq('status', 'active')
        .limit(1)

      if (logSelectError || !logs?.length) {
        showResult('Aktif görev kaydı bulunamadı.', 'error')
        return
      }

      const dropRate = resolveQuestDropRate(quest)
      const lootTableId = resolveQuestLootTableId(quest)

      const lootResult = isTestQuest(quest)
        ? await grantRandomCatalogLoot(supabase, char.id, {
            catalog: ALL_PHASE1_ITEMS,
            dropRatePercent: dropRate,
          })
        : await grantRandomLoot(supabase, char.id, {
            lootTableId,
            dropRatePercent: dropRate,
            catalog: getCatalogForSource('quest'),
          })

      const newXp = (char.xp || 0) + quest.reward_xp
      const newGold = (char.gold || 0) + quest.reward_gold
      const oldLevel = char.level ?? 1
      const newLevel = calcCharacterLevel(newXp)
      const leveledUp = newLevel > oldLevel

      await persistQuestCompletion(supabase, {
        characterId: char.id,
        questLogId: logs[0].id,
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
          ? ` · (${lootResult.error})`
          : ''

      if (leveledUp) showResult(`Kutlu olsun! Seviye ${newLevel}`, 'levelUp')
      showResult(
        `${quest.name} tamamlandı · +${quest.reward_xp} XP · +${quest.reward_gold} Akçe${lootMessage}`,
        'success'
      )
      onQuestCompleted?.()
    } catch (err) {
      showResult(err instanceof Error ? err.message : 'Görev ödülü kaydedilemedi.', 'error')
    } finally {
      completingRef.current.delete(questId)
    }
  }

  useEffect(() => {
    return () => Object.values(completionTimersRef.current).forEach(clearTimeout)
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

      if (error || !data?.length) return

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
    if (!Object.keys(questEndsAt).some((id) => getRemaining(id) > 0)) return
    const interval = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(interval)
  }, [questEndsAt])

  async function sendToQuest(quest: QuestRow) {
    if (!charData || isAnyQuestActive) return
    if (getQuestLockReason(quest, characterLevel)) return

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
          `En az ${quest.party_size_required} kişilik parti gerekir (şu an ${count ?? 0}).`,
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
      setQuestEndsAt((prev) => ({ ...prev, [quest.id]: endsAt.getTime() }))
      scheduleCompletion(quest.id, quest.duration_seconds * 1000)
      setExpandedId(quest.id)
      setResultBanner(null)
    } else {
      showResult(`Göreve başlanamadı: ${error.message}`, 'error')
    }
    setLoading(null)
  }

  const activeRemaining = activeQuest ? getRemaining(activeQuest.id) : 0
  const activeProgress =
    activeQuest && activeRemaining > 0
      ? Math.min(
          100,
          ((activeQuest.duration_seconds * 1000 - activeRemaining) /
            (activeQuest.duration_seconds * 1000)) *
            100
        )
      : 0

  return (
    <div className="relative space-y-4">
      {/* Mimari özeti — kısa */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/40 px-4 py-3 text-[10px] font-mono text-stone-500 leading-relaxed space-y-1">
        <p className="text-stone-400 text-[11px]">Sefer mantığı</p>
        <p>
          <span className="text-stone-400">Sefer</span> = idle zaman ·{' '}
          <span className="text-emerald-500/90">Farm</span> = harita + parti kasması ·{' '}
          <span className="text-amber-500/90">Bonus</span> = sınırlı süre
        </p>
        <p className="text-stone-600">
          İleride: aktif savaşta &quot;X yok etti / % ilerleme&quot; — şimdilik zaman çubuğu + sefer metni.
        </p>
      </div>

      {farmFilter && (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-[10px] font-mono text-emerald-400">
          Harita filtresi: {getFarmZone(farmFilter)?.name ?? farmFilter}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(QUEST_FILTER_LABELS) as QuestFilterId[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition ${
              filterTab === tab
                ? 'border-amber-600/60 bg-amber-950/40 text-amber-300'
                : 'border-stone-800 text-stone-500 hover:border-stone-700'
            }`}
          >
            {QUEST_FILTER_LABELS[tab]}
          </button>
        ))}
      </div>

      {resultBanner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-mono ${
            resultBanner.type === 'error'
              ? 'bg-red-950/40 border-red-800/50 text-red-200'
              : resultBanner.type === 'levelUp'
                ? 'bg-cyan-950/50 border-cyan-600/50 text-cyan-200'
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
            className={`px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-mono pointer-events-auto ${
              n.type === 'levelUp'
                ? 'bg-cyan-950/95 border-cyan-500/50 text-cyan-200'
                : 'bg-stone-900/95 border-amber-500/40 text-amber-100'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>

      {activeQuest && activeRemaining > 0 && (
        <div
          className={`rounded-2xl border p-4 ${
            isTestQuest(activeQuest)
              ? 'border-fuchsia-500/50 bg-fuchsia-950/30'
              : 'border-cyan-600/40 bg-cyan-950/30'
          }`}
        >
          <div className="flex justify-between items-start gap-3 mb-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80">
                Aktif Sefer
              </p>
              <h3 className="font-serif font-bold text-stone-100">{activeQuest.name}</h3>
              <p className="text-[10px] text-stone-400 mt-1 leading-snug">
                {getQuestProgressFlavor(activeQuest, activeProgress)}
              </p>
            </div>
            <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
              {formatTime(activeRemaining)}
            </span>
          </div>
          <div className="h-2 bg-stone-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isTestQuest(activeQuest)
                  ? 'bg-gradient-to-r from-fuchsia-700 to-fuchsia-400'
                  : 'bg-gradient-to-r from-cyan-700 to-cyan-400'
              }`}
              style={{ width: `${activeProgress}%` }}
            />
          </div>
          <p className="text-[9px] font-mono text-stone-500 mt-1.5 text-right">
            {Math.round(activeProgress)}%
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section) => (
          <QuestSectionBlock
            key={section.id}
            section={section}
            characterLevel={characterLevel}
            questEndsAt={questEndsAt}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            loading={loading}
            isAnyQuestActive={isAnyQuestActive}
            charData={charData}
            onStart={sendToQuest}
            getRemaining={getRemaining}
          />
        ))}
      </div>

      {sections.every((s) => s.quests.length === 0) && (
        <p className="text-center text-stone-600 font-mono text-sm py-12">
          Bu filtrede görev yok. seed-quests.sql çalıştırın veya filtreyi değiştirin.
        </p>
      )}
    </div>
  )
}

export default function QuestList(props: {
  quests: QuestRow[]
  character: Character
  onQuestCompleted?: () => void
}) {
  return (
    <Suspense
      fallback={
        <p className="text-stone-600 font-mono text-sm py-8 text-center">Görevler yükleniyor...</p>
      }
    >
      <QuestListInner {...props} />
    </Suspense>
  )
}
