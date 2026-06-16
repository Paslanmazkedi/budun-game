-- Arkadaşlar, parti davetleri, sohbet
-- ÖNCE setup-clan-party-social.sql veya add-clan-party-system.sql çalıştırılmış olmalı.
-- parties tablosu yoksa bu dosya hata verir — setup-clan-party-social.sql kullanın.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parties'
  ) THEN
    RAISE EXCEPTION 'parties tablosu yok. Önce supabase/setup-clan-party-social.sql dosyasını çalıştırın.';
  END IF;
END $$;

-- Arkadaşlık (istek + kabul)
CREATE TABLE IF NOT EXISTS character_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT character_friends_no_self CHECK (requester_id != addressee_id),
  CONSTRAINT character_friends_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_character_friends_requester ON character_friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_character_friends_addressee ON character_friends(addressee_id);

-- Parti katılım politikası (eski kurulumlar için)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS join_policy text NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parties_join_policy_check') THEN
    ALTER TABLE parties ADD CONSTRAINT parties_join_policy_check
      CHECK (join_policy IN ('public', 'friends', 'clan', 'invite_only'));
  END IF;
END $$;

-- Parti davetleri
CREATE TABLE IF NOT EXISTS party_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  from_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT party_invites_unique UNIQUE (party_id, to_character_id)
);

CREATE INDEX IF NOT EXISTS idx_party_invites_to ON party_invites(to_character_id, status);

-- Sohbet
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL CHECK (channel_type IN ('party', 'clan')),
  channel_id uuid NOT NULL,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_type, channel_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;
