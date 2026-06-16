import { writeFileSync } from 'fs'
import { ALL_PHASE1_ITEMS } from '../lib/item-catalog.ts'
import { LOOT_TABLE_IDS, LOOT_TABLE_LABELS, SOURCE_ALLOWED_RARITIES } from '../lib/content-loot.ts'

const lootWeights = { COMMON: 40, NORMAL: 28, RARE: 18, HIGH: 8, UNIQUE: 2 }

const itemValues = ALL_PHASE1_ITEMS.map(
  (i) =>
    `  ('${i.id}', '${i.slug}', '${i.name.replace(/'/g, "''")}', '${i.emoji}', '${i.slot}', '${i.rarity}')`
).join(',\n')

function lootRowsForSource(source) {
  const allowed = new Set(SOURCE_ALLOWED_RARITIES[source])
  const items = ALL_PHASE1_ITEMS.filter((i) => allowed.has(i.rarity))
  const tableId = LOOT_TABLE_IDS[source]
  return items
    .map((i) => `  ('${tableId}', '${i.id}', ${lootWeights[i.rarity]})`)
    .join(',\n')
}

function lootTableInsert(source) {
  const tableId = LOOT_TABLE_IDS[source]
  const label = LOOT_TABLE_LABELS[source]
  return `
INSERT INTO loot_tables (id, name)
VALUES ('${tableId}', '${label.replace(/'/g, "''")}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

DELETE FROM loot_table_items WHERE loot_table_id = '${tableId}';

INSERT INTO loot_table_items (loot_table_id, item_template_id, drop_chance) VALUES
${lootRowsForSource(source)};
`
}

const sql = `-- Orta çağ item seti + kaynak bazlı loot havuzları
-- lib/item-catalog.ts + lib/content-loot.ts ile senkron
-- Supabase SQL Editor'da çalıştırın.

BEGIN;

ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS emoji text;
ALTER TABLE item_templates ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS item_templates_slug_idx ON item_templates (slug);

DELETE FROM character_items WHERE item_template_id::text LIKE 'a101%';
DELETE FROM loot_table_items WHERE item_template_id::text LIKE 'a101%';
DELETE FROM item_templates WHERE id::text LIKE 'a101%';

INSERT INTO item_templates (id, slug, name, emoji, slot, rarity) VALUES
${itemValues}
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  slot = EXCLUDED.slot,
  rarity = EXCLUDED.rarity;

${lootTableInsert('quest')}
${lootTableInsert('dungeon')}
${lootTableInsert('group_dungeon')}
${lootTableInsert('world_boss')}

COMMIT;

SELECT lt.name, count(*) AS item_count
FROM loot_tables lt
JOIN loot_table_items lti ON lti.loot_table_id = lt.id
GROUP BY lt.id, lt.name
ORDER BY lt.name;
`

writeFileSync('supabase/seed-item-sets.sql', sql, 'utf8')
console.log(`Wrote ${ALL_PHASE1_ITEMS.length} items + 4 loot pools to supabase/seed-item-sets.sql`)
