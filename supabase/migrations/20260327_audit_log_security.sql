-- ═══════════════════════════════════════════════════════════════════════
-- ZERO-TRUST SECURITY: Immutable Audit Log, Auto-Expiry, Hardened RLS
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. IMMUTABLE AUDIT LOG ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  action        TEXT NOT NULL CHECK (action IN (
    'document.view', 'document.download', 'document.upload', 'document.delete',
    'grant.create', 'grant.revoke', 'grant.expire', 'grant.regrant',
    'data.access', 'data.export',
    'login.success', 'login.failure',
    'settings.change', 'member.add', 'member.remove'
  )),
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_workspace ON audit_log(workspace_id);
CREATE INDEX idx_audit_user      ON audit_log(user_id);
CREATE INDEX idx_audit_action    ON audit_log(action);
CREATE INDEX idx_audit_resource  ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_created   ON audit_log(created_at DESC);


-- ── 2. IMMUTABILITY VIA RLS ────────────────────────────────────────────
-- No UPDATE or DELETE policies = denied by default → append-only

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Workspace members can READ their workspace's audit entries
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- INSERT allowed for workspace members (used by log_audit_event function)
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- NO UPDATE policy → updates denied by RLS
-- NO DELETE policy → deletes denied by RLS


-- ── 3. SERVER-SIDE LOGGING FUNCTION ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action        TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id   UUID DEFAULT NULL,
  p_metadata      JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_ws_id UUID;
  v_ip    TEXT;
  v_ua    TEXT;
  v_id    UUID;
BEGIN
  -- Get workspace from caller's membership
  SELECT workspace_id INTO v_ws_id
  FROM workspace_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_ws_id IS NULL THEN
    -- Fallback: check profiles table
    SELECT workspace_id INTO v_ws_id FROM profiles WHERE id = auth.uid();
  END IF;

  -- Extract request context (Supabase sets these headers)
  BEGIN
    v_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    v_ua := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
    v_ua := NULL;
  END;

  INSERT INTO audit_log (
    workspace_id, user_id, action, resource_type, resource_id,
    metadata, ip_address, user_agent
  ) VALUES (
    v_ws_id, auth.uid(), p_action, p_resource_type, p_resource_id,
    p_metadata, v_ip::inet, v_ua
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. DATABASE TRIGGERS ───────────────────────────────────────────────

-- 4A. Access Grant lifecycle trigger
CREATE OR REPLACE FUNCTION public.audit_grant_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'grant.create', 'grant', NEW.id,
      jsonb_build_object(
        'professional_id', NEW.professional_id,
        'template_id', NEW.template_id,
        'expires_at', NEW.expires_at,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect revocation
    IF OLD.status = 'active' AND NEW.status = 'revoked' THEN
      PERFORM log_audit_event('grant.revoke', 'grant', NEW.id,
        jsonb_build_object('professional_id', NEW.professional_id));
    -- Detect expiry
    ELSIF OLD.status = 'active' AND NEW.status = 'expired' THEN
      PERFORM log_audit_event('grant.expire', 'grant', NEW.id,
        jsonb_build_object('professional_id', NEW.professional_id, 'expired_at', now()));
    -- Detect re-grant
    ELSIF OLD.status IN ('revoked', 'expired') AND NEW.status = 'active' THEN
      PERFORM log_audit_event('grant.regrant', 'grant', NEW.id,
        jsonb_build_object('professional_id', NEW.professional_id));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_grant_change
  AFTER INSERT OR UPDATE ON access_grants
  FOR EACH ROW EXECUTE FUNCTION public.audit_grant_change();


-- 4B. Document lifecycle trigger
CREATE OR REPLACE FUNCTION public.audit_document_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event('document.upload', 'document', NEW.id,
      jsonb_build_object('table', TG_TABLE_NAME));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event('document.delete', 'document', OLD.id,
      jsonb_build_object('table', TG_TABLE_NAME));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_documents
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_document_change();

-- Also trigger on generated_documents if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generated_documents') THEN
    EXECUTE 'CREATE TRIGGER trg_audit_generated_documents
      AFTER INSERT OR DELETE ON generated_documents
      FOR EACH ROW EXECUTE FUNCTION public.audit_document_change()';
  END IF;
END $$;


-- ── 5. AUTO-EXPIRY FOR SCOPED GRANTS ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.expire_stale_grants()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE access_grants
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron if available (Supabase Pro+ plans)
-- SELECT cron.schedule('expire-grants', '*/5 * * * *', 'SELECT expire_stale_grants()');


-- ── 6. HARDENED RLS FOR PROFESSIONALS ──────────────────────────────────
-- Replace existing policy to enforce expiry at the DB level

DROP POLICY IF EXISTS "Professionals see grants shared with them" ON access_grants;

CREATE POLICY "Professionals see active non-expired grants"
  ON access_grants FOR SELECT
  USING (
    professional_id = auth.uid()
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );
