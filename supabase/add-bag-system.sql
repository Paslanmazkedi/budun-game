-- Çanta sistemi: 3 çanta (30 slot / çanta), bag_unlock_level karakterde
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bag_unlock_level smallint NOT NULL DEFAULT 1;

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS bag_id text NOT NULL DEFAULT 'bag1';

COMMENT ON COLUMN characters.bag_unlock_level IS '1=Çanta I, 2=+Çanta II, 3=+Çanta III';
COMMENT ON COLUMN character_items.bag_id IS 'bag1 | bag2 | bag3 — hangi çantada';

-- Mevcut eşyalar çanta I'da
UPDATE character_items SET bag_id = 'bag1' WHERE bag_id IS NULL OR bag_id = '';
