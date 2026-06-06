'use client'

import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded"
    >
      Çıkış Yap
    </button>
  )
}
