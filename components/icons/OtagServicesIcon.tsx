/** Otağ hizmetleri menü ikonu — çekiç + iksir (oba butonu, oba nav çadırından ayrı) */
export function OtagServicesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 19.5 9.5 8l2 2L18 4l2 2-6.5 6.5-2-2L5 19.5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M9.5 8l2 2L18 4l2 2-6.5 6.5-2-2L5 19.5" />
      <path d="M14.5 14.5c1.5 1.5 1.5 3.5 0 5s-3.5 1.5-5 0-1.5-3.5 0-5 3.5-1.5 5 0z" fill="currentColor" fillOpacity="0.15" />
      <path d="M14.5 14.5c1.5 1.5 1.5 3.5 0 5s-3.5 1.5-5 0-1.5-3.5 0-5 3.5-1.5 5 0z" />
      <path d="M12.5 17v3.5" />
    </svg>
  )
}
