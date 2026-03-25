-- ============================================================================
-- RentVerified — Construction & Skilled Trades Data Model
-- ============================================================================
-- Adds projects, project_tasks, and project_time_entries tables for GCs,
-- HVAC techs, plumbers, electricians, handymen, and small crews.
-- Reuses existing workspace + RLS architecture — does NOT touch real-estate tables.
-- ============================================================================

-- ── 1. PROJECTS TABLE ─────────────────────────────────────────────────────
-- A "project" = a job, estimate, or contract for a construction / trades user.
-- Maps to a single client + job site. Optional link to a property for users
-- who also manage real-estate (e.g. landlord hires their own crew).

CREATE TABLE IF NOT EXISTS projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            text NOT NULL,                         -- "Smith Kitchen Remodel"
  description     text,
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','quoted','approved','in_progress','on_hold','completed','cancelled')),
  trade           text,                                  -- hvac, plumbing, electrical, general, handyman, roofing, painting, etc.
  client_name     text,
  client_email    text,
  client_phone    text,
  job_site        text,                                  -- free-text address or "same as client"
  property_id     uuid REFERENCES properties(id) ON DELETE SET NULL,  -- optional link
  quoted_amount   numeric(12,2),
  approved_amount numeric(12,2),
  start_date      date,
  due_date        date,
  completed_at    timestamptz,
  tags            text[] DEFAULT '{}',                   -- e.g. {'residential','permit-required'}
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_trade     ON projects(trade);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Workspace members can CRUD their own workspace's projects
CREATE POLICY "projects_workspace" ON projects
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );


-- ── 2. PROJECT TASKS TABLE ───────────────────────────────────────────────
-- Individual line items / phases inside a project (e.g. "demo old cabinets",
-- "rough-in plumbing", "install fixtures").  Ordering via sort_order.

CREATE TABLE IF NOT EXISTS project_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','skipped')),
  assigned_to     uuid REFERENCES auth.users(id),        -- crew member / sub
  sort_order      int DEFAULT 0,
  estimated_hours numeric(6,1),
  actual_hours    numeric(6,1),
  estimated_cost  numeric(10,2),
  actual_cost     numeric(10,2),
  due_date        date,
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ptasks_workspace ON project_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ptasks_project   ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_ptasks_assigned  ON project_tasks(assigned_to);

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ptasks_workspace" ON project_tasks
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Contractors can see tasks assigned to them
CREATE POLICY "ptasks_assigned" ON project_tasks
  FOR SELECT USING (assigned_to = auth.uid());


-- ── 3. PROJECT TIME ENTRIES TABLE ────────────────────────────────────────
-- Clock-in / clock-out for crew members, linked to a project (and optionally
-- to a specific task).  Supports both "timer" and "manual" entry modes.

CREATE TABLE IF NOT EXISTS project_time_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id         uuid REFERENCES project_tasks(id) ON DELETE SET NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  clock_in        timestamptz NOT NULL,
  clock_out       timestamptz,                           -- NULL = still running
  duration_min    numeric(8,1),                          -- computed or manual
  note            text,
  billable        boolean DEFAULT true,
  hourly_rate     numeric(8,2),                          -- snapshot of rate at log time
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_workspace ON project_time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_project   ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_user      ON project_time_entries(user_id);

ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;

-- Workspace members see all entries in their workspace
CREATE POLICY "time_workspace" ON project_time_entries
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Users can always see / edit their own entries
CREATE POLICY "time_own" ON project_time_entries
  FOR ALL USING (user_id = auth.uid());


-- ── 4. UPDATED_AT AUTO-TOUCH TRIGGERS ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
CREATE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ptasks_updated ON project_tasks;
CREATE TRIGGER trg_ptasks_updated
  BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
