-- Bonus ve seviye görev örnekleri
BEGIN;

UPDATE quests SET quest_type = 'standard' WHERE quest_type IS NULL OR quest_type = '';

INSERT INTO quests (
  id, name, duration_seconds, reward_xp, reward_gold, difficulty, description,
  loot_table_id, item_drop_rate, sort_order, is_active, quest_type, min_level,
  available_until
) VALUES (
  'c3010005-0001-4000-8000-000000000001',
  'Bozkır Bonusu',
  120,
  80,
  50,
  'normal',
  'Ara sıra çıkan bonus sefer — ekstra ganimet şansı.',
  '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
  85,
  5,
  true,
  'bonus',
  1,
  now() + interval '7 days'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  quest_type = EXCLUDED.quest_type,
  available_until = EXCLUDED.available_until,
  is_active = EXCLUDED.is_active;

INSERT INTO quests (
  id, name, duration_seconds, reward_xp, reward_gold, difficulty, description,
  loot_table_id, item_drop_rate, sort_order, is_active, quest_type, min_level
) VALUES (
  'c3010006-0001-4000-8000-000000000001',
  'Veteran Keşfi',
  240,
  100,
  70,
  'hard',
  'Seviye 8+ savaşçılar için uzun keşif.',
  '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
  70,
  40,
  true,
  'level_gate',
  8
) ON CONFLICT (id) DO UPDATE SET
  quest_type = EXCLUDED.quest_type,
  min_level = EXCLUDED.min_level;

-- Farm görevleri (parti ile — ileride parti zorunlu)
INSERT INTO quests (
  id, name, duration_seconds, reward_xp, reward_gold, difficulty, description,
  loot_table_id, item_drop_rate, sort_order, is_active, quest_type,
  farm_zone_id, party_size_required, min_level
) VALUES
  (
    'c3010007-0001-4000-8000-000000000001',
    'Orman Temizliği',
    180,
    45,
    30,
    'easy',
    'Yosun Orman farm — 3 kişilik parti gerekir.',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    60,
    50,
    true,
    'farm',
    'yosun-orman',
    3,
    1
  ),
  (
    'c3010008-0001-4000-8000-000000000001',
    'Harabe Baskını',
    300,
    150,
    100,
    'hard',
    'Eski Harabe — 8 kişilik tam parti.',
    '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea',
    75,
    55,
    true,
    'farm',
    'eski-harabe',
    8,
    10
  )
ON CONFLICT (id) DO UPDATE SET
  quest_type = EXCLUDED.quest_type,
  farm_zone_id = EXCLUDED.farm_zone_id,
  party_size_required = EXCLUDED.party_size_required;

COMMIT;
