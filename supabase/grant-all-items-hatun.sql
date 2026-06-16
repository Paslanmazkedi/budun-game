-- Tüm orta çağ set eşyalarını Hatun karakterinin çantalarına ver (tak-çıkar testi)
-- Sıra: seed-item-sets.sql → (bu dosya)
-- equipped_slot / bag_id yoksa script otomatik ekler.
-- Supabase SQL Editor'da çalıştırın.

-- Hatun
-- id:      9ac82f84-24b7-43a9-a8f5-4908c36f0682
-- user_id: c73a3e88-fc53-4535-88b1-5880b23409b2
-- name:    Hatun

BEGIN;

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS equipped_slot text;

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS bag_id text NOT NULL DEFAULT 'bag1';

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bag_unlock_level smallint NOT NULL DEFAULT 1;

DO $$
DECLARE
  hatun_id uuid := '9ac82f84-24b7-43a9-a8f5-4908c36f0682';
  item_count int;
  char_name text;
BEGIN
  SELECT name INTO char_name
  FROM characters
  WHERE id = hatun_id
    AND user_id = 'c73a3e88-fc53-4535-88b1-5880b23409b2';

  IF char_name IS NULL THEN
    RAISE EXCEPTION 'Karakter bulunamadı: id=9ac82f84-24b7-43a9-a8f5-4908c36f0682, user_id=c73a3e88-fc53-4535-88b1-5880b23409b2';
  END IF;

  DELETE FROM character_items WHERE character_id = hatun_id;

  -- 75 eşya → 3 çanta (30+30+15)
  UPDATE characters SET bag_unlock_level = 3 WHERE id = hatun_id;

  INSERT INTO character_items (character_id, item_template_id, equipped_slot, bag_id)
  SELECT
    hatun_id,
    t.id,
    NULL,
    CASE
      WHEN t.row_num <= 30 THEN 'bag1'
      WHEN t.row_num <= 60 THEN 'bag2'
      ELSE 'bag3'
    END
  FROM (
    SELECT id, row_number() OVER (ORDER BY slug) AS row_num
    FROM item_templates
    WHERE id::text LIKE 'a102%'
  ) t;

  GET DIAGNOSTICS item_count = ROW_COUNT;

  RAISE NOTICE '% (%) — % eşya çantalara eklendi (bag1+bag2+bag3).', char_name, hatun_id, item_count;
END $$;

COMMIT;

-- Kontrol
SELECT
  c.id,
  c.user_id,
  c.name,
  c.bag_unlock_level,
  count(ci.id) AS toplam_esya,
  count(*) FILTER (WHERE ci.bag_id = 'bag1') AS bag1,
  count(*) FILTER (WHERE ci.bag_id = 'bag2') AS bag2,
  count(*) FILTER (WHERE ci.bag_id = 'bag3') AS bag3
FROM characters c
JOIN character_items ci ON ci.character_id = c.id
WHERE c.id = '9ac82f84-24b7-43a9-a8f5-4908c36f0682'
GROUP BY c.id, c.user_id, c.name, c.bag_unlock_level;
