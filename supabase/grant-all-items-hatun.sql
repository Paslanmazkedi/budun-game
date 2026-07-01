-- Tüm orta çağ set eşyalarını karakterin çantalarına ver (tak-çıkar testi)
-- Sıra: seed-item-sets.sql → (bu dosya)
-- equipped_slot / bag_id yoksa script otomatik ekler.
-- Supabase SQL Editor'da çalıştırın.

-- PaslanmazKedi
-- id:      d9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9
-- user_id: 73fdd52b-c8dc-464e-a2b7-f3334f58f199
-- name:    PaslanmazKedi

BEGIN;

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS equipped_slot text;

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS bag_id text NOT NULL DEFAULT 'bag1';

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS bag_unlock_level smallint NOT NULL DEFAULT 1;

DO $$
DECLARE
  v_character_id uuid := 'd9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9';
  item_count int;
  char_name text;
BEGIN
  SELECT name INTO char_name
  FROM characters
  WHERE id = v_character_id
    AND user_id = '73fdd52b-c8dc-464e-a2b7-f3334f58f199';

  IF char_name IS NULL THEN
    RAISE EXCEPTION 'Karakter bulunamadı: id=d9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9, user_id=73fdd52b-c8dc-464e-a2b7-f3334f58f199';
  END IF;

  DELETE FROM character_items WHERE character_id = v_character_id;

  -- 75 eşya → 3 çanta (30+30+15)
  UPDATE characters SET bag_unlock_level = 3 WHERE id = v_character_id;

  INSERT INTO character_items (character_id, item_template_id, equipped_slot, bag_id)
  SELECT
    v_character_id,
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

  RAISE NOTICE '% (%) — % eşya çantalara eklendi (bag1+bag2+bag3).', char_name, v_character_id, item_count;
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
WHERE c.id = 'd9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9'
GROUP BY c.id, c.user_id, c.name, c.bag_unlock_level;
