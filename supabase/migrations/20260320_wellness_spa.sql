-- ══════════════════════════════════════════════════════════════════
-- Medical Spa / Wellness Vertical — Appointments & Inventory
-- ══════════════════════════════════════════════════════════════════

-- ── Appointments / Scheduling ──
CREATE TABLE IF NOT EXISTS spa_appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_phone      TEXT,
  service           TEXT NOT NULL,                -- e.g. "Botox", "Facial", "Laser"
  service_category  TEXT CHECK (service_category IN (
    'injectables','laser','facial','body','wellness','consultation','follow_up','other'
  )),
  staff_name        TEXT,                          -- provider / aesthetician
  staff_id          TEXT,                          -- internal staff ID
  room              TEXT,                          -- room name or number
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled','confirmed','checked_in','in_progress','completed','no_show','cancelled'
  )),
  amount            NUMERIC(10,2),                 -- service price
  deposit           NUMERIC(10,2),
  consent_signed    BOOLEAN DEFAULT false,         -- consent/intake form signed
  notes             TEXT,                          -- provider notes
  intake_notes      TEXT,                          -- client medical history notes
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_spaappt_workspace ON spa_appointments(workspace_id);
CREATE INDEX idx_spaappt_date ON spa_appointments(workspace_id, start_time);
CREATE INDEX idx_spaappt_status ON spa_appointments(workspace_id, status);
CREATE INDEX idx_spaappt_client ON spa_appointments(workspace_id, client_name);
CREATE INDEX idx_spaappt_staff ON spa_appointments(workspace_id, staff_name);

-- RLS
ALTER TABLE spa_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view appointments"
  ON spa_appointments FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage appointments"
  ON spa_appointments FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ── Inventory / Supplies ──
CREATE TABLE IF NOT EXISTS spa_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_name         TEXT NOT NULL,
  sku               TEXT,
  category          TEXT CHECK (category IN (
    'injectables','topicals','devices','consumables','retail','other'
  )),
  quantity          NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit              TEXT DEFAULT 'units',           -- units, ml, vials, boxes
  reorder_threshold NUMERIC(10,2) DEFAULT 5,
  cost_per_unit     NUMERIC(10,2),
  retail_price      NUMERIC(10,2),
  supplier          TEXT,
  lot_number        TEXT,                           -- for medical tracking
  expiration_date   DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_spainv_workspace ON spa_inventory(workspace_id);
CREATE INDEX idx_spainv_category ON spa_inventory(workspace_id, category);
CREATE INDEX idx_spainv_low_stock ON spa_inventory(workspace_id, quantity, reorder_threshold);

-- RLS
ALTER TABLE spa_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view inventory"
  ON spa_inventory FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage inventory"
  ON spa_inventory FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
