-- Parti açıklama ve alan etiketi (filtre / arama için)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS activity_tag text;

COMMENT ON COLUMN parties.description IS 'Lider notu — hedef, saat, kısa açıklama';
COMMENT ON COLUMN parties.activity_tag IS 'İçerik etiketi — parti bul filtreleri (yosun-orman, gorev, vb.)';
