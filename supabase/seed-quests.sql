-- Bozkır seferleri (görev kataloğu)
-- Sıra: add-quest-system.sql → seed-item-sets.sql → (bu dosya)
-- Supabase SQL Editor'da çalıştırın.

BEGIN;

INSERT INTO quests (
  id,
  name,
  duration_seconds,
  reward_xp,
  reward_gold,
  difficulty,
  description,
  loot_table_id,
  item_drop_rate,
  sort_order,
  is_active
) VALUES
  (
    'c3010001-0001-4000-8000-000000000001',
    'Test Seferi',
    10,
    5,
    5,
    'test',
    'Geliştirici testi — 10 saniye. Tüm eşya kataloğundan şans eseri drop (sandbox).',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    90,
    0,
    true
  ),
  (
    'c3010002-0001-4000-8000-000000000001',
    'Bozkır Avı',
    60,
    25,
    15,
    'easy',
    'Kısa av seferi. Kolay zorluk, orta düşme şansı.',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    50,
    10,
    true
  ),
  (
    'c3010003-0001-4000-8000-000000000001',
    'Kervan Koruma',
    180,
    60,
    40,
    'normal',
    'Kervanı koru, ganimet getir. Standart bozkır seferi.',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    62,
    20,
    true
  ),
  (
    'c3010004-0001-4000-8000-000000000001',
    'Uzak Diyar Keşfi',
    300,
    120,
    80,
    'hard',
    'Uzun keşif — daha fazla XP ve akçe, yüksek eşya şansı.',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    72,
    30,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  duration_seconds = EXCLUDED.duration_seconds,
  reward_xp = EXCLUDED.reward_xp,
  reward_gold = EXCLUDED.reward_gold,
  difficulty = EXCLUDED.difficulty,
  description = EXCLUDED.description,
  loot_table_id = EXCLUDED.loot_table_id,
  item_drop_rate = EXCLUDED.item_drop_rate,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

COMMIT;

SELECT name, difficulty, duration_seconds, reward_xp, reward_gold, item_drop_rate, sort_order
FROM quests
WHERE is_active
ORDER BY sort_order, name;
