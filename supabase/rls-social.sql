-- character_friends, party_invites, chat_messages RLS
-- add-social-system.sql + rls-clan-party.sql sonrası çalıştırın.

ALTER TABLE character_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- character_friends
DROP POLICY IF EXISTS "character_friends_select" ON character_friends;
DROP POLICY IF EXISTS "character_friends_insert" ON character_friends;
DROP POLICY IF EXISTS "character_friends_update" ON character_friends;
DROP POLICY IF EXISTS "character_friends_delete" ON character_friends;

CREATE POLICY "character_friends_select"
ON character_friends FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid())
);

CREATE POLICY "character_friends_insert"
ON character_friends FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  AND requester_id != addressee_id
);

CREATE POLICY "character_friends_update"
ON character_friends FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid())
);

CREATE POLICY "character_friends_delete"
ON character_friends FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = requester_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = addressee_id AND c.user_id = auth.uid())
);

-- party_invites
DROP POLICY IF EXISTS "party_invites_select" ON party_invites;
DROP POLICY IF EXISTS "party_invites_insert" ON party_invites;
DROP POLICY IF EXISTS "party_invites_update" ON party_invites;
DROP POLICY IF EXISTS "party_invites_delete" ON party_invites;

CREATE POLICY "party_invites_select"
ON party_invites FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM party_members pm
    JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = party_invites.party_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "party_invites_insert"
ON party_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM party_members pm
    JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = party_invites.party_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "party_invites_update"
ON party_invites FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
);

CREATE POLICY "party_invites_delete"
ON party_invites FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM characters c WHERE c.id = from_character_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM characters c WHERE c.id = to_character_id AND c.user_id = auth.uid())
);

-- chat_messages
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;

CREATE POLICY "chat_messages_select"
ON chat_messages FOR SELECT TO authenticated
USING (
  channel_type = 'party' AND EXISTS (
    SELECT 1 FROM party_members pm
    JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = channel_id AND c.user_id = auth.uid()
  )
  OR channel_type = 'clan' AND EXISTS (
    SELECT 1 FROM clan_members cm
    JOIN characters c ON c.id = cm.character_id
    WHERE cm.clan_id = channel_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "chat_messages_insert"
ON chat_messages FOR INSERT TO authenticated
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

-- Parti lideri üye atabilir
DROP POLICY IF EXISTS "party_members_delete_leader" ON party_members;

CREATE POLICY "party_members_delete_leader"
ON party_members FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM parties p
    JOIN characters c ON c.id = p.leader_character_id
    WHERE p.id = party_members.party_id
      AND c.user_id = auth.uid()
      AND party_members.character_id != p.leader_character_id
  )
);

-- Parti listesi: davet-only partiler sadece davetlilere görünür
DROP POLICY IF EXISTS "parties_select" ON parties;

CREATE POLICY "parties_select"
ON parties FOR SELECT TO authenticated
USING (
  join_policy != 'invite_only'
  OR EXISTS (
    SELECT 1 FROM characters c WHERE c.id = leader_character_id AND c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM party_members pm
    JOIN characters c ON c.id = pm.character_id
    WHERE pm.party_id = parties.id AND c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM party_invites pi
    JOIN characters c ON c.id = pi.to_character_id
    WHERE pi.party_id = parties.id AND c.user_id = auth.uid() AND pi.status = 'pending'
  )
);
