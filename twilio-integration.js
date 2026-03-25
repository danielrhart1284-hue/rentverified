// ============================================================================
// 3120 Life — Twilio SMS Integration
// ============================================================================
// NOTE: SMS sending MUST happen server-side (Supabase Edge Function)
// This file contains:
//   1. Client-side helpers (phone formatting, message templates)
//   2. Edge Function code to deploy to Supabase (copy to Supabase dashboard)
// ============================================================================

// ─── CLIENT-SIDE: Message Templates ────────────────────────────────────

const RVMessages = {
  templates: {
    rent_reminder: (name, amount, dueDate, payLink) =>
      `Hi ${name}, your rent of $${amount} is due ${dueDate}. Pay securely: ${payLink} - 3120 Life`,

    payment_confirmation: (name, amount, month) =>
      `✅ ${name}, your payment of $${amount} for ${month} rent has been received. Thank you! - 3120 Life`,

    late_notice: (name, daysLate, lateFee, payLink) =>
      `${name}, your rent is ${daysLate} days past due. A $${lateFee} late fee applies. Pay now: ${payLink} - 3120 Life`,

    maintenance_submitted: (name, requestId) =>
      `${name}, your maintenance request #${requestId} has been submitted. We'll update you when it's assigned. - 3120 Life`,

    maintenance_update: (name, requestId, status) =>
      `${name}, maintenance request #${requestId} status: ${status}. - 3120 Life`,

    lease_expiry: (name, expiryDate, renewLink) =>
      `${name}, your lease expires on ${expiryDate}. Renew now to lock in your rate: ${renewLink} - 3120 Life`,

    verification_code: (code) =>
      `Your 3120 Life verification code is ${code}. Expires in 10 minutes.`,

    welcome: (name) =>
      `Welcome to 3120 Life, ${name}! Your account is set up and ready to go. Log in: https://rentverified.com - 3120 Life`,

    deposit_bond_offer: (name, savings, applyLink) =>
      `Great news ${name}! This property accepts deposit bonds — move in for just ~$17/mo instead of $${savings}. Apply: ${applyLink} - 3120 Life`,

    funding_status: (name, status, link) =>
      `${name}, your business funding application status: ${status}. View details: ${link} - 3120 Life`,

    showing_reminder: (name, address, dateTime) =>
      `Reminder: ${name}, your showing at ${address} is scheduled for ${dateTime}. - 3120 Life`
  },

  // Format phone number to E.164 (+1XXXXXXXXXX)
  formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits[0] === '1') return '+' + digits;
    return '+' + digits;
  },

  // Client-side: Request SMS send via Supabase Edge Function
  async send(to, messageType, templateData) {
    if (!isSupabaseConfigured()) {
      console.log('[SMS Preview]', messageType, templateData);
      return { success: false, reason: 'Supabase not configured' };
    }

    const sb = getSupabase();
    const { data, error } = await sb.functions.invoke('send-sms', {
      body: {
        to: this.formatPhone(to),
        messageType,
        templateData
      }
    });

    return { success: !error, data, error };
  },

  // Client-side: Send verification code
  async sendVerificationCode(phone) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Store code temporarily (server should validate)
    sessionStorage.setItem('rv_verify_code', code);
    sessionStorage.setItem('rv_verify_phone', phone);
    sessionStorage.setItem('rv_verify_expires', Date.now() + 600000); // 10 min

    await this.send(phone, 'verification_code', { code });
    return code;
  },

  // Verify code entered by user
  verifyCode(entered) {
    const stored = sessionStorage.getItem('rv_verify_code');
    const expires = parseInt(sessionStorage.getItem('rv_verify_expires') || '0');
    if (Date.now() > expires) return { valid: false, reason: 'Code expired' };
    if (entered !== stored) return { valid: false, reason: 'Invalid code' };
    sessionStorage.removeItem('rv_verify_code');
    sessionStorage.removeItem('rv_verify_phone');
    sessionStorage.removeItem('rv_verify_expires');
    return { valid: true };
  }
};


// ============================================================================
// SUPABASE EDGE FUNCTION — Deploy this to Supabase
// ============================================================================
// To deploy:
// 1. Install Supabase CLI: npm i -g supabase
// 2. supabase functions new send-sms
// 3. Copy the code below into supabase/functions/send-sms/index.ts
// 4. Set secrets:
//    supabase secrets set TWILIO_ACCOUNT_SID=your_sid
//    supabase secrets set TWILIO_AUTH_TOKEN=your_token
//    supabase secrets set TWILIO_PHONE_NUMBER=+18015550199
// 5. supabase functions deploy send-sms
// ============================================================================

