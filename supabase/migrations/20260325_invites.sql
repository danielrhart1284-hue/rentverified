-- Invites table — tracks all sent invitations
CREATE TABLE IF NOT EXISTS invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  sent_by         UUID REFERENCES profiles(id),
  recipient_name  TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  invite_type     TEXT NOT NULL CHECK (invite_type IN (
    'business_owner','tenant','client','vendor','contractor',
    'loan_officer','accountant','attorney','insurance_agent','team_member','general'
  )),
  channel         TEXT NOT NULL CHECK (channel IN ('email','sms','both')),
  message         TEXT,
  referral_code   TEXT UNIQUE,
  status          TEXT DEFAULT 'sent' CHECK (status IN ('draft','sent','delivered','opened','accepted','expired','bounced')),
  sent_at         TIMESTAMPTZ DEFAULT now(),
  opened_at       TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invites_workspace ON invites(workspace_id);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_email ON invites(recipient_email);
CREATE INDEX idx_invites_code ON invites(referral_code);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their workspace invites"
  ON invites FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- Admin can see all invites
CREATE POLICY "Admins can see all invites"
  ON invites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
