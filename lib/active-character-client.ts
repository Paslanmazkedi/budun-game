import { ACTIVE_CHARACTER_COOKIE } from '@/lib/characters'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function getActiveCharacterId(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACTIVE_CHARACTER_COOKIE}=([^;]*)`)
  )
  if (match?.[1]) return decodeURIComponent(match[1])
  return localStorage.getItem(ACTIVE_CHARACTER_COOKIE)
}

export function setActiveCharacterId(id: string) {
  document.cookie = `${ACTIVE_CHARACTER_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  localStorage.setItem(ACTIVE_CHARACTER_COOKIE, id)
}
