-- ══════════════════════════════════════════════════════════════════
-- Commercial RE Vertical — Deal Pipeline
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS commercial_deals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deal_name         TEXT NOT NULL,
  property_address  TEXT,
  property_type     TEXT CHECK (property_type IN (
    'office','retail','industrial','multifamily','mixed_use',
    'hospitality','medical','land','warehouse','flex','other'
  )),
  deal_type         TEXT DEFAULT 'lease' CHECK (deal_type IN (
    'lease','sale','purchase','sublease','renewal','development','other'
  )),
  status            TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN (
    'prospect','qualifying','proposal','negotiation',
    'due_diligence','closed_won','closed_lost'
  )),
  client_name       TEXT,
  client_email      TEXT,
  client_phone      TEXT,
  client_company    TEXT,
  sqft              NUMERIC(12,0),
  asking_price      NUMERIC(14,2),
  offer_price       NUMERIC(14,2),
  lease_rate_sqft   NUMERIC(10,2),          -- $/sqft/yr for leases
  lease_term_months INTEGER,
  nnn_cam           NUMERIC(10,2),          -- NNN/CAM per sqft
  commission_rate   NUMERIC(5,2),           -- percentage
  commission_amount NUMERIC(14,2),          -- calculated
  close_date        DATE,                   -- expected close
  assigned_to       TEXT,                   -- agent name
  source            TEXT,                   -- referral, cold call, sign call, online, CoStar, etc.
  probability       INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comdeals_workspace ON commercial_deals(workspace_id);
CREATE INDEX idx_comdeals_status ON commercial_deals(workspace_id, status);
CREATE INDEX idx_comdeals_close ON commercial_deals(workspace_id, close_date);
CREATE INDEX idx_comdeals_type ON commercial_deals(workspace_id, deal_type);

ALTER TABLE commercial_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view deals"
  ON commercial_deals FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage deals"
  ON commercial_deals FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
