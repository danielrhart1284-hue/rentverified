-- ══════════════════════════════════════════════════════════════════
-- Lending Vertical — Loans Pipeline & Document Checklists
-- ══════════════════════════════════════════════════════════════════

-- ── Loans ──
CREATE TABLE IF NOT EXISTS loans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  loan_number       TEXT NOT NULL,                -- e.g. "LN-2026-001"
  borrower_name     TEXT NOT NULL,
  borrower_email    TEXT,
  borrower_phone    TEXT,
  borrower_company  TEXT,
  loan_type         TEXT NOT NULL CHECK (loan_type IN (
    'hard_money','bridge','fix_and_flip','rental_long_term','construction',
    'commercial','conventional','fha','va','usda','jumbo','heloc','other'
  )),
  status            TEXT NOT NULL DEFAULT 'lead' CHECK (status IN (
    'lead','application','processing','underwriting','conditional_approval',
    'clear_to_close','closing','funded','servicing','default','closed'
  )),
  property_address  TEXT,
  property_type     TEXT,                         -- SFR, multi, commercial, land
  property_value    NUMERIC(14,2),                -- appraised/estimated value
  purchase_price    NUMERIC(14,2),
  loan_amount       NUMERIC(14,2),
  ltv               NUMERIC(5,2),                 -- loan-to-value ratio
  interest_rate     NUMERIC(5,3),                 -- e.g. 12.500
  term_months       INTEGER,
  points            NUMERIC(5,2),                 -- origination points
  monthly_payment   NUMERIC(12,2),
  closing_date      DATE,
  maturity_date     DATE,
  credit_score      INTEGER,
  source            TEXT,                          -- referral, website, broker
  assigned_to       TEXT,                          -- loan officer name
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_loans_workspace ON loans(workspace_id);
CREATE INDEX idx_loans_status ON loans(workspace_id, status);
CREATE UNIQUE INDEX idx_loans_number ON loans(workspace_id, loan_number);
CREATE INDEX idx_loans_borrower ON loans(workspace_id, borrower_name);

-- RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view loans"
  ON loans FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage loans"
  ON loans FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Loan Document Checklist ──
CREATE TABLE IF NOT EXISTS loan_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  loan_id           UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  doc_name          TEXT NOT NULL,                -- e.g. "Pay Stubs (2 months)"
  doc_category      TEXT DEFAULT 'required' CHECK (doc_category IN (
    'required','conditional','optional'
  )),
  status            TEXT DEFAULT 'missing' CHECK (status IN (
    'missing','requested','received','approved','waived'
  )),
  received_date     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loandocs_loan ON loan_documents(loan_id);
CREATE INDEX idx_loandocs_workspace ON loan_documents(workspace_id);

ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view loan docs"
  ON loan_documents FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage loan docs"
  ON loan_documents FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
