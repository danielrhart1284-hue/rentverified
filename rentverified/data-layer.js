// ============================================================================
// RentVerified — Data Layer
// ============================================================================
// This module provides a unified API for all data operations.
// It uses Supabase when configured, falls back to localStorage when not.
// This means ALL existing pages continue to work during migration.
// ============================================================================

const RVData = {
  // ─── Internal Helpers ────────────────────────────────────────────────

  _useSupabase() {
    return isSupabaseConfigured() && getSupabase() !== null;
  },

  async _userId() {
    if (!this._useSupabase()) return 'local';
    const user = await RVAuth.getUser();
    return user?.id || 'local';
  },

  // ─── PROPERTIES ──────────────────────────────────────────────────────

  async getProperties() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('properties').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
      return data || [];
    }
    // Fallback: localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('rv_listings_'));
    let all = [];
    keys.forEach(k => { try { all = all.concat(JSON.parse(localStorage.getItem(k) || '[]')); } catch(e){} });
    return all;
  },

  async getPublicListings(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('properties').select('*').eq('status', 'available');
      if (filters.type) query = query.eq('property_type', filters.type);
      if (filters.minRent) query = query.gte('rent', filters.minRent);
      if (filters.maxRent) query = query.lte('rent', filters.maxRent);
      if (filters.beds) query = query.gte('beds', filters.beds);
      if (filters.city) query = query.ilike('city', `%${filters.city}%`);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_listings_default') || '[]').filter(l => l.status === 'available');
  },

  async saveProperty(property) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      property.owner_id = user.id;
      if (property.id) {
        const { data, error } = await sb.from('properties').update(property).eq('id', property.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('properties').insert(property).select().single();
        return { data, error };
      }
    }
    // Fallback: localStorage
    const key = 'rv_listings_default';
    const listings = JSON.parse(localStorage.getItem(key) || '[]');
    if (property.listingId) {
      const idx = listings.findIndex(l => l.listingId === property.listingId);
      if (idx >= 0) listings[idx] = property; else listings.push(property);
    } else {
      property.listingId = 'lst_' + Date.now();
      listings.push(property);
    }
    localStorage.setItem(key, JSON.stringify(listings));
    return { data: property, error: null };
  },

  async deleteProperty(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('properties').delete().eq('id', id);
    }
    const key = 'rv_listings_default';
    const listings = JSON.parse(localStorage.getItem(key) || '[]').filter(l => l.listingId !== id);
    localStorage.setItem(key, JSON.stringify(listings));
    return { error: null };
  },

  // ─── LEASES ──────────────────────────────────────────────────────────

  async getLeases(role = 'landlord') {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const col = role === 'tenant' ? 'tenant_id' : 'landlord_id';
      const { data } = await sb.from('leases').select('*, properties(address, city, state)').eq(col, user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_leases') || '[]');
  },

  async saveLease(lease) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (lease.id) {
        const { data, error } = await sb.from('leases').update(lease).eq('id', lease.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        lease.landlord_id = user.id;
        const { data, error } = await sb.from('leases').insert(lease).select().single();
        return { data, error };
      }
    }
    const leases = JSON.parse(localStorage.getItem('rv_leases') || '[]');
    if (lease.id) {
      const idx = leases.findIndex(l => l.id === lease.id);
      if (idx >= 0) leases[idx] = lease; else leases.push(lease);
    } else {
      lease.id = 'lease_' + Date.now();
      leases.push(lease);
    }
    localStorage.setItem('rv_leases', JSON.stringify(leases));
    return { data: lease, error: null };
  },

  // ─── PAYMENTS ────────────────────────────────────────────────────────

  async getPayments(role = 'landlord') {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const col = role === 'tenant' ? 'payer_id' : 'payee_id';
      const { data } = await sb.from('payments').select('*, properties(address)').eq(col, user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_rent_ledger') || '[]');
  },

  async recordPayment(payment) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data, error } = await sb.from('payments').insert(payment).select().single();
      return { data, error };
    }
    const ledger = JSON.parse(localStorage.getItem('rv_rent_ledger') || '[]');
    payment.id = 'pay_' + Date.now();
    ledger.push(payment);
    localStorage.setItem('rv_rent_ledger', JSON.stringify(ledger));
    return { data: payment, error: null };
  },

  // ─── ACCOUNTING ──────────────────────────────────────────────────────

  async getAccountingEntries() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('accounting_entries').select('*').eq('owner_id', user.id).order('entry_date', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_accounting') || '[]');
  },

  async saveAccountingEntry(entry) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      entry.owner_id = user.id;
      if (entry.id) {
        const { data, error } = await sb.from('accounting_entries').update(entry).eq('id', entry.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('accounting_entries').insert(entry).select().single();
        return { data, error };
      }
    }
    const entries = JSON.parse(localStorage.getItem('rv_accounting') || '[]');
    if (!entry.id) entry.id = 'acct_' + Date.now();
    entries.push(entry);
    localStorage.setItem('rv_accounting', JSON.stringify(entries));
    return { data: entry, error: null };
  },

  // ─── MAINTENANCE ─────────────────────────────────────────────────────

  async getMaintenanceRequests(role = 'landlord') {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const col = role === 'tenant' ? 'tenant_id' : 'landlord_id';
      const { data } = await sb.from('maintenance_requests').select('*, properties(address)').eq(col, user.id).order('submitted_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_maintenance_requests') || '[]');
  },

  async saveMaintenanceRequest(request) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      if (request.id) {
        const { data, error } = await sb.from('maintenance_requests').update(request).eq('id', request.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('maintenance_requests').insert(request).select().single();
        return { data, error };
      }
    }
    const requests = JSON.parse(localStorage.getItem('rv_maintenance_requests') || '[]');
    if (!request.id) request.id = 'maint_' + Date.now();
    requests.push(request);
    localStorage.setItem('rv_maintenance_requests', JSON.stringify(requests));
    return { data: request, error: null };
  },

  // ─── MESSAGES ────────────────────────────────────────────────────────

  async getMessages() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('messages')
        .select('*, sender:from_id(first_name, last_name, email)')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_messages') || '[]');
  },

  async sendMessage(message) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      message.from_id = user.id;
      const { data, error } = await sb.from('messages').insert(message).select().single();
      return { data, error };
    }
    const msgs = JSON.parse(localStorage.getItem('rv_messages') || '[]');
    message.id = 'msg_' + Date.now();
    msgs.push(message);
    localStorage.setItem('rv_messages', JSON.stringify(msgs));
    return { data: message, error: null };
  },

  // ─── AI CONVERSATIONS ───────────────────────────────────────────────

  async getAIConversations() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('ai_conversations').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_chat_inbox') || '[]');
  },

  // ─── MANAGEMENT PROFILE ─────────────────────────────────────────────

  async getManagementProfile(ownerId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const id = ownerId || (await RVAuth.getUser())?.id;
      const { data } = await sb.from('management_profiles').select('*').eq('owner_id', id).single();
      return data;
    }
    // Fallback
    const companyId = typeof getCompanyId === 'function' ? getCompanyId() : 'default';
    const key = 'rv_mgmt_profile_' + (ownerId || companyId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  },

  async saveManagementProfile(profile) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      profile.owner_id = user.id;
      const { data, error } = await sb.from('management_profiles')
        .upsert(profile, { onConflict: 'owner_id' })
        .select()
        .single();
      return { data, error };
    }
    const companyId = typeof getCompanyId === 'function' ? getCompanyId() : 'default';
    localStorage.setItem('rv_mgmt_profile_' + companyId, JSON.stringify(profile));
    return { data: profile, error: null };
  },

  // ─── APPLICANTS / SCREENING ──────────────────────────────────────────

  async getApplicants() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('applicants').select('*, properties(address)').eq('landlord_id', user.id).order('applied_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_applicants') || '[]');
  },

  async saveApplicant(applicant) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      applicant.landlord_id = user.id;
      const { data, error } = await sb.from('applicants').insert(applicant).select().single();
      return { data, error };
    }
    const apps = JSON.parse(localStorage.getItem('rv_applicants') || '[]');
    applicant.id = 'app_' + Date.now();
    apps.push(applicant);
    localStorage.setItem('rv_applicants', JSON.stringify(apps));
    return { data: applicant, error: null };
  },

  // ─── DOCUMENTS ───────────────────────────────────────────────────────

  async getDocuments(propertyId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      let query = sb.from('documents').select('*').eq('owner_id', user.id);
      if (propertyId) query = query.eq('property_id', propertyId);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_property_docs') || '{}');
  },

  // ─── EVICTION CASES ──────────────────────────────────────────────────

  async getEvictionCases() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('eviction_cases').select('*, eviction_notices(*)').eq('landlord_id', user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_ev_cases') || '[]');
  },

  async saveEvictionCase(evCase) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      evCase.landlord_id = user.id;
      if (evCase.id) {
        const { data, error } = await sb.from('eviction_cases').update(evCase).eq('id', evCase.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('eviction_cases').insert(evCase).select().single();
        return { data, error };
      }
    }
    const cases = JSON.parse(localStorage.getItem('rv_ev_cases') || '[]');
    if (!evCase.id) evCase.id = 'ev_' + Date.now();
    cases.push(evCase);
    localStorage.setItem('rv_ev_cases', JSON.stringify(cases));
    return { data: evCase, error: null };
  },

  // ─── FUNDING APPLICATIONS ───────────────────────────────────────────

  async getFundingApplications(role = 'landlord') {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const col = role === 'applicant' ? 'applicant_id' : 'landlord_id';
      const { data } = await sb.from('funding_applications').select('*').eq(col, user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_funding_applications') || '[]');
  },

  async saveFundingApplication(app) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data, error } = await sb.from('funding_applications').insert(app).select().single();
      return { data, error };
    }
    const apps = JSON.parse(localStorage.getItem('rv_funding_applications') || '[]');
    app.id = 'fund_' + Date.now();
    apps.push(app);
    localStorage.setItem('rv_funding_applications', JSON.stringify(apps));
    return { data: app, error: null };
  },

  // ─── REFERRALS ───────────────────────────────────────────────────────

  async getReferrals() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_referrals') || '[]');
  },

  async saveReferral(referral) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      referral.referrer_id = user.id;
      const { data, error } = await sb.from('referrals').insert(referral).select().single();
      return { data, error };
    }
    const refs = JSON.parse(localStorage.getItem('rv_referrals') || '[]');
    referral.id = 'ref_' + Date.now();
    refs.push(referral);
    localStorage.setItem('rv_referrals', JSON.stringify(refs));
    return { data: referral, error: null };
  },

  // ─── VENDORS ─────────────────────────────────────────────────────────

  async getVendors() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data } = await sb.from('vendors').select('*').eq('verification_status', 'verified').order('rating', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_vendors') || '[]');
  },

  async saveVendor(vendor) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      vendor.user_id = user.id;
      if (vendor.id) {
        const { data, error } = await sb.from('vendors').update(vendor).eq('id', vendor.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('vendors').insert(vendor).select().single();
        return { data, error };
      }
    }
    const vendors = JSON.parse(localStorage.getItem('rv_vendors') || '[]');
    if (!vendor.id) vendor.id = 'vnd_' + Date.now();
    vendors.push(vendor);
    localStorage.setItem('rv_vendors', JSON.stringify(vendors));
    return { data: vendor, error: null };
  },

  // ─── OWNER STATEMENTS ───────────────────────────────────────────────

  async getOwnerStatements() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('owner_statements').select('*, properties(address)').eq('owner_id', user.id).order('statement_month', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_saved_statements') || '[]');
  },

  // ─── NOTIFICATION PREFERENCES ───────────────────────────────────────

  async getNotificationPrefs() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('notification_preferences').select('*').eq('user_id', user.id).single();
      return data;
    }
    return JSON.parse(localStorage.getItem('rv_notification_prefs') || '{}');
  },

  async saveNotificationPrefs(prefs) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      prefs.user_id = user.id;
      const { data, error } = await sb.from('notification_preferences')
        .upsert(prefs, { onConflict: 'user_id' })
        .select()
        .single();
      return { data, error };
    }
    localStorage.setItem('rv_notification_prefs', JSON.stringify(prefs));
    return { data: prefs, error: null };
  },

  // ─── ADMIN: Platform-wide queries ───────────────────────────────────

  admin: {
    async getAllUsers() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },

    async getAllProperties() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from('properties').select('*, owner:owner_id(first_name, last_name, email, company)').order('created_at', { ascending: false });
      return data || [];
    },

    async getAllPayments() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from('payments').select('*, payer:payer_id(first_name, last_name), payee:payee_id(first_name, last_name)').order('created_at', { ascending: false });
      return data || [];
    },

    async getAllFundingApps() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from('funding_applications').select('*').order('created_at', { ascending: false });
      return data || [];
    },

    async getSettings(key) {
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb.from('admin_settings').select('setting_value').eq('setting_key', key).single();
      return data?.setting_value;
    },

    async saveSettings(key, value) {
      const sb = getSupabase();
      if (!sb) return { error: 'Not configured' };
      return await sb.from('admin_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
    },

    async getSMSLog(limit = 100) {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from('sms_log').select('*').order('sent_at', { ascending: false }).limit(limit);
      return data || [];
    },

    // Dashboard stats
    async getStats() {
      const sb = getSupabase();
      if (!sb) return {};
      const [users, properties, payments, funding] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('properties').select('id', { count: 'exact', head: true }),
        sb.from('payments').select('amount').eq('status', 'completed'),
        sb.from('funding_applications').select('id', { count: 'exact', head: true })
      ]);
      const totalRevenue = (payments.data || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      return {
        totalUsers: users.count || 0,
        totalProperties: properties.count || 0,
        totalRevenue,
        totalFundingApps: funding.count || 0
      };
    }
  }
};

// ============================================================================
// REALTIME SUBSCRIPTIONS — Live updates across browser tabs
// ============================================================================

const RVRealtime = {
  // Subscribe to new messages
  onNewMessage(callback) {
    const sb = getSupabase();
    if (!sb) return null;
    return sb.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        callback(payload.new);
      })
      .subscribe();
  },

  // Subscribe to payment updates
  onPaymentUpdate(callback) {
    const sb = getSupabase();
    if (!sb) return null;
    return sb.channel('payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
        callback(payload);
      })
      .subscribe();
  },

  // Subscribe to maintenance request updates
  onMaintenanceUpdate(callback) {
    const sb = getSupabase();
    if (!sb) return null;
    return sb.channel('maintenance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, payload => {
        callback(payload);
      })
      .subscribe();
  },

  // Unsubscribe all
  removeAll() {
    const sb = getSupabase();
    if (!sb) return;
    sb.removeAllChannels();
  }
};
