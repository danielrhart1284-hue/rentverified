-- ═══════════════════════════════════════════════════════════════════════
-- Listing Syndication Configuration
-- ═══════════════════════════════════════════════════════════════════════

-- Platform connections per workspace
CREATE TABLE IF NOT EXISTS syndication_platforms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN (
    'zillow','apartments_com','realtor_com','rent_com',
    'zumper','hotpads','facebook','craigslist'
  )),
  enabled boolean DEFAULT false,
  api_key text,
  feed_url text,
  last_push_at timestamptz,
  listings_pushed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, platform)
);

-- Per-listing syndication toggles
CREATE TABLE IF NOT EXISTS syndication_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN (
    'zillow','apartments_com','realtor_com','rent_com',
    'zumper','hotpads','facebook','craigslist'
  )),
  enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','error','removed')),
  external_listing_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, property_id, platform)
);

-- Feed access tokens
CREATE TABLE IF NOT EXISTS syndication_feeds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  feed_format text NOT NULL CHECK (feed_format IN ('xml','json','csv')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_active boolean DEFAULT true,
  last_accessed_at timestamptz,
  access_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_synd_platforms_workspace ON syndication_platforms(workspace_id);
CREATE INDEX idx_synd_listings_workspace ON syndication_listings(workspace_id);
CREATE INDEX idx_synd_listings_property ON syndication_listings(property_id);
CREATE INDEX idx_synd_feeds_token ON syndication_feeds(token);

-- RLS
ALTER TABLE syndication_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndication_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndication_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can manage syndication platforms"
  ON syndication_platforms FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace members can manage syndication listings"
  ON syndication_listings FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace members can manage syndication feeds"
  ON syndication_feeds FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
