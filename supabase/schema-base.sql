-- =============================================================================
-- BUDUN GAME — Yeni Supabase projesi temel şema
-- Supabase Dashboard → SQL Editor → New query → yapıştır → Run
--
-- Sonra: supabase/SETUP-NEW-PROJECT.md dosyasındaki sıradaki adımlara geçin.
-- =============================================================================

BEGIN;

-- ── Karakterler ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  gender text NOT NULL DEFAULT 'er',
  class text NOT NULL DEFAULT 'Gökbörü',
  level smallint NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  gold integer NOT NULL DEFAULT 100 CHECK (gold >= 0),
  strength integer NOT NULL DEFAULT 5,
  agility integer NOT NULL DEFAULT 5,
  intelligence integer NOT NULL DEFAULT 5,
  power_score integer,
  bag_unlock_level smallint NOT NULL DEFAULT 1 CHECK (bag_unlock_level BETWEEN 1 AND 3),
  inventory_slot_capacity smallint NOT NULL DEFAULT 20 CHECK (inventory_slot_capacity BETWEEN 20 AND 96),
  inventory_display_slots smallint NOT NULL DEFAULT 20 CHECK (inventory_display_slots BETWEEN 20 AND 96),
  fame_pts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);

-- ── Eşya şablonları ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_templates (
  id uuid PRIMARY KEY,
  slug text UNIQUE,
  name text NOT NULL,
  emoji text,
  slot text NOT NULL,
  rarity text NOT NULL DEFAULT 'COMMON'
);

-- ── Karakter envanteri ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS character_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_template_id uuid NOT NULL REFERENCES item_templates(id) ON DELETE RESTRICT,
  equipped_slot text,
  bag_id text NOT NULL DEFAULT 'bag1',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_character_items_character ON character_items(character_id);
CREATE INDEX IF NOT EXISTS idx_character_items_equipped
  ON character_items (character_id, equipped_slot)
  WHERE equipped_slot IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_character_items_one_equipped_per_slot
  ON character_items (character_id, equipped_slot)
  WHERE equipped_slot IS NOT NULL;

-- ── Loot havuzları ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loot_tables (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS loot_table_items (
  loot_table_id uuid NOT NULL REFERENCES loot_tables(id) ON DELETE CASCADE,
  item_template_id uuid NOT NULL REFERENCES item_templates(id) ON DELETE CASCADE,
  drop_chance smallint NOT NULL DEFAULT 1 CHECK (drop_chance >= 0),
  PRIMARY KEY (loot_table_id, item_template_id)
);

-- ── Görevler ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  reward_xp integer NOT NULL DEFAULT 0,
  reward_gold integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'normal',
  description text,
  loot_table_id uuid REFERENCES loot_tables(id) ON DELETE SET NULL,
  item_drop_rate smallint,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  quest_type text NOT NULL DEFAULT 'standard',
  min_level smallint NOT NULL DEFAULT 1,
  farm_zone_id text,
  party_size_required smallint,
  available_from timestamptz,
  available_until timestamptz
);

-- ── Görev günlüğü (sefer defteri) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled', 'failed')),
  reward_xp_granted integer,
  reward_gold_granted integer,
  loot_item_template_id uuid REFERENCES item_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quest_log_character ON quest_log(character_id, status);
CREATE INDEX IF NOT EXISTS idx_quest_log_active ON quest_log(character_id, ends_at)
  WHERE status = 'active';

COMMIT;

-- Kontrol
SELECT 'schema-base OK' AS status,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'characters') AS characters,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_templates') AS item_templates;
