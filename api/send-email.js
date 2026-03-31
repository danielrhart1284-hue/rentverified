// ============================================================================
// RentVerified — Vercel Serverless: Email Notifications via Resend
// api/send-email.js
// ============================================================================
// ENV VARS REQUIRED (set in Vercel Dashboard → Settings → Environment Variables):
//   RESEND_API_KEY   = re_xxxxxxxxxxxxxxxxxxxxxxxx
//   FROM_EMAIL       = noreply@rentverified.com  (must be verified in Resend)
//   APP_URL          = https://rentverified.com
// ============================================================================
// REQUEST:
//   POST /api/send-email
//   { type: 'application_received', to: 'tenant@email.com', data: { ... } }
// ============================================================================

const RESEND_URL = 'https://api.resend.com/emails';

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

const BRAND = {
  primary: '#FFD700',
  dark: '#121212',
  text: '#374151',
  light: '#F9FAFB',
  logo: '🏠 RentVerified'
};

function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#121212;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
          <span style="font-size:1.5rem;font-weight:900;color:#FFD700;letter-spacing:-0.5px;">🏠 RentVerified</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:white;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border-radius:0 0 12px 12px;padding:20px 32px;border:1px solid #E5E7EB;border-top:none;text-align:center;">
          <p style="margin:0;font-size:0.78rem;color:#9CA3AF;">
            © ${new Date().getFullYear()} RentVerified · 3120 Life Platform<br/>
            <a href="{{APP_URL}}" style="color:#9CA3AF;">rentverified.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label, url, color = '#FFD700', textColor = '#121212') {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:14px 28px;background:${color};color:${textColor};border-radius:8px;font-weight:700;font-size:0.95rem;text-decoration:none;">${label}</a>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 8px;font-size:1.4rem;font-weight:800;color:#121212;">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:12px 0;font-size:0.95rem;color:#374151;line-height:1.6;">${text}</p>`;
}

function infoBox(rows) {
  const cells = rows.map(([label, value]) =>
    `<tr>
      <td style="padding:8px 12px;font-size:0.85rem;font-weight:600;color:#6B7280;width:40%;">${label}</td>
      <td style="padding:8px 12px;font-size:0.875rem;font-weight:700;color:#111827;">${value}</td>
    </tr>`
  ).join('');
  return `<table style="width:100%;border-radius:8px;background:#F9FAFB;border:1px solid #E5E7EB;margin:16px 0;border-collapse:collapse;">${cells}</table>`;
}

// ── TEMPLATE REGISTRY ────────────────────────────────────────────────────────

