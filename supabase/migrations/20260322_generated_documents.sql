-- Generated Documents table
-- Stores all documents created through the doc generator
CREATE TABLE IF NOT EXISTS generated_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id   TEXT NOT NULL,
  template_name TEXT NOT NULL,
  profession    TEXT NOT NULL,
  company       TEXT,
  contact_name  TEXT,
  address       TEXT,
  phone_email   TEXT,
  to_name       TEXT,
  to_company    TEXT,
  to_address    TEXT,
  to_email      TEXT,
  doc_number    TEXT,
  doc_date      DATE,
  due_date      DATE,
  subtotal      NUMERIC(12,2) DEFAULT 0,
  tax_rate      NUMERIC(5,2) DEFAULT 0,
  tax_amount    NUMERIC(12,2) DEFAULT 0,
  discount      NUMERIC(12,2) DEFAULT 0,
  total         NUMERIC(12,2) DEFAULT 0,
  line_items    JSONB DEFAULT '[]',
  extra_fields  JSONB DEFAULT '{}',
  notes         TEXT,
  html_content  TEXT,
  logo_url      TEXT,
  qr_payment_url TEXT,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','void')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gendocs_workspace ON generated_documents(workspace_id);
CREATE INDEX idx_gendocs_template ON generated_documents(template_id);
CREATE INDEX idx_gendocs_profession ON generated_documents(profession);
CREATE INDEX idx_gendocs_status ON generated_documents(status);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace docs"
  ON generated_documents FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));
