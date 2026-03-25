-- ══════════════════════════════════════════════════════════════════
-- Insurance Agent/Broker Vertical — Policies & Commissions
-- ══════════════════════════════════════════════════════════════════

-- ── Policies / Pipeline ──
CREATE TABLE IF NOT EXISTS insurance_policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  policy_number     TEXT NOT NULL,                -- e.g. "POL-2026-001"
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_phone      TEXT,
  client_company    TEXT,
  status            TEXT NOT NULL DEFAULT 'lead' CHECK (status IN (
    'lead','quoting','quoted','application','underwriting',
    'bound','active','renewal','lapsed','cancelled'
  )),
  policy_type       TEXT NOT NULL CHECK (policy_type IN (
    'property','renters','commercial','umbrella','workers_comp',
    'general_liability','auto','life','health','bonds','other'
  )),
  carrier           TEXT,                         -- e.g. "State Farm", "Liberty Mutual"
  effective_date    DATE,
  expiration_date   DATE,
  premium           NUMERIC(12,2),                -- annual premium
  commission_rate   NUMERIC(5,2),                 -- commission % (e.g. 15.00)
  commission_amount NUMERIC(12,2),                -- calculated commission $
  property_address  TEXT,                         -- insured property (if applicable)
  coverage_amount   NUMERIC(14,2),                -- coverage limit
  deductible        NUMERIC(12,2),
  source            TEXT,                          -- referral, website, cold call, renewal
  assigned_to       TEXT,                          -- agent name
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inspol_workspace ON insurance_policies(workspace_id);
CREATE INDEX idx_inspol_status ON insurance_policies(workspace_id, status);
CREATE UNIQUE INDEX idx_inspol_number ON insurance_policies(workspace_id, policy_number);
CREATE INDEX idx_inspol_client ON insurance_policies(workspace_id, client_name);
CREATE INDEX idx_inspol_expiration ON insurance_policies(workspace_id, expiration_date);

-- RLS
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view policies"
  ON insurance_policies FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage policies"
  ON insurance_policies FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Commissions Tracker ──
CREATE TABLE IF NOT EXISTS insurance_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  policy_id         UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  commission_type   TEXT DEFAULT 'new_business' CHECK (commission_type IN (
    'new_business','renewal','override','bonus','referral'
  )),
  amount            NUMERIC(12,2) NOT NULL,
  rate              NUMERIC(5,2),                 -- % rate used
  earned_date       DATE,
  paid_date         DATE,
  status            TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','earned','paid','clawback'
  )),
  carrier           TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inscomm_policy ON insurance_commissions(policy_id);
CREATE INDEX idx_inscomm_workspace ON insurance_commissions(workspace_id);
CREATE INDEX idx_inscomm_status ON insurance_commissions(workspace_id, status);

ALTER TABLE insurance_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view commissions"
  ON insurance_commissions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage commissions"
  ON insurance_commissions FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
