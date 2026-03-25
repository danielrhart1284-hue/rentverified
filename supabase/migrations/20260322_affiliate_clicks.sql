-- Affiliate Clicks & Purchases tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  product_name  TEXT NOT NULL,
  product_url   TEXT NOT NULL,
  retailer      TEXT NOT NULL,
  category      TEXT NOT NULL,
  industry      TEXT,
  source_page   TEXT,
  source_context TEXT,
  event_type    TEXT DEFAULT 'click' CHECK (event_type IN ('click','purchase','impression')),
  revenue       NUMERIC(12,2) DEFAULT 0,
  commission    NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_affclicks_workspace ON affiliate_clicks(workspace_id);
CREATE INDEX idx_affclicks_user ON affiliate_clicks(user_id);
CREATE INDEX idx_affclicks_retailer ON affiliate_clicks(retailer);
CREATE INDEX idx_affclicks_category ON affiliate_clicks(category);
CREATE INDEX idx_affclicks_event ON affiliate_clicks(event_type);
CREATE INDEX idx_affclicks_created ON affiliate_clicks(created_at);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their workspace affiliate clicks"
  ON affiliate_clicks FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert affiliate clicks"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));
