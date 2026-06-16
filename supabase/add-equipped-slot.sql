-- Kuşanma (tak/çıkar) için gerekli kolon + slot indeksi
-- Supabase SQL Editor'da bir kez çalıştırın.

ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS equipped_slot text;

COMMENT ON COLUMN character_items.equipped_slot IS
  'Teçhizat slot id: helmet, armor, gloves, weapon, offhand, boots, amulet, earring1, earring2, ring1, ring2, belt, mount, cloak, costume';

CREATE INDEX IF NOT EXISTS idx_character_items_equipped
ON character_items (character_id, equipped_slot)
WHERE equipped_slot IS NOT NULL;

-- Aynı slotta tek eşya (kuşanılmış)
CREATE UNIQUE INDEX IF NOT EXISTS idx_character_items_one_equipped_per_slot
ON character_items (character_id, equipped_slot)
WHERE equipped_slot IS NOT NULL;
