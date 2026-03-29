-- Business Profiles: universal business identity
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  business_type TEXT NOT NULL DEFAULT 'generic_service'
    CHECK (business_type IN ('property_manager','contractor','salon','restaurant','retail','generic_service','nonprofit','attorney','insurance_agent','loan_officer')),
  modules_enabled JSONB NOT NULL DEFAULT '{
    "crm": true,
    "accounting": true,
    "jobs": true,
    "documents": true,
    "payments": true,
    "notifications": true,
    "ai_assistant": true,
    "team": true
  }'::jsonb,
  industry_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own business profile" ON public.business_profiles
  FOR ALL USING (auth.uid() = owner_id);

-- Custom Reports: AI-learned report definitions
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_type TEXT,
  report_name TEXT NOT NULL,
  report_category TEXT CHECK (report_category IN ('financial','clients','jobs','compliance','executive','leasing','maintenance')),
  description TEXT,
  columns_detected JSONB DEFAULT '[]',
  query_template TEXT,
  query_params JSONB DEFAULT '{}',
  file_format_default TEXT DEFAULT 'csv' CHECK (file_format_default IN ('csv','pdf')),
  frequency TEXT DEFAULT 'on_demand' CHECK (frequency IN ('on_demand','weekly','monthly','quarterly','annual')),
  storage_path TEXT,
  is_builtin BOOLEAN DEFAULT FALSE,
  placement TEXT DEFAULT 'financial',
  last_generated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reports" ON public.custom_reports
  FOR ALL USING (auth.uid() = owner_id);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_profiles_updated
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER custom_reports_updated
  BEFORE UPDATE ON public.custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed universal built-in reports (run for each new user via function)
CREATE OR REPLACE FUNCTION seed_builtin_reports(p_owner_id UUID, p_business_type TEXT)
RETURNS VOID AS $$
BEGIN
  -- Universal reports (all business types)
  INSERT INTO custom_reports (owner_id, business_type, report_name, report_category, description, query_template, is_builtin, placement) VALUES
    (p_owner_id, p_business_type, 'Client / Contact List', 'clients', 'All clients with contact info and status', 'REPORT:CLIENT_LIST', TRUE, 'clients'),
    (p_owner_id, p_business_type, 'Income & Expense Report', 'financial', 'Revenue and expenses by date range', 'REPORT:INCOME_EXPENSE', TRUE, 'financial'),
    (p_owner_id, p_business_type, 'Cash Flow Summary', 'financial', 'Cash inflows and outflows over time', 'REPORT:CASH_FLOW', TRUE, 'financial'),
    (p_owner_id, p_business_type, 'Open Invoices / AR Aging', 'financial', 'Outstanding invoices grouped by age', 'REPORT:AR_AGING', TRUE, 'financial'),
    (p_owner_id, p_business_type, 'Payments Received', 'financial', 'All payments received in date range', 'REPORT:PAYMENTS_RECEIVED', TRUE, 'financial'),
    (p_owner_id, p_business_type, 'Job / Work Order Summary', 'jobs', 'All jobs with status, cost, and assignment', 'REPORT:JOB_SUMMARY', TRUE, 'jobs'),
    (p_owner_id, p_business_type, 'Document List', 'clients', 'Documents organized by client or project', 'REPORT:DOCUMENT_LIST', TRUE, 'clients'),
    (p_owner_id, p_business_type, 'KPI Snapshot', 'executive', 'Revenue, active clients, open jobs at a glance', 'REPORT:KPI_SNAPSHOT', TRUE, 'executive');

  -- Property Manager specific
  IF p_business_type = 'property_manager' THEN
    INSERT INTO custom_reports (owner_id, business_type, report_name, report_category, description, query_template, is_builtin, placement) VALUES
      (p_owner_id, p_business_type, 'Rent Roll', 'leasing', 'All tenants, units, rent amounts, payment status', 'REPORT:RENT_ROLL', TRUE, 'leasing'),
      (p_owner_id, p_business_type, 'Owner Statement (EOM)', 'financial', 'Monthly income, expenses, distributions per owner', 'REPORT:OWNER_STATEMENT', TRUE, 'financial'),
      (p_owner_id, p_business_type, 'Lease Expiration 30/60/90', 'leasing', 'Leases expiring within 30, 60, or 90 days', 'REPORT:LEASE_EXPIRATION', TRUE, 'leasing'),
      (p_owner_id, p_business_type, 'Maintenance Cost by Property', 'maintenance', 'Maintenance spend breakdown per property', 'REPORT:MAINTENANCE_COST', TRUE, 'maintenance'),
      (p_owner_id, p_business_type, 'Eviction Activity Log', 'compliance', 'All eviction notices, filings, and outcomes', 'REPORT:EVICTION_LOG', TRUE, 'compliance'),
      (p_owner_id, p_business_type, 'Screening Summary', 'leasing', 'Applicant screening results and decisions', 'REPORT:SCREENING_SUMMARY', TRUE, 'leasing');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
