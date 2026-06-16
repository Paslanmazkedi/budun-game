'use client'

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Börü Khan', clan: 'Ötüken Muhafızları', emblem: '🏕️', power: 2840 },
  { rank: 2, name: 'Ayşe Hatun', clan: 'Gök Börüler', emblem: '🐺', power: 2650 },
  { rank: 3, name: 'Temür Alp', clan: 'Kızıl Yay', emblem: '⚔️', power: 2410 },
  { rank: 4, name: 'Kaya Er', clan: 'Yaylak Boyu', emblem: '🦅', power: 2280 },
  { rank: 5, name: 'Selcan', clan: 'Ordu Birliği', emblem: '🛡️', power: 2155 },
]

export default function LeaderboardPreview() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
        Genel kudret sıralaması
      </p>

      <div className="space-y-2">
        {MOCK_LEADERBOARD.map((row) => (
          <div
            key={row.rank}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              row.rank === 1
                ? 'border-amber-700/40 bg-amber-950/20'
                : 'border-stone-800 bg-stone-900/40'
            }`}
          >
            <span
              className={`text-sm font-mono font-bold w-6 ${
                row.rank <= 3 ? 'text-amber-400' : 'text-stone-600'
              }`}
            >
              {row.rank}
            </span>
            <span className="text-xl w-8 text-center">{row.emblem}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-stone-200 truncate">{row.name}</p>
              <p className="text-[10px] font-mono text-stone-500 truncate">{row.clan}</p>
            </div>
            <span className="text-xs font-mono text-amber-500 font-bold shrink-0">{row.power}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-stone-600 text-center pt-2">
        Canlı sıralama ve mevsim ödülleri yakında
      </p>
    </div>
  )
}
