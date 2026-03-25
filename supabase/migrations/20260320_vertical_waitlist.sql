-- ══════════════════════════════════════════════════════════════════
-- Vertical Waitlist — captures interest for "Coming Soon" verticals
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vertical_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  vertical    TEXT NOT NULL,      -- e.g. 'attorney', 'lending', 'marketing_consulting'
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for admin dashboard queries
CREATE INDEX idx_waitlist_vertical ON vertical_waitlist(vertical);
CREATE INDEX idx_waitlist_email ON vertical_waitlist(email);

-- Prevent duplicate email+vertical combos
CREATE UNIQUE INDEX idx_waitlist_unique ON vertical_waitlist(email, vertical);

-- RLS: public inserts (no auth needed for waitlist), admin reads
ALTER TABLE vertical_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can add themselves to the waitlist
CREATE POLICY "Anyone can join waitlist"
  ON vertical_waitlist FOR INSERT
  WITH CHECK (true);

-- Only authenticated users with admin role can read
CREATE POLICY "Admins can read waitlist"
  ON vertical_waitlist FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
