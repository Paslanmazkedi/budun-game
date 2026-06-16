-- Görev sistemi: zorluk, loot bağlantısı, ödül kaydı
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE quests ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'normal';
ALTER TABLE quests ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS loot_table_id uuid;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS item_drop_rate smallint;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS sort_order smallint NOT NULL DEFAULT 0;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN quests.difficulty IS 'test | easy | normal | hard';
COMMENT ON COLUMN quests.item_drop_rate IS 'Eşya düşme şansı (%). Boşsa zorluk varsayılanı.';
COMMENT ON COLUMN quests.loot_table_id IS 'Görev ganimet tablosu (varsayılan: Görev Ganimeti)';

ALTER TABLE quest_log ADD COLUMN IF NOT EXISTS reward_xp_granted int;
ALTER TABLE quest_log ADD COLUMN IF NOT EXISTS reward_gold_granted int;
ALTER TABLE quest_log ADD COLUMN IF NOT EXISTS loot_item_template_id uuid;

COMMENT ON COLUMN quest_log.reward_xp_granted IS 'Tamamlandığında verilen XP';
COMMENT ON COLUMN quest_log.reward_gold_granted IS 'Tamamlandığında verilen akçe';
COMMENT ON COLUMN quest_log.loot_item_template_id IS 'Düşen eşya şablonu (varsa)';
