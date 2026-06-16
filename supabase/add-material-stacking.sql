-- Malzeme birikimi (envanter stack) + parçalama güncellemesi
-- add-market-system.sql sonrası çalıştırın

ALTER TABLE character_items
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1);

-- Craft malzemeleri
INSERT INTO item_templates (id, slug, name, emoji, slot, rarity) VALUES
  ('a1030001-0001-4000-8000-000000000001', 'mat_bozkir_parcasi', 'Bozkır Parçası', '🔩', 'MATERIAL', 'COMMON'),
  ('a1030001-0001-4000-8000-000000000002', 'mat_nadir_tas', 'Nadir Taş', '💎', 'MATERIAL', 'RARE')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION grant_stackable_item(
  p_character_id uuid,
  p_template_slug text,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_item_id uuid;
  v_qty integer;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'Geçersiz miktar';
  END IF;

  SELECT id INTO v_template_id
  FROM item_templates
  WHERE slug = p_template_slug;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Malzeme şablonu bulunamadı: %', p_template_slug;
  END IF;

  SELECT ci.id, ci.quantity
  INTO v_item_id, v_qty
  FROM character_items ci
  WHERE ci.character_id = p_character_id
    AND ci.item_template_id = v_template_id
    AND ci.equipped_slot IS NULL
  ORDER BY ci.bag_id NULLS LAST, ci.id
  LIMIT 1
  FOR UPDATE;

  IF v_item_id IS NOT NULL THEN
    UPDATE character_items
    SET quantity = v_qty + p_amount
    WHERE id = v_item_id;
  ELSE
    INSERT INTO character_items (character_id, item_template_id, bag_id, quantity)
    VALUES (p_character_id, v_template_id, 'bag1', p_amount);
  END IF;
END;
$$;

-- Eski sürüm integer döndürüyordu; jsonb'ye geçiş için önce kaldır
DROP FUNCTION IF EXISTS dismantle_character_item(uuid);

CREATE OR REPLACE FUNCTION dismantle_character_item(p_character_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_character_id uuid;
  v_equipped text;
  v_rarity text;
  v_material_slug text;
  v_material_name text;
  v_amount integer;
BEGIN
  SELECT ci.character_id, ci.equipped_slot, it.rarity
  INTO v_character_id, v_equipped, v_rarity
  FROM character_items ci
  JOIN item_templates it ON it.id = ci.item_template_id
  JOIN characters c ON c.id = ci.character_id
  WHERE ci.id = p_character_item_id AND c.user_id = auth.uid();

  IF v_character_id IS NULL THEN
    RAISE EXCEPTION 'Eşya bulunamadı veya yetki yok';
  END IF;

  IF v_equipped IS NOT NULL THEN
    RAISE EXCEPTION 'Kuşanılmış eşya parçalanamaz';
  END IF;

  IF v_rarity IN ('HIGH', 'UNIQUE') THEN
    RAISE EXCEPTION 'Bağlı eşya parçalanamaz';
  END IF;

  IF EXISTS (
    SELECT 1 FROM market_listings ml
    WHERE ml.character_item_id = p_character_item_id AND ml.status = 'active'
  ) THEN
    RAISE EXCEPTION 'İlandaki eşya parçalanamaz';
  END IF;

  IF v_rarity = 'COMMON' THEN
    v_material_slug := 'mat_bozkir_parcasi';
    v_material_name := 'Bozkır Parçası';
    v_amount := 2;
  ELSIF v_rarity = 'NORMAL' THEN
    v_material_slug := 'mat_bozkir_parcasi';
    v_material_name := 'Bozkır Parçası';
    v_amount := 4;
  ELSIF v_rarity = 'RARE' THEN
    v_material_slug := 'mat_nadir_tas';
    v_material_name := 'Nadir Taş';
    v_amount := 2;
  ELSE
    RAISE EXCEPTION 'Bu eşya parçalanamaz';
  END IF;

  DELETE FROM character_items WHERE id = p_character_item_id;

  PERFORM grant_stackable_item(v_character_id, v_material_slug, v_amount);

  RETURN jsonb_build_object(
    'material_slug', v_material_slug,
    'material_name', v_material_name,
    'amount', v_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION grant_stackable_item(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION dismantle_character_item(uuid) TO authenticated;
