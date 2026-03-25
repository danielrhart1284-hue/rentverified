-- ══════════════════════════════════════════════════════════════════
-- Construction Vertical — Project Materials & Price Lookup
-- ══════════════════════════════════════════════════════════════════

-- ── Project Materials (tracked per job/project) ──
CREATE TABLE IF NOT EXISTS project_materials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id        UUID,                                -- links to rv_projects (optional)
  material_name     TEXT NOT NULL,
  category          TEXT CHECK (category IN (
    'lumber','concrete','drywall','electrical','plumbing','hvac',
    'roofing','flooring','paint','hardware','insulation','fixtures',
    'tile','siding','windows_doors','fasteners','adhesives','other'
  )),
  quantity          NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit              TEXT DEFAULT 'each',                  -- each, sqft, lnft, board, sheet, bag, box, gallon, lb, ton
  unit_price        NUMERIC(10,2),                        -- price per unit
  total_price       NUMERIC(12,2),                        -- quantity * unit_price
  supplier          TEXT,
  supplier_sku      TEXT,
  status            TEXT DEFAULT 'needed' CHECK (status IN (
    'needed','ordered','received','installed','returned'
  )),
  order_date        DATE,
  received_date     DATE,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projmat_workspace ON project_materials(workspace_id);
CREATE INDEX idx_projmat_project ON project_materials(project_id);
CREATE INDEX idx_projmat_category ON project_materials(workspace_id, category);
CREATE INDEX idx_projmat_status ON project_materials(workspace_id, status);

ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project materials"
  ON project_materials FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage project materials"
  ON project_materials FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