/*
// ─── supabase/functions/send-sms/index.ts ──────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const templates: Record<string, (data: any) => string> = {
  rent_reminder: (d) => `Hi ${d.name}, your rent of $${d.amount} is due ${d.dueDate}. Pay securely: ${d.payLink} - 3120 Life`,
  payment_confirmation: (d) => `✅ ${d.name}, your payment of $${d.amount} for ${d.month} rent has been received. Thank you! - 3120 Life`,
  late_notice: (d) => `${d.name}, your rent is ${d.daysLate} days past due. A $${d.lateFee} late fee applies. Pay now: ${d.payLink} - 3120 Life`,
  maintenance_submitted: (d) => `${d.name}, your maintenance request #${d.requestId} has been submitted. We'll update you when it's assigned. - 3120 Life`,
  maintenance_update: (d) => `${d.name}, maintenance request #${d.requestId} status: ${d.status}. - 3120 Life`,
  lease_expiry: (d) => `${d.name}, your lease expires on ${d.expiryDate}. Renew now: ${d.renewLink} - 3120 Life`,
  verification_code: (d) => `Your 3120 Life verification code is ${d.code}. Expires in 10 minutes.`,
  welcome: (d) => `Welcome to 3120 Life, ${d.name}! Your account is set up. Log in: https://rentverified.com - 3120 Life`,
  deposit_bond_offer: (d) => `Great news ${d.name}! Deposit bonds available — move in for ~$17/mo instead of $${d.savings}. Apply: ${d.applyLink} - 3120 Life`,
  funding_status: (d) => `${d.name}, your funding application status: ${d.status}. Details: ${d.link} - 3120 Life`,
}

serve(async (req) => {
  try {
    const { to, messageType, templateData } = await req.json()

    // Build message from template
    const template = templates[messageType]
    if (!template) {
      return new Response(JSON.stringify({ error: 'Unknown message type' }), { status: 400 })
    }
    const body = template(templateData)

    // Send via Twilio
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
      message_type: messageType,
      twilio_sid: result.sid || null,
      status: result.status || 'failed',
      cost: result.price ? parseFloat(result.price) : null,
    })

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
*/

// ============================================================================
// SUPABASE EDGE FUNCTION — Scheduled rent reminders (runs daily via cron)
// ============================================================================
// Deploy as: supabase functions new rent-reminders
// Set up cron: In Supabase Dashboard → Database → Extensions → pg_cron
// SELECT cron.schedule('rent-reminders', '0 9 * * *', $$
//   SELECT net.http_post(
//     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/rent-reminders',
//     headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
//   );
// $$);
// ============================================================================

/*
// ─── supabase/functions/rent-reminders/index.ts ────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date()
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // 1st of next month
  const reminderDate = new Date(dueDate)
  reminderDate.setDate(reminderDate.getDate() - 3) // 3 days before

  // Only run if today is 3 days before the 1st
  if (today.toDateString() !== reminderDate.toDateString()) {
    return new Response(JSON.stringify({ message: 'Not a reminder day' }))
  }

  // Get all active leases with tenant notification preferences
  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      tenant:tenant_id(first_name, last_name, email),
      notifications:tenant_id(notification_preferences(phone_number, sms_enabled, rent_reminders))
    `)
    .eq('status', 'active')

  let sent = 0
  for (const lease of (leases || [])) {
    const prefs = lease.notifications?.notification_preferences
    if (!prefs?.sms_enabled || !prefs?.rent_reminders || !prefs?.phone_number) continue

    // Send SMS via the send-sms function
    await supabase.functions.invoke('send-sms', {
      body: {
        to: prefs.phone_number,
        messageType: 'rent_reminder',
        templateData: {
          name: lease.tenant?.first_name || 'Tenant',
          amount: lease.rent_amount,
          dueDate: dueDate.toLocaleDateString(),
          payLink: 'https://rentverified.com/tenant-portal.html'
        }
      }
    })
    sent++
  }

  return new Response(JSON.stringify({ sent, total: leases?.length || 0 }))
})
*/
