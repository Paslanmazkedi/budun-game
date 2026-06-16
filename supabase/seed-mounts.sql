-- Üç binek: Bozkır Atı, Ahal Teke, Tulpar
-- Görsel eşlemesi: lib/mount-assets.ts
-- slug UNIQUE olduğu için önce a102 kopyaları geçici slug alır, sonra a101 kanonik olur.

BEGIN;

-- 1) a102 binek şablonları kanonik slug'ları serbest bırak (loot tabloları id ile bağlı kalır)
UPDATE item_templates SET
  slug = 'legacy-mount-bozkir-a102',
  name = 'Bozkır Atı',
  emoji = '🐎'
WHERE id = 'a1020601-0001-4000-8000-000000000002';

UPDATE item_templates SET
  slug = 'legacy-mount-ahal-a102',
  name = 'Ahal Teke',
  emoji = '🐎'
WHERE id = 'a1020601-0001-4000-8000-000000000003';

UPDATE item_templates SET
  slug = 'legacy-mount-tulpar-a102',
  name = 'Tulpar',
  emoji = '🦄'
WHERE id = 'a1020601-0001-4000-8000-000000000005';

-- 2) Diğer eski binek slug'larını da temizle (varsa)
UPDATE item_templates SET slug = 'legacy-mount-common-a101'
WHERE id = 'a1011001-0001-4000-8000-000000000001'
  AND slug IN ('mount-bozkir-at', 'mount-ahal-teke', 'mount-tulpar');

UPDATE item_templates SET slug = 'legacy-mount-war-a101'
WHERE id = 'a1011001-0001-4000-8000-000000000004'
  AND slug IN ('mount-bozkir-at', 'mount-ahal-teke', 'mount-tulpar');

-- 3) Kanonik üç at (a101) — oyunda kullanılan slug'lar
UPDATE item_templates SET
  slug = 'mount-bozkir-at',
  name = 'Bozkır Atı',
  emoji = '🐎',
  slot = 'MOUNT',
  rarity = 'NORMAL'
WHERE id = 'a1011001-0001-4000-8000-000000000002';

UPDATE item_templates SET
  slug = 'mount-ahal-teke',
  name = 'Ahal Teke',
  emoji = '🐎',
  slot = 'MOUNT',
  rarity = 'RARE'
WHERE id = 'a1011001-0001-4000-8000-000000000003';

UPDATE item_templates SET
  slug = 'mount-tulpar',
  name = 'Tulpar',
  emoji = '🦄',
  slot = 'MOUNT',
  rarity = 'UNIQUE'
WHERE id = 'a1011001-0001-4000-8000-000000000005';

-- 4) Satır yoksa ekle (yeni kurulum)
INSERT INTO item_templates (id, slug, name, emoji, slot, rarity) VALUES
  ('a1011001-0001-4000-8000-000000000002', 'mount-bozkir-at', 'Bozkır Atı', '🐎', 'MOUNT', 'NORMAL'),
  ('a1011001-0001-4000-8000-000000000003', 'mount-ahal-teke', 'Ahal Teke', '🐎', 'MOUNT', 'RARE'),
  ('a1011001-0001-4000-8000-000000000005', 'mount-tulpar', 'Tulpar', '🦄', 'MOUNT', 'UNIQUE')
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity;

COMMIT;
