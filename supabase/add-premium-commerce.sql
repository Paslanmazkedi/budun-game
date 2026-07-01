-- Premium ticaret: Kut Taşı cüzdanı, entitlement'lar, heybe slot paketleri
-- Oyun akçesi (gold) ile karışmaz. Abonelik aktivasyonu sonraki faz.
-- add-inventory-slot-expansion.sql sonrası bir kez çalıştırın.

BEGIN;

-- display_slots: entitlement bonus ile base capacity üstüne çıkabilir (max 96)
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_inventory_display_slots_check;
ALTER TABLE characters ADD CONSTRAINT characters_inventory_display_slots_check
  CHECK (
    inventory_display_slots >= 20
    AND inventory_display_slots <= 96
  );

-- ── Cüzdan (hesap bazlı premium para) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  premium_balance integer NOT NULL DEFAULT 0 CHECK (premium_balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE player_wallets IS 'Hesap bazlı Kut Taşı bakiyesi';

-- ── Entitlement'lar (abonelik bonusları, promosyonlar) ───────────────────────

CREATE TABLE IF NOT EXISTS player_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key text NOT NULL,
  int_value integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'manual',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entitlement_key)
);

CREATE INDEX IF NOT EXISTS player_entitlements_user_id_idx
  ON player_entitlements (user_id);

COMMENT ON TABLE player_entitlements IS 'Premium haklar: inventory_slots_bonus, exp_bonus_pct, starter_mount_unlocked, …';

