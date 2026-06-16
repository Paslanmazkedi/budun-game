'use client'

import type { ScenePreset } from '@/lib/game-assets'

type SceneBackgroundProps = {
  preset: ScenePreset
  presetKey?: string
  className?: string
}

export default function SceneBackground({ preset, presetKey, className = '' }: SceneBackgroundProps) {
  const key = presetKey ?? preset.background

  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {/* CSS zemin — asset yoksa veya yüklenmeden önce */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950"
        style={{
          backgroundImage: presetKey
            ? undefined
            : 'radial-gradient(ellipse at 50% 20%, rgba(120,53,15,0.15), transparent 60%)',
        }}
      />
      <img
        src={preset.background}
        alt=""
        className={`absolute inset-0 w-full h-full ${preset.backgroundClassName ?? 'object-cover'}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      {preset.layers?.map((layer, i) =>
        layer.src ? (
          <img
            key={`${key}-layer-${i}`}
            src={layer.src}
            alt={layer.alt ?? ''}
            className={`absolute ${layer.className ?? ''}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : null
      )}
      <div className={`absolute inset-0 ${preset.overlayClassName ?? 'bg-stone-950/60'}`} />
    </div>
  )
}
