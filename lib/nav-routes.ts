/** Alt navigasyon ve hub grupları */

export type NavIconId = 'kahraman' | 'macera' | 'oba' | 'market' | 'harita'

export const NAV_ITEMS: Array<{
  href: string
  icon: NavIconId
  label: string
  center?: boolean
  cluster: 'kahraman' | 'macera' | 'oba' | 'market' | 'harita'
}> = [
  { href: '/character', icon: 'kahraman', label: 'Kahraman', cluster: 'kahraman' },
  { href: '/macera', icon: 'macera', label: 'Macera', cluster: 'macera' },
  { href: '/', icon: 'oba', label: 'Oba', center: true, cluster: 'oba' },
  { href: '/market', icon: 'market', label: 'Pazar', cluster: 'market' },
  { href: '/dunya', icon: 'harita', label: 'Harita', cluster: 'harita' },
]

const MACERA_PATHS = ['/macera', '/quests', '/battle', '/party', '/macera/farm']
const KAHRAMAN_PATHS = ['/character', '/inventory']
const OBA_PATHS = ['/', '/oba']
const HARITA_PATHS = ['/dunya', '/siralama', '/harita']

export function isNavActive(pathname: string, cluster: string) {
  if (cluster === 'macera') return MACERA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'kahraman') return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'oba') return OBA_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  if (cluster === 'market') return pathname.startsWith('/market')
  if (cluster === 'harita') return HARITA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return false
}

export const KAHRAMAN_TABS = [
  { href: '/character', label: 'Karnet', icon: '📋' },
  { href: '/inventory', label: 'Heybe', icon: '🎒' },
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
  { href: '/party', icon: '👥', label: 'Parti', description: 'Kur ve bul (max 8 kişi)', tone: 'social' as const },
  { href: '/macera/farm', icon: '🌲', label: 'Farm', description: '3 / 4 / 8 kişilik alanlar', tone: 'quest' as const },
  { href: '/battle', icon: '⚔️', label: 'Düello', description: 'Cenk ve kapışma', tone: 'combat' as const },
]
