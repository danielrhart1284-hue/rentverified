-- ============================================================================
-- RentVerified — Workspace / Multi-Tenant Migration
-- ============================================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This adds workspace isolation so multiple businesses can use the platform
-- ============================================================================

-- ── 1. CREATE WORKSPACES TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4F46E5',
  domain_alias TEXT,
  industry TEXT DEFAULT 'general' CHECK (industry IN ('real_estate', 'accounting', 'legal', 'mortgage', 'general')),
  is_public BOOLEAN DEFAULT FALSE,
  bio TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  services TEXT[],
  feature_flags JSONB DEFAULT '{
    "properties": true, "leases": true, "maintenance": true, "screening": true,
    "accounting": true, "documents": true, "funding": true, "insurance": false,
    "legal_cases": false, "lending": false, "crm": false, "invoicing": false
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_industry ON workspaces(industry);

-- ── 2. ADD workspace_id TO PROFILES ─────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_workspace ON profiles(workspace_id);

-- ── 3. ADD workspace_id TO ALL BUSINESS TABLES ──────────────────────────────

ALTER TABLE properties ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_properties_workspace ON properties(workspace_id);

ALTER TABLE leases ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leases_workspace ON leases(workspace_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON payments(workspace_id);

ALTER TABLE accounting_entries ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_accounting_workspace ON accounting_entries(workspace_id);

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_maintenance_workspace ON maintenance_requests(workspace_id);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);

ALTER TABLE funding_applications ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_funding_workspace ON funding_applications(workspace_id);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vendors_workspace ON vendors(workspace_id);

ALTER TABLE applicants ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_applicants_workspace ON applicants(workspace_id);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON messages(workspace_id);

ALTER TABLE eviction_cases ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_eviction_workspace ON eviction_cases(workspace_id);

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_referrals_workspace ON referrals(workspace_id);

ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_statements_workspace ON owner_statements(workspace_id);

ALTER TABLE agent_clients ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_agent_clients_workspace ON agent_clients(workspace_id);

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_convos_workspace ON ai_conversations(workspace_id);

-- ── 4. WORKSPACE INVITE CODES ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  email TEXT,
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_workspace ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON workspace_invites(invite_code);

-- ── 5. WORKSPACE MEMBERS (many-to-many: users can belong to multiple workspaces) ──

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ws_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ws_members_user ON workspace_members(user_id);

-- ── 6. HELPER FUNCTION: Get current user's active workspace ─────────────────

CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid();
$$;

-- ── 7. RLS POLICIES FOR WORKSPACES ──────────────────────────────────────────

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Anyone can view public workspaces (for the business directory)
CREATE POLICY "Public workspaces visible to all" ON workspaces
  FOR SELECT USING (is_public = true);

-- Workspace members can view their own workspace
CREATE POLICY "Members can view own workspace" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Only owner can update workspace settings
CREATE POLICY "Owner can update workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Authenticated users can create workspaces
CREATE POLICY "Authenticated users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── 8. RLS FOR WORKSPACE_MEMBERS ────────────────────────────────────────────

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members wm WHERE wm.user_id = auth.uid())
  );

CREATE POLICY "Workspace owner/admin can manage members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ── 9. RLS FOR WORKSPACE_INVITES ────────────────────────────────────────────

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace admins can manage invites" ON workspace_invites
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Anyone with the code can read an invite (to join)
CREATE POLICY "Anyone can read invite by code" ON workspace_invites
  FOR SELECT USING (true);

-- ── 10. AUTO-CREATE WORKSPACE ON SIGNUP (optional trigger) ──────────────────

CREATE OR REPLACE FUNCTION auto_create_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ws_id UUID;
  ws_slug TEXT;
BEGIN
  -- Only create workspace for landlord/admin roles (not tenants/agents who join existing ones)
  IF NEW.role IN ('landlord', 'admin') THEN
    -- Generate a slug from company name or email
    ws_slug := lower(regexp_replace(
      COALESCE(NEW.company, split_part(NEW.email, '@', 1)),
      '[^a-z0-9]+', '-', 'g'
    ));
    -- Ensure uniqueness
    ws_slug := ws_slug || '-' || substr(gen_random_uuid()::text, 1, 4);

    INSERT INTO workspaces (name, slug, owner_id, plan, industry)
    VALUES (
      COALESCE(NEW.company, 'My Workspace'),
      ws_slug,
      NEW.id,
      COALESCE(NEW.plan, 'starter'),
      'real_estate'
    )
    RETURNING id INTO ws_id;

    -- Set workspace_id on profile
    UPDATE profiles SET workspace_id = ws_id WHERE id = NEW.id;

    -- Add owner as workspace member
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, NEW.id, 'owner');
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_profile_created_create_workspace ON profiles;
CREATE TRIGGER on_profile_created_create_workspace
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_workspace();

-- ── 11. SEED: Create workspace for existing admin user ──────────────────────

DO $$
DECLARE
  admin_id UUID;
  ws_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  IF admin_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM workspaces WHERE owner_id = admin_id) THEN
    INSERT INTO workspaces (name, slug, owner_id, plan, industry, is_public)
    VALUES ('RentVerified', 'rentverified', admin_id, 'enterprise', 'real_estate', true)
    RETURNING id INTO ws_id;

    UPDATE profiles SET workspace_id = ws_id WHERE id = admin_id;

    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, admin_id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- ============================================================================
-- DONE! After running this:
-- 1. Every new landlord/admin signup auto-creates a workspace
-- 2. All business data can be filtered by workspace_id
-- 3. The business directory can show public workspaces
-- 4. Invite codes let users join existing workspaces
-- ============================================================================
