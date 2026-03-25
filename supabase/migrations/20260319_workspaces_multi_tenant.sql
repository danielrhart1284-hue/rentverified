-- ============================================================================
-- RentVerified — Multi-Tenant Workspace Migration
-- ============================================================================
-- Creates workspace infrastructure + adds workspace_id to all data tables
-- + Row Level Security policies so users only see their workspace's data
-- ============================================================================

-- ── 1. WORKSPACES TABLE ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  owner_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan          text NOT NULL DEFAULT 'starter',
  industry      text NOT NULL DEFAULT 'real_estate',
  feature_flags jsonb DEFAULT '{}',
  logo_url      text,
  bio           text,
  city          text,
  state         text,
  services      text[],
  primary_color text DEFAULT '#2563eb',
  is_public     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Owner can do everything; members can read
CREATE POLICY "workspace_owner_all" ON workspaces
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "workspace_member_read" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "workspace_public_read" ON workspaces
  FOR SELECT USING (is_public = true);


-- ── 2. WORKSPACE MEMBERS TABLE ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer','contractor')),
  permissions   jsonb DEFAULT '{}',
  display_name  text,
  specialty     text,
  hourly_rate   numeric(10,2),
  joined_at     timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their workspace
CREATE POLICY "members_see_own_workspace" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Owners/admins can manage members
CREATE POLICY "members_manage" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users can insert themselves (for joining)
CREATE POLICY "members_join" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());


-- ── 3. WORKSPACE INVITES TABLE ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invite_code   text UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  role          text NOT NULL DEFAULT 'member',
  email         text,
  used_by       uuid REFERENCES auth.users(id),
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Workspace admins/owners can manage invites
CREATE POLICY "invites_manage" ON workspace_invites
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Anyone can read an invite by code (for joining)
CREATE POLICY "invites_read_by_code" ON workspace_invites
  FOR SELECT USING (true);


-- ── 4. ADD workspace_id TO PROFILES ─────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);


-- ── 5. ADD workspace_id TO ALL DATA TABLES ──────────────────────────────────
-- Each table gets a workspace_id column + index + RLS policy

-- Properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_properties_workspace ON properties(workspace_id);
DROP POLICY IF EXISTS "properties_workspace" ON properties;
CREATE POLICY "properties_workspace" ON properties
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Leases
ALTER TABLE leases ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_leases_workspace ON leases(workspace_id);
DROP POLICY IF EXISTS "leases_workspace" ON leases;
CREATE POLICY "leases_workspace" ON leases
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON payments(workspace_id);
DROP POLICY IF EXISTS "payments_workspace" ON payments;
CREATE POLICY "payments_workspace" ON payments
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Accounting entries
ALTER TABLE accounting_entries ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_accounting_workspace ON accounting_entries(workspace_id);
DROP POLICY IF EXISTS "accounting_workspace" ON accounting_entries;
CREATE POLICY "accounting_workspace" ON accounting_entries
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Maintenance requests
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_maintenance_workspace ON maintenance_requests(workspace_id);
DROP POLICY IF EXISTS "maintenance_workspace" ON maintenance_requests;
CREATE POLICY "maintenance_workspace" ON maintenance_requests
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON messages(workspace_id);
DROP POLICY IF EXISTS "messages_workspace" ON messages;
CREATE POLICY "messages_workspace" ON messages
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Applicants
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_applicants_workspace ON applicants(workspace_id);
DROP POLICY IF EXISTS "applicants_workspace" ON applicants;
CREATE POLICY "applicants_workspace" ON applicants
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
DROP POLICY IF EXISTS "documents_workspace" ON documents;
CREATE POLICY "documents_workspace" ON documents
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Eviction cases
ALTER TABLE eviction_cases ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_eviction_workspace ON eviction_cases(workspace_id);
DROP POLICY IF EXISTS "eviction_workspace" ON eviction_cases;
CREATE POLICY "eviction_workspace" ON eviction_cases
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Funding applications
ALTER TABLE funding_applications ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_funding_workspace ON funding_applications(workspace_id);
DROP POLICY IF EXISTS "funding_workspace" ON funding_applications;
CREATE POLICY "funding_workspace" ON funding_applications
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_referrals_workspace ON referrals(workspace_id);
DROP POLICY IF EXISTS "referrals_workspace" ON referrals;
CREATE POLICY "referrals_workspace" ON referrals
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_vendors_workspace ON vendors(workspace_id);
DROP POLICY IF EXISTS "vendors_workspace" ON vendors;
CREATE POLICY "vendors_workspace" ON vendors
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR verification_status = 'verified'  -- public vendor directory
  );

