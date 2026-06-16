import type { NavIconId } from '@/lib/nav-routes'

type NavIconProps = {
  className?: string
}

/** Macera — kılıç + kalkan */
export function NavMaceraIcon({ className = 'w-5 h-5' }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M6.5 5.5 5 7v4.2c0 2.8 1.6 5.1 3.8 6.2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M6.5 5.5 5 7v4.2c0 2.8 1.6 5.1 3.8 6.2" />
      <path d="M5.5 6.5 8.5 9.5" />
      <path d="M16 3.5l4.5 4.5-1 1 2.2 2.2-1.4 1.4L14 9.9l-1 1L10.5 6.4" />
      <path d="M18.5 5.5 21 8" />
      <path d="M14.5 9.5 8 16" strokeWidth="1.75" />
    </svg>
  )
}

/** Kahraman — şövalye / miğfer silüeti */
export function NavHeroIcon({ className = 'w-5 h-5' }: NavIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M8.5 9.5c0-2.5 1.6-4.5 3.5-4.5s3.5 2 3.5 4.5v1.5H8.5V9.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9.5c0-2.5 1.6-4.5 3.5-4.5s3.5 2 3.5 4.5v1.5H8.5V9.5z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M7 11h10v2.5c0 2.2-1.8 4-4 4h-2c-2.2 0-4-1.8-4-4V11z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M9.5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 8.5h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.55" />
      <path
        d="M5.5 17.5h13"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path
        d="M7 17.5l1.5-3h9l1.5 3"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Oba — çadır */
export function NavObaTentIcon({ className = 'w-6 h-6' }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M12 3.5 20.5 19.5H3.5L12 3.5z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
      />
      <path d="M12 3.5V19.5M3.5 19.5h17" />
      <path d="M8 19.5 12 8.5 16 19.5" />
    </svg>
  )
}

/** Pazar — terazi (⚖️ tarzı) */
export function NavMarketIcon({ className = 'w-5 h-5' }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v2.5" />
      <path d="M5.5 7.5h13" />
      <path d="M5.5 7.5 4 11.5M18.5 7.5 20 11.5" />
      <path
        d="M4 11.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5M15 11.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5"
      />
      <path d="M12 5.5v14" />
      <path d="M9 19.5h6" />
    </svg>
  )
}

/** Sefer defteri — açık kitap */
export function NavSeferIcon({ className = 'w-5 h-5' }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M5 5.5c0-1 .8-1.8 2-1.8H11v15.3H6.8A2.8 2.8 0 0 1 4 16.5V5.5z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M5 5.5c0-1 .8-1.8 2-1.8H11v15.3H6.8A2.8 2.8 0 0 1 4 16.5V5.5z" />
      <path
        d="M19 5.5c0-1-.8-1.8-2-1.8H13v15.3h4.2A2.8 2.8 0 0 0 19 16.5V5.5z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M19 5.5c0-1-.8-1.8-2-1.8H13v15.3h4.2A2.8 2.8 0 0 0 19 16.5V5.5z" />
      <path d="M11 5.5h2v15.3h-2z" />
      <path d="M7 9h3M14 9h3M7 12.5h3M14 12.5h3" strokeWidth="1.25" opacity="0.5" />
    </svg>
  )
}

/** Harita — katlanmış harita */
export function NavHaritaIcon({ className = 'w-5 h-5' }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M4 6.5 9 4.5l5 2 6-2.5v13l-5 2-5-2-6 2.5V6.5z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
      />
      <path d="M9 4.5v15M14 6.5v13" />
      <path d="M4 6.5l5 2 5-2 6-2.5" />
    </svg>
  )
}

export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  switch (id) {
    case 'macera':
      return <NavMaceraIcon className={className} />
    case 'kahraman':
      return <NavHeroIcon className={className} />
    case 'oba':
      return <NavObaTentIcon className={className} />
    case 'market':
      return <NavMarketIcon className={className} />
    case 'sefer':
      return <NavSeferIcon className={className} />
  }
}
