-- Boy + Parti + Arkadaş + Sohbet RLS — TEK SEFERDE
-- setup-clan-party-social.sql sonrası çalıştırın.

-- clan/party (rls-clan-party.sql ile aynı + güncellemeler)
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clans_select_all" ON clans;
DROP POLICY IF EXISTS "clans_insert_leader" ON clans;
DROP POLICY IF EXISTS "clans_update_leader" ON clans;
CREATE POLICY "clans_select_all" ON clans FOR SELECT TO authenticated USING (true);
CREATE POLICY "clans_insert_leader" ON clans FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()));
CREATE POLICY "clans_update_leader" ON clans FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "clan_members_select" ON clan_members;
DROP POLICY IF EXISTS "clan_members_insert" ON clan_members;
DROP POLICY IF EXISTS "clan_members_delete_own" ON clan_members;
CREATE POLICY "clan_members_select" ON clan_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "clan_members_insert" ON clan_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "clan_members_delete_own" ON clan_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "parties_select" ON parties;
DROP POLICY IF EXISTS "parties_insert" ON parties;
DROP POLICY IF EXISTS "parties_update_leader" ON parties;
DROP POLICY IF EXISTS "parties_delete_leader" ON parties;
CREATE POLICY "parties_select" ON parties FOR SELECT TO authenticated
USING (
  join_policy IS DISTINCT FROM 'invite_only'
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM party_members pm JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = parties.id AND c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM party_invites pi JOIN characters c ON c.id = pi.to_character_id
    WHERE pi.party_id = parties.id AND c.user_id = auth.uid() AND pi.status = 'pending'
  )
);
CREATE POLICY "parties_insert" ON parties FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()));
CREATE POLICY "parties_update_leader" ON parties FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()));
CREATE POLICY "parties_delete_leader" ON parties FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "party_members_select" ON party_members;
DROP POLICY IF EXISTS "party_members_insert" ON party_members;
DROP POLICY IF EXISTS "party_members_delete_own" ON party_members;
DROP POLICY IF EXISTS "party_members_delete_leader" ON party_members;
CREATE POLICY "party_members_select" ON party_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "party_members_insert" ON party_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "party_members_delete_own" ON party_members FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid()));
CREATE POLICY "party_members_delete_leader" ON party_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parties p JOIN characters c ON c.id = p.leader_character_id
    WHERE p.id = party_members.party_id AND c.user_id = auth.uid()
      AND party_members.character_id != p.leader_character_id
  )
);

DROP POLICY IF EXISTS "farm_zones_select" ON farm_zones;
CREATE POLICY "farm_zones_select" ON farm_zones FOR SELECT TO authenticated USING (true);

-- social (rls-social.sql ile aynı)
ALTER TABLE character_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "character_friends_select" ON character_friends;
DROP POLICY IF EXISTS "character_friends_insert" ON character_friends;
DROP POLICY IF EXISTS "character_friends_update" ON character_friends;
DROP POLICY IF EXISTS "character_friends_delete" ON character_friends;
CREATE POLICY "character_friends_select" ON character_friends FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid())
);
CREATE POLICY "character_friends_insert" ON character_friends FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  AND requester_id != addressee_id
);
CREATE POLICY "character_friends_update" ON character_friends FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid()));
CREATE POLICY "character_friends_delete" ON character_friends FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid())
);

DROP POLICY IF EXISTS "party_invites_select" ON party_invites;
DROP POLICY IF EXISTS "party_invites_insert" ON party_invites;
DROP POLICY IF EXISTS "party_invites_update" ON party_invites;
DROP POLICY IF EXISTS "party_invites_delete" ON party_invites;
CREATE POLICY "party_invites_select" ON party_invites FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM party_members pm JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = party_invites.party_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "party_invites_insert" ON party_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM party_members pm JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = party_invites.party_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "party_invites_update" ON party_invites FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid()));
CREATE POLICY "party_invites_delete" ON party_invites FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
);

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT TO authenticated
USING (
  channel_type = 'party' AND EXISTS (
    SELECT 1 FROM party_members pm JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = channel_id AND c.user_id = auth.uid()
  )
  OR channel_type = 'clan' AND EXISTS (
    SELECT 1 FROM clan_members cm JOIN characters c ON c.id = cm.character_id
    WHERE cm.clan_id = channel_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = character_id AND c.user_id = auth.uid())
  AND (
    channel_type = 'party' AND EXISTS (
      SELECT 1 FROM party_members pm
      WHERE pm.party_id = channel_id AND pm.character_id = chat_messages.character_id
    )
    OR channel_type = 'clan' AND EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = channel_id AND cm.character_id = chat_messages.character_id
    )
  )
);
