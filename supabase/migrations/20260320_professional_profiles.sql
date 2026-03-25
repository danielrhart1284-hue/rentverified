-- ══════════════════════════════════════════════════════════════════
-- Professional Marketplace — Pro Profiles
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS professional_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  full_name         TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN (
    'accountant','attorney','bookkeeper','tax','insurance','inspector',
    'appraiser','notary','contractor','plumber','electrician','hvac',
    'cleaner','handyman','painter','roofer','landscaper','other'
  )),
  title             TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  location          TEXT,
  location_label    TEXT,
  rate_amount       NUMERIC(10,2),
  rate_label        TEXT,
  licenses          TEXT,
  services          TEXT[],
  description       TEXT,
  experience        TEXT,
  rating            NUMERIC(3,2) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  completed_jobs    INTEGER DEFAULT 0,
  is_verified       BOOLEAN DEFAULT false,
  is_active         BOOLEAN DEFAULT true,
  avatar_color      TEXT,
  initials          TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_proprof_category ON professional_profiles(category);
CREATE INDEX idx_proprof_location ON professional_profiles(location);
CREATE INDEX idx_proprof_active ON professional_profiles(is_active, is_verified);

ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active profiles
CREATE POLICY "Anyone can view active profiles"
  ON professional_profiles FOR SELECT
  USING (is_active = true);

-- Owners can manage their own profiles
CREATE POLICY "Users can manage own profile"
  ON professional_profiles FOR ALL
  USING (created_by = auth.uid());
