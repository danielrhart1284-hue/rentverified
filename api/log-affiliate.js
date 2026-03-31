// ============================================================================
// RentVerified — Affiliate Click Logger
// api/log-affiliate.js
// ============================================================================
// Logs affiliate product clicks to Supabase for revenue tracking
// Called by recommended-supplies.js on every product click
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_ANON_KEY;

  // ── GET: fetch click stats for dashboard ──────────────────────────────────
  if (req.method === 'GET') {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ clicks: [], total: 0 });
    }
    try {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/affiliate_clicks?order=created_at.desc&limit=500`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const data = await r.json();
      return res.status(200).json({ clicks: data || [], total: data?.length || 0 });
    } catch (e) {
      return res.status(200).json({ clicks: [], total: 0, error: e.message });
    }
  }

  // ── POST: log a click ─────────────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const {
    product_name,
    product_url,
    retailer,
    category,
    industry,
    source_page,
    source_context,
    user_id,
  } = body;

  // Estimate commission (rough — actual varies by retailer & product)
  const COMMISSION_RATES = {
    'Home Depot':    0.03,  // ~3% average
    'Northern Tool': 0.04,  // ~4% average
  };

  const estimatedCommission = null; // Can't know until purchase is confirmed

  const clickRecord = {
    product_name:    product_name  || 'Unknown',
    product_url:     product_url   || '',
    retailer:        retailer       || 'Unknown',
    category:        category       || 'general',
    industry:        industry       || 'general',
    source_page:     source_page    || '',
    source_context:  source_context || '',
    user_id:         user_id        || null,
    commission_rate: COMMISSION_RATES[retailer] || 0.03,
    created_at:      new Date().toISOString(),
  };

  // Log to Supabase if available
  if (supabaseUrl && supabaseKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/affiliate_clicks`, {
        method:  'POST',
        headers: {
          'apikey':        supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify(clickRecord),
      });
    } catch (e) {
      console.error('Supabase log error:', e.message);
    }
  }

  return res.status(200).json({ logged: true, click: clickRecord });
}
