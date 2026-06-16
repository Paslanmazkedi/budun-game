-- clans, clan_members, parties, party_members RLS
-- add-clan-party-system.sql sonrası çalıştırın.

ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_zones ENABLE ROW LEVEL SECURITY;

-- clans
DROP POLICY IF EXISTS "clans_select_all" ON clans;
DROP POLICY IF EXISTS "clans_insert_leader" ON clans;
DROP POLICY IF EXISTS "clans_update_leader" ON clans;

CREATE POLICY "clans_select_all"
ON clans FOR SELECT TO authenticated USING (true);

CREATE POLICY "clans_insert_leader"
ON clans FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "clans_update_leader"
ON clans FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
);

-- clan_members
DROP POLICY IF EXISTS "clan_members_select" ON clan_members;
DROP POLICY IF EXISTS "clan_members_insert" ON clan_members;
DROP POLICY IF EXISTS "clan_members_delete_own" ON clan_members;

CREATE POLICY "clan_members_select"
ON clan_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "clan_members_insert"
ON clan_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "clan_members_delete_own"
ON clan_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- parties
DROP POLICY IF EXISTS "parties_select" ON parties;
DROP POLICY IF EXISTS "parties_insert" ON parties;
DROP POLICY IF EXISTS "parties_update_leader" ON parties;
DROP POLICY IF EXISTS "parties_delete_leader" ON parties;

CREATE POLICY "parties_select"
ON parties FOR SELECT TO authenticated
USING (is_public = true OR EXISTS (
  SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM party_members pm
  JOIN characters c ON c.id = pm.character_id
  WHERE pm.party_id = parties.id AND c.user_id = auth.uid()
));

CREATE POLICY "parties_insert"
ON parties FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "parties_update_leader"
ON parties FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "parties_delete_leader"
ON parties FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
);

-- party_members
DROP POLICY IF EXISTS "party_members_select" ON party_members;
DROP POLICY IF EXISTS "party_members_insert" ON party_members;
DROP POLICY IF EXISTS "party_members_delete_own" ON party_members;

CREATE POLICY "party_members_select"
ON party_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "party_members_insert"
ON party_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "party_members_delete_own"
ON party_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM characters c
    WHERE c.id = character_id AND c.user_id = auth.uid()
  )
);

-- farm_zones read-only
DROP POLICY IF EXISTS "farm_zones_select" ON farm_zones;
CREATE POLICY "farm_zones_select"
ON farm_zones FOR SELECT TO authenticated USING (true);
