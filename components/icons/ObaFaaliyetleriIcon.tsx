/** Hilal — Oba Faaliyetleri menü simgesi (48px viewBox, keskin detay) */
export function ObaFaaliyetleriIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      aria-hidden
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id="oba-hilal-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
        <filter id="oba-hilal-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M30 8.5a11.5 11.5 0 1 0 0 23 9.5 9.5 0 0 1 0-23z"
        fill="url(#oba-hilal-glow)"
        fillOpacity="0.28"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M22 12.5a8.5 8.5 0 1 0 0 17 11.5 11.5 0 0 1 0-17z"
        fill="currentColor"
        fillOpacity="0.62"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#oba-hilal-soft)"
      />
      <circle cx="34.5" cy="13.5" r="1.4" fill="currentColor" opacity="0.9" />
      <circle cx="37.5" cy="18.5" r="1" fill="currentColor" opacity="0.75" />
      <circle cx="33" cy="20.5" r="0.65" fill="currentColor" opacity="0.55" />
    </svg>
  )
}
