-- ══════════════════════════════════════════════════════════════════
-- Marketing/Consultant Vertical — Proposals & Retainers
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS proposals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  proposal_number   TEXT NOT NULL,                -- e.g. "PROP-2026-001"
  title             TEXT NOT NULL,
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_company    TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','sent','viewed','accepted','declined','expired','revised'
  )),
  proposal_type     TEXT DEFAULT 'project' CHECK (proposal_type IN (
    'project','retainer','hourly','fixed','milestone','other'
  )),
  amount            NUMERIC(12,2),
  recurring_amount  NUMERIC(12,2),                -- monthly retainer amount
  recurring_interval TEXT CHECK (recurring_interval IN ('weekly','monthly','quarterly','annually')),
  valid_until       DATE,
  scope_summary     TEXT,                         -- brief scope of work
  deliverables      TEXT,                         -- line items / deliverables (JSON or text)
  terms             TEXT,                         -- payment terms
  sent_at           TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  declined_at       TIMESTAMPTZ,
  project_id        TEXT,                         -- link to project if converted
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_proposals_workspace ON proposals(workspace_id);
CREATE INDEX idx_proposals_status ON proposals(workspace_id, status);
CREATE UNIQUE INDEX idx_proposals_number ON proposals(workspace_id, proposal_number);
CREATE INDEX idx_proposals_client ON proposals(workspace_id, client_name);

-- RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view proposals"
  ON proposals FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage proposals"
  ON proposals FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
