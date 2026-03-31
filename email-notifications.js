// ============================================================================
// RentVerified — Email Notifications Client Helper
// email-notifications.js — Drop-in helper for sending transactional emails
// ============================================================================
// USAGE:
//   <script src="email-notifications.js"></script>
//   await RVEmail.send('application_received', 'tenant@email.com', { ... })
// ============================================================================

const RVEmail = {

  // Base URL for API — auto-detects local vs production
  get _apiUrl() {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return '/api/send-email';
    return '/api/send-email';
  },

  /**
   * Send a transactional email
   * @param {string} type     - Template type (see api/send-email.js TEMPLATES)
   * @param {string|string[]} to - Recipient email(s)
   * @param {object} data     - Template data
   * @param {object} opts     - Optional: { cc, replyTo }
   */
  async send(type, to, data = {}, opts = {}) {
    try {
      const res = await fetch(this._apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to, data, ...opts })
      });
      const result = await res.json();
      if (!res.ok) {
        console.warn(`RVEmail: Failed to send "${type}"`, result);
        return { ok: false, error: result.error };
      }
      console.log(`RVEmail: Sent "${type}" to ${Array.isArray(to) ? to.join(', ') : to}`);
      return { ok: true, ...result };
    } catch (e) {
      console.warn('RVEmail: Network error', e.message);
      return { ok: false, error: e.message };
    }
  },

  // ── Convenience methods ──────────────────────────────────────────────────

  /** Confirm to tenant that their application was received */
  async applicationReceived(tenantEmail, data) {
    return this.send('application_received', tenantEmail, data);
  },

  /** Alert landlord of a new incoming application */
  async alertLandlord(landlordEmail, data) {
    return this.send('application_alert_landlord', landlordEmail, data);
  },

  /** Tell tenant their application was approved */
  async applicationApproved(tenantEmail, data) {
    return this.send('application_approved', tenantEmail, data);
  },

  /** Tell tenant their application was declined */
  async applicationDeclined(tenantEmail, data) {
    return this.send('application_declined', tenantEmail, data);
  },

  /** Send lease for signing */
  async leaseSent(tenantEmail, data) {
    return this.send('lease_sent', tenantEmail, data);
  },

  /** Confirm lease signed — pass isTenant:true/false to customize message */
  async leaseSigned(email, data) {
    return this.send('lease_signed', email, data);
  },

  /** Welcome tenant to their portal */
  async portalActivated(tenantEmail, data) {
    return this.send('tenant_portal_activated', tenantEmail, data);
  },

  /** Rent reminder — pass daysLate: -3 (upcoming), 0 (due today), 1+ (late) */
  async rentReminder(tenantEmail, data) {
    return this.send('rent_reminder', tenantEmail, data);
  },

  /** Maintenance request confirmation to tenant */
  async maintenanceReceived(tenantEmail, data) {
    return this.send('maintenance_received', tenantEmail, data);
  },

  /** Maintenance status update */
  async maintenanceUpdate(tenantEmail, data) {
    return this.send('maintenance_update', tenantEmail, data);
  },

  // ── Pipeline helper: fires all emails for a pipeline event ───────────────

  /**
   * Fire the full set of emails when an application is submitted
   * Sends to both tenant AND landlord in one call
   */
  async onApplicationSubmit({ tenantEmail, landlordEmail, appData }) {
    const results = await Promise.allSettled([
      this.applicationReceived(tenantEmail, appData),
      this.alertLandlord(landlordEmail, appData),
    ]);
    return results;
  },

  /**
   * Fire emails when landlord approves — tenant gets approval + lease
   */
  async onApplicationApproved({ tenantEmail, appData, leaseData }) {
    const results = await Promise.allSettled([
      this.applicationApproved(tenantEmail, appData),
      leaseData ? this.leaseSent(tenantEmail, leaseData) : Promise.resolve(),
    ]);
    return results;
  },

  /**
   * Fire emails when lease is fully signed — both parties notified + portal activated
   */
  async onLeaseSigned({ tenantEmail, landlordEmail, leaseData, portalData }) {
    const results = await Promise.allSettled([
      this.leaseSigned(tenantEmail, { ...leaseData, isTenant: true, recipientName: leaseData.tenantName }),
      this.leaseSigned(landlordEmail, { ...leaseData, isTenant: false, recipientName: 'Property Manager' }),
      this.portalActivated(tenantEmail, portalData || leaseData),
    ]);
    return results;
  },
};

if (typeof window !== 'undefined') window.RVEmail = RVEmail;
console.log('✅ email-notifications.js loaded — RVEmail ready');
