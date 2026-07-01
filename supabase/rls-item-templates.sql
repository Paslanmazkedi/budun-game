-- Eşya şablonları herkes (giriş yapmış oyuncu) okuyabilsin — heybe join için zorunlu
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE item_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "item_templates_select_auth" ON item_templates;

CREATE POLICY "item_templates_select_auth"
ON item_templates
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON item_templates TO authenticated;
GRANT SELECT ON item_templates TO anon;
