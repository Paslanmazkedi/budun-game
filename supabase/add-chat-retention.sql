-- Sohbet: kanal başına son 30 mesaj + parti silinince temizlik
-- setup-clan-party-social.sql sonrası çalıştırın.

-- Trim: her INSERT sonrası sadece o kanalın fazla mesajlarını sil (global scan yok)
CREATE OR REPLACE FUNCTION chat_trim_channel_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE channel_type = NEW.channel_type
    AND channel_id = NEW.channel_id
    AND id IN (
      SELECT id
      FROM chat_messages
      WHERE channel_type = NEW.channel_type
        AND channel_id = NEW.channel_id
      ORDER BY created_at DESC
      OFFSET 30
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_trim_after_insert ON chat_messages;
CREATE TRIGGER chat_trim_after_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION chat_trim_channel_messages();

-- Parti dağıtıldığında sohbet geçmişini sil
CREATE OR REPLACE FUNCTION chat_cleanup_party_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM chat_messages
  WHERE channel_type = 'party' AND channel_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS parties_chat_cleanup ON parties;
CREATE TRIGGER parties_chat_cleanup
  BEFORE DELETE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION chat_cleanup_party_messages();

COMMENT ON FUNCTION chat_trim_channel_messages IS 'Kanal başına max 30 mesaj — her insert sonrası sadece o kanal trim edilir';
