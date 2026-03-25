-- ═══════════════════════════════════════════════════════════════════════
-- Insurance Quote Comparisons
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS insurance_quote_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  property_address text,
  coverage_type text NOT NULL CHECK (coverage_type IN (
    'property','renters','commercial','umbrella',
    'general_liability','workers_comp','auto','life','health','bonds','other'
  )),
  coverage_amount numeric,
  property_value numeric,
  deductible numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES insurance_quote_requests(id) ON DELETE CASCADE NOT NULL,
  carrier text NOT NULL,
  premium numeric NOT NULL,
  monthly numeric,
  deductible numeric,
  coverage numeric,
  liability numeric,
  personal_property numeric,
  loss_of_rent numeric,
  commission_rate numeric,
  commission_amount numeric,
  am_best_rating text,
  claims_rating text,
  response_time text,
  selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ins_quote_requests_workspace ON insurance_quote_requests(workspace_id);
CREATE INDEX idx_ins_quotes_request ON insurance_quotes(request_id);
CREATE INDEX idx_ins_quotes_workspace ON insurance_quotes(workspace_id);

-- RLS
ALTER TABLE insurance_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can manage quote requests"
  ON insurance_quote_requests FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace members can manage quotes"
  ON insurance_quotes FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
