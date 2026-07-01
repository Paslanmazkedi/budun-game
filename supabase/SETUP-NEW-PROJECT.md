# Yeni Supabase projesi — kurulum rehberi

GitHub + Vercel hazır. Bu rehber sıfır Supabase projesini oynanabilir hale getirir.

---

## Aşama 1 — Supabase projesi oluştur

1. [supabase.com/dashboard](https://supabase.com/dashboard) → giriş (Ravencons hesabı)
2. **New project**
   - **Name:** `budun-online` (veya istediğiniz)
   - **Database password:** güçlü bir şifre — **kaydedin**
   - **Region:** kullanıcıya yakın (ör. Frankfurt)
3. Proje yeşil olana kadar bekleyin (~2 dk)

---

## Aşama 2 — API anahtarlarını not al

**Project Settings → API**

| Değişken | Nereden |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |

> `service_role` key’i **asla** frontend’e veya GitHub’a koymayın.

---

## Aşama 3 — SQL script’leri (sırayla)

**SQL Editor → New query** → dosya içeriğini yapıştır → **Run**

Her adım hatasız bitmeli. Hata alırsanız durun, mesajı paylaşın.

| # | Dosya | Ne yapar |
|---|--------|----------|
| 1 | `schema-base.sql` | Temel tablolar (characters, items, quests…) |
| 2 | `rls-characters.sql` | Karakter güvenliği |
| 3 | `rls-character-items.sql` | Envanter güvenliği |
| 4 | `rls-quests.sql` | Görev güvenliği |
| 5 | `seed-item-sets.sql` | Eşya kataloğu + loot havuzları |
| 5b | `rls-item-templates.sql` | Eşya tanımlarını okuma (heybe join) |
| 6 | `rls-loot-tables.sql` | Loot okuma |
| 7 | `setup-clan-party-social.sql` | Klan, parti, arkadaş, sohbet |
| 8 | `setup-clan-party-social-rls.sql` | Sosyal RLS |
| 9 | `add-clan-features.sql` | Klan davet + puan sistemi |
| 10 | `rls-clan-features.sql` | Klan ek RLS |
| 11 | `add-market-system.sql` | Pazar + RPC fonksiyonları |
| 12 | `add-material-stacking.sql` | Malzeme stack + parçalama güncellemesi |
| 13 | `rls-market.sql` | Pazar RLS |
| 14 | `add-market-listing-rls.sql` | Pazarda ilan eşyası okuma |
| 15 | `seed-quests.sql` | Bozkır seferleri |
| 16 | `seed-quest-types.sql` | Bonus / seviye görevleri |
| 17 | `seed-mounts.sql` | Binek görselleri (Bozkır, Ahal, Tulpar) |

**Atlanabilir (eski kurulum parçaları — yukarıdakiler yeterli):**
- `add-equipped-slot.sql`, `add-bag-system.sql`, `add-quest-system.sql` → `schema-base` içinde
- `add-clan-party-system.sql`, `add-social-system.sql` → `setup-clan-party-social` içinde

---

## Aşama 4 — Google ile giriş (Auth)

### 4a) Supabase

**Authentication → Providers → Google** → Enable

**Authentication → URL Configuration**

| Alan | Değer |
|------|--------|
| Site URL | `https://budunonline.com.tr` (canlı) veya Vercel preview URL |
| Redirect URLs | `https://budunonline.com.tr/auth/callback` |
| | `http://localhost:3000/auth/callback` |
| | `https://<vercel-preview>.vercel.app/auth/callback` |

### 4b) Google Cloud Console

[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client

**Authorized redirect URIs** (Supabase’in istediği):

```
https://<PROJE-REF>.supabase.co/auth/v1/callback
```

Client ID + Secret → Supabase Google provider alanlarına yapıştır.

---

## Aşama 5 — Vercel environment variables

**Vercel → Project → Settings → Environment Variables**

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_SITE_URL` | `https://budunonline.com.tr` |

Production + Preview + Development için ekleyin.

**Deployments → Redeploy** (son deploy’u “Use existing build cache” kapalı yeniden çalıştırın).

---

## Aşama 6 — Lokal geliştirme (isteğe bağlı)

Proje kökünde `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev
```

---

## Aşama 7 — Smoke test (oynanabilirlik)

1. Site açılıyor mu?
2. **Google ile giriş** → `/characters` → karakter oluştur
3. **Kahraman → Heybe** — başlangıç eşyaları var mı?
4. **Macera → Görev** — Test Seferi (10 sn) başlat, ödül geliyor mu?
5. **Pazar** — ilan ver / al (varsa 2. hesap)
6. **Oba → Klan / Parti** — tablo açılıyor mu?

---

## Eski site ile çakışma

- Eski `budunonline.com.tr` **eski Supabase key** kullanıyorsa → etkilenmez
- Vercel env’lerini **yeni key** ile güncellerseniz → site yeni (boş) DB’ye bağlanır
- Domain tek Vercel projesinde kalır; sadece env değişir

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Login sonrası hata | Redirect URL’leri Supabase + Google’da kontrol |
| Karakter oluşturulamıyor | `rls-characters.sql` çalıştı mı? |
| Heybe boş | `seed-item-sets.sql` + karakter yeniden oluştur |
| Görev başlamıyor | `seed-quests.sql` + `rls-quests.sql` |
| Pazar RPC hatası | `add-market-system.sql` + `rls-market.sql` |
| Build deploy hatası | Vercel env boş mu? Redeploy |

---

## Sonraki adım (güvenlik / prod)

Oynanabilir olduktan sonra:

- RLS politikalarını gözden geçir
- Rate limiting / WAF (Vercel veya Cloudflare)
- Supabase backup planı
- `service_role` sadece sunucu tarafı script’lerde (şu an oyunda kullanılmıyor)
