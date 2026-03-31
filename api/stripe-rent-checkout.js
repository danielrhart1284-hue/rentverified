// ============================================================================
// RentVerified — Stripe Rent Payment Checkout
// api/stripe-rent-checkout.js
// ============================================================================
// Creates a one-time Stripe Checkout session for rent payment
// Tenant is redirected to Stripe's hosted, PCI-compliant payment page
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const appUrl    = (process.env.APP_URL || 'https://rentverified-ocyo.vercel.app').replace(/\/$/, '');

  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const {
    rentAmount,           // e.g. 120000 (cents) = $1,200.00
    tenantName,
    tenantEmail,
    propertyAddress,
    landlordName,
    paymentMethod = 'card', // 'card' | 'ach'
    absorbFee = false,    // landlord absorbs the processing fee
    month,                // e.g. "April 2026"
    tenantId,
    propertyId,
  } = body;

  if (!rentAmount || rentAmount <= 0) {
    return res.status(400).json({ error: 'rentAmount is required and must be > 0' });
  }

  // Calculate fee
  const rent        = parseInt(rentAmount);
  const stripeFee   = Math.round(rent * 0.029 + 30); // 2.9% + $0.30
  const totalCharge = absorbFee ? rent : rent + stripeFee;
  const monthLabel  = month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Build line items
  const lineItems = [
    {
      price_data: {
        currency:     'usd',
        product_data: {
          name:        `Rent Payment — ${monthLabel}`,
          description: `${propertyAddress || 'Property'} · ${landlordName || 'Property Manager'}`,
        },
        unit_amount: rent,
      },
      quantity: 1,
    }
  ];

  // Add convenience fee line item if tenant pays
  if (!absorbFee && paymentMethod === 'card') {
    lineItems.push({
      price_data: {
        currency:     'usd',
        product_data: {
          name:        'Convenience Fee',
          description: 'Stripe card processing fee (2.9% + $0.30) — passed through at cost',
        },
        unit_amount: stripeFee,
      },
      quantity: 1,
    });
  }

  // Payment method types
  const paymentMethodTypes = paymentMethod === 'ach'
    ? ['us_bank_account']
    : ['card'];

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode:                       'payment',
        'payment_method_types[0]':  paymentMethodTypes[0],
        'line_items[0][price_data][currency]':                  'usd',
        'line_items[0][price_data][product_data][name]':        `Rent — ${monthLabel}`,
        'line_items[0][price_data][product_data][description]': `${propertyAddress || 'Property'}`,
        'line_items[0][price_data][unit_amount]':               String(totalCharge),
        'line_items[0][quantity]':                              '1',
        success_url:                `${appUrl}/tenant-portal.html?payment=success&amount=${totalCharge}&month=${encodeURIComponent(monthLabel)}`,
        cancel_url:                 `${appUrl}/tenant-portal.html?payment=canceled`,
        ...(tenantEmail ? { customer_email: tenantEmail } : {}),
        'metadata[type]':           'rent_payment',
        'metadata[rent_amount]':    String(rent),
        'metadata[total_charge]':   String(totalCharge),
        'metadata[property]':       propertyAddress || '',
        'metadata[tenant_name]':    tenantName || '',
        'metadata[tenant_id]':      tenantId || '',
        'metadata[property_id]':    propertyId || '',
        'metadata[month]':          monthLabel,
        'payment_intent_data[description]': `Rent payment — ${propertyAddress || 'Property'} — ${monthLabel}`,
        'payment_intent_data[metadata][type]': 'rent_payment',
        'payment_intent_data[metadata][tenant]': tenantName || '',
        'payment_intent_data[metadata][property]': propertyAddress || '',
      }).toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return res.status(400).json({ error: session.error.message });
    }

    return res.status(200).json({
      url:       session.url,
      sessionId: session.id,
      total:     totalCharge,
      fee:       absorbFee ? 0 : stripeFee,
    });

  } catch (e) {
    console.error('Stripe rent checkout error:', e);
    return res.status(502).json({ error: e.message || 'Failed to create payment session' });
  }
}