const TEMPLATES = {

  // ── Tenant receives confirmation after submitting application
  application_received: (d, appUrl) => ({
    subject: `✅ Application Received — ${d.propertyAddress || 'Property'}`,
    html: baseTemplate('Application Received', `
      ${h1('Your application was received!')}
      ${p(`Hi ${d.tenantName || 'there'}, we got your rental application and it's now under review.`)}
      ${infoBox([
        ['Application ID', d.appId || '—'],
        ['Property', d.propertyAddress || '—'],
        ['Submitted', new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })],
        ['Status', '🔄 Under Review'],
      ])}
      ${p('You\'ll receive a decision email within <strong>2–3 business days</strong>. You can check your application status in your tenant portal anytime.')}
      ${btn('View Application Status', `${appUrl}/tenant-portal.html`)}
    `)
  }),

  // ── Landlord receives alert when new application comes in
  application_alert_landlord: (d, appUrl) => ({
    subject: `🔔 New Application — ${d.tenantName || 'Applicant'} for ${d.propertyAddress || 'your property'}`,
    html: baseTemplate('New Application', `
      ${h1('New rental application received')}
      ${p(`A new application was just submitted for <strong>${d.propertyAddress || 'your property'}</strong>.`)}
      ${infoBox([
        ['Applicant', d.tenantName || '—'],
        ['Email', d.tenantEmail || '—'],
        ['Phone', d.tenantPhone || '—'],
        ['Monthly Income', d.monthlyIncome ? `$${Number(d.monthlyIncome).toLocaleString()}` : '—'],
        ['Employment', d.employmentStatus || '—'],
        ['Application ID', d.appId || '—'],
      ])}
      ${p('Log in to your landlord dashboard to review the full application and make a decision.')}
      ${btn('Review Application', `${appUrl}/landlord-signup.html`)}
    `)
  }),

  // ── Tenant learns they are approved
  application_approved: (d, appUrl) => ({
    subject: `🎉 Application Approved — ${d.propertyAddress || 'Your new home'}`,
    html: baseTemplate('Application Approved', `
      ${h1('Congratulations — you\'re approved! 🎉')}
      ${p(`Hi ${d.tenantName || 'there'}, great news! Your application for <strong>${d.propertyAddress || 'the property'}</strong> has been approved.`)}
      ${infoBox([
        ['Property', d.propertyAddress || '—'],
        ['Monthly Rent', d.rentAmount ? `$${Number(d.rentAmount).toLocaleString()}/mo` : '—'],
        ['Move-In Date', d.moveInDate || 'TBD'],
        ['Next Step', '✍️ Sign your lease'],
      ])}
      ${p('Your lease has been prepared and is ready for your electronic signature. Click below to review and sign.')}
      ${btn('Review & Sign Lease', `${appUrl}/e-signature.html`)}
      ${p('<small style="color:#9CA3AF;">Questions? Reply to this email or contact your property manager directly.</small>')}
    `)
  }),

  // ── Tenant learns they are declined
  application_declined: (d, appUrl) => ({
    subject: `Application Update — ${d.propertyAddress || 'Your application'}`,
    html: baseTemplate('Application Update', `
      ${h1('Application Status Update')}
      ${p(`Hi ${d.tenantName || 'there'}, thank you for applying for <strong>${d.propertyAddress || 'the property'}</strong>.`)}
      ${p('After reviewing your application, we are unable to approve it at this time.')}
      ${d.decisionNotes ? `<div style="background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:4px;padding:12px 16px;margin:16px 0;font-size:0.875rem;color:#92400E;">${d.decisionNotes}</div>` : ''}
      ${p('We encourage you to continue searching. RentVerified has many available listings that may be a great fit.')}
      ${btn('Browse Other Listings', `${appUrl}/listings.html`, '#111827', '#FFFFFF')}
    `)
  }),

  // ── Tenant receives their lease for signing
  lease_sent: (d, appUrl) => ({
    subject: `📋 Your Lease is Ready to Sign — ${d.propertyAddress || 'Action Required'}`,
    html: baseTemplate('Lease Ready to Sign', `
      ${h1('Your lease is ready for your signature')}
      ${p(`Hi ${d.tenantName || 'there'}, your lease agreement for <strong>${d.propertyAddress || 'the property'}</strong> is ready for your electronic signature.`)}
      ${infoBox([
        ['Property', d.propertyAddress || '—'],
        ['Lease Start', d.leaseStart || '—'],
        ['Lease End', d.leaseEnd || '—'],
        ['Monthly Rent', d.rentAmount ? `$${Number(d.rentAmount).toLocaleString()}/mo` : '—'],
      ])}
      ${p('Please review and sign your lease at your earliest convenience. Your move-in date depends on completing this step.')}
      ${btn('Review & Sign Lease →', `${appUrl}/e-signature.html?lease=${d.leaseId || ''}`)}
      ${p('<small style="color:#9CA3AF;">This lease is legally binding under the Utah UETA and federal ESIGN Act.</small>')}
    `)
  }),

  // ── Both parties confirm the lease was signed
  lease_signed: (d, appUrl) => ({
    subject: `✅ Lease Signed — ${d.propertyAddress || 'Move-in confirmed'}`,
    html: baseTemplate('Lease Signed', `
      ${h1('Lease signed — you\'re all set!')}
      ${p(`Hi ${d.recipientName || 'there'}, the lease agreement for <strong>${d.propertyAddress || 'the property'}</strong> has been signed by all parties.`)}
      ${infoBox([
        ['Property', d.propertyAddress || '—'],
        ['Signed By', d.tenantName || '—'],
        ['Signed On', d.signedAt ? new Date(d.signedAt).toLocaleDateString() : new Date().toLocaleDateString()],
        ['Lease Start', d.leaseStart || '—'],
      ])}
      ${d.isTenant ? p('Your tenant portal is now active. You can pay rent, submit maintenance requests, and manage your lease from there.') : p('The tenant\'s portal has been activated. Rent payments and maintenance requests will now route through your dashboard.')}
      ${btn(d.isTenant ? 'Go to Tenant Portal' : 'Go to Dashboard', d.isTenant ? `${appUrl}/tenant-portal.html` : `${appUrl}/landlord-signup.html`)}
    `)
  }),

  // ── Tenant portal welcome / activation
  tenant_portal_activated: (d, appUrl) => ({
    subject: `🏠 Your Tenant Portal is Active — ${d.propertyAddress || 'Welcome!'}`,
    html: baseTemplate('Tenant Portal Active', `
      ${h1('Welcome to your tenant portal!')}
      ${p(`Hi ${d.tenantName || 'there'}, your tenant account is now active for <strong>${d.propertyAddress || 'your property'}</strong>.`)}
      ${p('From your portal you can:')}
      <ul style="font-size:0.9rem;color:#374151;line-height:2;">
        <li>💳 Pay rent online (card or bank transfer)</li>
        <li>🔧 Submit and track maintenance requests</li>
        <li>📄 View your lease and documents</li>
        <li>💬 Message your property manager</li>
      </ul>
      ${infoBox([
        ['Portal Login', d.tenantEmail || '—'],
        ['Property', d.propertyAddress || '—'],
        ['Rent Due', d.rentDueDay ? `${d.rentDueDay}th of each month` : '1st of each month'],
        ['Monthly Rent', d.rentAmount ? `$${Number(d.rentAmount).toLocaleString()}` : '—'],
      ])}
      ${btn('Open My Tenant Portal →', `${appUrl}/tenant-portal.html`)}
    `)
  }),

  // ── Rent reminder (upcoming / due / late)
  rent_reminder: (d, appUrl) => {
    const isLate = d.daysLate > 0;
    const isDue = d.daysLate === 0;
    const isUpcoming = d.daysLate < 0;
    const subject = isLate
      ? `⚠️ Rent ${d.daysLate} Day${d.daysLate > 1 ? 's' : ''} Late — Action Required`
      : isDue ? `💳 Rent Due Today — ${d.propertyAddress || ''}`
      : `📅 Rent Reminder — Due ${d.dueDate || 'Soon'}`;
    return {
      subject,
      html: baseTemplate('Rent Reminder', `
        ${h1(isLate ? `Your rent is ${d.daysLate} day${d.daysLate > 1 ? 's' : ''} past due` : isDue ? 'Rent is due today' : `Rent reminder — due ${d.dueDate || 'soon'}`)}
        ${p(`Hi ${d.tenantName || 'there'}, ${isLate ? `your rent payment of <strong>$${d.amount}</strong> is now <strong>${d.daysLate} day${d.daysLate > 1 ? 's' : ''} late</strong>.` : isDue ? `your rent of <strong>$${d.amount}</strong> is due today.` : `your rent of <strong>$${d.amount}</strong> is due on <strong>${d.dueDate}</strong>.`}`)}
        ${isLate && d.lateFee ? `<div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:4px;padding:12px 16px;margin:16px 0;font-size:0.875rem;color:#991B1B;">A late fee of <strong>$${d.lateFee}</strong> may apply per your lease agreement.</div>` : ''}
        ${btn('Pay Rent Now →', `${appUrl}/tenant-portal.html`)}
      `)
    };
  },

  // ── Maintenance request received confirmation
  maintenance_received: (d, appUrl) => ({
    subject: `🔧 Maintenance Request Received — ${d.issue || 'Your request'}`,
    html: baseTemplate('Maintenance Request Received', `
      ${h1('Maintenance request received')}
      ${p(`Hi ${d.tenantName || 'there'}, we received your maintenance request and will schedule a technician.`)}
      ${infoBox([
        ['Request ID', d.requestId || '—'],
        ['Issue', d.issue || '—'],
        ['Priority', d.priority || 'Standard'],
        ['Submitted', new Date().toLocaleDateString()],
        ['Status', '🔄 Received — Scheduling'],
      ])}
      ${p('You\'ll receive an update when a technician is scheduled. For emergencies, please call your property manager directly.')}
      ${btn('Track Request Status', `${appUrl}/tenant-portal.html`)}
    `)
  }),

  // ── Post-tour follow-up to prospect
  tour_followup: (d, appUrl) => ({
    subject: `Thanks for touring ${d.propertyAddress || 'the property'} — ready to apply?`,
    html: baseTemplate('Thanks for Touring', `
      ${h1(`Thanks for touring, ${d.prospectName ? d.prospectName.split(' ')[0] : 'there'}! 👋`)}
      ${p(`It was great showing you <strong>${d.propertyAddress || 'the property'}</strong>. We hope you liked what you saw!`)}
      ${infoBox([
        ['Property', d.propertyAddress || '—'],
        ['Rent', d.rentAmount ? `$${Number(d.rentAmount).toLocaleString()}/mo` : '—'],
        ['Available', d.availableDate || 'Now'],
        ['Bedrooms', d.bedrooms || '—'],
        ['Tour Date', d.tourDate || new Date().toLocaleDateString()],
      ])}
      ${p('If you\'re ready to move forward, you can submit your application online in about 10 minutes. We review applications quickly — usually within 1–2 business days.')}
      ${btn('Apply Now →', `${appUrl}/tenant-application.html?property=${encodeURIComponent(d.propertyAddress || '')}`)}
      ${p('<strong>Have questions?</strong> Reply to this email or call/text us directly.')}
      ${d.managerName ? p(`<strong>${d.managerName}</strong>${d.managerPhone ? ` · ${d.managerPhone}` : ''}`) : ''}
      ${p('<small style="color:#9CA3AF;">Not interested? No worries — we have other listings that might be a better fit.</small>')}
      ${btn('See Other Listings', `${appUrl}/listings.html`, '#111827', '#ffffff')}
    `)
  }),

  // ── Tour confirmation reminder (sent night before)
  tour_reminder: (d, appUrl) => ({
    subject: `📅 Reminder: Property tour tomorrow at ${d.tourTime || 'your scheduled time'}`,
    html: baseTemplate('Tour Reminder', `
      ${h1('Your tour is tomorrow!')}
      ${p(`Hi ${d.prospectName || 'there'}, just a quick reminder about your upcoming property tour.`)}
      ${infoBox([
        ['Property', d.propertyAddress || '—'],
        ['Date', d.tourDate || '—'],
        ['Time', d.tourTime || '—'],
        ['Address', d.propertyAddress || '—'],
      ])}
      ${p('If you need to reschedule or cancel, please let us know as soon as possible.')}
      ${d.managerPhone ? p(`📞 Text or call to reschedule: <strong>${d.managerPhone}</strong>`) : ''}
      ${btn('View Booking Details', `${appUrl}/calendar.html`)}
    `)
  }),

  // ── Maintenance status update
  maintenance_update: (d, appUrl) => ({
    subject: `🔧 Maintenance Update — ${d.issue || 'Your request'}: ${d.newStatus || 'Updated'}`,
    html: baseTemplate('Maintenance Update', `
      ${h1('Maintenance request update')}
      ${p(`Hi ${d.tenantName || 'there'}, here's an update on your maintenance request.`)}
      ${infoBox([
        ['Request', d.issue || '—'],
        ['New Status', d.newStatus || '—'],
        ['Scheduled For', d.scheduledDate || 'TBD'],
        ['Technician', d.technicianName || 'TBD'],
      ])}
      ${d.notes ? `<div style="background:#F0FDF4;border-left:4px solid #22C55E;border-radius:4px;padding:12px 16px;margin:16px 0;font-size:0.875rem;color:#166534;">${d.notes}</div>` : ''}
      ${btn('View Request', `${appUrl}/tenant-portal.html`)}
    `)
  }),

};

// ── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@rentverified.com';
  const appUrl = (process.env.APP_URL || 'https://rentverified.com').replace(/\/$/, '');

  if (!apiKey) {
    // Dev mode: log email content instead of sending
    console.log('[Email — dev mode] Would send:', req.body);
    return res.status(200).json({ sent: false, dev: true, message: 'RESEND_API_KEY not set — email logged to console' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { type, to, data = {}, cc, replyTo } = body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing required fields: type, to' });
  }

  const templateFn = TEMPLATES[type];
  if (!templateFn) {
    return res.status(400).json({ error: `Unknown email type: ${type}. Valid types: ${Object.keys(TEMPLATES).join(', ')}` });
  }

  const { subject, html } = templateFn(data, appUrl);

  const emailPayload = {
    from: `RentVerified <${fromEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await r.json();

    if (!r.ok) {
      console.error('Resend error:', result);
      return res.status(r.status).json({ error: result.message || 'Resend API error', details: result });
    }

    return res.status(200).json({ sent: true, id: result.id, type, to });
  } catch (e) {
    console.error('Email send error:', e);
    return res.status(502).json({ error: e.message || 'Failed to send email' });
  }
}
