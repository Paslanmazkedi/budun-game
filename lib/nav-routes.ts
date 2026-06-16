/** Alt navigasyon ve hub grupları */

export type NavIconId = 'kahraman' | 'macera' | 'oba' | 'market' | 'sefer'

export const NAV_ITEMS: Array<{
  href: string
  icon: NavIconId
  emoji: string
  label: string
  center?: boolean
  cluster: 'kahraman' | 'macera' | 'oba' | 'market' | 'sefer'
}> = [
  { href: '/character', icon: 'kahraman', emoji: '🛡️', label: 'Kahraman', cluster: 'kahraman' },
  { href: '/macera', icon: 'macera', emoji: '⚔️', label: 'Aksiyon', cluster: 'macera' },
  { href: '/', icon: 'oba', emoji: '⛺', label: 'Oba', center: true, cluster: 'oba' },
  { href: '/market', icon: 'market', emoji: '⚖️', label: 'Pazar', cluster: 'market' },
  { href: '/sefer-defteri', icon: 'sefer', emoji: '📖', label: 'Sefer Defteri', cluster: 'sefer' },
]

const MACERA_PATHS = ['/macera', '/quests', '/battle', '/party', '/macera/farm', '/dunya', '/siralama']
const KAHRAMAN_PATHS = ['/character', '/inventory']
const OBA_PATHS = ['/', '/oba']
const SEFER_PATHS = ['/sefer-defteri']

export function isKahramanPath(pathname: string) {
  return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isNavActive(pathname: string, cluster: string) {
  if (cluster === 'macera') return MACERA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'kahraman') return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'oba') return OBA_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  if (cluster === 'market') return pathname.startsWith('/market')
  if (cluster === 'sefer') return SEFER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return false
}

export const KAHRAMAN_TABS = [
  {
    href: '/character',
    label: 'Künye',
    emoji: '📜',
    match: (p: string) => p === '/character',
  },
  {
    href: '/inventory',
    label: 'Heybe',
    emoji: '🧳',
    match: (p: string) => p === '/inventory' || p.startsWith('/inventory/'),
  },
  {
    href: '/character/ozellikler',
    label: 'Özellikler',
    emoji: '✨',
    match: (p: string) => p === '/character/ozellikler' || p.startsWith('/character/ozellikler/'),
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
