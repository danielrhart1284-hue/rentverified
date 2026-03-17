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
    const { amount, propertyAddress, tenantName, landlordStripeAccountId } = await req.json()

    const amountCents = Math.round(amount * 100)

    // Create a product and price for this payment
    const product = await stripe.products.create({
      name: `Rent — ${propertyAddress || 'Property'}`,
      metadata: { tenantName: tenantName || '', source: 'rentverified' },
    })

    const price = await stripe.prices.create({
      unit_amount: amountCents,
      currency: 'usd',
      product: product.id,
    })

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        tenantName: tenantName || '',
        propertyAddress: propertyAddress || '',
        source: 'rentverified',
      },
    })

    // Generate QR code URL using QR Server API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink.url)}`

    return new Response(JSON.stringify({
      paymentUrl: paymentLink.url,
      qrCodeUrl: qrCodeUrl,
      linkId: paymentLink.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
