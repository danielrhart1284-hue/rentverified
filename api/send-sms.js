// ============================================================================
// RentVerified — Vercel Serverless: SMS Notifications via Twilio
// api/send-sms.js
// ============================================================================
// ENV VARS REQUIRED (set in Vercel Dashboard → Settings → Environment Variables):
//   TWILIO_ACCOUNT_SID    = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//   TWILIO_AUTH_TOKEN     = your_auth_token
//   TWILIO_PHONE_NUMBER   = +18015550100  (your Twilio number)
// ============================================================================
// REQUEST:
//   POST /api/send-sms
//   { type: 'rent_reminder', to: '+18015550199', data: { name, amount, ... } }
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── SMS TEMPLATES ────────────────────────────────────────────────────────────
// All messages must be under 160 chars to avoid multi-part SMS charges

const TEMPLATES = {

  rent_reminder: (d) =>
    `Hi ${d.name}, rent of $${d.amount} is due ${d.dueDate}. Pay: ${d.payLink || 'rentverified.com/tenant-portal.html'} -RentVerified`,

  rent_due_today: (d) =>
    `${d.name}, your rent of $${d.amount} is due TODAY. Pay now: ${d.payLink || 'rentverified.com/tenant-portal.html'} -RentVerified`,

  late_notice: (d) =>
    `${d.name}, rent is ${d.daysLate} day${d.daysLate > 1 ? 's' : ''} late. $${d.lateFee} late fee applies. Pay: ${d.payLink || 'rentverified.com/tenant-portal.html'}`,

  payment_received: (d) =>
    `✅ ${d.name}, $${d.amount} rent received for ${d.month}. Thank you! -RentVerified`,

  application_received: (d) =>
    `Hi ${d.name}, we got your rental application for ${d.address}. Decision in 2-3 business days. -RentVerified`,

  application_approved: (d) =>
    `🎉 ${d.name}, your application for ${d.address} is APPROVED! Check email to sign your lease. -RentVerified`,

  application_declined: (d) =>
    `${d.name}, your application for ${d.address} was not approved at this time. See email for details. -RentVerified`,

  lease_ready: (d) =>
    `${d.name}, your lease for ${d.address} is ready to sign. Check email or: ${d.link || 'rentverified.com'} -RentVerified`,

  lease_signed: (d) =>
    `✅ ${d.name}, lease signed! Your tenant portal is now active. -RentVerified`,

  maintenance_received: (d) =>
    `${d.name}, maintenance request #${d.requestId} received. We'll schedule a tech within 24-48 hrs. -RentVerified`,

  maintenance_update: (d) =>
    `${d.name}, maintenance #${d.requestId} update: ${d.status}. ${d.scheduledDate ? 'Scheduled: ' + d.scheduledDate : ''} -RentVerified`,

  showing_reminder: (d) =>
    `Reminder: ${d.name}, your showing at ${d.address} is ${d.dateTime}. Reply CANCEL to cancel. -RentVerified`,

  verification_code: (d) =>
    `Your RentVerified code is ${d.code}. Expires in 10 min. Do not share this code.`,

  welcome: (d) =>
    `Welcome to RentVerified, ${d.name}! Your portal is ready: rentverified.com/tenant-portal.html -RentVerified`,

  new_application_alert: (d) =>
    `New application from ${d.tenantName} for ${d.address}. Review: rentverified.com/landlord-signup.html`,

  custom: (d) =>
    (d.message || d.body || '').slice(0, 160),
};

// ── FORMAT PHONE TO E.164 ────────────────────────────────────────────────────
function formatPhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

// ── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  // Dev mode — log instead of send
  if (!sid || !token || !from) {
    console.log('[SMS — dev mode] Would send:', req.body);
    return res.status(200).json({
      sent: false,
      dev: true,
      message: 'Twilio credentials not set — SMS logged to console'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { type, to, data = {} } = body;

  if (!type || !to) {
    return res.status(400).json({ error: 'Missing required fields: type, to' });
  }

  const templateFn = TEMPLATES[type];
  if (!templateFn) {
    return res.status(400).json({
      error: `Unknown SMS type: ${type}. Valid types: ${Object.keys(TEMPLATES).join(', ')}`
    });
  }

  const messageBody = templateFn(data).slice(0, 1600); // Twilio max
  const toFormatted = formatPhone(to);

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const r = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toFormatted,
        From: from,
        Body: messageBody,
      }).toString(),
    });

    const result = await r.json();

    if (result.error_code) {
      console.error('Twilio error:', result);
      return res.status(400).json({
        sent: false,
        error: result.message,
        code: result.error_code
      });
    }

    return res.status(200).json({
      sent: true,
      sid: result.sid,
      status: result.status,
      type,
      to: toFormatted
    });

  } catch (e) {
    console.error('SMS send error:', e);
    return res.status(502).json({ error: e.message || 'Failed to send SMS' });
  }
}
