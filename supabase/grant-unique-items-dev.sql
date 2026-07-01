-- Eşsiz (UNIQUE) teçhizat + tüm binekler — mevcut heybe temizlenir (çanta kilidi korunur)
-- Önkoşul: seed-item-sets.sql + seed-mounts.sql
-- Supabase SQL Editor'da çalıştırın.

-- PaslanmazKedi
-- id:      d9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9
-- user_id: 73fdd52b-c8dc-464e-a2b7-f3334f58f199
-- name:    PaslanmazKedi

BEGIN;

DO $$
DECLARE
  v_character_id uuid := 'd9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9';
  v_user_id uuid := '73fdd52b-c8dc-464e-a2b7-f3334f58f199';
  v_character_name text;
  v_deleted int;
  v_added int;
BEGIN
  SELECT name INTO v_character_name
  FROM characters
  WHERE id = v_character_id AND user_id = v_user_id;

  IF v_character_name IS NULL THEN
    RAISE EXCEPTION 'Karakter bulunamadı: id=%, user_id=%', v_character_id, v_user_id;
  END IF;

  -- Aktif pazar ilanları (varsa) character_items silinince cascade düşer
  DELETE FROM character_items WHERE character_id = v_character_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Çanta sayısı / bag_unlock_level dokunulmaz; sadece eşya içeriği sıfırlandı
  UPDATE characters
  SET bag_unlock_level = GREATEST(bag_unlock_level, 1)
  WHERE id = v_character_id;

  INSERT INTO character_items (character_id, item_template_id, equipped_slot, bag_id, quantity)
  SELECT
    v_character_id,
    t.id,
    NULL,
    'bag1',
    1
  FROM item_templates t
  WHERE t.rarity = 'UNIQUE'
     OR upper(t.slot) = 'MOUNT'
  ORDER BY
    CASE WHEN upper(t.slot) = 'MOUNT' THEN 0 ELSE 1 END,
    t.slot,
    t.slug;

  GET DIAGNOSTICS v_added = ROW_COUNT;

  RAISE NOTICE '% — % eski eşya silindi, % eşya eklendi (Eşsiz + tüm binekler).',
    v_character_name, v_deleted, v_added;
END $$;

COMMIT;

-- Özet
SELECT
  c.name AS karakter,
  c.bag_unlock_level AS acik_canta,
  it.rarity,
  it.slot,
  it.slug,
  it.name AS esya,
  it.emoji
FROM characters c
JOIN character_items ci ON ci.character_id = c.id
JOIN item_templates it ON it.id = ci.item_template_id
WHERE c.id = 'd9d5c7d0-0e17-4c0b-b8fd-415394d6f2f9'
ORDER BY
  CASE WHEN upper(it.slot) = 'MOUNT' THEN 0 ELSE 1 END,
  it.slot,
  it.name;
