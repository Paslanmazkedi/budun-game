# Supabase — eşya yönetimi (Faz 1.0)

## Eşyaları nereden yönetiyoruz?

| Ne | Dosya / yer |
|----|-------------|
| Tanım (isim, emoji, slot, nadirlik) | `lib/item-catalog.ts` |
| Nadirlik renkleri & loot ağırlığı | `lib/item-rarity.ts` |
| Heybe slot sayısı (UI) | `lib/inventory-bags.ts` → 30 slot / çanta, 3 çanta |
| DB’ye yükleme | `supabase/seed-phase1-items.sql` |
| Test: tüm eşyaları bir karaktere ver | `supabase/grant-all-items-hatun.sql` |

**Akış:** Önce katalogda eşya ekle/düzenle → `seed-phase1-items.sql` ile Supabase’e upsert → oyunda görünür.

## Boy / Parti / Arkadaş / Sohbet (sosyal sistem)

**Tek seferde kurulum (önerilen):**

1. `setup-clan-party-social.sql` — tablolar (clans, parties, friends, chat…)
2. `setup-clan-party-social-rls.sql` — tüm RLS politikaları
3. `add-chat-retention.sql` — sohbet kanal başına 30 mesaj + parti silince temizlik

`add-social-system.sql` **parties tablosu olmadan çalışmaz** — önce `setup-clan-party-social.sql` gerekir.

Parça parça kurulum sırası: `add-clan-party-system.sql` → `add-social-system.sql` → `rls-clan-party.sql` → `rls-social.sql`

## 1. Eşya kataloğu (ilk kurulum)

1. Supabase Dashboard → **SQL Editor**
2. `add-equipped-slot.sql` — bir kez (kuşanma için `equipped_slot` kolonu)
3. `add-bag-system.sql` — çanta I–III (`bag_id`, `bag_unlock_level`)
4. `rls-character-items.sql` — kuşanma / çanta için UPDATE yetkisi (RLS)
5. `add-quest-system.sql` — görev zorluk + ödül kaydı kolonları
6. `rls-quests.sql` — quest_log güncelleme yetkisi
7. `rls-characters.sql` — görev XP/akçe kaydı (characters UPDATE)
7. `seed-item-sets.sql` — eşya tanımları + 4 loot havuzu
8. `rls-loot-tables.sql` — ganimet tablolarını okuma
9. `setup-clan-party-social.sql` — **boy + parti + arkadaş + sohbet (tek dosya)**
10. `setup-clan-party-social-rls.sql` — sosyal RLS (tek dosya)
11. `seed-quests.sql` — bozkır seferleri
12. `seed-quest-types.sql` — bonus, seviye ve farm görevleri

(Eski parça dosyalar: `add-clan-party-system.sql`, `add-social-system.sql`, `rls-clan-party.sql`, `rls-social.sql`)

### Loot havuzları (`lib/content-loot.ts`)

| Kaynak | Tablo | Düşen nadirlik |
|--------|--------|----------------|
| Görev | Görev Ganimeti | Yaygın, Normal |
| Zindan (Kapı Geçidi) | Zindan Ganimeti | Nadir |
| Grup zindan (Gök Börü) | Grup Zindan Ganimeti | Nadir, Üstün |
| Haftalık dünya boss | Dünya Boss Ganimeti | Eşsiz |

Görev zorlukları: `test` (10 sn), `easy`, `normal`, `hard` — süre, ödül ve düşme şansı `lib/quest-config.ts` ile senkron.

Tamamlanan görevler `quest_log` tablosunda `reward_xp_granted`, `reward_gold_granted`, `loot_item_template_id` ile kayıt altına alınır. Oyuncu arayüzünde **Macera → Görevler → Sefer Defteri** sekmesinde görünür.

Bu script:

- `item_templates` tablosuna `emoji` ve `slug` kolonlarını ekler (yoksa)
- 50 emoji eşyayı upsert eder (silah, zırh, takı, binek — 5 nadirlik × 10 slot)
- Görev loot tablosunu (`31afb626-fc14-43eb-a62a-dbd9ac8bc0ea`) tüm eşyalarla doldurur

## 2. Hatun karakterine tüm eşyalar (tak-çıkar testi)

1. Oyunda **Hatun** karakterinin (`9ac82f84-24b7-43a9-a8f5-4908c36f0682`) olması gerekir.
2. SQL Editor’da `grant-all-items-hatun.sql` çalıştırın.

Script mevcut heybeyi temizler ve ~50 faz 1 eşyayı heybeye ekler (kuşanılmış değil).

3. Oyunda **Kahraman → Heybe** sayfasına git, eşyaya dokun → slota dokun.

Başka karakter için script içindeki `hatun_id` ve `user_id` değerlerini güncelleyin.

## Nadirlik renkleri (UI)

| Kod    | Etiket  | Loot ağırlığı |
|--------|---------|---------------|
| COMMON | Yaygın | 40            |
| NORMAL | Normal  | 28            |
| RARE   | Nadir   | 18            |
| HIGH   | Üstün   | 8             |
| UNIQUE | Eşsiz   | 2             |

Görevlerde ~72% şansla bir eşya düşer; hangi eşya geleceği ağırlıklı seçimle belirlenir.

## Yeni karakterler

Karakter oluşturulduğunda otomatik başlangıç seti verilir:

- Ahşap Sopası, Deri Yelek, Deri Başlık, Deri Çizme, Eski At

## Mevcut karakterler

Seed sonrası eski karakterlere başlangıç seti vermek için (isteğe bağlı):

```sql
-- Örnek: tek karakter
INSERT INTO character_items (character_id, item_template_id)
SELECT 'KARAKTER_UUID', id FROM item_templates
WHERE slug IN (
  'weapon-common-club', 'armor-common-vest', 'helmet-common-cap',
  'boots-common-leather', 'mount-common-horse'
)
ON CONFLICT DO NOTHING;
```

`equipped_slot` için `add-equipped-slot.sql` çalıştırın veya `grant-all-items-hatun.sql` (kolonu otomatik ekler).
