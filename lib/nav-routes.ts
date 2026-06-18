/** Alt navigasyon ve hub grupları */

export type NavIconId = 'kahraman' | 'macera' | 'oba' | 'market' | 'sefer'
export type KahramanNavSvgIcon = 'heybe'

type BaseNavItem = {
  href: string
  label: string
  center?: boolean
}

export type MainNavItem = BaseNavItem & {
  icon: NavIconId
  emoji: string
  cluster: 'kahraman' | 'macera' | 'oba' | 'market' | 'sefer'
}

export type KahramanNavItem = BaseNavItem & {
  emoji?: string
  svgIcon?: KahramanNavSvgIcon
  cluster: 'kunye' | 'ozellikler' | 'oba-exit' | 'heybe' | 'budun'
}

export const NAV_ITEMS: MainNavItem[] = [
  { href: '/character', icon: 'kahraman', emoji: '🛡️', label: 'Kahraman', cluster: 'kahraman' },
  { href: '/macera', icon: 'macera', emoji: '⚔️', label: 'Aksiyon', cluster: 'macera' },
  { href: '/', icon: 'oba', emoji: '⛺', label: 'Oba', center: true, cluster: 'oba' },
  { href: '/market', icon: 'market', emoji: '⚖️', label: 'Pazar', cluster: 'market' },
  { href: '/sefer-defteri', icon: 'sefer', emoji: '📖', label: 'Cenk Defteri', cluster: 'sefer' },
]

/** Kahraman hub — Oba ortada sabit; diğer sekmeler dinamik */
export const KAHRAMAN_NAV_ITEMS: KahramanNavItem[] = [
  { href: '/character', emoji: '📜', label: 'Künye', cluster: 'kunye' },
  { href: '/character/ozellikler', emoji: '✨', label: 'Özellikler', cluster: 'ozellikler' },
  { href: '/', emoji: '⛺', label: 'Oba', center: true, cluster: 'oba-exit' },
  { href: '/inventory', svgIcon: 'heybe', label: 'Heybe', cluster: 'heybe' },
  { href: '/oba/klan', emoji: '🏛️', label: 'Budun', cluster: 'budun' },
]

const MACERA_PATHS = ['/macera', '/quests', '/battle', '/party', '/macera/farm', '/dunya', '/siralama']
const KAHRAMAN_PATHS = ['/character', '/inventory', '/oba/klan']
const OBA_PATHS = ['/', '/oba']
const SEFER_PATHS = ['/sefer-defteri']

export function isKahramanPath(pathname: string) {
  return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isNavActive(pathname: string, cluster: string) {
  if (cluster === 'macera') return MACERA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'kahraman') return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'oba') {
    return OBA_PATHS.some((p) => {
      if (p === '/') return pathname === '/'
      if (p === '/oba' && pathname.startsWith('/oba/klan')) return false
      return pathname.startsWith(p)
    })
  }
  if (cluster === 'market') return pathname.startsWith('/market')
  if (cluster === 'sefer') return SEFER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return false
}

export function isKahramanNavActive(pathname: string, cluster: KahramanNavItem['cluster']) {
  if (cluster === 'kunye') return pathname === '/character'
  if (cluster === 'ozellikler') {
    return pathname === '/character/ozellikler' || pathname.startsWith('/character/ozellikler/')
  }
  if (cluster === 'heybe') return pathname === '/inventory' || pathname.startsWith('/inventory/')
  if (cluster === 'budun') return pathname === '/oba/klan' || pathname.startsWith('/oba/klan/')
  return false
}

/** @deprecated Alt navigasyon KAHRAMAN_NAV_ITEMS kullanıyor */
export const KAHRAMAN_TABS = [
  {
    href: '/character',
    label: 'Künye',
    emoji: '📜',
    match: (p: string) => p === '/character',
  },
  {
    href: '/character/ozellikler',
    label: 'Özellikler',
    emoji: '✨',
    match: (p: string) => p === '/character/ozellikler' || p.startsWith('/character/ozellikler/'),
  },
  {
    href: '/inventory',
    label: 'Heybe',
    emoji: '🎒',
    match: (p: string) => p === '/inventory' || p.startsWith('/inventory/'),
  },
  {
    href: '/oba/klan',
    label: 'Budun',
    emoji: '🏛️',
    match: (p: string) => p === '/oba/klan' || p.startsWith('/oba/klan/'),
  },
]

export const OBA_ACTIVITIES = [
  { href: '/oba/craft', icon: '🔨', label: 'Demirci', shortLabel: 'Demirci', description: 'Örs ile craft' },
  { href: '/oba/iksir', icon: '🧪', label: 'İksir Tezgâhı', shortLabel: 'İksir', description: 'İksir ve malzeme' },
  { href: '/oba/arkadas', icon: '👋', label: 'Arkadaşlar', shortLabel: 'Arkadaş', description: 'Liste ve davet' },
  { href: '/oba/klan', icon: '🏛️', label: 'Klan', shortLabel: 'Boy', description: 'Boy ve totem' },
]

export const BOZKIR_LINKS = [
  { href: '/dunya', icon: '🗺️', label: 'Dünya', description: 'Yolculuk ve parti odaları' },
  { href: '/siralama', icon: '🏆', label: 'Sıralama', description: 'Kudret rekabeti' },
]

export const MACERA_DESTINATIONS = [
  { href: '/quests', icon: '📜', label: 'Görevler', description: 'Standart, bonus ve seviye seferleri', tone: 'quest' as const },
  { href: '/macera/farm', icon: '🌲', label: 'Farm', description: '3 / 4 / 8 kişilik alanlar', tone: 'quest' as const },
  { href: '/battle', icon: '⚔️', label: 'Düello', description: 'Cenk ve kapışma', tone: 'combat' as const },
  { href: '/dunya', icon: '🗺️', label: 'Harita', description: 'Dünya, bölgeler ve boss', tone: 'world' as const },
]
