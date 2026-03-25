-- ══════════════════════════════════════════════════════════════════
-- Chart of Accounts — double-entry bookkeeping foundation
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  account_code      TEXT NOT NULL,              -- e.g. "1000", "2000"
  account_name      TEXT NOT NULL,              -- e.g. "Cash", "Accounts Receivable"
  account_type      TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_active         BOOLEAN DEFAULT true,
  is_trust_account  BOOLEAN DEFAULT false,      -- IOLTA / client trust (for attorneys)
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coa_workspace ON chart_of_accounts(workspace_id);
CREATE UNIQUE INDEX idx_coa_code_ws ON chart_of_accounts(workspace_id, account_code);

-- RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view COA"
  ON chart_of_accounts FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners/admins can manage COA"
  ON chart_of_accounts FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
      AND role IN ('owner','admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════
-- Add 'reconciled' flag to accounting_entries if it doesn't exist
-- ══════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounting_entries' AND column_name = 'is_reconciled'
  ) THEN
    ALTER TABLE accounting_entries ADD COLUMN is_reconciled BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounting_entries' AND column_name = 'account_code'
  ) THEN
    ALTER TABLE accounting_entries ADD COLUMN account_code TEXT;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- Seed function: creates default chart of accounts for a workspace
-- Call: SELECT seed_chart_of_accounts('workspace-uuid-here');
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION seed_chart_of_accounts(ws_id UUID)
RETURNS void AS $$
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE workspace_id = ws_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO chart_of_accounts (workspace_id, account_code, account_name, account_type) VALUES
    -- Assets (1000s)
    (ws_id, '1000', 'Cash - Operating',           'asset'),
    (ws_id, '1010', 'Cash - Petty Cash',           'asset'),
    (ws_id, '1100', 'Accounts Receivable',         'asset'),
    (ws_id, '1200', 'Prepaid Expenses',            'asset'),
    (ws_id, '1300', 'Equipment',                   'asset'),
    (ws_id, '1310', 'Accumulated Depreciation',    'asset'),
    (ws_id, '1400', 'Security Deposits Held',      'asset'),
    -- Liabilities (2000s)
    (ws_id, '2000', 'Accounts Payable',            'liability'),
    (ws_id, '2100', 'Credit Card Payable',         'liability'),
    (ws_id, '2200', 'Mortgage / Loans Payable',    'liability'),
    (ws_id, '2300', 'Accrued Expenses',            'liability'),
    (ws_id, '2400', 'Security Deposits Liability', 'liability'),
    (ws_id, '2500', 'Sales Tax Payable',           'liability'),
    -- Equity (3000s)
    (ws_id, '3000', 'Owner Equity',                'equity'),
    (ws_id, '3100', 'Retained Earnings',           'equity'),
    (ws_id, '3200', 'Owner Draws',                 'equity'),
    -- Revenue (4000s)
    (ws_id, '4000', 'Service Revenue',             'revenue'),
    (ws_id, '4010', 'Rent Income',                 'revenue'),
    (ws_id, '4020', 'Consulting Revenue',          'revenue'),
    (ws_id, '4030', 'Late Fees',                   'revenue'),
    (ws_id, '4040', 'Other Income',                'revenue'),
    -- Expenses (5000s–6000s)
    (ws_id, '5000', 'Cost of Goods Sold',          'expense'),
    (ws_id, '5100', 'Subcontractor Expense',       'expense'),
    (ws_id, '5200', 'Materials & Supplies',        'expense'),
    (ws_id, '6000', 'Rent Expense',                'expense'),
    (ws_id, '6010', 'Utilities',                   'expense'),
    (ws_id, '6020', 'Insurance',                   'expense'),
    (ws_id, '6030', 'Repairs & Maintenance',       'expense'),
    (ws_id, '6040', 'Office Supplies',             'expense'),
    (ws_id, '6050', 'Advertising & Marketing',     'expense'),
    (ws_id, '6060', 'Professional Fees',           'expense'),
    (ws_id, '6070', 'Travel & Transportation',     'expense'),
    (ws_id, '6080', 'Payroll / Wages',             'expense'),
    (ws_id, '6090', 'Depreciation',                'expense'),
    (ws_id, '6100', 'Bank Fees & Interest',        'expense'),
    (ws_id, '6110', 'Taxes & Licenses',            'expense'),
    (ws_id, '6999', 'Miscellaneous Expense',       'expense');
END;
$$ LANGUAGE plpgsql;
