-- Heybe slot kapasitesi: kalıcı inventory_slot_capacity + görünür grid (inventory_display_slots)
-- Eski bag_unlock_level değerleri migrate edilir. Max 96 slot / karakter.
-- Supabase SQL Editor'da bir kez çalıştırın (add-bag-system.sql sonrası).

BEGIN;

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS inventory_slot_capacity smallint;

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS inventory_display_slots smallint;

UPDATE characters
SET
  inventory_slot_capacity = COALESCE(
    inventory_slot_capacity,
    LEAST(
      96,
      GREATEST(
        20,
        CASE COALESCE(bag_unlock_level, 1)
          WHEN 3 THEN 90
          WHEN 2 THEN 60
          ELSE 30
        END
      )
    )
  ),
  inventory_display_slots = COALESCE(
    inventory_display_slots,
    LEAST(
      96,
      GREATEST(
        20,
        CASE COALESCE(bag_unlock_level, 1)
          WHEN 3 THEN 90
          WHEN 2 THEN 60
          ELSE 30
        END
      )
    )
  );

ALTER TABLE characters
ALTER COLUMN inventory_slot_capacity SET DEFAULT 20;

ALTER TABLE characters
ALTER COLUMN inventory_display_slots SET DEFAULT 20;

ALTER TABLE characters
ALTER COLUMN inventory_slot_capacity SET NOT NULL;

ALTER TABLE characters
ALTER COLUMN inventory_display_slots SET NOT NULL;

ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_inventory_slot_capacity_check;
ALTER TABLE characters ADD CONSTRAINT characters_inventory_slot_capacity_check
  CHECK (inventory_slot_capacity >= 20 AND inventory_slot_capacity <= 96);

ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_inventory_display_slots_check;
ALTER TABLE characters ADD CONSTRAINT characters_inventory_display_slots_check
  CHECK (
    inventory_display_slots >= 20
    AND inventory_display_slots <= 96
  );

COMMENT ON COLUMN characters.inventory_display_slots IS 'Heybe UI: gösterilen boş slot sayısı (<= efektif kapasite, max 96)';

-- ── Görünür grid genişletme (ücretsiz, kapasiteye kadar) ─────────────────────

CREATE OR REPLACE FUNCTION expand_inventory_display(
  p_character_id uuid,
  p_display_slots smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_capacity smallint;
BEGIN
  IF p_display_slots < 20 OR p_display_slots > 96 THEN
    RAISE EXCEPTION 'Geçersiz görünür slot sayısı';
  END IF;

  SELECT user_id, inventory_slot_capacity
  INTO v_user_id, v_capacity
  FROM characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Karakter bulunamadı';
  END IF;

  IF p_display_slots > v_capacity THEN
    RAISE EXCEPTION 'Görünür slot kapasiteden fazla olamaz';
  END IF;

  UPDATE characters
  SET inventory_display_slots = p_display_slots
  WHERE id = p_character_id;

  RETURN jsonb_build_object('inventory_display_slots', p_display_slots);
END;
$$;

-- Slot satın alma: add-premium-commerce.sql (Kut Taşı — oyun akçesi değil)

GRANT EXECUTE ON FUNCTION expand_inventory_display(uuid, smallint) TO authenticated;

COMMIT;
