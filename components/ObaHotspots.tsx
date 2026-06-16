'use client'

import { useRouter } from 'next/navigation'
import { OBA_ACTIVITIES } from '@/lib/nav-routes'

export function ObaActivityList({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 gap-2">
      {OBA_ACTIVITIES.map((activity) => (
        <button
          key={activity.href}
          type="button"
          onClick={() => {
            onNavigate?.()
            router.push(activity.href)
          }}
          className="flex items-center gap-3 p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-800/40 transition active:scale-[0.98] text-left group"
        >
          <span className="text-2xl w-10 text-center shrink-0">{activity.icon}</span>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold text-stone-200 block">{activity.label}</span>
            <span className="text-[10px] font-mono text-stone-500">{activity.description}</span>
          </div>
          <span className="text-stone-600 group-hover:text-amber-500/80 text-sm shrink-0">›</span>
        </button>
      ))}
    </div>
  )
}
