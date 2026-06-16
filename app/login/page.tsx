'use client'

import { createClient } from '@/lib/supabase-browser'
import { signOutToLogin } from '@/lib/auth-client'
import WolfMoonEmblem from '@/components/WolfMoonEmblem'

function StarField() {
  const stars = [
    { top: '12%', left: '8%', size: 2, delay: 0 },
    { top: '22%', left: '78%', size: 3, delay: 0.5 },
    { top: '8%', left: '45%', size: 2, delay: 1 },
    { top: '35%', left: '15%', size: 1, delay: 1.2 },
    { top: '18%', left: '62%', size: 2, delay: 0.3 },
    { top: '42%', left: '88%', size: 2, delay: 0.8 },
    { top: '6%', left: '92%', size: 1, delay: 1.5 },
    { top: '28%', left: '32%', size: 1, delay: 0.6 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-amber-100/80 animate-star-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

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
    <div className="relative min-h-screen w-full text-stone-100 flex flex-col overflow-hidden animate-page-enter">
      {/* Gece gökyüzü */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a12] via-[#0c0a09] to-[#050508]" />
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 70% 18%, rgba(120,53,15,0.25), transparent 55%)',
        }}
      />
      <StarField />

      {/* Üst ay parıltısı */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[min(420px,70vw)] h-[min(420px,70vw)] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 safe-bottom">
        <div className="w-full max-w-sm space-y-6">
          {/* Kurt + ay amblemi */}
          <div className="flex flex-col items-center text-stone-200">
            <div className="w-44 h-36 sm:w-52 sm:h-40 mb-2">
              <WolfMoonEmblem className="w-full h-full" />
            </div>
            <p className="text-[10px] font-mono text-amber-500/70 uppercase tracking-[0.35em] mt-1">
              Bozkırın Gecesi
            </p>
            <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-[0.15em] text-transparent bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text uppercase mt-2">
              Budun
            </h1>
            <p className="text-xs text-stone-500 uppercase tracking-[0.2em] font-mono mt-1">
              Online
            </p>
          </div>

          <div className="bg-stone-950/75 backdrop-blur-xl border border-stone-800/80 rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.5)] space-y-5">
            <p className="text-sm text-stone-400 text-center leading-relaxed">
              Ayın altında otağını kur, kahramanını seç ve bozkır seferlerine çık.
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold font-mono text-sm py-3.5 rounded-xl transition active:scale-[0.98] shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google ile Bağlan
            </button>
          </div>

          <p className="text-[10px] text-center text-stone-600 font-mono leading-relaxed">
            Travian tarzı bozkır RPG · Mobil uyumlu
          </p>
        </div>
      </div>
    </div>
  )
}
