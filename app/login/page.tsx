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
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex items-center justify-center p-4">
      {/* Atmosferik Giriş Kutusu */}
      <div className="w-full max-w-md bg-stone-900/60 backdrop-blur-md border border-stone-800 p-8 rounded-xl shadow-2xl z-10 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-black tracking-widest text-amber-500 uppercase drop-shadow">
            BUDUN
          </h1>
          <p className="text-xs text-stone-400 uppercase tracking-widest mt-2 font-mono">
            Bozkırın Destanı
          </p>
        </div>

        <p className="text-sm text-stone-300 font-sans mb-6">
          Otağına adım atmak ve karakterini kuşanmak için giriş yap.
        </p>

        {/* Google Giriş Butonu */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-200 font-mono text-sm py-3 rounded-lg transition flex items-center justify-center gap-3 shadow-md"
        >
          🌐 Google Hesabı ile Bağlan
        </button>
      </div>
    </div>
  )
}