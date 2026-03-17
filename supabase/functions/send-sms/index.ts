// RentVerified — SMS Edge Function (Supabase + Twilio)
// Deploy: supabase functions deploy send-sms
// Secrets needed (set via Supabase CLI — never commit real values):
//   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
//   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
//   supabase secrets set TWILIO_PHONE_NUMBER=your_twilio_number

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const templates: Record<string, (data: any) => string> = {
  rent_reminder: (d) =>
    `Hi ${d.name}, your rent of $${d.amount} is due ${d.dueDate}. Pay securely: ${d.payLink || 'https://rentverified.com/tenant-portal.html'} - RentVerified`,

  payment_confirmation: (d) =>
    `✅ ${d.name}, your payment of $${d.amount} for ${d.month} rent has been received. Thank you! - RentVerified`,

  late_notice: (d) =>
    `${d.name}, your rent is ${d.daysLate} days past due. A $${d.lateFee} late fee applies. Pay now: ${d.payLink || 'https://rentverified.com/tenant-portal.html'} - RentVerified`,

  maintenance_submitted: (d) =>
    `${d.name}, your maintenance request #${d.requestId} has been submitted. We'll update you when it's assigned. - RentVerified`,

  maintenance_update: (d) =>
    `${d.name}, maintenance request #${d.requestId} status: ${d.status}. - RentVerified`,

  lease_expiry: (d) =>
    `${d.name}, your lease expires on ${d.expiryDate}. Renew now to lock in your rate: ${d.renewLink || 'https://rentverified.com/tenant-portal.html'} - RentVerified`,

  verification_code: (d) =>
    `Your RentVerified verification code is ${d.code}. Expires in 10 minutes.`,

  welcome: (d) =>
    `Welcome to RentVerified, ${d.name}! Your account is set up and ready to go. Log in: https://rentverified.com - RentVerified`,

  deposit_bond_offer: (d) =>
    `Great news ${d.name}! This property accepts deposit bonds — move in for ~$17/mo instead of $${d.savings}. Apply: ${d.applyLink || 'https://rentverified.com'} - RentVerified`,

  funding_status: (d) =>
    `${d.name}, your business funding application status: ${d.status}. View details: ${d.link || 'https://rentverified.com/funding.html'} - RentVerified`,

  direct: (d) =>
    d.customMessage || d.body || 'You have a new message from your property manager.',

  custom: (d) =>
    d.message,
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, messageType, templateData } = await req.json()

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing "to" phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build message from template
    const template = templates[messageType || 'custom']
    if (!template) {
      return new Response(JSON.stringify({ error: `Unknown message type: ${messageType}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = template(templateData || {})

    // Send via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM,
        Body: body,
      }),
    })

    const result = await twilioResponse.json()

    // Log to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await supabase.from('sms_log').insert({
      phone_to: to,
      phone_from: TWILIO_FROM,
      message_body: body,
      message_type: messageType || 'custom',
      twilio_sid: result.sid || null,
      status: result.status || (result.error_code ? 'failed' : 'sent'),
      cost: result.price ? parseFloat(result.price) : null,
    })

    if (result.error_code) {
      return new Response(JSON.stringify({
        success: false,
        error: result.message,
        code: result.error_code
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      sid: result.sid,
      status: result.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
