'use client'

import { useState } from 'react'
import {
  CLAN_MEDAL_CATALOG,
  CLAN_SCORE_PERIOD_LABELS,
  clanMedalProgress,
  getEarnedMedals,
  isClanMedalEarned,
  type ClanLeaderboardRow,
  type ClanRow,
  type ClanScorePeriod,
  type ClanScoreTotals,
} from '@/lib/clans'

type ClanOverviewSectionProps = {
  clan: ClanRow
  achievementTotals: ClanScoreTotals
  achievementRank: number | null
  leaderboard: ClanLeaderboardRow[]
  scorePeriod: ClanScorePeriod
  onScorePeriodChange: (p: ClanScorePeriod) => void
}

type ScoreTab = 'basarimlar' | 'siralama'

export default function ClanOverviewSection({
  clan,
  achievementTotals,
  achievementRank,
  leaderboard,
  scorePeriod,
  onScorePeriodChange,
}: ClanOverviewSectionProps) {
  const [scoreTab, setScoreTab] = useState<ScoreTab>('basarimlar')

  const earnedMedals = getEarnedMedals(achievementTotals, achievementRank)
  const lockedMedals = CLAN_MEDAL_CATALOG.filter(
    (m) => !isClanMedalEarned(m, achievementTotals, achievementRank)
  )

  return (
    <div className="rounded-xl border border-stone-800 overflow-hidden">
      <div className="flex border-b border-stone-800 bg-stone-900/40">
        <button
          type="button"
          onClick={() => setScoreTab('basarimlar')}
          className={`flex-1 py-2.5 text-[10px] font-mono font-bold transition ${
            scoreTab === 'basarimlar'
              ? 'text-amber-300 bg-amber-950/30 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          Başarımlar
        </button>
        <button
          type="button"
          onClick={() => setScoreTab('siralama')}
          className={`flex-1 py-2.5 text-[10px] font-mono font-bold transition ${
            scoreTab === 'siralama'
              ? 'text-cyan-300 bg-cyan-950/20 border-b-2 border-cyan-600'
              : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          Sıralamalar
        </button>
      </div>

      {scoreTab === 'basarimlar' ? (
        <div className="p-4 space-y-5">
          <div>
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-3">
              Kazanılan başarımlar · {earnedMedals.length}
            </p>
            {earnedMedals.length === 0 ? (
              <p className="text-xs font-mono text-stone-500 text-center py-6 border border-dashed border-stone-800 rounded-xl">
                Henüz başarım yok — puan toplayarak madalya kazan.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {earnedMedals.map((medal) => (
                  <div
                    key={medal.id}
                    className="flex items-center gap-3 rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 shadow-[0_0_12px_rgba(245,158,11,0.06)]"
                  >
                    <span className="text-3xl shrink-0">{medal.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-serif font-bold text-stone-200 truncate">
                        {medal.label}
                      </p>
                      <p className="text-[9px] font-mono text-stone-500">{medal.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {lockedMedals.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-3">
                Devam eden · {lockedMedals.length}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {lockedMedals.map((medal) => {
                  const progress = clanMedalProgress(medal, achievementTotals, achievementRank)
                  return (
                    <div
                      key={medal.id}
                      className="rounded-xl border border-stone-800 bg-stone-950/40 p-2 text-center opacity-70"
                    >
                      <span className="text-2xl block grayscale">{medal.icon}</span>
                      <p className="text-[9px] font-mono text-stone-400 mt-1 leading-tight truncate">
                        {medal.label}
                      </p>
                      <p className="text-[8px] font-mono text-stone-600 mt-0.5">{progress}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end gap-1 px-3 py-2 border-b border-stone-800/80">
            {(['weekly', 'monthly', 'all'] as ClanScorePeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onScorePeriodChange(p)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                  scorePeriod === p
                    ? 'bg-stone-800 text-stone-200'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {CLAN_SCORE_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="p-3">
            <p className="text-[9px] font-mono text-stone-600 uppercase tracking-widest mb-2 px-1">
              Top 10 · {CLAN_SCORE_PERIOD_LABELS[scorePeriod]}
            </p>
            {leaderboard.length === 0 ? (
              <p className="text-xs font-mono text-stone-500 text-center py-8">Henüz veri yok.</p>
            ) : (
              <ul className="space-y-2">
                {leaderboard.map((row) => (
                  <li
                    key={row.clan_id}
                    className={`rounded-xl border px-3 py-2.5 ${
                      row.clan_id === clan.id
                        ? 'border-amber-800/50 bg-amber-950/20'
                        : 'border-stone-800 bg-stone-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className={`w-7 text-center font-bold shrink-0 ${
                          row.rank <= 3 ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      >
                        #{row.rank}
                      </span>
                      <span className="text-2xl shrink-0">{row.emblem}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-stone-200 block truncate font-bold">
                          {row.clan_name}
                        </span>
                        <span className="text-[9px] text-stone-600">
                          Sv.{row.level} · {row.member_count} üye
                        </span>
                      </div>
                      <span className="text-amber-400/90 tabular-nums shrink-0 font-bold">
                        {row.honor_pts.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {row.earned_medal_icons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pl-9">
                        {row.earned_medal_icons.map((icon, i) => (
                          <span
                            key={`${row.clan_id}-${i}`}
                            className="text-base leading-none"
                            title="Kazanılan madalya"
                          >
                            {icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
