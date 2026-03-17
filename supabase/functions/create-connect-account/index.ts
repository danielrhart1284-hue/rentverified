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
    const { action, landlordEmail, landlordName, accountId } = await req.json()

    if (action === 'create') {
      // Create a Connect Express account for the landlord
      const account = await stripe.accounts.create({
        type: 'express',
        email: landlordEmail,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          landlordName: landlordName || '',
          source: 'rentverified',
        },
      })

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.headers.get('origin') || 'https://rentverified.vercel.app'}/landlord-signup.html?stripe=refresh`,
        return_url: `${req.headers.get('origin') || 'https://rentverified.vercel.app'}/landlord-signup.html?stripe=success&account=${account.id}`,
        type: 'account_onboarding',
      })

      return new Response(JSON.stringify({ accountId: account.id, url: accountLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'status') {
      // Check if account is fully onboarded
      const account = await stripe.accounts.retrieve(accountId)
      return new Response(JSON.stringify({
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'login') {
      // Create login link for existing connected account
      const loginLink = await stripe.accounts.createLoginLink(accountId)
      return new Response(JSON.stringify({ url: loginLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
