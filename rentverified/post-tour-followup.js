// ============================================================================
// RentVerified — Post-Tour Follow-Up System
// post-tour-followup.js — Drop-in auto follow-up after property tours
// ============================================================================
// DROP-IN USAGE:
//   <script src="post-tour-followup.js"></script>
//   Automatically scans for completed tours and sends follow-up
//   Also exposes PTF.sendFollowUp(booking) for manual triggers
// ============================================================================

const PTF = (() => {

  const API_EMAIL = '/api/send-email';
  const API_SMS   = '/api/send-sms';
  const STORE_KEY = 'rv_ptf_sent';  // tracks which bookings already got follow-up

  // ── DEFAULT SETTINGS ──────────────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    autoSend:        true,    // Auto-send when tour marked complete
    delayMinutes:    30,      // Send 30 min after tour completes (0 = immediate)
    sendEmail:       true,
    sendSMS:         true,
    reminderEnabled: true,    // Send reminder night before
    reminderHour:    18,      // 6 PM reminder the evening before
  };

  function getSettings() {
    const saved = localStorage.getItem('rv_ptf_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  }

  function saveSettings(settings) {
    localStorage.setItem('rv_ptf_settings', JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }));
  }

  function getSentLog() {
    const s = localStorage.getItem(STORE_KEY);
    return s ? JSON.parse(s) : {};
  }

  function markSent(bookingId, type) {
    const log = getSentLog();
    if (!log[bookingId]) log[bookingId] = {};
    log[bookingId][type] = new Date().toISOString();
    localStorage.setItem(STORE_KEY, JSON.stringify(log));
  }

  function alreadySent(bookingId, type) {
    const log = getSentLog();
    return !!(log[bookingId] && log[bookingId][type]);
  }

  // ── SEND FOLLOW-UP ────────────────────────────────────────────────────────
  async function sendFollowUp(booking, options = {}) {
    const settings = { ...getSettings(), ...options };

    if (alreadySent(booking.id, 'followup')) {
      console.log(`[PTF] Follow-up already sent for booking ${booking.id}`);
      return { skipped: true, reason: 'already_sent' };
    }

    const appUrl = window.location.origin;
    const applyLink = `${appUrl}/tenant-application.html?property=${encodeURIComponent(booking.property || '')}`;

    const emailData = {
      prospectName:    booking.name,
      propertyAddress: booking.property,
      rentAmount:      booking.rentAmount || '',
      availableDate:   booking.availableDate || 'Now',
      bedrooms:        booking.bedrooms || '',
      tourDate:        booking.date,
      managerName:     booking.managerName || localStorage.getItem('rv_user_name') || 'Your Property Manager',
      managerPhone:    booking.managerPhone || localStorage.getItem('rv_user_phone') || '',
    };

    const smsData = {
      name:      booking.name ? booking.name.split(' ')[0] : 'there',
      address:   booking.property,
      applyLink,
    };

    const results = { email: null, sms: null };

    // Send email
    if (settings.sendEmail && booking.email) {
      try {
        const r = await fetch(API_EMAIL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tour_followup', to: booking.email, data: emailData }),
        });
        results.email = await r.json();
        console.log('[PTF] Follow-up email sent to', booking.email, results.email);
      } catch (e) {
        console.error('[PTF] Email error:', e);
        results.email = { error: e.message };
      }
    }

    // Send SMS
    if (settings.sendSMS && booking.phone) {
      try {
        const r = await fetch(API_SMS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tour_followup', to: booking.phone, data: smsData }),
        });
        results.sms = await r.json();
        console.log('[PTF] Follow-up SMS sent to', booking.phone, results.sms);
      } catch (e) {
        console.error('[PTF] SMS error:', e);
        results.sms = { error: e.message };
      }
    }

    markSent(booking.id, 'followup');

    // Log to Supabase if available
    try {
      if (typeof RVData !== 'undefined') {
        await RVData.insert('sms_log', {
          phone_to:     booking.phone || '',
          phone_from:   'system',
          message_body: `Post-tour follow-up sent to ${booking.name} for ${booking.property}`,
          message_type: 'post_tour_followup',
          status:       'sent',
        });
      }
    } catch (_) {}

    return results;
  }

  // ── SEND TOUR REMINDER (night before) ────────────────────────────────────
  async function sendReminder(booking, options = {}) {
    const settings = { ...getSettings(), ...options };

    if (alreadySent(booking.id, 'reminder')) {
      return { skipped: true, reason: 'already_sent' };
    }

    const emailData = {
      prospectName:    booking.name,
      propertyAddress: booking.property,
      tourDate:        booking.date,
      tourTime:        booking.time,
      managerPhone:    booking.managerPhone || localStorage.getItem('rv_user_phone') || '',
    };

    const smsData = {
      name:    booking.name ? booking.name.split(' ')[0] : 'there',
      address: booking.property,
      time:    booking.time,
    };

    const results = { email: null, sms: null };

    if (settings.sendEmail && booking.email) {
      try {
        const r = await fetch(API_EMAIL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tour_reminder', to: booking.email, data: emailData }),
        });
        results.email = await r.json();
      } catch (e) {
        results.email = { error: e.message };
      }
    }

    if (settings.sendSMS && booking.phone) {
      try {
        const r = await fetch(API_SMS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tour_reminder', to: booking.phone, data: smsData }),
        });
        results.sms = await r.json();
      } catch (e) {
        results.sms = { error: e.message };
      }
    }

    markSent(booking.id, 'reminder');
    return results;
  }

  // ── AUTO-SCAN: check calendar for tours that ended and need follow-up ─────
  function autoScan() {
    const settings = getSettings();
    if (!settings.autoSend) return;

    const now = new Date();
    const bookings = JSON.parse(localStorage.getItem('rv_cal_bookings') || '[]');
    const events   = JSON.parse(localStorage.getItem('rv_cal_events') || '[]');

    // Check confirmed tours that are in the past
    bookings.forEach(b => {
      if (b.status !== 'confirmed') return;
      const tourDateTime = new Date(`${b.date}T${convertTo24(b.time || '12:00 PM')}`);
      const minutesSince = (now - tourDateTime) / 60000;

      if (minutesSince >= settings.delayMinutes && minutesSince < 1440) { // within 24 hrs
        sendFollowUp(b).then(r => {
          if (r && !r.skipped) {
            console.log(`[PTF] Auto follow-up sent for ${b.name}`);
            showFollowUpToast(b.name, b.property);
          }
        });
      }
    });

    // Check calendar tour events marked done that need follow-up
    events.forEach(e => {
      if (e.cat !== 'tours' || !e.done) return;
      if (alreadySent(e.id, 'followup')) return;

      // Extract name from title (e.g. "Property Tour — Sarah M.")
      const match = e.title.match(/—\s*(.+)$/);
      const name  = match ? match[1].trim() : 'Prospect';

      // Try to find matching booking
      const booking = bookings.find(b => b.name === name || e.title.includes(b.name));
      if (booking) {
        sendFollowUp(booking);
      }
    });

    // Send reminders for tomorrow's tours
    if (settings.reminderEnabled) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      bookings.forEach(b => {
        if (b.status !== 'confirmed') return;
        if (b.date !== tomorrowStr) return;
        if (alreadySent(b.id, 'reminder')) return;
        if (now.getHours() >= settings.reminderHour) {
          sendReminder(b);
        }
      });
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function convertTo24(time12) {
    try {
      const [time, modifier] = time12.split(' ');
      let [hours, minutes]   = time.split(':');
      hours = parseInt(hours);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2,'0')}:${minutes || '00'}`;
    } catch (_) {
      return '12:00';
    }
  }

  function showFollowUpToast(name, property) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0f172a;color:white;padding:14px 20px;border-radius:12px;font-size:.88rem;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.3);max-width:300px;line-height:1.4';
    t.innerHTML = `📨 Follow-up sent to <strong>${name}</strong><br><span style="font-weight:400;font-size:.8rem;opacity:.8">${property}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ── SETTINGS UI ───────────────────────────────────────────────────────────
  function renderSettingsPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const s = getSettings();

    container.innerHTML = `
      <div style="background:white;border-radius:12px;border:1px solid #e2e8f0;padding:20px">
        <h3 style="font-size:.95rem;font-weight:800;color:#0f172a;margin-bottom:16px">📨 Post-Tour Follow-Up Settings</h3>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
          <div>
            <div style="font-weight:700;font-size:.88rem">Auto-Send Follow-Up</div>
            <div style="font-size:.75rem;color:#6b7280">Automatically send after tour completes</div>
          </div>
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.82rem">
            <input type="checkbox" id="ptf-auto" ${s.autoSend?'checked':''} onchange="PTF.updateSetting('autoSend',this.checked)"> On
          </label>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
          <div>
            <div style="font-weight:700;font-size:.88rem">Send Email Follow-Up</div>
            <div style="font-size:.75rem;color:#6b7280">Includes apply link and property details</div>
          </div>
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.82rem">
            <input type="checkbox" id="ptf-email" ${s.sendEmail?'checked':''} onchange="PTF.updateSetting('sendEmail',this.checked)"> On
          </label>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
          <div>
            <div style="font-weight:700;font-size:.88rem">Send SMS Follow-Up</div>
            <div style="font-size:.75rem;color:#6b7280">Short text with apply link</div>
          </div>
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.82rem">
            <input type="checkbox" id="ptf-sms" ${s.sendSMS?'checked':''} onchange="PTF.updateSetting('sendSMS',this.checked)"> On
          </label>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">
          <div>
            <div style="font-weight:700;font-size:.88rem">Send Tour Reminder</div>
            <div style="font-size:.75rem;color:#6b7280">Remind prospect the evening before</div>
          </div>
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;font-size:.82rem">
            <input type="checkbox" id="ptf-reminder" ${s.reminderEnabled?'checked':''} onchange="PTF.updateSetting('reminderEnabled',this.checked)"> On
          </label>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0">
          <div>
            <div style="font-weight:700;font-size:.88rem">Delay After Tour</div>
            <div style="font-size:.75rem;color:#6b7280">Wait before sending follow-up</div>
          </div>
          <select id="ptf-delay" onchange="PTF.updateSetting('delayMinutes',parseInt(this.value))"
            style="padding:6px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:.82rem">
            <option value="0"  ${s.delayMinutes===0?'selected':''}>Immediately</option>
            <option value="30" ${s.delayMinutes===30?'selected':''}>30 minutes</option>
            <option value="60" ${s.delayMinutes===60?'selected':''}>1 hour</option>
            <option value="180"${s.delayMinutes===180?'selected':''}>3 hours</option>
            <option value="1440"${s.delayMinutes===1440?'selected':''}>Next day</option>
          </select>
        </div>
      </div>
    `;
  }

  function updateSetting(key, value) {
    const s = getSettings();
    s[key] = value;
    saveSettings(s);
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    // Run auto-scan every 15 minutes
    autoScan();
    setInterval(autoScan, 15 * 60 * 1000);
    console.log('[PTF] Post-tour follow-up system initialized');
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  return {
    sendFollowUp,
    sendReminder,
    autoScan,
    getSettings,
    saveSettings,
    updateSetting,
    renderSettingsPanel,
    getSentLog,
  };

})();

// Make globally accessible
window.PTF = PTF;
