-- quest_log: kendi karakterinin aktif/tamamlanan seferlerini güncelle
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE quest_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quest_log_select_own" ON quest_log;
DROP POLICY IF EXISTS "quest_log_insert_own" ON quest_log;
DROP POLICY IF EXISTS "quest_log_update_own" ON quest_log;

CREATE POLICY "quest_log_select_own"
ON quest_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = quest_log.character_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "quest_log_insert_own"
ON quest_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = quest_log.character_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "quest_log_update_own"
ON quest_log
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = quest_log.character_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = quest_log.character_id
      AND c.user_id = auth.uid()
  )
);

-- Görev tanımları herkese okunabilir
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quests_select_all" ON quests;

CREATE POLICY "quests_select_all"
ON quests
FOR SELECT
TO authenticated
USING (is_active = true OR is_active IS NULL);
