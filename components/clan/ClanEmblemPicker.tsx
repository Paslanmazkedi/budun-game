'use client'

import {
  CLAN_EMBLEM_TIER_LABELS,
  emblemsForClanLevel,
  type ClanEmblemTier,
} from '@/lib/clans'

type ClanEmblemPickerProps = {
  clanLevel: number
  value: string
  onChange: (emoji: string) => void
  disabled?: boolean
}

const TIER_ORDER: ClanEmblemTier[] = ['basic', 'standard', 'premium', 'animated']

export default function ClanEmblemPicker({
  clanLevel,
  value,
  onChange,
  disabled,
}: ClanEmblemPickerProps) {
  const available = emblemsForClanLevel(clanLevel)
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: available.filter((e) => e.tier === tier),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-3">
      {grouped.map(({ tier, items }) => (
        <div key={tier}>
          <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest mb-1.5">
            {CLAN_EMBLEM_TIER_LABELS[tier]}
            {tier === 'animated' && (
              <span className="text-amber-600/80 normal-case tracking-normal ml-1">
                · GIF totem (yakında)
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(opt.emoji)}
                title={`${opt.label} · sv.${opt.minClanLevel}+`}
                className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl transition-all active:scale-95 ${
                  value === opt.emoji
                    ? 'border-amber-500 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'border-stone-700 bg-stone-950 hover:border-stone-500'
                } ${opt.animated ? 'animate-pulse' : ''}`}
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
      {clanLevel < 10 && (
        <p className="text-[9px] font-mono text-stone-600">
          Boy seviyesi yükseldikçe daha kaliteli ve hareketli totemler açılır.
        </p>
      )}
    </div>
  )
}
