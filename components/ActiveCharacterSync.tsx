'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  readActiveCharacterCookie,
  readActiveCharacterStorage,
  syncActiveCharacterId,
} from '@/lib/active-character-client'
import { ACTIVE_CHARACTER_COOKIE } from '@/lib/characters'

/**
 * localStorage ↔ sunucu cookie uyumsuzluğunu giderir.
 * Oba (client) ile Kahraman (server) arasında farklı karakter görünmesini önler.
 */
export default function ActiveCharacterSync() {
  const router = useRouter()
  const syncing = useRef(false)

  useEffect(() => {
    if (syncing.current) return

    const storedId = readActiveCharacterStorage()
    const cookieId = readActiveCharacterCookie()

    if (!storedId && !cookieId) return

    if (storedId && storedId !== cookieId) {
      syncing.current = true
      void syncActiveCharacterId(storedId)
        .then(() => router.refresh())
        .finally(() => {
          syncing.current = false
        })
      return
    }

    if (cookieId && !storedId) {
      localStorage.setItem(ACTIVE_CHARACTER_COOKIE, cookieId)
    }
  }, [router])

  return null
}
