-- ══════════════════════════════════════════════════════════════════
-- Attorney Vertical — Matters (Cases), Deadlines, Time Entries
-- ══════════════════════════════════════════════════════════════════

-- ── Matters (Cases) ──
CREATE TABLE IF NOT EXISTS matters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  matter_number     TEXT NOT NULL,                -- e.g. "2026-001"
  title             TEXT NOT NULL,
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_phone      TEXT,
  matter_type       TEXT NOT NULL CHECK (matter_type IN (
    'eviction','landlord_tenant','real_estate','contract','litigation',
    'corporate','estate_planning','family','criminal','immigration','other'
  )),
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'intake','open','discovery','negotiation','trial','appeal','closed','archived'
  )),
  opposing_party    TEXT,
  opposing_counsel  TEXT,
  court_name        TEXT,
  case_number       TEXT,                         -- court case number
  judge             TEXT,
  date_opened       DATE DEFAULT CURRENT_DATE,
  date_closed       DATE,
  statute_of_limitations DATE,
  retainer_amount   NUMERIC(12,2) DEFAULT 0,
  billed_total      NUMERIC(12,2) DEFAULT 0,
  hourly_rate       NUMERIC(8,2),                 -- override per-matter rate
  is_trust_funded   BOOLEAN DEFAULT false,        -- paid from IOLTA trust
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_matters_workspace ON matters(workspace_id);
CREATE INDEX idx_matters_status ON matters(workspace_id, status);
CREATE UNIQUE INDEX idx_matters_number ON matters(workspace_id, matter_number);
CREATE INDEX idx_matters_client ON matters(workspace_id, client_name);

-- RLS
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view matters"
  ON matters FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage matters"
  ON matters FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Matter Deadlines ──
CREATE TABLE IF NOT EXISTS matter_deadlines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  matter_id         UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  deadline_date     DATE NOT NULL,
  deadline_type     TEXT DEFAULT 'filing' CHECK (deadline_type IN (
    'filing','hearing','discovery','deposition','mediation','trial','appeal','other'
  )),
  is_completed      BOOLEAN DEFAULT false,
  alert_days_before INTEGER DEFAULT 7,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deadlines_matter ON matter_deadlines(matter_id);
CREATE INDEX idx_deadlines_workspace ON matter_deadlines(workspace_id);
CREATE INDEX idx_deadlines_upcoming ON matter_deadlines(workspace_id, deadline_date) WHERE NOT is_completed;

ALTER TABLE matter_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view deadlines"
  ON matter_deadlines FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage deadlines"
  ON matter_deadlines FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Matter Time Entries (billable hours) ──
CREATE TABLE IF NOT EXISTS matter_time_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  matter_id         UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id),
  description       TEXT NOT NULL,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  hours             NUMERIC(6,2) NOT NULL,
  rate              NUMERIC(8,2),                 -- hourly rate at time of entry
  amount            NUMERIC(12,2),                -- hours × rate (computed on save)
  is_billable       BOOLEAN DEFAULT true,
  is_billed         BOOLEAN DEFAULT false,        -- included on an invoice?
  invoice_id        TEXT,                          -- reference to invoice
  timer_start       TIMESTAMPTZ,                  -- for live timer
  timer_end         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mte_matter ON matter_time_entries(matter_id);
CREATE INDEX idx_mte_workspace ON matter_time_entries(workspace_id);
CREATE INDEX idx_mte_unbilled ON matter_time_entries(workspace_id, is_billed) WHERE NOT is_billed;

ALTER TABLE matter_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view time entries"
  ON matter_time_entries FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage time entries"
  ON matter_time_entries FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
