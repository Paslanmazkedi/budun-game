-- Pazardaki ilanların eşya detayını herkes okuyabilsin (character_items join)
-- rls-market.sql sonrası çalıştırın

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
