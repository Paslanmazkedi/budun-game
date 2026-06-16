-- Pazar ve malzeme RLS
-- add-market-system.sql sonrası çalıştırın

ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_listings_select" ON market_listings;
DROP POLICY IF EXISTS "character_materials_select_own" ON character_materials;

CREATE POLICY "market_listings_select"
ON market_listings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "character_materials_select_own"
ON character_materials
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_materials.character_id
      AND c.user_id = auth.uid()
  )
);

-- İlan oluşturma / satın alma / iptal: SECURITY DEFINER RPC
-- character_materials güncelleme: dismantle RPC

DROP POLICY IF EXISTS "character_items_select_market_listed" ON character_items;

CREATE POLICY "character_items_select_market_listed"
ON character_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM market_listings ml
    WHERE ml.character_item_id = character_items.id
      AND ml.status = 'active'
      AND ml.expires_at > now()
  )
);
