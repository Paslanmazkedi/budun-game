'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { ContentLootSource } from '@/lib/content-loot'
import { LOOT_TABLE_LABELS } from '@/lib/content-loot'
import { grantContentSourceLoot } from '@/lib/reward-grants'

type ContentLootButtonProps = {
  characterId: string
  source: ContentLootSource
  label?: string
  dropRateOverride?: number
  className?: string
}

export default function ContentLootButton({
  characterId,
  source,
  label,
  dropRateOverride,
  className = '',
}: ContentLootButtonProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleGrant() {
    if (busy) return
    setBusy(true)
    setMessage(null)
    const supabase = createClient()
    const result = await grantContentSourceLoot(
      supabase,
      characterId,
      source,
      dropRateOverride
    )
    if (result.granted && result.item) {
      setMessage(`${result.item.emoji} ${result.item.name} heybeye eklendi!`)
    } else if (result.error) {
      setMessage(result.error)
    } else {
      setMessage('Bu sefer ganimet düşmedi.')
    }
    setBusy(false)
  }

  const defaultLabel =
    source === 'world_boss'
      ? 'Katılım ödülü al (test)'
      : `${LOOT_TABLE_LABELS[source]} (test)`

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleGrant}
        disabled={busy}
        className="w-full text-xs font-mono font-bold py-2.5 rounded-xl border border-amber-700/40 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 disabled:opacity-50 transition active:scale-[0.98]"
      >
        {busy ? '...' : label ?? defaultLabel}
      </button>
      {message && (
        <p className="mt-2 text-[10px] font-mono text-amber-200/90 bg-stone-950/60 border border-stone-800 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
    </div>
  )
}
