/** Alt navigasyon ve hub grupları */

export const NAV_ITEMS = [
  { href: '/macera', icon: '🗺️', label: 'Macera', cluster: 'macera' as const },
  { href: '/character', icon: '👤', label: 'Kahraman', cluster: 'kahraman' as const },
  { href: '/', icon: '⛺', label: 'Oba', center: true, cluster: 'oba' as const },
  { href: '/market', icon: '⚖️', label: 'Pazar', cluster: 'market' as const },
]

const MACERA_PATHS = ['/macera', '/quests', '/battle']
const KAHRAMAN_PATHS = ['/character', '/inventory']
const OBA_PATHS = ['/', '/oba']

export function isNavActive(pathname: string, cluster: string) {
  if (cluster === 'macera') return MACERA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'kahraman') return KAHRAMAN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (cluster === 'oba') return OBA_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  if (cluster === 'market') return pathname.startsWith('/market')
  return false
}

export const KAHRAMAN_TABS = [
  { href: '/character', label: 'Karnet', icon: '📋' },
  { href: '/inventory', label: 'Heybe', icon: '🎒' },
]

export const OBA_ACTIVITIES = [
  { href: '/oba/craft', icon: '🔨', label: 'Demirci', description: 'Örs ile craft' },
  { href: '/oba/iksir', icon: '🧪', label: 'İksir Tezgâhı', description: 'İksir ve malzeme' },
  { href: '/oba/klan', icon: '🏛️', label: 'Klan', description: 'Boy ve totem' },
]

export const MACERA_DESTINATIONS = [
  { href: '/quests', icon: '📜', label: 'Görevler', description: 'Sefer ve ganimet', position: 'left' as const },
  { href: '/battle', icon: '⚔️', label: 'Düello', description: 'Cenk ve kapışma', position: 'right' as const },
]
