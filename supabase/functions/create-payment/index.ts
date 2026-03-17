import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() })
    const { amount, tenantName, tenantEmail, propertyAddress, landlordStripeAccountId, paymentMethod, platformFee } = await req.json()

    // Validate
    if (!amount || amount < 1) throw new Error('Invalid amount')

    const amountCents = Math.round(amount * 100)
    const feeCents = Math.round((platformFee || 0) * 100)

    // Build line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Rent Payment — ${propertyAddress || 'Property'}`,
          description: `${tenantName || 'Tenant'} — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }]

    // Add processing fee as separate line item if card payment
    if (feeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Card Processing Fee',
            description: 'Fee for paying by credit/debit card',
          },
          unit_amount: feeCents,
        },
        quantity: 1,
      })
    }

    // Session options
    const sessionParams: any = {
      payment_method_types: paymentMethod === 'ach' ? ['us_bank_account'] : ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'https://rentverified.vercel.app'}/tenant-portal.html?payment=success&amount=${amount}`,
      cancel_url: `${req.headers.get('origin') || 'https://rentverified.vercel.app'}/tenant-portal.html?payment=cancelled`,
      customer_email: tenantEmail || undefined,
      metadata: {
        tenantName: tenantName || '',
        propertyAddress: propertyAddress || '',
        rentAmount: amount.toString(),
        paymentMethod: paymentMethod || 'card',
        source: 'rentverified',
      },
    }

    // If landlord has a connected Stripe account, use it (Stripe Connect)
    if (landlordStripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: feeCents || Math.round(amount * 0.02 * 100), // 2% platform fee
        transfer_data: {
          destination: landlordStripeAccountId,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
