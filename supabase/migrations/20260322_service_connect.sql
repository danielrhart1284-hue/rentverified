-- ═══════════════════════════════════════════════════════════════════════
-- SERVICE CONNECT: Access Templates, Access Grants, Loan Packages, Messages
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. ACCESS TEMPLATES ──────────────────────────────────────────────
-- Pre-configured data-sharing specs per provider role
CREATE TABLE IF NOT EXISTS access_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          TEXT NOT NULL CHECK (role IN (
    'loan_officer','insurance_agent','accountant','attorney',
    'marketing_agency','bookkeeper','appraiser','inspector'
  )),
  name          TEXT NOT NULL,
  description   TEXT,
  data_spec     JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_at_role ON access_templates(role);

-- Seed default templates
INSERT INTO access_templates (role, name, description, data_spec) VALUES
  ('loan_officer', 'Standard SBA Loan Package', 'Revenue, expenses, cash flow, owner statements, business license verification',
   '{"accounting_entries":["amount","entry_date","category","type"],"owner_statements":["period","total_income","total_expense","net"],"payments":["amount","date","status"],"properties":["address","value","units"],"profile":["business_name","business_type","state","license_verified"]}'),
  ('insurance_agent', 'Basic P&C Insurance Quote', 'Business profile, properties/assets, revenue range, employee count, current policies',
   '{"profile":["business_name","business_type","state","employee_count"],"properties":["address","value","units","type"],"accounting_entries":["amount","category","type"]}'),
  ('accountant', 'Full Bookkeeping Access', 'Accounting entries, payments, owner statements, receipts, documents',
   '{"accounting_entries":"*","payments":"*","owner_statements":"*","documents":["name","type","created_at"],"properties":["address","units"]}'),
  ('attorney', 'Legal Review Package', 'Leases, eviction cases, documents, property details, tenant info',
   '{"leases":"*","eviction_cases":"*","documents":"*","properties":["address","units","type"],"tenants":["name","lease_status"]}'),
  ('marketing_agency', 'Marketing Data Package', 'Business profile, listings, properties, review data',
   '{"profile":["business_name","business_type","state","website"],"listings":"*","properties":["address","type","photos"],"reviews":["rating","count"]}'),
  ('bookkeeper', 'Monthly Bookkeeping Access', 'Accounting entries, payments, bank transactions',
   '{"accounting_entries":"*","payments":"*","owner_statements":["period","total_income","total_expense"]}'),
  ('appraiser', 'Property Appraisal Package', 'Property details, recent transactions, comparable data',
   '{"properties":"*","accounting_entries":["amount","category","entry_date"],"documents":["name","type"]}'),
  ('inspector', 'Inspection Package', 'Property details, maintenance history, documents',
   '{"properties":"*","maintenance_requests":"*","documents":["name","type","created_at"]}')
ON CONFLICT DO NOTHING;

ALTER TABLE access_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Access templates are readable by all authenticated users"
  ON access_templates FOR SELECT USING (auth.uid() IS NOT NULL);


-- ── 2. ACCESS GRANTS ─────────────────────────────────────────────────
-- Tracks which business shared what data with which provider
CREATE TABLE IF NOT EXISTS access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL,
  professional_id UUID NOT NULL,
  template_id     UUID REFERENCES access_templates(id),
  granted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','revoked','expired')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ag_workspace ON access_grants(workspace_id);
CREATE INDEX idx_ag_business ON access_grants(business_id);
CREATE INDEX idx_ag_professional ON access_grants(professional_id);
CREATE INDEX idx_ag_status ON access_grants(status);

ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their workspace grants"
  ON access_grants FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Professionals see grants shared with them"
  ON access_grants FOR SELECT
  USING (professional_id = auth.uid() AND status = 'active');


-- ── 3. LOAN PACKAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_packages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL,
  loan_officer_id   UUID NOT NULL,
  grant_id          UUID REFERENCES access_grants(id),
  status            TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','under_review','pre_approved','funded','declined'
  )),
  shared_at         TIMESTAMPTZ,
  revenue_12mo      NUMERIC(14,2),
  expense_12mo      NUMERIC(14,2),
  cashflow_avg      NUMERIC(14,2),
  license_verified  BOOLEAN DEFAULT false,
  package_url       TEXT,
  loan_type         TEXT,
  loan_amount       NUMERIC(14,2),
  notes             TEXT,
  status_history    JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lp_workspace ON loan_packages(workspace_id);
CREATE INDEX idx_lp_business ON loan_packages(business_id);
CREATE INDEX idx_lp_officer ON loan_packages(loan_officer_id);
CREATE INDEX idx_lp_status ON loan_packages(status);

ALTER TABLE loan_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage their loan packages"
  ON loan_packages FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Loan officers see packages assigned to them"
  ON loan_packages FOR SELECT
  USING (loan_officer_id = auth.uid());

CREATE POLICY "Loan officers update status on their packages"
  ON loan_packages FOR UPDATE
  USING (loan_officer_id = auth.uid());


-- ── 4. MESSAGES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  from_id       UUID,
  to_id         UUID,
  message_type  TEXT NOT NULL CHECK (message_type IN ('internal','professional','promotional')),
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  read          BOOLEAN DEFAULT false,
  related_id    UUID,
  related_type  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_msg_workspace ON messages(workspace_id);
CREATE INDEX idx_msg_to ON messages(to_id);
CREATE INDEX idx_msg_type ON messages(message_type);
CREATE INDEX idx_msg_read ON messages(read);
CREATE INDEX idx_msg_created ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see messages in their workspace or to them"
  ON messages FOR ALL
  USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR to_id = auth.uid()
    OR from_id = auth.uid()
  );
