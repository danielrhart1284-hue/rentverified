-- ═══════════════════════════════════════════════════════════════════════
-- FEATURES 1-4: CRM, Booking, Reviews, Client Portal
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. LEADS (CRM Pipeline) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL,
  source          TEXT DEFAULT 'web_form' CHECK (source IN (
    'web_form','phone','referral','network','walk_in','social_media','advertising','cold_outreach','website','other'
  )),
  name            TEXT NOT NULL,
  contact_info    JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','won','lost')),
  value_estimate  NUMERIC(14,2),
  assigned_to     TEXT,
  tags            TEXT[],
  notes           TEXT,
  won_at          TIMESTAMPTZ,
  lost_reason     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_workspace ON leads(workspace_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their workspace leads"
  ON leads FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- ── LEAD ACTIVITIES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('call','email','sms','meeting','note','status_change','task')),
  note        TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_la_lead ON lead_activities(lead_id);
CREATE INDEX idx_la_created ON lead_activities(created_at DESC);

ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage lead activities via lead ownership"
  ON lead_activities FOR ALL USING (lead_id IN (
    SELECT id FROM leads WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

-- ── 2. SERVICES & APPOINTMENTS (Online Booking) ─────────────────────
CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id      UUID NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  duration_minutes INTEGER DEFAULT 60,
  price            NUMERIC(10,2),
  is_public        BOOLEAN DEFAULT true,
  category         TEXT,
  color            TEXT DEFAULT '#3b82f6',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_svc_workspace ON services(workspace_id);
CREATE INDEX idx_svc_public ON services(is_public);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their workspace services"
  ON services FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Public services are readable by anyone"
  ON services FOR SELECT USING (is_public = true);

CREATE TABLE IF NOT EXISTS appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id       UUID NOT NULL,
  service_id        UUID REFERENCES services(id),
  customer_name     TEXT NOT NULL,
  customer_contact  JSONB DEFAULT '{}',
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL,
  status            TEXT DEFAULT 'requested' CHECK (status IN ('requested','confirmed','canceled','completed','no_show')),
  assigned_to       TEXT,
  notes             TEXT,
  lead_id           UUID REFERENCES leads(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appt_workspace ON appointments(workspace_id);
CREATE INDEX idx_appt_start ON appointments(start_time);
CREATE INDEX idx_appt_status ON appointments(status);
CREATE INDEX idx_appt_service ON appointments(service_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their workspace appointments"
  ON appointments FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- ── 3. CLIENT PORTAL USERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_portal_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  access_token    TEXT,
  lead_id         UUID REFERENCES leads(id),
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cpu_workspace ON client_portal_users(workspace_id);
CREATE INDEX idx_cpu_email ON client_portal_users(email);

ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their workspace client portal users"
  ON client_portal_users FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- ── 4. REVIEWS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_id      UUID NOT NULL,
  reviewer_name    TEXT NOT NULL,
  reviewer_contact JSONB DEFAULT '{}',
  rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment          TEXT,
  source           TEXT DEFAULT 'direct' CHECK (source IN ('direct','google_link','yelp_link','facebook_link','manual')),
  appointment_id   UUID REFERENCES appointments(id),
  is_published     BOOLEAN DEFAULT false,
  response         TEXT,
  responded_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rev_workspace ON reviews(workspace_id);
CREATE INDEX idx_rev_rating ON reviews(rating);
CREATE INDEX idx_rev_published ON reviews(is_published);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their workspace reviews"
  ON reviews FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- ── 5. COMMUNITY: GROUPS, POSTS, RECOMMENDATIONS ────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT DEFAULT 'topic' CHECK (type IN ('industry','location','topic','mastermind')),
  created_by  UUID,
  avatar_color TEXT DEFAULT '#4F46E5',
  member_count INTEGER DEFAULT 1,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_groups_type ON groups(type);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups are readable by authenticated users"
  ON groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Group creators manage their groups"
  ON groups FOR ALL USING (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  role        TEXT DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
  joined_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gm_group ON group_members(group_id);
CREATE INDEX idx_gm_business ON group_members(business_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see their groups"
  ON group_members FOR SELECT USING (business_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS group_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  content     TEXT NOT NULL,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gp_group ON group_posts(group_id);
CREATE INDEX idx_gp_created ON group_posts(created_at DESC);

ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group posts readable by members"
  ON group_posts FOR SELECT USING (group_id IN (
    SELECT group_id FROM group_members WHERE business_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE TABLE IF NOT EXISTS recommendations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_business_id UUID NOT NULL,
  to_business_id   UUID NOT NULL,
  text             TEXT NOT NULL,
  is_published     BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rec_to ON recommendations(to_business_id);
CREATE INDEX idx_rec_from ON recommendations(from_business_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recommendations are publicly readable"
  ON recommendations FOR SELECT USING (is_published = true);
