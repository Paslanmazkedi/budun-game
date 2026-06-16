-- Pazar ilanları + parçalama malzemeleri
-- Çalıştırma: rls-character-items.sql sonrası, ardından rls-market.sql

CREATE TABLE IF NOT EXISTS market_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_item_id uuid NOT NULL REFERENCES character_items(id) ON DELETE CASCADE,
  seller_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  price integer NOT NULL CHECK (price >= 1),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  sold_to_character_id uuid REFERENCES characters(id),
  sold_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS market_listings_one_active_per_item
  ON market_listings (character_item_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS market_listings_active_expires
  ON market_listings (status, expires_at)
  WHERE status = 'active';

-- Craft için parçalama malzemeleri (Demirci craft yakında)
CREATE TABLE IF NOT EXISTS character_materials (
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  material_slug text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (character_id, material_slug)
);

-- Süresi dolan ilanları kapat
CREATE OR REPLACE FUNCTION market_expire_stale_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE market_listings
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION market_create_listing(p_character_item_id uuid, p_price integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_equipped text;
  v_rarity text;
  v_listing_id uuid;
BEGIN
  PERFORM market_expire_stale_listings();

  SELECT ci.character_id, ci.equipped_slot, it.rarity
  INTO v_seller_id, v_equipped, v_rarity
  FROM character_items ci
  JOIN item_templates it ON it.id = ci.item_template_id
  JOIN characters c ON c.id = ci.character_id
  WHERE ci.id = p_character_item_id AND c.user_id = auth.uid();

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Eşya bulunamadı veya yetki yok';
  END IF;

  IF v_equipped IS NOT NULL THEN
    RAISE EXCEPTION 'Kuşanılmış eşya satılamaz';
  END IF;

  IF v_rarity IN ('HIGH', 'UNIQUE') THEN
    RAISE EXCEPTION 'Bağlı eşya pazarda satılamaz';
  END IF;

  IF p_price IS NULL OR p_price < 1 THEN
    RAISE EXCEPTION 'Geçerli bir fiyat girin';
  END IF;

  IF EXISTS (
    SELECT 1 FROM market_listings ml
    WHERE ml.character_item_id = p_character_item_id AND ml.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Bu eşya zaten ilanda';
  END IF;

  INSERT INTO market_listings (character_item_id, seller_character_id, price)
  VALUES (p_character_item_id, v_seller_id, p_price)
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;

CREATE OR REPLACE FUNCTION market_cancel_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
BEGIN
  SELECT ml.seller_character_id INTO v_seller_id
  FROM market_listings ml
  JOIN characters c ON c.id = ml.seller_character_id
  WHERE ml.id = p_listing_id
    AND ml.status = 'active'
    AND c.user_id = auth.uid();

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'İlan bulunamadı veya iptal edilemez';
  END IF;

  UPDATE market_listings
  SET status = 'cancelled'
  WHERE id = p_listing_id AND status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION market_buy_listing(p_listing_id uuid, p_buyer_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing market_listings%ROWTYPE;
  v_buyer_gold integer;
BEGIN
  PERFORM market_expire_stale_listings();

  SELECT * INTO v_listing
  FROM market_listings
  WHERE id = p_listing_id
    AND status = 'active'
    AND expires_at > now()
  FOR UPDATE;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'İlan bulunamadı veya süresi doldu';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = p_buyer_character_id AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Alıcı karakter bulunamadı';
  END IF;

  IF v_listing.seller_character_id = p_buyer_character_id THEN
    RAISE EXCEPTION 'Kendi ilanınızı satın alamazsınız';
  END IF;

  SELECT gold INTO v_buyer_gold
  FROM characters
  WHERE id = p_buyer_character_id
  FOR UPDATE;

  IF v_buyer_gold IS NULL OR v_buyer_gold < v_listing.price THEN
    RAISE EXCEPTION 'Yeterli akçe yok';
  END IF;

  UPDATE characters
  SET gold = gold - v_listing.price
  WHERE id = p_buyer_character_id;

  UPDATE characters
  SET gold = gold + v_listing.price
  WHERE id = v_listing.seller_character_id;

  UPDATE character_items
  SET character_id = p_buyer_character_id
  WHERE id = v_listing.character_item_id;

  UPDATE market_listings
  SET status = 'sold',
      sold_to_character_id = p_buyer_character_id,
      sold_at = now()
  WHERE id = p_listing_id;
END;
$$;

CREATE OR REPLACE FUNCTION dismantle_character_item(p_character_item_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_character_id uuid;
  v_equipped text;
  v_rarity text;
  v_scraps integer;
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

  IF v_rarity NOT IN ('COMMON', 'NORMAL') THEN
    RAISE EXCEPTION 'Sadece yaygın ve normal eşyalar parçalanabilir';
  END IF;

  IF EXISTS (
    SELECT 1 FROM market_listings ml
    WHERE ml.character_item_id = p_character_item_id AND ml.status = 'active'
  ) THEN
    RAISE EXCEPTION 'İlandaki eşya parçalanamaz';
  END IF;

  v_scraps := CASE v_rarity WHEN 'COMMON' THEN 2 ELSE 4 END;

  DELETE FROM character_items WHERE id = p_character_item_id;

  INSERT INTO character_materials (character_id, material_slug, quantity)
  VALUES (v_character_id, 'bozkir_parcasi', v_scraps)
  ON CONFLICT (character_id, material_slug)
  DO UPDATE SET quantity = character_materials.quantity + EXCLUDED.quantity;

  RETURN v_scraps;
END;
$$;

GRANT EXECUTE ON FUNCTION market_expire_stale_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION market_create_listing(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION market_cancel_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION market_buy_listing(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION dismantle_character_item(uuid) TO authenticated;
