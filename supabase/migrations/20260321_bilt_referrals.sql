-- ══════════════════════════════════════════════════════════════════
-- Bilt Alliance — Referral Tracking & Commission Earnings
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bilt_referrals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id         UUID REFERENCES profiles(id),
  landlord_id       UUID REFERENCES profiles(id),
  referral_link     TEXT,
  status            TEXT NOT NULL DEFAULT 'clicked' CHECK (status IN (
    'clicked','pending','approved','paid','declined'
  )),
  commission_amount NUMERIC(10,2) DEFAULT 45.00,
  clicked_at        TIMESTAMPTZ DEFAULT now(),
  converted         BOOLEAN DEFAULT false,
  converted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bilt_referrals_workspace  ON bilt_referrals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bilt_referrals_landlord   ON bilt_referrals(landlord_id);
CREATE INDEX IF NOT EXISTS idx_bilt_referrals_tenant     ON bilt_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bilt_referrals_status     ON bilt_referrals(status);

-- RLS
ALTER TABLE bilt_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY bilt_referrals_select ON bilt_referrals FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY bilt_referrals_insert ON bilt_referrals FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY bilt_referrals_update ON bilt_referrals FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY bilt_referrals_delete ON bilt_referrals FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Auto-update timestamp
CREATE TRIGGER set_bilt_referrals_updated_at
  BEFORE UPDATE ON bilt_referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
