-- Faz 1.0: Emoji teçhizat kataloğu
-- Supabase SQL Editor'da çalıştırın.

BEGIN;

ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS emoji text;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS item_templates_slug_idx ON item_templates (slug);

INSERT INTO item_templates (id, slug, name, emoji, slot, rarity) VALUES
  ('a1010101-0001-4000-8000-000000000001', 'weapon-common-club', 'Ahşap Sopası', '🪵', 'WEAPON', 'COMMON'),
  ('a1010101-0001-4000-8000-000000000002', 'weapon-normal-sword', 'Kısa Kılıç', '🗡️', 'WEAPON', 'NORMAL'),
  ('a1010101-0001-4000-8000-000000000003', 'weapon-rare-saber', 'Bozkır Kılıcı', '⚔️', 'WEAPON', 'RARE'),
  ('a1010101-0001-4000-8000-000000000004', 'weapon-high-spear', 'Tengri Mızrağı', '🔱', 'WEAPON', 'HIGH'),
  ('a1010101-0001-4000-8000-000000000005', 'weapon-unique-axe', 'Kurt Dişi Balta', '🪓', 'WEAPON', 'UNIQUE'),
  ('a1010201-0001-4000-8000-000000000001', 'helmet-common-cap', 'Deri Başlık', '🧢', 'HELMET', 'COMMON'),
  ('a1010201-0001-4000-8000-000000000002', 'helmet-normal-iron', 'Demir Miğfer', '⛑️', 'HELMET', 'NORMAL'),
  ('a1010201-0001-4000-8000-000000000003', 'helmet-rare-steppe', 'Bozkır Miğferi', '🪖', 'HELMET', 'RARE'),
  ('a1010201-0001-4000-8000-000000000004', 'helmet-high-crown', 'Şaman Tacı', '👑', 'HELMET', 'HIGH'),
  ('a1010201-0001-4000-8000-000000000005', 'helmet-unique-moon', 'Ay Tacı', '🌙', 'HELMET', 'UNIQUE'),
  ('a1010301-0001-4000-8000-000000000001', 'armor-common-vest', 'Deri Yelek', '🥋', 'ARMOR', 'COMMON'),
  ('a1010301-0001-4000-8000-000000000002', 'armor-normal-plate', 'Demir Zırh', '🛡️', 'ARMOR', 'NORMAL'),
  ('a1010301-0001-4000-8000-000000000003', 'armor-rare-war', 'Savaşçı Zırhı', '🦺', 'ARMOR', 'RARE'),
  ('a1010301-0001-4000-8000-000000000004', 'armor-high-wolf', 'Kurt Postu', '🐺', 'ARMOR', 'HIGH'),
  ('a1010301-0001-4000-8000-000000000005', 'armor-unique-gold', 'Altın Ordu Zırhı', '✨', 'ARMOR', 'UNIQUE'),
  ('a1010401-0001-4000-8000-000000000001', 'offhand-common-shield', 'Ahşap Kalkan', '🪵', 'OFFHAND', 'COMMON'),
  ('a1010401-0001-4000-8000-000000000002', 'offhand-normal-shield', 'Demir Kalkan', '🛡️', 'OFFHAND', 'NORMAL'),
  ('a1010401-0001-4000-8000-000000000003', 'offhand-rare-shield', 'Bozkır Kalkanı', '🔰', 'OFFHAND', 'RARE'),
  ('a1010401-0001-4000-8000-000000000004', 'offhand-high-totem', 'Totem Kalkan', '🗿', 'OFFHAND', 'HIGH'),
  ('a1010401-0001-4000-8000-000000000005', 'offhand-unique-sun', 'Güneş Kalkan', '☀️', 'OFFHAND', 'UNIQUE'),
  ('a1010501-0001-4000-8000-000000000001', 'boots-common-leather', 'Deri Çizme', '👞', 'BOOTS', 'COMMON'),
  ('a1010501-0001-4000-8000-000000000002', 'boots-normal-iron', 'Demir Çizme', '🥾', 'BOOTS', 'NORMAL'),
  ('a1010501-0001-4000-8000-000000000003', 'boots-rare-walker', 'Yürüyücü Çizme', '👢', 'BOOTS', 'RARE'),
  ('a1010501-0001-4000-8000-000000000004', 'boots-high-wind', 'Rüzgar Çizme', '💨', 'BOOTS', 'HIGH'),
  ('a1010501-0001-4000-8000-000000000005', 'boots-unique-storm', 'Yıldırım Çizme', '⚡', 'BOOTS', 'UNIQUE'),
  ('a1010601-0001-4000-8000-000000000001', 'amulet-common-stone', 'Taş Muska', '🔮', 'AMULET', 'COMMON'),
  ('a1010601-0001-4000-8000-000000000002', 'amulet-normal-bronze', 'Bronz Muska', '📿', 'AMULET', 'NORMAL'),
  ('a1010601-0001-4000-8000-000000000003', 'amulet-rare-wolf', 'Kurt Muska', '🐾', 'AMULET', 'RARE'),
  ('a1010601-0001-4000-8000-000000000004', 'amulet-high-moon', 'Ay Muska', '🌙', 'AMULET', 'HIGH'),
  ('a1010601-0001-4000-8000-000000000005', 'amulet-unique-sky', 'Tengri Muska', '✨', 'AMULET', 'UNIQUE'),
  ('a1010701-0001-4000-8000-000000000001', 'ring-common-bronze', 'Bronz Yüzük', '💍', 'RING', 'COMMON'),
  ('a1010701-0001-4000-8000-000000000002', 'ring-normal-silver', 'Gümüş Yüzük', '💎', 'RING', 'NORMAL'),
  ('a1010701-0001-4000-8000-000000000003', 'ring-rare-moon', 'Ay Yüzüğü', '🌙', 'RING', 'RARE'),
  ('a1010701-0001-4000-8000-000000000004', 'ring-high-fire', 'Bozkır Yüzük', '🔥', 'RING', 'HIGH'),
  ('a1010701-0001-4000-8000-000000000005', 'ring-unique-royal', 'Hakan Yüzüğü', '👑', 'RING', 'UNIQUE'),
  ('a1010801-0001-4000-8000-000000000001', 'bracelet-common-leather', 'Deri Bileklik', '⌚', 'BRACELET', 'COMMON'),
  ('a1010801-0001-4000-8000-000000000002', 'bracelet-normal-chain', 'Demir Bileklik', '⛓️', 'BRACELET', 'NORMAL'),
  ('a1010801-0001-4000-8000-000000000003', 'bracelet-rare-war', 'Savaş Bilekliği', '🤜', 'BRACELET', 'RARE'),
  ('a1010801-0001-4000-8000-000000000004', 'bracelet-high-totem', 'Totem Bilek', '🗿', 'BRACELET', 'HIGH'),
  ('a1010801-0001-4000-8000-000000000005', 'bracelet-unique-gold', 'Altın Bilek', '✨', 'BRACELET', 'UNIQUE'),
  ('a1010901-0001-4000-8000-000000000001', 'belt-common-leather', 'Deri Kemer', '🎗️', 'BELT', 'COMMON'),
  ('a1010901-0001-4000-8000-000000000002', 'belt-normal-iron', 'Demir Kemer', '🔗', 'BELT', 'NORMAL'),
  ('a1010901-0001-4000-8000-000000000003', 'belt-rare-war', 'Savaş Kemeri', '⚔️', 'BELT', 'RARE'),
  ('a1010901-0001-4000-8000-000000000004', 'belt-high-knight', 'Şövalye Kemer', '🏅', 'BELT', 'HIGH'),
  ('a1010901-0001-4000-8000-000000000005', 'belt-unique-khan', 'Hakan Kemeri', '👑', 'BELT', 'UNIQUE'),
  ('a1011001-0001-4000-8000-000000000001', 'mount-common-horse', 'Eski At', '🐴', 'MOUNT', 'COMMON'),
  ('a1011001-0001-4000-8000-000000000002', 'mount-bozkir-at', 'Bozkır Atı', '🐎', 'MOUNT', 'NORMAL'),
  ('a1011001-0001-4000-8000-000000000003', 'mount-ahal-teke', 'Ahal Teke', '🐎', 'MOUNT', 'RARE'),
  ('a1011001-0001-4000-8000-000000000004', 'mount-high-war', 'Savaş Atı', '🦓', 'MOUNT', 'HIGH'),
  ('a1011001-0001-4000-8000-000000000005', 'mount-tulpar', 'Tulpar', '🦄', 'MOUNT', 'UNIQUE')
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity;

INSERT INTO loot_tables (id, name)
VALUES ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'Görev Ganimeti')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

DELETE FROM loot_table_items
WHERE loot_table_id = '31afb626-fc14-43eb-a62a-dbd9ac8bc0ea';

INSERT INTO loot_table_items (loot_table_id, item_template_id, drop_chance) VALUES
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010101-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010101-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010101-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010101-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010101-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010201-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010201-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010201-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010201-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010201-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010301-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010301-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010301-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010301-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010301-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010401-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010401-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010401-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010401-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010401-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010501-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010501-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010501-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010501-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010501-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010601-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010601-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010601-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010601-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010601-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010701-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010701-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010701-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010701-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010701-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010801-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010801-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010801-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010801-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010801-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010901-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010901-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010901-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010901-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1010901-0001-4000-8000-000000000005', 2),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1011001-0001-4000-8000-000000000001', 40),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1011001-0001-4000-8000-000000000002', 28),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1011001-0001-4000-8000-000000000003', 18),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1011001-0001-4000-8000-000000000004', 8),
  ('31afb626-fc14-43eb-a62a-dbd9ac8bc0ea', 'a1011001-0001-4000-8000-000000000005', 2);

COMMIT;
