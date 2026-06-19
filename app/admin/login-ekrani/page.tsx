'use client'

import Link from 'next/link'
import {
  LOGIN_LOGO_FIELD_LABELS,
  LOGIN_SCREEN_CONFIG,
  loginLogoPreviewStyle,
} from '@/lib/login-screen-config'
import { LOGIN_LOGO } from '@/lib/game-assets'

function ConfigRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-1 sm:gap-4 py-2 border-b border-stone-800/80 last:border-0">
      <dt className="text-stone-500 text-xs font-mono">{label}</dt>
      <dd className="text-stone-200 text-sm font-mono tabular-nums sm:text-right">{value}</dd>
    </div>
  )
}

export default function LoginEkraniAdminPage() {
  const cfg = LOGIN_SCREEN_CONFIG
  const logoKeys = Object.keys(LOGIN_LOGO_FIELD_LABELS) as (keyof typeof LOGIN_LOGO_FIELD_LABELS)[]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] font-mono text-amber-600/80 uppercase tracking-widest">
          Yönetim · Giriş ekranı
        </p>
        <h1 className="text-2xl font-serif font-black text-amber-500 uppercase">
          Login Ekranı Ayarları
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          Metin, logo boyutu ve konumu{' '}
          <code className="text-amber-400/90 text-xs bg-stone-900 px-1.5 py-0.5 rounded">
            lib/login-screen-config.ts
          </code>{' '}
          dosyasından düzenlenir. Değişiklikten sonra deploy gerekir.
        </p>
      </header>

      <section className="rounded-xl border border-stone-800 bg-stone-900/60 p-5 space-y-4">
        <h2 className="text-xs font-mono text-stone-500 uppercase tracking-wider">Metinler</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-stone-500 text-xs font-mono mb-1">tagline</dt>
            <dd className="text-stone-200">{cfg.tagline || '(kapalı)'}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs font-mono mb-1">googleButtonLabel</dt>
            <dd className="text-stone-200">{cfg.googleButtonLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-stone-800 bg-stone-900/60 p-5 space-y-3">
        <h2 className="text-xs font-mono text-stone-500 uppercase tracking-wider">Arka plan</h2>
        <dl className="space-y-2 text-sm font-mono">
          <div>
            <dt className="text-stone-500 text-xs mb-1">showLogoOnMobile</dt>
            <dd className="text-stone-200">{cfg.showLogoOnMobile ? 'evet' : 'hayır (sadece masaüstü)'}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs mb-1">background.mobile</dt>
            <dd className="text-stone-300 text-xs break-all">{cfg.background.mobile}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs mb-1">background.desktop</dt>
            <dd className="text-stone-300 text-xs break-all">{cfg.background.desktop}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-stone-800 bg-stone-900/60 p-5 space-y-3">
        <h2 className="text-xs font-mono text-stone-500 uppercase tracking-wider">
          Logo — boyut ve konum (px)
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          <code className="text-stone-500">logo.widthMobile</code>,{' '}
          <code className="text-stone-500">logo.offsetXMobile</code> vb. alanları config dosyasında
          güncelleyin. Yatay: eksi sola, artı sağa. Dikey: eksi yukarı, artı aşağı.
        </p>
        <dl>
          {logoKeys.map((key) => (
            <ConfigRow
              key={key}
              label={`logo.${key} — ${LOGIN_LOGO_FIELD_LABELS[key]}`}
              value={cfg.logo[key]}
            />
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-stone-800 bg-stone-900/40 p-5 space-y-4">
        <h2 className="text-xs font-mono text-stone-500 uppercase tracking-wider">Mini önizleme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg bg-stone-950/80 border border-stone-800/60 p-4">
            <p className="text-[10px] font-mono text-stone-600 uppercase mb-3 text-center">Mobil</p>
            <div className="flex flex-col items-center gap-3 min-h-[200px] justify-center">
              <img
                src={LOGIN_LOGO}
                alt=""
                style={loginLogoPreviewStyle(cfg.logo, 'mobile')}
                className="drop-shadow-[0_8px_20px_rgba(6,182,212,0.2)]"
              />
            </div>
          </div>
          <div className="rounded-lg bg-stone-950/80 border border-stone-800/60 p-4">
            <p className="text-[10px] font-mono text-stone-600 uppercase mb-3 text-center">
              Masaüstü
            </p>
            <div className="flex flex-col items-center gap-3 min-h-[200px] justify-center">
              <img
                src={LOGIN_LOGO}
                alt=""
                style={loginLogoPreviewStyle(cfg.logo, 'desktop')}
                className="drop-shadow-[0_8px_20px_rgba(6,182,212,0.2)]"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 pt-2 border-t border-stone-800/60">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-stone-700 text-sm font-medium">
            G {cfg.googleButtonLabel}
          </span>
          {cfg.tagline ? (
            <p className="text-sm text-stone-400 max-w-xs leading-relaxed font-serif text-center px-2">
              {cfg.tagline}
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="text-sm font-mono px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-amber-700/50 hover:text-amber-400 transition"
        >
          → Canlı login ekranı
        </Link>
        <Link
          href="/"
          className="text-sm font-mono px-4 py-2 rounded-lg border border-stone-800 text-stone-500 hover:text-stone-300 transition"
        >
          Oba
        </Link>
      </div>
    </div>
  )
}
