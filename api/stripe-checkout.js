// ============================================================================
// RentVerified — Stripe Checkout Session Creator
// api/stripe-checkout.js
// ============================================================================
// ENV VARS REQUIRED:
//   STRIPE_SECRET_KEY      = sk_live_...
//   STRIPE_PUBLISHABLE_KEY = pk_live_...
//   APP_URL                = https://rentverified-ocyo.vercel.app
// ============================================================================

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── PLAN DEFINITIONS ─────────────────────────────────────────────────────────
// These match the Price IDs you create in Stripe Dashboard → Products
// After running this file once, update these with your real Stripe Price IDs
const PLANS = {
  pro: {
    name:        'Pro',
    amount:      7900,        // $79.00 in cents
    interval:    'month',
    description: 'Up to 20 properties · Full leasing pipeline · AI tools · Email & SMS',
    // Replace with your real Stripe Price ID from dashboard → Products → Pro → Price ID
    priceId:     process.env.STRIPE_PRICE_PRO || null,
  },
  enterprise: {
    name:        'Enterprise',
    amount:      14900,       // $149.00 in cents
    interval:    'month',
    description: 'Unlimited properties · White-label · Priority support · API access',
    priceId:     process.env.STRIPE_PRICE_ENTERPRISE || null,
  },
};

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

  const { plan, email, userId, successPath = '/landlord-signup.html', cancelPath = '/pricing.html' } = body;

  if (!plan || !PLANS[plan]) {
    return res.status(400).json({ error: `Invalid plan. Valid plans: ${Object.keys(PLANS).join(', ')}` });
  }

  const planConfig = PLANS[plan];

  // If we have a Price ID, use it directly (recommended)
  // If not, create an inline price (works but less flexible)
  let lineItems;

  if (planConfig.priceId) {
    lineItems = [{ price: planConfig.priceId, quantity: 1 }];
  } else {
    // Inline price — creates one-off price each time (not ideal but functional)
    lineItems = [{
      price_data: {
        currency:       'usd',
        product_data:   { name: `RentVerified ${planConfig.name}`, description: planConfig.description },
        unit_amount:    planConfig.amount,
        recurring:      { interval: planConfig.interval },
      },
      quantity: 1,
    }];
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode:                        'subscription',
        'line_items[0][price]':      planConfig.priceId || '',
        'line_items[0][quantity]':   '1',
        success_url:                 `${appUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
        cancel_url:                  `${appUrl}${cancelPath}?canceled=true`,
        ...(email ? { customer_email: email } : {}),
        ...(userId ? { 'metadata[userId]': userId } : {}),
        'metadata[plan]':            plan,
        'metadata[source]':          'rentverified',
        allow_promotion_codes:       'true',
        billing_address_collection:  'auto',
        // Use inline price if no priceId set
        ...(planConfig.priceId ? {} : {
          'line_items[0][price_data][currency]':                   'usd',
          'line_items[0][price_data][product_data][name]':         `RentVerified ${planConfig.name}`,
          'line_items[0][price_data][product_data][description]':  planConfig.description,
          'line_items[0][price_data][unit_amount]':                String(planConfig.amount),
          'line_items[0][price_data][recurring][interval]':        planConfig.interval,
        }),
      }).toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return res.status(400).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (e) {
    console.error('Stripe checkout error:', e);
    return res.status(502).json({ error: e.message || 'Failed to create checkout session' });
  }
}
