-- character_items: okuma / ekleme / güncelleme (kuşanma, çanta taşıma)
-- Supabase SQL Editor'da bir kez çalıştırın.
-- Önce add-equipped-slot.sql ve add-bag-system.sql çalıştırılmış olmalı.

ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;

-- Eski politikalar (yeniden çalıştırılabilir)
DROP POLICY IF EXISTS "character_items_select_own" ON character_items;
DROP POLICY IF EXISTS "character_items_insert_own" ON character_items;
DROP POLICY IF EXISTS "character_items_update_own" ON character_items;
DROP POLICY IF EXISTS "character_items_delete_own" ON character_items;

CREATE POLICY "character_items_select_own"
ON character_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_items.character_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "character_items_insert_own"
ON character_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_items.character_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "character_items_update_own"
ON character_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_items.character_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_items.character_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "character_items_delete_own"
ON character_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_items.character_id
      AND c.user_id = auth.uid()
  )
);
