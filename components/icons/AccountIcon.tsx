/** Hesap menüsü simgesi */
export function AccountIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
    </svg>
  )
}
