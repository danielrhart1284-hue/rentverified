-- Business Deadlines table
-- Tracks all time-sensitive obligations per workspace
CREATE TABLE IF NOT EXISTS business_deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id     UUID,
  deadline_type   TEXT NOT NULL CHECK (deadline_type IN (
    'license_renewal','insurance_renewal','tax_filing','tax_payment',
    'permit_renewal','registration_renewal','compliance_audit',
    'lease_renewal','contract_renewal','inspection','bond_renewal',
    'annual_report','ein_update','workers_comp_renewal','custom'
  )),
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        DATE NOT NULL,
  status          TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','due_soon','overdue','completed','dismissed')),
  reminder_sent_at TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  auto_generated  BOOLEAN DEFAULT false,
  recurring       TEXT CHECK (recurring IN ('monthly','quarterly','annually','none')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deadlines_workspace ON business_deadlines(workspace_id);
CREATE INDEX idx_deadlines_due ON business_deadlines(due_date);
CREATE INDEX idx_deadlines_status ON business_deadlines(status);
CREATE INDEX idx_deadlines_type ON business_deadlines(deadline_type);

ALTER TABLE business_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace deadlines"
  ON business_deadlines FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));
