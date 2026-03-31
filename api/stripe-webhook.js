// ============================================================================
// RentVerified — Stripe Webhook Handler
// api/stripe-webhook.js
// ============================================================================
// ENV VARS REQUIRED:
//   STRIPE_SECRET_KEY        = sk_live_...
//   STRIPE_WEBHOOK_SECRET    = whsec_... (from Stripe Dashboard → Webhooks)
// ============================================================================
// Register this webhook URL in Stripe Dashboard → Developers → Webhooks:
//   https://rentverified-ocyo.vercel.app/api/stripe-webhook
//
// Events to enable:
//   checkout.session.completed
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_succeeded
//   invoice.payment_failed
// ============================================================================

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function verifyStripeSignature(rawBody, signature, secret) {
  // Manual HMAC verification (no stripe npm package needed)
  const encoder = new TextEncoder();
  const parts    = signature.split(',');
  const tPart    = parts.find(p => p.startsWith('t='));
  const v1Part   = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) throw new Error('Invalid signature format');
  const timestamp  = tPart.split('=')[1];
  const expected   = v1Part.split('=')[1];
  const payload    = `${timestamp}.${rawBody}`;
  const key        = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signedBuf  = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const computed   = Array.from(new Uint8Array(signedBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
  if (computed !== expected) throw new Error('Signature mismatch');
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) throw new Error('Webhook timestamp too old');
  return JSON.parse(rawBody);
}

// ── SUPABASE HELPER ───────────────────────────────────────────────────────────
async function updateSupabase(table, data, match) {
  const url     = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  const matchQuery = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join('&');
  await fetch(`${url}/rest/v1/${table}?${matchQuery}`, {
    method:  'PATCH',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
}

async function insertSupabase(table, data) {
  const url     = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  await fetch(`${url}/rest/v1/${table}`, {
    method:  'POST',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body:    JSON.stringify(data),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await getRawBody(req);

  let event;
  try {
    if (secret && sig) {
      event = await verifyStripeSignature(rawBody, sig, secret);
    } else {
      // Dev mode — no signature verification
      event = JSON.parse(rawBody);
      console.warn('[Stripe Webhook] No webhook secret — skipping signature verification');
    }
  } catch (e) {
    console.error('Webhook signature error:', e.message);
    return res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  try {
    switch (event.type) {

      // ── Checkout completed → activate subscription ─────────────────────────
      case 'checkout.session.completed': {
        const session  = event.data.object;
        const plan     = session.metadata?.plan || 'pro';
        const userId   = session.metadata?.userId;
        const email    = session.customer_details?.email || session.customer_email;
        const customerId = session.customer;
        const subId    = session.subscription;

        console.log(`[Stripe] Checkout complete: ${email} → ${plan}`);

        // Update user profile in Supabase
        if (email) {
          await updateSupabase('profiles', {
            stripe_customer_id:    customerId,
            stripe_subscription_id: subId,
            plan,
            plan_status:           'active',
            plan_activated_at:     new Date().toISOString(),
          }, { email });
        }

        // Log the event
        await insertSupabase('billing_events', {
          event_type:    'subscription_started',
          plan,
          email,
          customer_id:   customerId,
          subscription_id: subId,
          amount:        session.amount_total,
          currency:      session.currency,
          created_at:    new Date().toISOString(),
        });

        break;
      }

      // ── Subscription updated (upgrade/downgrade) ───────────────────────────
      case 'customer.subscription.updated': {
        const sub   = event.data.object;
        const email = sub.customer_email;

        await updateSupabase('profiles', {
          plan_status:   sub.status,
          plan_updated_at: new Date().toISOString(),
        }, { stripe_subscription_id: sub.id });

        console.log(`[Stripe] Subscription updated: ${sub.id} → ${sub.status}`);
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        await updateSupabase('profiles', {
          plan:          'starter',
          plan_status:   'canceled',
          plan_canceled_at: new Date().toISOString(),
        }, { stripe_subscription_id: sub.id });

        console.log(`[Stripe] Subscription canceled: ${sub.id}`);
        break;
      }

      // ── Invoice paid (renewal) ─────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`[Stripe] Payment succeeded: ${invoice.id} — $${invoice.amount_paid / 100}`);

        await insertSupabase('billing_events', {
          event_type:      'payment_succeeded',
          customer_id:     invoice.customer,
          subscription_id: invoice.subscription,
          amount:          invoice.amount_paid,
          currency:        invoice.currency,
          invoice_id:      invoice.id,
          created_at:      new Date().toISOString(),
        });
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`[Stripe] Payment FAILED: ${invoice.id}`);

        await updateSupabase('profiles', {
          plan_status: 'past_due',
        }, { stripe_customer_id: invoice.customer });

        await insertSupabase('billing_events', {
          event_type:  'payment_failed',
          customer_id: invoice.customer,
          amount:      invoice.amount_due,
          invoice_id:  invoice.id,
          created_at:  new Date().toISOString(),
        });
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (e) {
    console.error('[Stripe Webhook] Handler error:', e);
    // Still return 200 so Stripe doesn't retry
  }

  return res.status(200).json({ received: true });
}
