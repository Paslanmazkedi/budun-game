'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { fetchPlayerEntitlements, fetchPremiumWallet } from '@/lib/premium-api'
import {
  formatSubscriptionPrice,
  getActiveSubscriptionExpiry,
  hasEntitlement,
  PREMIUM_CURRENCY,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from '@/lib/premium-commerce'

function formatExpiry(iso: string): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function SubscriptionPlanCard({
  plan,
  isActive,
  expiryLabel,
}: {
  plan: SubscriptionPlan
  isActive: boolean
  expiryLabel: string | null
}) {
  const featured = plan.id === 'kut_baslangic'

  return (
    <article
      className={`relative flex flex-col rounded-2xl border p-5 md:p-6 transition ${
        featured
          ? 'border-violet-600/40 bg-gradient-to-b from-violet-950/35 via-stone-900/80 to-stone-950/90 shadow-lg shadow-violet-950/20'
          : 'border-stone-800 bg-stone-900/70'
      }`}
    >
      {featured && (
        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-violet-600 text-stone-50">
          Önerilen
        </span>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-stone-100">{plan.label}</h3>
          <p className="text-xs font-mono text-stone-500 mt-1 leading-relaxed">{plan.description}</p>
        </div>
        {isActive && (
          <span className="shrink-0 px-2 py-1 rounded-lg text-[9px] font-mono uppercase tracking-wide bg-emerald-950/60 border border-emerald-700/40 text-emerald-300">
            Aktif
          </span>
        )}
      </div>

      <ul className="space-y-2 mb-5 flex-1">
        {plan.perkLabels.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-2 text-sm font-mono text-stone-300"
          >
            <span className="text-violet-400 shrink-0 mt-0.5" aria-hidden>
              ✦
            </span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 pt-4 border-t border-stone-800/80">
        <p className="text-sm font-mono text-violet-300/90">
          {formatSubscriptionPrice(plan)}
        </p>
        {isActive && expiryLabel && (
          <p className="text-[10px] font-mono text-emerald-400/80">
            Bitiş: {expiryLabel}
          </p>
        )}
        <button
          type="button"
          disabled
          className={`w-full py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
            featured
              ? 'bg-violet-600/80 text-stone-100'
              : 'bg-stone-800 text-stone-400 border border-stone-700'
          }`}
        >
          {isActive ? 'Yönetim yakında' : 'Abone ol — yakında'}
        </button>
      </div>
    </article>
  )
}

export default function SubscriptionPanel() {
  const supabase = createClient()
  const [premiumBalance, setPremiumBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [expiryIso, setExpiryIso] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) {
        setLoading(false)
        return
      }

      const [walletRes, entRes] = await Promise.all([
        fetchPremiumWallet(supabase, user.id),
        fetchPlayerEntitlements(supabase, user.id),
      ])

      if (cancelled) return

      if (walletRes.wallet) {
        setPremiumBalance(walletRes.wallet.premium_balance)
      }

      const entitlements = entRes.entitlements
      setSubscriptionActive(hasEntitlement(entitlements, 'subscription_active'))
      setExpiryIso(getActiveSubscriptionExpiry(entitlements))
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const expiryLabel = useMemo(
    () => (expiryIso ? formatExpiry(expiryIso) : null),
    [expiryIso]
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-slide-up">
      <section className="rounded-2xl border border-violet-900/30 bg-gradient-to-br from-violet-950/25 via-stone-900/80 to-stone-950/90 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono text-violet-400/80 uppercase tracking-[0.2em] mb-1">
              Premium hesap
            </p>
            <h2 className="text-xl font-serif font-bold text-stone-100">
              Kut Paketleri
            </h2>
            <p className="text-xs font-mono text-stone-500 mt-2 max-w-md leading-relaxed">
              Abonelikler oyun akçesinden ayrıdır. Kut Taşı ile slot paketleri; abonelikler
              ise süreli bonus ve kozmetik hakları verir.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-violet-800/40 bg-stone-950/70 px-4 py-3 text-center min-w-[8.5rem]">
            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">
              Bakiye
            </p>
            <p className="text-lg font-bold font-mono text-violet-300 tabular-nums mt-0.5">
              {loading ? '…' : premiumBalance.toLocaleString()}{' '}
              <span className="text-base">{PREMIUM_CURRENCY.emoji}</span>
            </p>
            <p className="text-[9px] font-mono text-stone-600 mt-0.5">{PREMIUM_CURRENCY.label}</p>
          </div>
        </div>

        {subscriptionActive && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-800/30 bg-emerald-950/20 px-3 py-2.5">
            <span className="text-emerald-400 text-sm" aria-hidden>
              ✓
            </span>
            <p className="text-xs font-mono text-emerald-300/90">
              Aktif aboneliğin var
              {expiryLabel ? ` · ${expiryLabel} tarihine kadar` : ''}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
              Abonelik planları
            </p>
            <p className="text-xs font-mono text-stone-600 mt-1">
              Ödeme ve aktivasyon sonraki güncellemede açılacak.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              isActive={subscriptionActive && plan.id === 'kut_baslangic'}
              expiryLabel={expiryLabel}
            />
          ))}

          <article className="flex flex-col rounded-2xl border border-dashed border-stone-800 bg-stone-900/40 p-5 md:p-6 opacity-80">
            <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest mb-2">
              Yakında
            </p>
            <h3 className="text-lg font-serif font-bold text-stone-400">Kut Savaşçı</h3>
            <p className="text-xs font-mono text-stone-600 mt-1 mb-4 leading-relaxed">
              İleri seviye maceracılar için genişletilmiş paket — detaylar hazırlanıyor.
            </p>
            <ul className="space-y-2 mb-5 flex-1">
              {['Ek EXP bonusu', 'Özel binek görünümü', 'Aylık Kut Taşı'].map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm font-mono text-stone-600">
                  <span className="shrink-0">○</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide bg-stone-900 text-stone-600 border border-stone-800 disabled:cursor-not-allowed"
            >
              Çok yakında
            </button>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 md:p-5 space-y-3">
        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">
          Tek seferlik genişletmeler
        </p>
        <p className="text-xs font-mono text-stone-500 leading-relaxed">
          Heybe slot paketleri (+1 / +10 / +20) Kut Taşı ile envanter ekranından satın alınır;
          abonelik bonuslarından bağımsızdır ve kalıcıdır.
        </p>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 hover:text-violet-300 transition"
        >
          → Heybe · Genişlet menüsü
        </Link>
      </section>

      <p className="text-[10px] font-mono text-stone-600 text-center px-4 leading-relaxed">
        Gerçek para ödemesi, mağaza entegrasyonu ve abonelik yönetimi sonraki aşamada
        eklenecek. Şimdilik planlar önizleme amaçlıdır.
      </p>
    </div>
  )
}
