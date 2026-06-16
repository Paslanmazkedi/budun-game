-- loot_tables / loot_table_items: görev ganimetini okuyabilmek için
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE loot_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_table_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loot_tables_select_auth" ON loot_tables;
DROP POLICY IF EXISTS "loot_table_items_select_auth" ON loot_table_items;

CREATE POLICY "loot_tables_select_auth"
ON loot_tables
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "loot_table_items_select_auth"
ON loot_table_items
FOR SELECT
TO authenticated
USING (true);
