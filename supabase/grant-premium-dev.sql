-- Geliştirme: hesaba Kut Taşı ve örnek abonelik bonusu
-- user_id ve character_id değerlerini kendi hesabınıza göre güncelleyin.

BEGIN;

-- Örnek: PaslanmazKedi sahibi
-- user_id: 73fdd52b-c8dc-464e-a2b7-f3334f58f199

INSERT INTO player_wallets (user_id, premium_balance)
VALUES ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 500)
ON CONFLICT (user_id)
DO UPDATE SET premium_balance = 500, updated_at = now();

-- Kut Başlangıç aboneliği simülasyonu (+20 slot, %10 EXP — slot bonusu entitlement ile)
INSERT INTO player_entitlements (user_id, entitlement_key, int_value, source, expires_at)
VALUES
  ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 'inventory_slots_bonus', 20, 'subscription', now() + interval '30 days'),
  ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 'exp_bonus_pct', 10, 'subscription', now() + interval '30 days'),
  ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 'starter_mount_unlocked', 1, 'subscription', now() + interval '30 days'),
  ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 'starter_costume_unlocked', 1, 'subscription', now() + interval '30 days'),
  ('73fdd52b-c8dc-464e-a2b7-f3334f58f199', 'subscription_active', 1, 'subscription', now() + interval '30 days')
ON CONFLICT (user_id, entitlement_key)
DO UPDATE SET
  int_value = EXCLUDED.int_value,
  source = EXCLUDED.source,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

COMMIT;
