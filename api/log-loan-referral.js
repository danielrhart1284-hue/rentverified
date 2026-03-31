// ============================================================================
// 3120 Life — Loan Connect Referral Logger
// api/log-loan-referral.js
// ============================================================================
// Logs loan referrals to Supabase for revenue tracking.
// When a user submits a loan package through loan-connect.html, this records
// the referral so 3120 Life can track estimated fees and follow up at closing.
//
// Referral fee structure:
//   • 1% of funded loan amount (paid by loan officer / lender at closing)
//   • Tracked from submission → review → pre-approved → funded
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const REFERRAL_FEE_RATE = 0.01; // 1% of loan amount

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // ── GET: fetch referral stats for dashboard ───────────────────────────────
  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ referrals: [], total: 0, estimated_total: 0 });
    }
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/loan_referrals?order=submitted_at.desc&limit=200`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const data = await r.json();
      const list = data || [];
      const estimatedTotal = list.reduce((sum, row) => sum + (row.estimated_fee || 0), 0);
      const fundedTotal    = list
        .filter(r => r.status === 'funded')
        .reduce((sum, row) => sum + (row.estimated_fee || 0), 0);
      return res.status(200).json({
        referrals:       list,
        total:           list.length,
        estimated_total: estimatedTotal,
        funded_total:    fundedTotal,
      });
    } catch (e) {
      return res.status(200).json({ referrals: [], total: 0, estimated_total: 0, error: e.message });
    }
  }

  // ── PATCH: update referral status (e.g. funded) ───────────────────────────
  if (req.method === 'PATCH') {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch (_) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    const { id, status } = body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/loan_referrals?id=eq.${id}`, {
          method:  'PATCH',
          headers: {
            'apikey':        supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal',
          },
          body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
        });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    return res.status(200).json({ updated: true });
  }

  // ── POST: log a new referral submission ───────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const {
    user_id,
    loan_officer_id,
    loan_officer_name,
    loan_officer_company,
    loan_type,           // SBA, Bridge, Commercial RE, etc.
    loan_amount,         // Requested amount in cents (or 0 if not provided)
    revenue_12mo,
    expense_12mo,
    cashflow_avg,
    source_page,
  } = body;

  const amount        = parseInt(loan_amount) || 0;
  const estimatedFee  = Math.round(amount * REFERRAL_FEE_RATE);

  const record = {
    user_id:              user_id              || null,
    loan_officer_id:      loan_officer_id      || null,
    loan_officer_name:    loan_officer_name    || 'Unknown',
    loan_officer_company: loan_officer_company || '',
    loan_type:            loan_type            || 'general',
    loan_amount:          amount,
    estimated_fee:        estimatedFee,
    fee_rate:             REFERRAL_FEE_RATE,
    revenue_12mo:         parseInt(revenue_12mo)  || 0,
    expense_12mo:         parseInt(expense_12mo)  || 0,
    cashflow_avg:         parseInt(cashflow_avg)  || 0,
    status:               'submitted',
    source_page:          source_page || '',
    submitted_at:         new Date().toISOString(),
    updated_at:           new Date().toISOString(),
  };

  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/loan_referrals`, {
        method:  'POST',
        headers: {
          'apikey':        supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.error('Supabase loan referral log error:', e.message);
    }
  }

  return res.status(200).json({
    logged:        true,
    referral:      record,
    estimated_fee: estimatedFee,
    fee_display:   estimatedFee > 0 ? '$' + (estimatedFee / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'TBD at closing',
  });
}
