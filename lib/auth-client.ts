'use client'

import { createClient } from '@/lib/supabase-browser'
import { clearActiveCharacterId } from '@/lib/active-character-client'

export async function signOutToLogin() {
  const supabase = createClient()
  clearActiveCharacterId()
  await supabase.auth.signOut()
}