-- Owner statements
ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_statements_workspace ON owner_statements(workspace_id);
DROP POLICY IF EXISTS "statements_workspace" ON owner_statements;
CREATE POLICY "statements_workspace" ON owner_statements
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Management profiles
ALTER TABLE management_profiles ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
CREATE INDEX IF NOT EXISTS idx_mgmt_workspace ON management_profiles(workspace_id);
DROP POLICY IF EXISTS "mgmt_workspace" ON management_profiles;
CREATE POLICY "mgmt_workspace" ON management_profiles
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );


-- ── 6. AUTO-CREATE WORKSPACE ON SIGNUP (TRIGGER) ───────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger AS $$
DECLARE
  ws_id uuid;
  ws_slug text;
BEGIN
  -- Generate slug from company name or email
  ws_slug := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'company', split_part(NEW.email, '@', 1)),
    '[^a-z0-9]+', '-', 'g'
  )) || '-' || substring(md5(random()::text) from 1 for 4);

  -- Create workspace
  INSERT INTO workspaces (name, slug, owner_id, industry, plan)
  VALUES (
    coalesce(NEW.raw_user_meta_data->>'company', split_part(NEW.email, '@', 1) || '''s Workspace'),
    ws_slug,
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'industry', 'real_estate'),
    'starter'
  )
  RETURNING id INTO ws_id;

  -- Add as owner member
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');

  -- Set workspace on profile
  UPDATE profiles SET workspace_id = ws_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after the profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_workspace ON auth.users;
CREATE TRIGGER on_auth_user_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();


-- ── 7. HELPER: GET CURRENT USER'S WORKSPACE ID ─────────────────────────────

CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS uuid AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ── 8. CONTRACTOR SUPPORT ───────────────────────────────────────────────────

-- Add assigned_to column to maintenance_requests for contractor assignment
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_maint_assigned ON maintenance_requests(assigned_to);

-- Contractor-specific RLS: contractors can see maintenance assigned to them
DROP POLICY IF EXISTS "maintenance_contractor" ON maintenance_requests;
CREATE POLICY "maintenance_contractor" ON maintenance_requests
  FOR ALL USING (
    assigned_to = auth.uid()
  );

-- Contractor invite metadata (stored separately to apply on invite acceptance)
CREATE TABLE IF NOT EXISTS contractor_invite_meta (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id     uuid NOT NULL REFERENCES workspace_invites(id) ON DELETE CASCADE,
  display_name  text,
  specialty     text,
  hourly_rate   numeric(10,2),
  permissions   jsonb DEFAULT '{}',
  UNIQUE(invite_id)
);

ALTER TABLE contractor_invite_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invite_meta_manage" ON contractor_invite_meta
  FOR ALL USING (
    invite_id IN (
      SELECT id FROM workspace_invites WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Function: when contractor accepts invite, apply metadata to their membership
CREATE OR REPLACE FUNCTION public.apply_contractor_meta()
RETURNS trigger AS $$
BEGIN
  -- Only run when used_by changes from NULL to a user
  IF OLD.used_by IS NULL AND NEW.used_by IS NOT NULL THEN
    UPDATE workspace_members
    SET
      display_name = meta.display_name,
      specialty    = meta.specialty,
      hourly_rate  = meta.hourly_rate,
      permissions  = meta.permissions
    FROM contractor_invite_meta meta
    WHERE meta.invite_id = NEW.id
      AND workspace_members.workspace_id = NEW.workspace_id
      AND workspace_members.user_id = NEW.used_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_invite_accepted ON workspace_invites;
CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON workspace_invites
  FOR EACH ROW EXECUTE FUNCTION public.apply_contractor_meta();
