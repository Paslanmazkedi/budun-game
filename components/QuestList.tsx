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

export default function QuestList({ quests, character }: { quests: Quest[], character: Character }) {
  const [activeQuests, setActiveQuests] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [charData, setCharData] = useState(character)
  const completingRef = useRef<Set<string>>(new Set())

  // Herhangi bir aktif görev var mı kontrolü (Aynı anda tek görev kuralı için)
  const isAnyQuestActive = Object.values(activeQuests).some(remaining => remaining > 0)

  function addNotification(message: string, type: 'success' | 'levelUp' = 'success') {
    const id = Math.random().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const completeQuest = useCallback(async (questId: string) => {
    if (!charData) return
    if (completingRef.current.has(questId)) return

    completingRef.current.add(questId)
    setActiveQuests(prev => {
      const updated = { ...prev }
      delete updated[questId]
      return updated
    })

    const supabase = createClient()
    const quest = quests.find(q => q.id === questId)
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

    if (!logs || logs.length === 0) {
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
          lootMessage = ` ve 🎁 [${loot.item_templates.name}]`
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

    setCharData(prev => prev ? { ...prev, xp: newXp, gold: newGold, level: newLevel } : prev)

    if (leveledUp) {
      addNotification(`🎉 KUTLU OLSUN! Seviye ${newLevel} oldun!`, 'levelUp')
    }
    
    completingRef.current.delete(questId)
    addNotification(`⚔️ ${quest.name} bitti! +${quest.reward_xp} XP, +${quest.reward_gold} Altın${lootMessage} kazandın.`, 'success')

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
        data.forEach(log => {
          const remaining = Math.max(0, new Date(log.ends_at).getTime() - Date.now())
          if (remaining > 0) timers[log.quest_id] = remaining
        })
        setActiveQuests(timers)
      }
    }

    loadActiveQuests()

    const interval = setInterval(() => {
      setActiveQuests(prev => {
        const updated = { ...prev }
        let changed = false
        Object.keys(updated).forEach(k => {
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
      setActiveQuests(prev => ({ ...prev, [quest.id]: quest.duration_seconds * 1000 }))
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
    return `${Math.round(seconds / 60)} dk`
  }

  return (
    <div className="relative w-full">
      
      {/* ─── TOAST BİLDİRİMLERİ ─── */}
      <div className="fixed top-6 right-6 space-y-3 z-50 max-w-sm w-full">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={`px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-in flex flex-col gap-1 transition-all ${
              n.type === 'levelUp' 
                ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200' 
                : 'bg-stone-900/90 border-amber-500/50 text-amber-200'
            }`}
          >
            <div className="text-xs uppercase tracking-widest font-mono font-bold opacity-60">
              {n.type === 'levelUp' ? '▲ KUT REKORU' : '⚔️ SEFER RAPORU'}
            </div>
            <div className="text-sm font-medium">{n.message}</div>
          </div>
        ))}
      </div>

      {/* ─── GÖREV KARTLARI (GRID) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {quests.map(quest => {
          const remaining = activeQuests[quest.id] ?? 0
          const isActive = remaining > 0
          
          // Canlı akan ilerleme çubuğu yüzdesi hesabı
          const totalDurationMs = quest.duration_seconds * 1000
          const progressPercentage = isActive 
            ? Math.max(0, Math.min(100, ((totalDurationMs - remaining) / totalDurationMs) * 100))
            : 0

          return (
            <div 
              key={quest.id} 
              className={`relative bg-stone-900 border rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-md transition-all duration-300 ${
                isActive 
                  ? 'border-cyan-500 bg-stone-900/80 shadow-cyan-950/20 shadow-lg ring-1 ring-cyan-500/20' 
                  : 'border-stone-800/80 hover:border-stone-700/80 hover:shadow-lg'
              }`}
            >
              {/* Kart İçeriği */}
              <div className="relative z-10">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-stone-200 text-base tracking-wide">{quest.name}</h4>
                  <span className="text-xs px-2 py-1 bg-stone-800 text-stone-400 font-mono rounded-md shrink-0 border border-stone-700/50">
                    ⏱️ {formatDuration(quest.duration_seconds)}
                  </span>
                </div>

                {/* Ödüller */}
                <div className="flex gap-4 mt-4 bg-stone-950/40 px-3 py-2 rounded-xl border border-stone-800/40 w-fit">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-cyan-400">✨</span>
                    <span className="text-stone-400">XP:</span>
                    <span className="font-bold text-stone-200 font-mono">+{quest.reward_xp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-amber-500">🪙</span>
                    <span className="text-stone-400">Altın:</span>
                    <span className="font-bold text-amber-500 font-mono">+{quest.reward_gold}</span>
                  </div>
                </div>
              </div>

              {/* Alt Buton / Geri Sayım Alanı */}
              <div className="mt-6 relative z-10 flex items-center justify-between min-h-[44px]">
                {isActive ? (
                  <div className="w-full flex items-center justify-between bg-cyan-950/20 px-4 py-2.5 rounded-xl border border-cyan-500/20">
                    <span className="text-xs text-cyan-400/80 font-medium font-mono animate-pulse tracking-wider">SEFERDE...</span>
                    <span className="text-cyan-400 font-mono text-base font-bold">{formatTime(remaining)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => sendToQuest(quest)}
                    disabled={loading === quest.id || isAnyQuestActive || !charData}
                    className={`w-full font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-md active:scale-[0.98] ${
                      isAnyQuestActive 
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed shadow-none' 
                        : 'bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-50'
                    }`}
                  >
                    {loading === quest.id ? 'Yola Çıkılıyor...' : isAnyQuestActive ? 'Başka Sefer Aktif' : 'Turan Seferine Gönder'}
                  </button>
                )}
              </div>

              {/* ─── ALT PROGRESS BAR (Sadece Aktif Görevde Görünür) ─── */}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-stone-950 border-t border-stone-900 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}