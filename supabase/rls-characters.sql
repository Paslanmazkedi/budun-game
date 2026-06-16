-- characters: kendi karakterini güncelle (görev XP/akçe)
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "characters_select_own" ON characters;
DROP POLICY IF EXISTS "characters_update_own" ON characters;
DROP POLICY IF EXISTS "characters_insert_own" ON characters;

CREATE POLICY "characters_select_own"
ON characters
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "characters_insert_own"
ON characters
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_update_own"
ON characters
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
