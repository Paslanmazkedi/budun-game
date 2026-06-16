-- add-clan-features.sql sonrası çalıştırın

ALTER TABLE clan_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_member_scores ENABLE ROW LEVEL SECURITY;

-- clan_members: rütbe güncelleme (hakan / subay)
DROP POLICY IF EXISTS "clan_members_update_leader_officer" ON clan_members;
CREATE POLICY "clan_members_update_leader_officer"
ON clan_members FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clan_members me
    JOIN characters c ON c.id = me.character_id
    WHERE me.clan_id = clan_members.clan_id
      AND me.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clan_members me
    JOIN characters c ON c.id = me.character_id
    WHERE me.clan_id = clan_members.clan_id
      AND me.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
  AND clan_members.rank IN ('leader', 'officer', 'member')
);

-- clan_members: üye çıkarma (hakan/subay; hakan çıkarılamaz)
DROP POLICY IF EXISTS "clan_members_delete_leader_officer" ON clan_members;
CREATE POLICY "clan_members_delete_leader_officer"
ON clan_members FOR DELETE TO authenticated
USING (
  clan_members.character_id != (
    SELECT cl.leader_character_id FROM clans cl WHERE cl.id = clan_members.clan_id
  )
  AND EXISTS (
    SELECT 1 FROM clan_members me
    JOIN characters c ON c.id = me.character_id
    WHERE me.clan_id = clan_members.clan_id
      AND me.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
);

-- clan_invites
DROP POLICY IF EXISTS "clan_invites_select" ON clan_invites;
DROP POLICY IF EXISTS "clan_invites_insert" ON clan_invites;
DROP POLICY IF EXISTS "clan_invites_update" ON clan_invites;
DROP POLICY IF EXISTS "clan_invites_delete" ON clan_invites;

CREATE POLICY "clan_invites_select" ON clan_invites FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM clan_members cm
    JOIN characters c ON c.id = cm.character_id
    WHERE cm.clan_id = clan_invites.clan_id AND cm.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "clan_invites_insert" ON clan_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM clan_members cm
    WHERE cm.clan_id = clan_invites.clan_id
      AND cm.character_id = from_character_id
      AND cm.rank IN ('leader', 'officer')
  )
);

CREATE POLICY "clan_invites_update" ON clan_invites FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM clan_members cm
    JOIN characters c ON c.id = cm.character_id
    WHERE cm.clan_id = clan_invites.clan_id AND cm.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "clan_invites_delete" ON clan_invites FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM clan_members cm
    JOIN characters c ON c.id = cm.character_id
    WHERE cm.clan_id = clan_invites.clan_id AND cm.rank IN ('leader', 'officer')
      AND c.user_id = auth.uid()
  )
);

-- clan_member_scores: okuma (sıralama + boy içi)
DROP POLICY IF EXISTS "clan_member_scores_select" ON clan_member_scores;
CREATE POLICY "clan_member_scores_select"
ON clan_member_scores FOR SELECT TO authenticated
USING (true);
