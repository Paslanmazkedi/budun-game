'use client'

import { useRouter } from 'next/navigation'
import { OBA_ACTIVITIES } from '@/lib/nav-routes'

type ObaHotspot = {
  id: string
  href: string
  icon: string
  label: string
  className: string
}

const HOTSPOTS: ObaHotspot[] = [
  {
    id: 'craft',
    href: '/oba/craft',
    icon: '🔨',
    label: 'Demirci',
    className: 'left-[8%] top-[42%] md:left-[14%] md:top-[38%]',
  },
  {
    id: 'iksir',
    href: '/oba/iksir',
    icon: '🧪',
    label: 'İksir',
    className: 'right-[6%] top-[38%] md:right-[12%] md:top-[34%]',
  },
  {
    id: 'klan',
    href: '/oba/klan',
    icon: '🏛️',
    label: 'Klan',
    className: 'left-[42%] top-[22%] md:left-[46%] md:top-[20%]',
  },
]

export default function ObaHotspots() {
  const router = useRouter()

  return (
    <div className="absolute inset-0 z-[25] pointer-events-none">
      {HOTSPOTS.map((spot) => (
        <button
          key={spot.id}
          type="button"
          onClick={() => router.push(spot.href)}
          className={`absolute pointer-events-auto flex flex-col items-center gap-1 p-2 md:p-3 rounded-2xl border border-stone-700/60 bg-stone-950/70 backdrop-blur-sm hover:border-amber-600/50 hover:bg-stone-950/90 transition-all active:scale-95 shadow-lg ${spot.className}`}
          aria-label={spot.label}
        >
          <span className="text-2xl md:text-3xl drop-shadow-md">{spot.icon}</span>
          <span className="text-[8px] md:text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider">
            {spot.label}
          </span>
        </button>
      ))}
    </div>
  )
}

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
          className="flex items-center gap-3 p-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-800/40 transition active:scale-[0.98] text-left"
        >
          <span className="text-xl">{activity.icon}</span>
          <div>
            <span className="text-xs font-bold text-stone-300 block">{activity.label}</span>
            <span className="text-[10px] font-mono text-stone-500">{activity.description}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
