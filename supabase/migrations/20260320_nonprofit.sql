-- ══════════════════════════════════════════════════════════════════
-- Nonprofit / Association Vertical — Donors, Volunteers, Grants
-- ══════════════════════════════════════════════════════════════════

-- ── Donor Records ──
CREATE TABLE IF NOT EXISTS donor_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  donor_name        TEXT NOT NULL,
  donor_email       TEXT,
  donor_phone       TEXT,
  donor_company     TEXT,
  donor_type        TEXT DEFAULT 'individual' CHECK (donor_type IN (
    'individual','corporate','foundation','government','anonymous','other'
  )),
  status            TEXT DEFAULT 'active' CHECK (status IN (
    'prospect','active','lapsed','major','recurring','one_time'
  )),
  total_donated     NUMERIC(14,2) DEFAULT 0,
  last_donation     DATE,
  donation_count    INTEGER DEFAULT 0,
  recurring_amount  NUMERIC(12,2),                -- monthly recurring gift
  recurring_interval TEXT CHECK (recurring_interval IN ('monthly','quarterly','annually')),
  fund_designation  TEXT DEFAULT 'unrestricted' CHECK (fund_designation IN (
    'unrestricted','restricted','endowment','capital','program','other'
  )),
  source            TEXT,                          -- gala, online, mail, event, referral
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_donors_workspace ON donor_records(workspace_id);
CREATE INDEX idx_donors_status ON donor_records(workspace_id, status);
CREATE INDEX idx_donors_name ON donor_records(workspace_id, donor_name);
CREATE INDEX idx_donors_type ON donor_records(workspace_id, donor_type);

ALTER TABLE donor_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view donors"
  ON donor_records FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage donors"
  ON donor_records FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ── Donations (individual gifts) ──
CREATE TABLE IF NOT EXISTS donations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  donor_id          UUID NOT NULL REFERENCES donor_records(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  donation_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  fund_designation  TEXT DEFAULT 'unrestricted' CHECK (fund_designation IN (
    'unrestricted','restricted','endowment','capital','program','other'
  )),
  payment_method    TEXT CHECK (payment_method IN (
    'check','cash','credit_card','bank_transfer','online','in_kind','stock','other'
  )),
  campaign          TEXT,                          -- annual fund, gala, capital campaign
  is_recurring      BOOLEAN DEFAULT false,
  receipt_sent      BOOLEAN DEFAULT false,
  tax_deductible    BOOLEAN DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_donations_workspace ON donations(workspace_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_date ON donations(workspace_id, donation_date);
CREATE INDEX idx_donations_fund ON donations(workspace_id, fund_designation);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view donations"
  ON donations FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage donations"
  ON donations FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ── Volunteer Hours ──
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  volunteer_name    TEXT NOT NULL,
  volunteer_email   TEXT,
  volunteer_phone   TEXT,
  activity          TEXT NOT NULL,                 -- event setup, tutoring, admin, etc.
  hours             NUMERIC(6,2) NOT NULL,
  volunteer_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status            TEXT DEFAULT 'logged' CHECK (status IN (
    'logged','approved','rejected'
  )),
  program           TEXT,                          -- which program/event
  supervisor        TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_volhours_workspace ON volunteer_hours(workspace_id);
CREATE INDEX idx_volhours_date ON volunteer_hours(workspace_id, volunteer_date);
CREATE INDEX idx_volhours_volunteer ON volunteer_hours(workspace_id, volunteer_name);

ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view volunteer hours"
  ON volunteer_hours FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage volunteer hours"
  ON volunteer_hours FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ── Grant Tracking ──
CREATE TABLE IF NOT EXISTS grant_tracking (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  grant_name        TEXT NOT NULL,
  funder            TEXT NOT NULL,                 -- foundation / agency name
  funder_contact    TEXT,
  status            TEXT NOT NULL DEFAULT 'researching' CHECK (status IN (
    'researching','preparing','submitted','under_review',
    'approved','declined','active','reporting','closed'
  )),
  amount_requested  NUMERIC(14,2),
  amount_awarded    NUMERIC(14,2),
  fund_designation  TEXT DEFAULT 'restricted' CHECK (fund_designation IN (
    'unrestricted','restricted','endowment','capital','program','other'
  )),
  deadline          DATE,                          -- application deadline
  start_date        DATE,
  end_date          DATE,
  report_due        DATE,                          -- next report due date
  program           TEXT,                          -- program this funds
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grants_workspace ON grant_tracking(workspace_id);
CREATE INDEX idx_grants_status ON grant_tracking(workspace_id, status);
CREATE INDEX idx_grants_deadline ON grant_tracking(workspace_id, deadline);

ALTER TABLE grant_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view grants"
  ON grant_tracking FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage grants"
  ON grant_tracking FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
