// RentVerified — Automated Rent Reminders (runs daily via cron)
// Deploy: supabase functions deploy rent-reminders
// Cron setup (run in SQL Editor after deploying):
//   SELECT cron.schedule('daily-rent-reminders', '0 15 * * *',
//     $$SELECT net.http_post(
//       url := 'https://apwzjhkuvndcowfihdys.supabase.co/functions/v1/rent-reminders',
//       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     );$$
//   );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const today = new Date()
  const currentDay = today.getDate()

  // Send reminders on the 28th (3 days before the 1st)
  // and on the 1st (due date), and the 4th (3 days late)
  let messageType: string
  let daysContext: string

  if (currentDay === 28 || currentDay === 29 || currentDay === 30 || currentDay === 31) {
    messageType = 'rent_reminder'
    daysContext = 'upcoming'
  } else if (currentDay === 1) {
    messageType = 'rent_reminder'
    daysContext = 'due_today'
  } else if (currentDay >= 2 && currentDay <= 5) {
    messageType = 'late_notice'
    daysContext = `${currentDay - 1}_days_late`
  } else {
    return new Response(JSON.stringify({ message: 'Not a reminder day', day: currentDay }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get all active leases with tenant info and notification preferences
  const { data: leases, error } = await supabase
    .from('leases')
    .select(`
      id, rent_amount, tenant_name, tenant_email,
      tenant_id,
      properties(address)
    `)
    .eq('status', 'active')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const lease of (leases || [])) {
    if (!lease.tenant_id) { skipped++; continue }

    // Get tenant's notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('phone_number, sms_enabled, rent_reminders')
      .eq('user_id', lease.tenant_id)
      .single()

    if (!prefs?.sms_enabled || !prefs?.rent_reminders || !prefs?.phone_number) {
      skipped++
      continue
    }

    // Send via the send-sms function
    const templateData = messageType === 'late_notice'
      ? {
          name: lease.tenant_name || 'Tenant',
          daysLate: currentDay - 1,
          lateFee: 50, // default late fee, should come from lease terms
          payLink: 'https://rentverified.com/tenant-portal.html'
        }
      : {
          name: lease.tenant_name || 'Tenant',
          amount: lease.rent_amount || 0,
          dueDate: currentDay === 1 ? 'today' : `${new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString()}`,
          payLink: 'https://rentverified.com/tenant-portal.html'
        }

    try {
      const smsResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: prefs.phone_number,
          messageType,
          templateData
        })
      })

      if (smsResponse.ok) sent++
      else skipped++
    } catch (e) {
      skipped++
    }
  }

  return new Response(JSON.stringify({
    success: true,
    date: today.toISOString(),
    day: currentDay,
    messageType,
    context: daysContext,
    sent,
    skipped,
    totalLeases: leases?.length || 0
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
