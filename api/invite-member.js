// ============================================================================
// 3120 Life — Team Member Invite
// api/invite-member.js
// ============================================================================
// Sends a role-specific invite email via Resend.
// Logs the invite to Supabase team_invites table.
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const ROLE_META = {
  owner:  { label: 'Owner',  color: '#7c3aed', icon: '👑', desc: 'Full access to all business data and settings.' },
  admin:  { label: 'Admin',  color: '#1d4ed8', icon: '🔑', desc: 'Full operational access. Cannot manage billing.' },
  staff:  { label: 'Staff',  color: '#059669', icon: '👤', desc: 'Operational access to CRM, jobs, bookings, and messaging.' },
  agent:  { label: 'Agent',  color: '#0891b2', icon: '🏘️', desc: 'Leasing and CRM access. Cannot view financials.' },
  vendor: { label: 'Vendor', color: '#d97706', icon: '🔧', desc: 'Job and invoice access only.' },
};

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resendKey    = process.env.RESEND_API_KEY;
  const fromEmail    = process.env.FROM_EMAIL || 'noreply@3120life.com';
  const appUrl       = (process.env.APP_URL || 'https://rentverified-ocyo.vercel.app').replace(/\/$/, '');
  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_ANON_KEY;

  // ── GET: list invites ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ invites: [] });
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/team_invites?order=created_at.desc&limit=100`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const data = await r.json();
      return res.status(200).json({ invites: data || [] });
    } catch (e) {
      return res.status(200).json({ invites: [], error: e.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { invitee_name, invitee_email, role, invited_by, business_name, workspace_id } = body;

  if (!invitee_email || !role) {
    return res.status(400).json({ error: 'invitee_email and role are required' });
  }

  const roleMeta   = ROLE_META[role] || ROLE_META.staff;
  const token      = Buffer.from(`${invitee_email}:${role}:${Date.now()}`).toString('base64url');
  const inviteLink = `${appUrl}/landlord-signup.html?invite=${token}&role=${role}`;
  const bizName    = business_name || '3120 Life';
  const inviterName = invited_by || 'Your team owner';

  // ── Log invite to Supabase ────────────────────────────────────────────────
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/team_invites`, {
        method:  'POST',
        headers: {
          'apikey':        supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          invitee_name:  invitee_name || '',
          invitee_email,
          role,
          invited_by:    invited_by || '',
          workspace_id:  workspace_id || null,
          token,
          status:        'pending',
          created_at:    new Date().toISOString(),
          expires_at:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    } catch (e) {
      console.error('Supabase invite log error:', e.message);
    }
  }

  // ── Send invite email via Resend ──────────────────────────────────────────
  if (resendKey) {
    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:2rem auto;">
    <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:1.5rem;text-align:center;">
      <div style="color:#00E676;font-weight:900;font-size:1.3rem;letter-spacing:.02em;">3120 Life</div>
    </td></tr>
    <tr><td style="background:#fff;padding:2rem 2.5rem;">
      <h2 style="color:#1e293b;font-size:1.25rem;margin:0 0 .75rem;">You've been invited to join ${bizName}</h2>
      <p style="color:#475569;font-size:.95rem;line-height:1.6;">
        ${inviterName} has invited you to collaborate on <strong>${bizName}</strong>'s business workspace on 3120 Life.
      </p>

      <div style="background:${roleMeta.color}15;border:1px solid ${roleMeta.color}40;border-radius:10px;padding:1rem 1.25rem;margin:1.25rem 0;">
        <div style="font-size:.75rem;font-weight:700;color:${roleMeta.color};text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem;">Your Role</div>
        <div style="font-size:1.1rem;font-weight:800;color:#1e293b;">${roleMeta.icon} ${roleMeta.label}</div>
        <div style="font-size:.85rem;color:#64748b;margin-top:.25rem;">${roleMeta.desc}</div>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:1.5rem 0;">
        <tr><td style="text-align:center;">
          <a href="${inviteLink}" style="display:inline-block;background:#00E676;color:#0f172a;text-decoration:none;font-weight:800;font-size:1rem;padding:.85rem 2.5rem;border-radius:10px;">
            Accept Invitation →
          </a>
        </td></tr>
      </table>

      <p style="color:#94a3b8;font-size:.8rem;text-align:center;">
        This invitation expires in 7 days. If you didn't expect this, you can ignore this email.
      </p>
    </td></tr>
    <tr><td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:.75rem;text-align:center;">
      <p style="color:#94a3b8;font-size:.75rem;margin:0;">3120 Life · Business OS for every industry</p>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `${bizName} via 3120 Life <${fromEmail}>`,
          to:      [invitee_email],
          subject: `${roleMeta.icon} You've been invited to join ${bizName} on 3120 Life`,
          html:    emailBody,
        }),
      });
    } catch (e) {
      console.error('Resend invite error:', e.message);
    }
  }

  return res.status(200).json({
    sent:        true,
    invitee:     invitee_email,
    role,
    role_label:  roleMeta.label,
    invite_link: inviteLink,
    expires_in:  '7 days',
  });
}
