-- Boy geliştirmeleri: açıklama, davet, puan/sıralama, senkron RPC
-- Önkoşul: setup-clan-party-social.sql
-- Sonra: rls-clan-features.sql

ALTER TABLE clans ADD COLUMN IF NOT EXISTS description text;
COMMENT ON COLUMN clans.description IS 'Boy açıklaması (kısa tanıtım)';

-- ── Davetler ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clan_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  from_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clan_invites_no_self CHECK (from_character_id != to_character_id),
  CONSTRAINT clan_invites_unique_target UNIQUE (clan_id, to_character_id)
);

CREATE INDEX IF NOT EXISTS idx_clan_invites_to ON clan_invites(to_character_id, status);
CREATE INDEX IF NOT EXISTS idx_clan_invites_clan ON clan_invites(clan_id);

-- ── Üye puanları (haftalık / aylık / tüm zamanlar) ─────────────────────────
CREATE TABLE IF NOT EXISTS clan_member_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('all', 'weekly', 'monthly')),
  period_key text NOT NULL,
  wealth bigint NOT NULL DEFAULT 0,
  power int NOT NULL DEFAULT 0,
  defense int NOT NULL DEFAULT 0,
  level_pts int NOT NULL DEFAULT 0,
  quest_pts int NOT NULL DEFAULT 0,
  boss_pts int NOT NULL DEFAULT 0,
  honor_pts int NOT NULL DEFAULT 0,
  fame_pts int NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, period_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_clan_member_scores_clan_period
  ON clan_member_scores(clan_id, period_type, period_key);

CREATE INDEX IF NOT EXISTS idx_clan_member_scores_honor
  ON clan_member_scores(period_type, period_key, honor_pts DESC);

-- ── Dönem yardımcıları ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION clan_weekly_period_key(p_at timestamptz DEFAULT now())
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(p_at, 'IYYY') || '-W' || lpad(to_char(p_at, 'IW'), 2, '0');
$$;

CREATE OR REPLACE FUNCTION clan_monthly_period_key(p_at timestamptz DEFAULT now())
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(p_at, 'YYYY-MM');
$$;

CREATE OR REPLACE FUNCTION clan_period_start(p_period_type text, p_at timestamptz DEFAULT now())
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_period_type = 'weekly' THEN
    RETURN date_trunc('week', p_at);
  ELSIF p_period_type = 'monthly' THEN
    RETURN date_trunc('month', p_at);
  ELSE
    RETURN '1970-01-01'::timestamptz;
  END IF;
END;
$$;

-- ── Şan puanı hesabı ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_clan_honor_pts(
  p_wealth bigint,
  p_power int,
  p_defense int,
  p_level_pts int,
  p_quest_pts int,
  p_boss_pts int,
  p_fame_pts int
)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    floor(p_wealth::numeric / 100)::int
    + p_power * 2
    + p_defense
    + p_level_pts
    + p_quest_pts * 5
    + p_boss_pts * 10
    + p_fame_pts
  );
$$;

-- ── Tek üye senkron ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_clan_member_scores(p_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_gold int;
  v_level smallint;
  v_strength int;
  v_agility int;
  v_intelligence int;
  v_power int;
  v_defense int;
  v_level_pts int;
  v_quest_all int;
  v_quest_week int;
  v_quest_month int;
  v_fame int;
  v_boss int;
  v_honor int;
  v_now timestamptz := now();
  v_week_key text := clan_weekly_period_key(v_now);
  v_month_key text := clan_monthly_period_key(v_now);
  v_week_start timestamptz := clan_period_start('weekly', v_now);
  v_month_start timestamptz := clan_period_start('monthly', v_now);
BEGIN
  SELECT cm.clan_id INTO v_clan_id
  FROM clan_members cm
  WHERE cm.character_id = p_character_id;

  IF v_clan_id IS NULL THEN
    RETURN;
  END IF;

  SELECT c.gold, c.level,
         COALESCE(c.strength, 5),
         COALESCE(c.agility, 5),
         COALESCE(c.intelligence, 5),
         COALESCE(c.fame_pts, 0)
  INTO v_gold, v_level, v_strength, v_agility, v_intelligence, v_fame
  FROM characters c
  WHERE c.id = p_character_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_power := v_strength * 3 + v_agility * 2 + v_intelligence * 2;
  v_defense := floor(v_strength * 2 + v_agility + v_level * 3)::int;
  v_level_pts := v_level * 10;
  v_boss := 0;

  SELECT count(*)::int INTO v_quest_all
  FROM quest_log ql
  WHERE ql.character_id = p_character_id AND ql.status = 'completed';

  SELECT count(*)::int INTO v_quest_week
  FROM quest_log ql
  WHERE ql.character_id = p_character_id
    AND ql.status = 'completed'
    AND ql.completed_at >= v_week_start;

  SELECT count(*)::int INTO v_quest_month
  FROM quest_log ql
  WHERE ql.character_id = p_character_id
    AND ql.status = 'completed'
    AND ql.completed_at >= v_month_start;

  -- Tüm zamanlar
  v_honor := compute_clan_honor_pts(v_gold, v_power, v_defense, v_level_pts, v_quest_all, v_boss, v_fame);
  INSERT INTO clan_member_scores (
    clan_id, character_id, period_type, period_key,
    wealth, power, defense, level_pts, quest_pts, boss_pts, honor_pts, fame_pts, synced_at
  ) VALUES (
    v_clan_id, p_character_id, 'all', 'all',
    v_gold, v_power, v_defense, v_level_pts, v_quest_all, v_boss, v_honor, v_fame, v_now
  )
  ON CONFLICT (character_id, period_type, period_key) DO UPDATE SET
    clan_id = EXCLUDED.clan_id,
    wealth = EXCLUDED.wealth,
    power = EXCLUDED.power,
    defense = EXCLUDED.defense,
    level_pts = EXCLUDED.level_pts,
    quest_pts = EXCLUDED.quest_pts,
    boss_pts = EXCLUDED.boss_pts,
    honor_pts = EXCLUDED.honor_pts,
    fame_pts = EXCLUDED.fame_pts,
    synced_at = EXCLUDED.synced_at;

  -- Haftalık
  v_honor := compute_clan_honor_pts(v_gold, v_power, v_defense, v_level_pts, v_quest_week, v_boss, v_fame);
  INSERT INTO clan_member_scores (
    clan_id, character_id, period_type, period_key,
    wealth, power, defense, level_pts, quest_pts, boss_pts, honor_pts, fame_pts, synced_at
  ) VALUES (
    v_clan_id, p_character_id, 'weekly', v_week_key,
    v_gold, v_power, v_defense, v_level_pts, v_quest_week, v_boss, v_honor, v_fame, v_now
  )
  ON CONFLICT (character_id, period_type, period_key) DO UPDATE SET
    clan_id = EXCLUDED.clan_id,
    wealth = EXCLUDED.wealth,
    power = EXCLUDED.power,
    defense = EXCLUDED.defense,
    level_pts = EXCLUDED.level_pts,
    quest_pts = EXCLUDED.quest_pts,
    boss_pts = EXCLUDED.boss_pts,
    honor_pts = EXCLUDED.honor_pts,
    fame_pts = EXCLUDED.fame_pts,
    synced_at = EXCLUDED.synced_at;

  -- Aylık
  v_honor := compute_clan_honor_pts(v_gold, v_power, v_defense, v_level_pts, v_quest_month, v_boss, v_fame);
  INSERT INTO clan_member_scores (
    clan_id, character_id, period_type, period_key,
    wealth, power, defense, level_pts, quest_pts, boss_pts, honor_pts, fame_pts, synced_at
  ) VALUES (
    v_clan_id, p_character_id, 'monthly', v_month_key,
    v_gold, v_power, v_defense, v_level_pts, v_quest_month, v_boss, v_honor, v_fame, v_now
  )
  ON CONFLICT (character_id, period_type, period_key) DO UPDATE SET
    clan_id = EXCLUDED.clan_id,
    wealth = EXCLUDED.wealth,
    power = EXCLUDED.power,
    defense = EXCLUDED.defense,
    level_pts = EXCLUDED.level_pts,
    quest_pts = EXCLUDED.quest_pts,
    boss_pts = EXCLUDED.boss_pts,
    honor_pts = EXCLUDED.honor_pts,
    fame_pts = EXCLUDED.fame_pts,
    synced_at = EXCLUDED.synced_at;
END;
$$;

-- ── Boydaki tüm üyeleri senkron (sayfa açılışında) ───────────────────────────
CREATE OR REPLACE FUNCTION sync_clan_scores_for_clan(p_clan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_char_id uuid;
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli';
  END IF;

  SELECT cm.character_id INTO v_char_id
  FROM clan_members cm
  JOIN characters c ON c.id = cm.character_id
  WHERE cm.clan_id = p_clan_id AND c.user_id = v_uid
  LIMIT 1;

  IF v_char_id IS NULL THEN
    RAISE EXCEPTION 'Bu boyun üyesi değilsin';
  END IF;

  FOR r IN SELECT character_id FROM clan_members WHERE clan_id = p_clan_id LOOP
    PERFORM sync_clan_member_scores(r.character_id);
  END LOOP;
END;
$$;

-- characters.fame_pts — gelecek PvP şöhret altyapısı
ALTER TABLE characters ADD COLUMN IF NOT EXISTS fame_pts int NOT NULL DEFAULT 0;
COMMENT ON COLUMN characters.fame_pts IS 'Şöhret puanı (gelecek PvP); boy şanına katkı';

GRANT EXECUTE ON FUNCTION sync_clan_member_scores(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_clan_scores_for_clan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION clan_weekly_period_key(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION clan_monthly_period_key(timestamptz) TO authenticated;
