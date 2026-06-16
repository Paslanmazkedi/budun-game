'use client'

import { createClient } from '@/lib/supabase-browser'
import { OTAG_BACKGROUND } from '@/lib/game-assets'

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
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col animate-page-enter">
      <div className="absolute inset-0 z-0">
        <img src={OTAG_BACKGROUND} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/80 to-stone-950" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 safe-bottom">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-mono text-stone-600 uppercase tracking-[0.3em]">Faz 1.0</p>
            <h1 className="text-4xl font-serif font-black tracking-widest text-amber-500 uppercase">
              Budun
            </h1>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-mono">
              Bozkırın Destanı
            </p>
          </div>

          <div className="bg-stone-900/70 backdrop-blur-md border border-stone-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <p className="text-sm text-stone-400 text-center leading-relaxed">
              Otağına adım at, karakterini seç ve bozkır seferlerine çık.
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-mono text-sm py-3.5 rounded-xl transition active:scale-[0.98] shadow-lg shadow-amber-900/25 flex items-center justify-center gap-2"
            >
              <span>🌐</span>
              Google ile Bağlan
            </button>
          </div>

          <p className="text-[10px] text-center text-stone-600 font-mono">
            Travian tarzı bozkır RPG · Mobil uyumlu
          </p>
        </div>
      </div>
    </div>
  )
}
