-- Boy (klan) + parti + görev türleri + farm alan meta
-- Supabase SQL Editor'da bir kez çalıştırın.

-- Boy
CREATE TABLE IF NOT EXISTS clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  emblem text NOT NULL DEFAULT '🏕️',
  motto text,
  leader_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  level smallint NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  character_id uuid NOT NULL UNIQUE REFERENCES characters(id) ON DELETE CASCADE,
  rank text NOT NULL DEFAULT 'member' CHECK (rank IN ('leader', 'officer', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);

-- Parti (max 8)
CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  zone_id text,
  quest_id uuid,
  max_size smallint NOT NULL DEFAULT 8 CHECK (max_size >= 1 AND max_size <= 8),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_run', 'closed')),
  is_public boolean NOT NULL DEFAULT true,
  join_policy text NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Eski kurulum: join_policy kolonu
ALTER TABLE parties ADD COLUMN IF NOT EXISTS join_policy text NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parties_join_policy_check') THEN
    ALTER TABLE parties ADD CONSTRAINT parties_join_policy_check
      CHECK (join_policy IN ('public', 'friends', 'clan', 'invite_only'));
  END IF;
END $$;

-- quests FK (quests tablosu varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quests'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parties_quest_id_fkey'
  ) THEN
    ALTER TABLE parties
      ADD CONSTRAINT parties_quest_id_fkey
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS party_members (
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  character_id uuid NOT NULL UNIQUE REFERENCES characters(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_parties_public ON parties(is_public, status);

-- Görev türleri (quests tablosu gerekli)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quests'
  ) THEN
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS quest_type text NOT NULL DEFAULT 'standard';
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS min_level smallint NOT NULL DEFAULT 1;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS farm_zone_id text;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS party_size_required smallint;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS available_from timestamptz;
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS available_until timestamptz;
  ELSE
    RAISE NOTICE 'quests tablosu yok — görev tür kolonları atlandı.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quests'
  ) THEN
    COMMENT ON COLUMN quests.quest_type IS 'standard | bonus | level_gate | farm';
    COMMENT ON COLUMN quests.farm_zone_id IS 'lib/farm-zones.ts id ile eşleşir';
    COMMENT ON COLUMN quests.party_size_required IS 'Farm görevleri için gerekli parti boyutu';
  END IF;
END $$;

-- Farm alan meta (harita seed)
CREATE TABLE IF NOT EXISTS farm_zones (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '🌲',
  party_size smallint NOT NULL,
  max_party_size smallint NOT NULL,
  min_character_level smallint NOT NULL DEFAULT 1,
  map_x smallint,
  map_y smallint
);

INSERT INTO farm_zones (id, name, description, icon, party_size, max_party_size, min_character_level, map_x, map_y) VALUES
  ('yosun-orman', 'Yosun Tutmuş Orman', 'Farm alanı — 3 kişilik ekip', '🌲', 3, 3, 1, 22, 38),
  ('bozkir-avcilik', 'Bozkır Avlak', '4 kişilik orta farm', '🏹', 4, 4, 5, 62, 35),
  ('eski-harabe', 'Eski Harabe', '8 kişilik zor farm', '🏚️', 8, 8, 10, 75, 72)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  party_size = EXCLUDED.party_size,
  max_party_size = EXCLUDED.max_party_size,
  min_character_level = EXCLUDED.min_character_level,
  map_x = EXCLUDED.map_x,
  map_y = EXCLUDED.map_y;
