import { ACTIVE_CHARACTER_COOKIE } from '@/lib/characters'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function readCookieValue(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACTIVE_CHARACTER_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
  )
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

function writeDocumentCookie(id: string) {
  document.cookie = `${ACTIVE_CHARACTER_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/** Tarayıcıda seçili aktif karakter — localStorage ile cookie uyumlu */
export function getActiveCharacterId(): string | null {
  if (typeof document === 'undefined') return null

  const cookieId = readCookieValue()
  const storedId = localStorage.getItem(ACTIVE_CHARACTER_COOKIE)

  if (storedId && cookieId && storedId !== cookieId) {
    return storedId
  }

  return cookieId ?? storedId
}

/** Aktif karakteri hem istemci hem sunucu tarafında kaydet */
export function setActiveCharacterId(id: string) {
  localStorage.setItem(ACTIVE_CHARACTER_COOKIE, id)
  writeDocumentCookie(id)

  void fetch('/api/active-character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    credentials: 'same-origin',
  }).catch(() => {
    /* document.cookie yedek */
  })
}

export async function syncActiveCharacterId(id: string): Promise<void> {
  localStorage.setItem(ACTIVE_CHARACTER_COOKIE, id)
  writeDocumentCookie(id)

  await fetch('/api/active-character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    credentials: 'same-origin',
  })
}

export function clearActiveCharacterId() {
  document.cookie = `${ACTIVE_CHARACTER_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  localStorage.removeItem(ACTIVE_CHARACTER_COOKIE)
}

export function readActiveCharacterCookie(): string | null {
  return readCookieValue()
}

export function readActiveCharacterStorage(): string | null {
  if (typeof document === 'undefined') return null
  return localStorage.getItem(ACTIVE_CHARACTER_COOKIE)
}