-- ── Satın alma kaydı (audit) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS premium_purchase_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  product_id text NOT NULL,
  premium_cost integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_purchase_log_user_id_idx
  ON premium_purchase_log (user_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE player_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_purchase_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_wallets_select_own" ON player_wallets;
CREATE POLICY "player_wallets_select_own"
  ON player_wallets FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "player_entitlements_select_own" ON player_entitlements;
CREATE POLICY "player_entitlements_select_own"
  ON player_entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "premium_purchase_log_select_own" ON premium_purchase_log;
CREATE POLICY "premium_purchase_log_select_own"
  ON premium_purchase_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Yazma işlemleri yalnızca SECURITY DEFINER RPC'ler üzerinden

-- ── Yardımcı: aktif entitlement bonus toplamı ─────────────────────────────────

CREATE OR REPLACE FUNCTION sum_active_entitlement(
  p_user_id uuid,
  p_key text
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(int_value), 0)::integer
  FROM player_entitlements
  WHERE user_id = p_user_id
    AND entitlement_key = p_key
    AND (expires_at IS NULL OR expires_at > now());
$$;

CREATE OR REPLACE FUNCTION get_effective_inventory_capacity(
  p_user_id uuid,
  p_base_capacity smallint
)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LEAST(
    96,
    GREATEST(
      20,
      p_base_capacity + sum_active_entitlement(p_user_id, 'inventory_slots_bonus')
    )
  )::smallint;
$$;

-- ── Görünür grid (entitlement bonus dahil efektif kapasiteye kadar) ─────────

CREATE OR REPLACE FUNCTION expand_inventory_display(
  p_character_id uuid,
  p_display_slots smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_base smallint;
  v_effective smallint;
BEGIN
  IF p_display_slots < 20 OR p_display_slots > 96 THEN
    RAISE EXCEPTION 'Geçersiz görünür slot sayısı';
  END IF;

  SELECT user_id, inventory_slot_capacity
  INTO v_user_id, v_base
  FROM characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Karakter bulunamadı';
  END IF;

  v_effective := get_effective_inventory_capacity(v_user_id, v_base);

  IF p_display_slots > v_effective THEN
    RAISE EXCEPTION 'Görünür slot kapasiteden fazla olamaz';
  END IF;

  UPDATE characters
  SET inventory_display_slots = p_display_slots
  WHERE id = p_character_id;

  RETURN jsonb_build_object(
    'inventory_display_slots', p_display_slots,
    'effective_inventory_capacity', v_effective
  );
END;
$$;

-- ── Eski akçe RPC kaldır ─────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS purchase_inventory_slots(uuid, smallint, integer);

-- ── Premium ürün satın alma ───────────────────────────────────────────────────
-- Ürün kataloğu lib/premium-commerce.ts ile senkron (inventory_slots_*)

CREATE OR REPLACE FUNCTION purchase_premium_product(
  p_character_id uuid,
  p_product_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_base smallint;
  v_display smallint;
  v_bonus integer;
  v_effective smallint;
  v_slots smallint;
  v_cost integer;
  v_balance integer;
  v_new_base smallint;
  v_new_display smallint;
  v_max constant smallint := 96;
BEGIN
  v_slots := CASE p_product_id
    WHEN 'inventory_slots_1' THEN 1
    WHEN 'inventory_slots_10' THEN 10
    WHEN 'inventory_slots_20' THEN 20
    ELSE NULL
  END;

  v_cost := CASE p_product_id
    WHEN 'inventory_slots_1' THEN 5
    WHEN 'inventory_slots_10' THEN 40
    WHEN 'inventory_slots_20' THEN 70
    ELSE NULL
  END;

  IF v_slots IS NULL OR v_cost IS NULL THEN
    RAISE EXCEPTION 'Geçersiz premium ürün';
  END IF;

  SELECT user_id, inventory_slot_capacity, inventory_display_slots
  INTO v_user_id, v_base, v_display
  FROM characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Karakter bulunamadı';
  END IF;

  v_bonus := sum_active_entitlement(v_user_id, 'inventory_slots_bonus');
  v_effective := get_effective_inventory_capacity(v_user_id, v_base);

  IF v_effective + v_slots > v_max THEN
    RAISE EXCEPTION 'Maksimum slot kapasitesine ulaşıldı';
  END IF;

  INSERT INTO player_wallets (user_id, premium_balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT premium_balance
  INTO v_balance
  FROM player_wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Yeterli Kut Taşı yok';
  END IF;

  v_new_base := v_base + v_slots;
  v_new_display := GREATEST(v_display, LEAST(v_max, v_new_base + v_bonus));

  UPDATE player_wallets
  SET premium_balance = premium_balance - v_cost,
      updated_at = now()
  WHERE user_id = v_user_id;

  UPDATE characters
  SET
    inventory_slot_capacity = v_new_base,
    inventory_display_slots = v_new_display
  WHERE id = p_character_id;

  INSERT INTO premium_purchase_log (user_id, character_id, product_id, premium_cost)
  VALUES (v_user_id, p_character_id, p_product_id, v_cost);

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'inventory_slot_capacity', v_new_base,
    'inventory_display_slots', v_new_display,
    'effective_inventory_capacity', get_effective_inventory_capacity(v_user_id, v_new_base),
    'premium_balance', v_balance - v_cost
  );
END;
$$;

-- ── Abonelik / paket entitlement verme (ileride webhook veya admin) ───────────

CREATE OR REPLACE FUNCTION grant_player_entitlement(
  p_user_id uuid,
  p_entitlement_key text,
  p_int_value integer,
  p_source text DEFAULT 'subscription',
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz';
  END IF;

  INSERT INTO player_entitlements (user_id, entitlement_key, int_value, source, expires_at)
  VALUES (p_user_id, p_entitlement_key, p_int_value, p_source, p_expires_at)
  ON CONFLICT (user_id, entitlement_key)
  DO UPDATE SET
    int_value = EXCLUDED.int_value,
    source = EXCLUDED.source,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();

  RETURN jsonb_build_object(
    'entitlement_key', p_entitlement_key,
    'int_value', p_int_value,
    'expires_at', p_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION expand_inventory_display(uuid, smallint) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_premium_product(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_player_entitlement(uuid, text, integer, text, timestamptz) TO authenticated;

COMMENT ON COLUMN characters.inventory_slot_capacity IS 'Heybe: kalıcı max slot (premium paketler; entitlement bonus ayrı)';

COMMIT;
