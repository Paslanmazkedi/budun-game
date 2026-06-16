/** Hilal — Oba Faaliyetleri menü simgesi */
export function ObaFaaliyetleriIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M14.5 4.5A7.5 7.5 0 1 0 14.5 19.5 6 6 0 0 1 14.5 4.5z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11 6.5a5.5 5.5 0 1 0 0 11 7.5 7.5 0 0 1 0-11z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="7" r="0.75" fill="currentColor" opacity="0.6" />
      <circle cx="19" cy="10" r="0.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
