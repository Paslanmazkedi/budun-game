type WolfMoonEmblemProps = {
  className?: string
  moonClassName?: string
}

/** Login ve marka alanları için kurt + ay amblemi (SVG — ileride asset ile değiştirilebilir) */
export default function WolfMoonEmblem({ className = '', moonClassName = '' }: WolfMoonEmblemProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden>
      {/* Ay */}
      <div
        className={`absolute rounded-full bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.45)] animate-moon-glow ${moonClassName}`}
        style={{ width: '72%', height: '72%', top: '8%', right: '6%' }}
      />
      <div
        className="absolute rounded-full bg-stone-950/25"
        style={{ width: '58%', height: '58%', top: '14%', right: '18%' }}
      />

      {/* Kurt silüeti */}
      <svg
        viewBox="0 0 200 160"
        className="relative z-10 w-full h-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
        fill="currentColor"
      >
        <defs>
          <linearGradient id="wolfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d6d3d1" />
            <stop offset="45%" stopColor="#f5f5f4" />
            <stop offset="100%" stopColor="#a8a29e" />
          </linearGradient>
        </defs>
        {/* Gövde */}
        <path
          d="M28 118 C42 98 58 88 78 86 L95 72 C98 58 108 48 122 44 C128 42 134 44 138 50 L148 62 C158 58 168 62 174 72 L180 88 C188 96 192 108 188 118 C182 132 168 138 152 136 L120 132 C98 130 72 128 48 124 C36 122 26 128 28 118 Z"
          fill="url(#wolfGrad)"
        />
        {/* Baş */}
        <path
          d="M122 44 C118 32 124 22 136 18 C148 14 158 20 162 30 C166 38 164 48 158 54 L148 62 C142 50 132 44 122 44 Z"
          fill="url(#wolfGrad)"
        />
        {/* Kulak */}
        <path d="M128 22 L124 8 L136 16 Z" fill="#e7e5e4" />
        <path d="M148 20 L154 6 L158 18 Z" fill="#e7e5e4" />
        {/* Ağız açık — ay'a bakış */}
        <path
          d="M154 48 C158 52 160 58 156 62 C152 66 146 64 144 58 C142 52 148 46 154 48 Z"
          fill="#1c1917"
        />
        {/* Kuyruk */}
        <path
          d="M28 118 C12 108 8 92 16 78 C22 68 32 64 40 70 L48 124 Z"
          fill="url(#wolfGrad)"
        />
        {/* Ön ayak */}
        <path d="M78 118 L72 138 L86 136 L90 120 Z" fill="#a8a29e" />
        <path d="M100 120 L96 140 L110 138 L112 122 Z" fill="#a8a29e" />
      </svg>
    </div>
  )
}
