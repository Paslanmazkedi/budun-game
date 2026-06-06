'use client'

import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">BUDUN</h1>
        <p className="text-gray-400 mb-8">Bozkırın Destanı</p>
        <button
          onClick={handleGoogleLogin}
          className="bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-200"
        >
          Google ile Giriş Yap
        </button>
      </div>
    </main>
  )
}