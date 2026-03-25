// ============================================================================
// 3120 Life — Data Layer
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

  /** Get the current user's workspace_id (cached after first call) */
  _wsCache: null,
  async _workspaceId() {
    if (this._wsCache) return this._wsCache;
    if (!this._useSupabase()) return null;
    if (typeof Workspace !== 'undefined' && Workspace.getActiveId) {
      this._wsCache = await Workspace.getActiveId();
      return this._wsCache;
    }
    // Fallback: read from profile
    const profile = await RVAuth.getProfile();
    this._wsCache = profile?.workspace_id || null;
    return this._wsCache;
  },

  /** Seed default access templates for localStorage mode */
  _seedTemplates() {
    var templates = [
      { id:'at_loan', role:'loan_officer', name:'Standard SBA Loan Package', description:'Revenue, expenses, cash flow, owner statements, license verification',
        data_spec:{ accounting_entries:['amount','entry_date','category','type'], owner_statements:['period','total_income','total_expense','net'], payments:['amount','date','status'], properties:['address','value','units'], profile:['business_name','business_type','state','license_verified'] }},
      { id:'at_ins', role:'insurance_agent', name:'Basic P&C Insurance Quote', description:'Business profile, properties/assets, revenue range, current policies',
        data_spec:{ profile:['business_name','business_type','state','employee_count'], properties:['address','value','units','type'], accounting_entries:['amount','category','type'] }},
      { id:'at_acct', role:'accountant', name:'Full Bookkeeping Access', description:'Accounting entries, payments, owner statements, receipts',
        data_spec:{ accounting_entries:'*', payments:'*', owner_statements:'*', documents:['name','type','created_at'], properties:['address','units'] }},
      { id:'at_atty', role:'attorney', name:'Legal Review Package', description:'Leases, eviction cases, documents, property details',
        data_spec:{ leases:'*', eviction_cases:'*', documents:'*', properties:['address','units','type'], tenants:['name','lease_status'] }},
      { id:'at_mktg', role:'marketing_agency', name:'Marketing Data Package', description:'Business profile, listings, properties, review data',
        data_spec:{ profile:['business_name','business_type','state','website'], listings:'*', properties:['address','type','photos'] }},
      { id:'at_book', role:'bookkeeper', name:'Monthly Bookkeeping Access', description:'Accounting entries, payments, bank transactions',
        data_spec:{ accounting_entries:'*', payments:'*', owner_statements:['period','total_income','total_expense'] }},
      { id:'at_appr', role:'appraiser', name:'Property Appraisal Package', description:'Property details, recent transactions',
        data_spec:{ properties:'*', accounting_entries:['amount','category','entry_date'], documents:['name','type'] }},
      { id:'at_insp', role:'inspector', name:'Inspection Package', description:'Property details, maintenance history',
        data_spec:{ properties:'*', maintenance_requests:'*', documents:['name','type','created_at'] }}
    ];
    localStorage.setItem('rv_access_templates', JSON.stringify(templates));
    return templates;
  },

  /** Add workspace_id to a record before insert */
  async _stampWorkspace(record) {
    const wsId = await this._workspaceId();
    if (wsId) record.workspace_id = wsId;
    return record;
  },

  /** Add workspace_id filter to a query */
  async _scopeQuery(query) {
    const wsId = await this._workspaceId();
    if (wsId) return query.eq('workspace_id', wsId);
    return query;
  },

  /** Clear workspace cache (call on workspace switch) */
  clearWorkspaceCache() {
    this._wsCache = null;
  },

  // ─── PROPERTIES ──────────────────────────────────────────────────────

  async getProperties() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('properties').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
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
      await this._stampWorkspace(property);
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
      let query = sb.from('leases').select('*, properties(address, city, state)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
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
        await this._stampWorkspace(lease);
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
      let query = sb.from('payments').select('*, properties(address)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_rent_ledger') || '[]');
  },

  async recordPayment(payment) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(payment);
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
      let query = sb.from('accounting_entries').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.order('entry_date', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_accounting') || '[]');
  },

  async saveAccountingEntry(entry) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      entry.owner_id = user.id;
      await this._stampWorkspace(entry);
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
      let query = sb.from('maintenance_requests').select('*, properties(address)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('submitted_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_maintenance_requests') || '[]');
  },

  async saveMaintenanceRequest(request) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      await this._stampWorkspace(request);
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
      let query = sb.from('messages').select('*, sender:from_id(first_name, last_name, email)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_messages') || '[]');
  },

  async sendMessage(message) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      message.from_id = user.id;
      await this._stampWorkspace(message);
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
      let query = sb.from('ai_conversations').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_chat_inbox') || '[]');
  },

  // ─── MANAGEMENT PROFILE ─────────────────────────────────────────────

  async getManagementProfile(ownerId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('management_profiles').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.single();
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
      await this._stampWorkspace(profile);
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
      let query = sb.from('applicants').select('*, properties(address)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('applied_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_applicants') || '[]');
  },

  async saveApplicant(applicant) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      applicant.landlord_id = user.id;
      await this._stampWorkspace(applicant);
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
      let query = sb.from('documents').select('*');
      query = await this._scopeQuery(query);
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
      let query = sb.from('eviction_cases').select('*, eviction_notices(*)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_ev_cases') || '[]');
  },

  async saveEvictionCase(evCase) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      evCase.landlord_id = user.id;
      await this._stampWorkspace(evCase);
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
      let query = sb.from('funding_applications').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_funding_applications') || '[]');
  },

  async saveFundingApplication(app) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(app);
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
      let query = sb.from('referrals').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_referrals') || '[]');
  },

  async saveReferral(referral) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      referral.referrer_id = user.id;
      await this._stampWorkspace(referral);
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
      await this._stampWorkspace(vendor);
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

  // ─── PROJECTS (Construction / Trades) ──────────────────────────────

  async getProjects(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('projects').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.trade)  query = query.eq('trade', filters.trade);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let projects = JSON.parse(localStorage.getItem('rv_projects') || '[]');
    if (filters.status) projects = projects.filter(p => p.status === filters.status);
    if (filters.trade)  projects = projects.filter(p => p.trade === filters.trade);
    return projects;
  },

  async getProject(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data } = await sb.from('projects').select('*').eq('id', id).single();
      return data;
    }
    const projects = JSON.parse(localStorage.getItem('rv_projects') || '[]');
    return projects.find(p => p.id === id) || null;
  },

  async saveProject(project) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(project);
      if (project.id) {
        project.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('projects').update(project).eq('id', project.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        project.created_by = user.id;
        const { data, error } = await sb.from('projects').insert(project).select().single();
        return { data, error };
      }
    }
    const projects = JSON.parse(localStorage.getItem('rv_projects') || '[]');
    if (project.id) {
      const idx = projects.findIndex(p => p.id === project.id);
      project.updated_at = new Date().toISOString();
      if (idx >= 0) projects[idx] = project; else projects.push(project);
    } else {
      project.id = 'proj_' + Date.now();
      project.created_at = new Date().toISOString();
      project.updated_at = project.created_at;
      projects.push(project);
    }
    localStorage.setItem('rv_projects', JSON.stringify(projects));
    return { data: project, error: null };
  },

  async deleteProject(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('projects').delete().eq('id', id);
    }
    let projects = JSON.parse(localStorage.getItem('rv_projects') || '[]');
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('rv_projects', JSON.stringify(projects));
    // Cascade: remove tasks + time entries
    let tasks = JSON.parse(localStorage.getItem('rv_project_tasks') || '[]');
    tasks = tasks.filter(t => t.project_id !== id);
    localStorage.setItem('rv_project_tasks', JSON.stringify(tasks));
    let entries = JSON.parse(localStorage.getItem('rv_time_entries') || '[]');
    entries = entries.filter(e => e.project_id !== id);
    localStorage.setItem('rv_time_entries', JSON.stringify(entries));
    return { error: null };
  },

  // ─── PROJECT TASKS ────────────────────────────────────────────────────

  async getProjectTasks(projectId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('project_tasks').select('*').eq('project_id', projectId);
      const { data } = await query.order('sort_order', { ascending: true });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_project_tasks') || '[]')
      .filter(t => t.project_id === projectId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  },

  async saveProjectTask(task) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(task);
      if (task.id) {
        task.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('project_tasks').update(task).eq('id', task.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('project_tasks').insert(task).select().single();
        return { data, error };
      }
    }
    const tasks = JSON.parse(localStorage.getItem('rv_project_tasks') || '[]');
    if (task.id) {
      const idx = tasks.findIndex(t => t.id === task.id);
      task.updated_at = new Date().toISOString();
      if (idx >= 0) tasks[idx] = task; else tasks.push(task);
    } else {
      task.id = 'ptask_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      task.created_at = new Date().toISOString();
      task.updated_at = task.created_at;
      tasks.push(task);
    }
    localStorage.setItem('rv_project_tasks', JSON.stringify(tasks));
    return { data: task, error: null };
  },

  async deleteProjectTask(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('project_tasks').delete().eq('id', id);
    }
    let tasks = JSON.parse(localStorage.getItem('rv_project_tasks') || '[]');
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('rv_project_tasks', JSON.stringify(tasks));
    return { error: null };
  },

  // ─── TIME ENTRIES (Construction / Trades) ─────────────────────────────

  async getTimeEntries(projectId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('project_time_entries').select('*');
      if (projectId) query = query.eq('project_id', projectId);
      else query = await this._scopeQuery(query);
      const { data } = await query.order('clock_in', { ascending: false });
      return data || [];
    }
    let entries = JSON.parse(localStorage.getItem('rv_time_entries') || '[]');
    if (projectId) entries = entries.filter(e => e.project_id === projectId);
    return entries.sort((a, b) => new Date(b.clock_in) - new Date(a.clock_in));
  },

  async saveTimeEntry(entry) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(entry);
      if (entry.id) {
        const { data, error } = await sb.from('project_time_entries').update(entry).eq('id', entry.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        entry.user_id = user.id;
        const { data, error } = await sb.from('project_time_entries').insert(entry).select().single();
        return { data, error };
      }
    }
    const entries = JSON.parse(localStorage.getItem('rv_time_entries') || '[]');
    if (entry.id) {
      const idx = entries.findIndex(e => e.id === entry.id);
      if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    } else {
      entry.id = 'time_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      entry.created_at = new Date().toISOString();
      entries.push(entry);
    }
    localStorage.setItem('rv_time_entries', JSON.stringify(entries));
    return { data: entry, error: null };
  },

  async deleteTimeEntry(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('project_time_entries').delete().eq('id', id);
    }
    let entries = JSON.parse(localStorage.getItem('rv_time_entries') || '[]');
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem('rv_time_entries', JSON.stringify(entries));
    return { error: null };
  },

  /** Get the currently-running time entry (clock_out === null) for the current user */
  async getActiveTimer() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('project_time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .limit(1)
        .single();
      return data;
    }
    const entries = JSON.parse(localStorage.getItem('rv_time_entries') || '[]');
    return entries.find(e => !e.clock_out) || null;
  },

  // ─── MATTERS (Attorney) ─────────────────────────────────────────────

  async getMatters(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('matters').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.matter_type) query = query.eq('matter_type', filters.matter_type);
      if (filters.client_name) query = query.ilike('client_name', `%${filters.client_name}%`);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let matters = JSON.parse(localStorage.getItem('rv_matters') || '[]');
    if (filters.status) matters = matters.filter(m => m.status === filters.status);
    if (filters.matter_type) matters = matters.filter(m => m.matter_type === filters.matter_type);
    if (filters.client_name) matters = matters.filter(m =>
      m.client_name.toLowerCase().includes(filters.client_name.toLowerCase()));
    return matters;
  },

  async getMatter(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data } = await sb.from('matters').select('*').eq('id', id).single();
      return data;
    }
    const matters = JSON.parse(localStorage.getItem('rv_matters') || '[]');
    return matters.find(m => m.id === id) || null;
  },

  async saveMatter(matter) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(matter);
      if (matter.id) {
        matter.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('matters').update(matter).eq('id', matter.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        matter.created_by = user.id;
        const { data, error } = await sb.from('matters').insert(matter).select().single();
        return { data, error };
      }
    }
    const matters = JSON.parse(localStorage.getItem('rv_matters') || '[]');
    if (matter.id) {
      const idx = matters.findIndex(m => m.id === matter.id);
      matter.updated_at = new Date().toISOString();
      if (idx >= 0) matters[idx] = matter; else matters.push(matter);
    } else {
      matter.id = 'mat_' + Date.now();
      matter.created_at = new Date().toISOString();
      matter.updated_at = matter.created_at;
      matters.push(matter);
    }
    localStorage.setItem('rv_matters', JSON.stringify(matters));
    return { data: matter, error: null };
  },

  async deleteMatter(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('matters').delete().eq('id', id);
    }
    let matters = JSON.parse(localStorage.getItem('rv_matters') || '[]');
    matters = matters.filter(m => m.id !== id);
    localStorage.setItem('rv_matters', JSON.stringify(matters));
    // Cascade: remove deadlines + time entries
    let deadlines = JSON.parse(localStorage.getItem('rv_matter_deadlines') || '[]');
    deadlines = deadlines.filter(d => d.matter_id !== id);
    localStorage.setItem('rv_matter_deadlines', JSON.stringify(deadlines));
    let entries = JSON.parse(localStorage.getItem('rv_matter_time_entries') || '[]');
    entries = entries.filter(e => e.matter_id !== id);
    localStorage.setItem('rv_matter_time_entries', JSON.stringify(entries));
    return { error: null };
  },

  /** Conflict check: search for opposing party / client across all matters */
  async checkConflict(partyName) {
    if (!partyName || partyName.trim().length < 2) return [];
    const all = await this.getMatters();
    const q = partyName.toLowerCase().trim();
    return all.filter(m =>
      (m.client_name && m.client_name.toLowerCase().includes(q)) ||
      (m.opposing_party && m.opposing_party.toLowerCase().includes(q)) ||
      (m.opposing_counsel && m.opposing_counsel.toLowerCase().includes(q))
    );
  },

  // ─── MATTER DEADLINES ─────────────────────────────────────────────

  async getMatterDeadlines(matterId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('matter_deadlines').select('*');
      if (matterId) query = query.eq('matter_id', matterId);
      else query = await this._scopeQuery(query);
      const { data } = await query.order('deadline_date', { ascending: true });
      return data || [];
    }
    let deadlines = JSON.parse(localStorage.getItem('rv_matter_deadlines') || '[]');
    if (matterId) deadlines = deadlines.filter(d => d.matter_id === matterId);
    return deadlines.sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
  },

  async saveMatterDeadline(deadline) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(deadline);
      if (deadline.id) {
        const { data, error } = await sb.from('matter_deadlines').update(deadline).eq('id', deadline.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('matter_deadlines').insert(deadline).select().single();
        return { data, error };
      }
    }
    const deadlines = JSON.parse(localStorage.getItem('rv_matter_deadlines') || '[]');
    if (deadline.id) {
      const idx = deadlines.findIndex(d => d.id === deadline.id);
      if (idx >= 0) deadlines[idx] = deadline; else deadlines.push(deadline);
    } else {
      deadline.id = 'dl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      deadline.created_at = new Date().toISOString();
      deadlines.push(deadline);
    }
    localStorage.setItem('rv_matter_deadlines', JSON.stringify(deadlines));
    return { data: deadline, error: null };
  },

  async deleteMatterDeadline(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('matter_deadlines').delete().eq('id', id);
    }
    let deadlines = JSON.parse(localStorage.getItem('rv_matter_deadlines') || '[]');
    deadlines = deadlines.filter(d => d.id !== id);
    localStorage.setItem('rv_matter_deadlines', JSON.stringify(deadlines));
    return { error: null };
  },

  // ─── MATTER TIME ENTRIES (billable hours) ──────────────────────────

  async getMatterTimeEntries(matterId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('matter_time_entries').select('*');
      if (matterId) query = query.eq('matter_id', matterId);
      else query = await this._scopeQuery(query);
      const { data } = await query.order('date', { ascending: false });
      return data || [];
    }
    let entries = JSON.parse(localStorage.getItem('rv_matter_time_entries') || '[]');
    if (matterId) entries = entries.filter(e => e.matter_id === matterId);
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async saveMatterTimeEntry(entry) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(entry);
      if (!entry.amount && entry.hours && entry.rate) {
        entry.amount = parseFloat(entry.hours) * parseFloat(entry.rate);
      }
      if (entry.id) {
        const { data, error } = await sb.from('matter_time_entries').update(entry).eq('id', entry.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        entry.user_id = user.id;
        const { data, error } = await sb.from('matter_time_entries').insert(entry).select().single();
        return { data, error };
      }
    }
    if (!entry.amount && entry.hours && entry.rate) {
      entry.amount = parseFloat(entry.hours) * parseFloat(entry.rate);
    }
    const entries = JSON.parse(localStorage.getItem('rv_matter_time_entries') || '[]');
    if (entry.id) {
      const idx = entries.findIndex(e => e.id === entry.id);
      if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    } else {
      entry.id = 'mte_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      entry.created_at = new Date().toISOString();
      entries.push(entry);
    }
    localStorage.setItem('rv_matter_time_entries', JSON.stringify(entries));
    return { data: entry, error: null };
  },

  async deleteMatterTimeEntry(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('matter_time_entries').delete().eq('id', id);
    }
    let entries = JSON.parse(localStorage.getItem('rv_matter_time_entries') || '[]');
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem('rv_matter_time_entries', JSON.stringify(entries));
    return { error: null };
  },

  /** Get the active matter timer (timer_end === null) */
  async getActiveMatterTimer() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const user = await RVAuth.getUser();
      const { data } = await sb.from('matter_time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('timer_end', null)
        .not('timer_start', 'is', null)
        .limit(1)
        .single();
      return data;
    }
    const entries = JSON.parse(localStorage.getItem('rv_matter_time_entries') || '[]');
    return entries.find(e => e.timer_start && !e.timer_end) || null;
  },

  // ─── LOANS (Lending) ────────────────────────────────────────────────

  async getLoans(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('loans').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.loan_type) query = query.eq('loan_type', filters.loan_type);
      if (filters.borrower_name) query = query.ilike('borrower_name', `%${filters.borrower_name}%`);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let loans = JSON.parse(localStorage.getItem('rv_loans') || '[]');
    if (filters.status) loans = loans.filter(l => l.status === filters.status);
    if (filters.loan_type) loans = loans.filter(l => l.loan_type === filters.loan_type);
    if (filters.borrower_name) loans = loans.filter(l =>
      l.borrower_name.toLowerCase().includes(filters.borrower_name.toLowerCase()));
    return loans;
  },

  async getLoan(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      const { data } = await sb.from('loans').select('*').eq('id', id).single();
      return data;
    }
    const loans = JSON.parse(localStorage.getItem('rv_loans') || '[]');
    return loans.find(l => l.id === id) || null;
  },

  async saveLoan(loan) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(loan);
      if (loan.id) {
        loan.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('loans').update(loan).eq('id', loan.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        loan.created_by = user.id;
        const { data, error } = await sb.from('loans').insert(loan).select().single();
        return { data, error };
      }
    }
    const loans = JSON.parse(localStorage.getItem('rv_loans') || '[]');
    if (loan.id) {
      const idx = loans.findIndex(l => l.id === loan.id);
      loan.updated_at = new Date().toISOString();
      if (idx >= 0) loans[idx] = loan; else loans.push(loan);
    } else {
      loan.id = 'loan_' + Date.now();
      loan.created_at = new Date().toISOString();
      loan.updated_at = loan.created_at;
      loans.push(loan);
    }
    localStorage.setItem('rv_loans', JSON.stringify(loans));
    return { data: loan, error: null };
  },

  async deleteLoan(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('loans').delete().eq('id', id);
    }
    let loans = JSON.parse(localStorage.getItem('rv_loans') || '[]');
    loans = loans.filter(l => l.id !== id);
    localStorage.setItem('rv_loans', JSON.stringify(loans));
    // Cascade: remove loan docs
    let docs = JSON.parse(localStorage.getItem('rv_loan_documents') || '[]');
    docs = docs.filter(d => d.loan_id !== id);
    localStorage.setItem('rv_loan_documents', JSON.stringify(docs));
    return { error: null };
  },

  // ─── LOAN DOCUMENTS ───────────────────────────────────────────────

  async getLoanDocuments(loanId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('loan_documents').select('*');
      if (loanId) query = query.eq('loan_id', loanId);
      else query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: true });
      return data || [];
    }
    let docs = JSON.parse(localStorage.getItem('rv_loan_documents') || '[]');
    if (loanId) docs = docs.filter(d => d.loan_id === loanId);
    return docs;
  },

  async saveLoanDocument(doc) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(doc);
      if (doc.id) {
        const { data, error } = await sb.from('loan_documents').update(doc).eq('id', doc.id).select().single();
        return { data, error };
      } else {
        const { data, error } = await sb.from('loan_documents').insert(doc).select().single();
        return { data, error };
      }
    }
    const docs = JSON.parse(localStorage.getItem('rv_loan_documents') || '[]');
    if (doc.id) {
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx >= 0) docs[idx] = doc; else docs.push(doc);
    } else {
      doc.id = 'ldoc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      doc.created_at = new Date().toISOString();
      docs.push(doc);
    }
    localStorage.setItem('rv_loan_documents', JSON.stringify(docs));
    return { data: doc, error: null };
  },

  async deleteLoanDocument(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('loan_documents').delete().eq('id', id);
    }
    let docs = JSON.parse(localStorage.getItem('rv_loan_documents') || '[]');
    docs = docs.filter(d => d.id !== id);
    localStorage.setItem('rv_loan_documents', JSON.stringify(docs));
    return { error: null };
  },

  /** Seed default document checklist for a loan type */
  seedLoanDocChecklist(loanId, loanType) {
    const CHECKLISTS = {
      hard_money: ['Property Photos','Purchase Contract','Proof of Funds','Scope of Work','Entity Docs (LLC/Corp)','Insurance Binder','Title Report','Appraisal/BPO'],
      fix_and_flip: ['Purchase Contract','Scope of Work & Budget','Contractor Bids','Property Photos','Proof of Funds/Down Payment','Entity Docs','Experience Resume (Rehab Track Record)','Insurance Binder','Title Report','ARV Appraisal'],
      bridge: ['Purchase Contract','Existing Mortgage Statement','Property Financials','Bank Statements (3 months)','Entity Docs','Title Report','Insurance Binder','Exit Strategy Letter'],
      conventional: ['Pay Stubs (2 months)','W-2s (2 years)','Tax Returns (2 years)','Bank Statements (2 months)','Photo ID','Purchase Contract','Gift Letter (if applicable)','HOA Docs (if applicable)','Appraisal','Title Report','Insurance Binder','Employment Verification'],
      fha: ['Pay Stubs (2 months)','W-2s (2 years)','Tax Returns (2 years)','Bank Statements (2 months)','Photo ID','Purchase Contract','Gift Letter (if applicable)','Appraisal (FHA)','Title Report','Insurance Binder','Employment Verification','Credit Explanation Letters'],
      commercial: ['Business Tax Returns (3 years)','Personal Tax Returns (2 years)','Rent Roll','Property Financials/P&L','Bank Statements (3 months)','Entity Docs','Appraisal','Environmental Report (Phase I)','Title Report','Insurance Binder','Lease Copies']
    };
    const defaultList = ['Application Form','Photo ID','Proof of Income','Bank Statements','Purchase Contract','Appraisal','Title Report','Insurance Binder'];
    const items = CHECKLISTS[loanType] || defaultList;
    return items.map(function(name) {
      return { loan_id: loanId, doc_name: name, doc_category: 'required', status: 'missing' };
    });
  },

  // ─── PROPOSALS (Marketing/Consultant) ───────────────────────────────

  async getProposals(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('proposals').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.proposal_type) query = query.eq('proposal_type', filters.proposal_type);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let proposals = JSON.parse(localStorage.getItem('rv_proposals') || '[]');
    if (filters.status) proposals = proposals.filter(p => p.status === filters.status);
    if (filters.proposal_type) proposals = proposals.filter(p => p.proposal_type === filters.proposal_type);
    return proposals;
  },

  async saveProposal(proposal) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(proposal);
      if (proposal.id) {
        proposal.updated_at = new Date().toISOString();
        const { data, error } = await sb.from('proposals').update(proposal).eq('id', proposal.id).select().single();
        return { data, error };
      } else {
        const user = await RVAuth.getUser();
        proposal.created_by = user.id;
        const { data, error } = await sb.from('proposals').insert(proposal).select().single();
        return { data, error };
      }
    }
    const proposals = JSON.parse(localStorage.getItem('rv_proposals') || '[]');
    if (proposal.id) {
      const idx = proposals.findIndex(p => p.id === proposal.id);
      proposal.updated_at = new Date().toISOString();
      if (idx >= 0) proposals[idx] = proposal; else proposals.push(proposal);
    } else {
      proposal.id = 'prop_' + Date.now();
      proposal.created_at = new Date().toISOString();
      proposal.updated_at = proposal.created_at;
      proposals.push(proposal);
    }
    localStorage.setItem('rv_proposals', JSON.stringify(proposals));
    return { data: proposal, error: null };
  },

  async deleteProposal(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('proposals').delete().eq('id', id);
    }
    let proposals = JSON.parse(localStorage.getItem('rv_proposals') || '[]');
    proposals = proposals.filter(p => p.id !== id);
    localStorage.setItem('rv_proposals', JSON.stringify(proposals));
    return { error: null };
  },

  // ─── INSURANCE POLICIES ────────────────────────────────────────────

  async getInsurancePolicies(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('insurance_policies').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.policy_type) query = query.eq('policy_type', filters.policy_type);
      if (filters.search) {
        query = query.or(`client_name.ilike.%${filters.search}%,policy_number.ilike.%${filters.search}%,carrier.ilike.%${filters.search}%`);
      }
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_policies') || '[]');
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.policy_type) rows = rows.filter(r => r.policy_type === filters.policy_type);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r =>
        (r.client_name || '').toLowerCase().includes(q) ||
        (r.policy_number || '').toLowerCase().includes(q) ||
        (r.carrier || '').toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  },

  async saveInsurancePolicy(policy) {
    // Auto-calc commission amount
    if (policy.premium && policy.commission_rate) {
      policy.commission_amount = +(parseFloat(policy.premium) * parseFloat(policy.commission_rate) / 100).toFixed(2);
    }
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (policy.id) {
        policy.updated_at = new Date().toISOString();
        const { data } = await sb.from('insurance_policies').upsert(await this._stampWorkspace(policy)).select().single();
        return data;
      }
      const { data } = await sb.from('insurance_policies').insert(await this._stampWorkspace(policy)).select().single();
      return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_policies') || '[]');
    if (policy.id) {
      const idx = rows.findIndex(r => r.id === policy.id);
      if (idx >= 0) { Object.assign(rows[idx], policy); rows[idx].updated_at = new Date().toISOString(); }
    } else {
      policy.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      policy.created_at = new Date().toISOString();
      policy.updated_at = policy.created_at;
      rows.push(policy);
    }
    localStorage.setItem('rv_insurance_policies', JSON.stringify(rows));
    return policy;
  },

  async deleteInsurancePolicy(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await sb.from('insurance_commissions').delete().eq('policy_id', id);
      return await sb.from('insurance_policies').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_policies') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_insurance_policies', JSON.stringify(rows));
    // Also remove commissions for this policy
    let comms = JSON.parse(localStorage.getItem('rv_insurance_commissions') || '[]');
    comms = comms.filter(c => c.policy_id !== id);
    localStorage.setItem('rv_insurance_commissions', JSON.stringify(comms));
    return { error: null };
  },

  async getInsuranceCommissions(policyId) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('insurance_commissions').select('*').eq('policy_id', policyId);
      const { data } = await query.order('earned_date', { ascending: false });
      return data || [];
    }
    const rows = JSON.parse(localStorage.getItem('rv_insurance_commissions') || '[]');
    return rows.filter(c => c.policy_id === policyId);
  },

  async saveInsuranceCommission(comm) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (comm.id) {
        const { data } = await sb.from('insurance_commissions').upsert(await this._stampWorkspace(comm)).select().single();
        return data;
      }
      const { data } = await sb.from('insurance_commissions').insert(await this._stampWorkspace(comm)).select().single();
      return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_commissions') || '[]');
    if (comm.id) {
      const idx = rows.findIndex(r => r.id === comm.id);
      if (idx >= 0) Object.assign(rows[idx], comm);
    } else {
      comm.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      comm.created_at = new Date().toISOString();
      rows.push(comm);
    }
    localStorage.setItem('rv_insurance_commissions', JSON.stringify(rows));
    return comm;
  },

  async deleteInsuranceCommission(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('insurance_commissions').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_commissions') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_insurance_commissions', JSON.stringify(rows));
    return { error: null };
  },

  // ─── INSURANCE QUOTE COMPARISONS ─────────────────────────────────

  async getInsuranceQuotes() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('insurance_quote_requests').select('*, insurance_quotes(*)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_insurance_quotes') || '[]');
  },

  async saveInsuranceQuote(request) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(request);
      const quotes = request.quotes || [];
      delete request.quotes;
      const { data } = await sb.from('insurance_quote_requests').upsert(request).select().single();
      if (data && quotes.length) {
        const withReqId = quotes.map(q => ({ ...q, request_id: data.id, workspace_id: data.workspace_id }));
        await sb.from('insurance_quotes').upsert(withReqId);
      }
      return { data, error: null };
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_quotes') || '[]');
    if (!request.id) request.id = 'qr_' + Date.now();
    const idx = rows.findIndex(r => r.id === request.id);
    if (idx >= 0) rows[idx] = request; else rows.unshift(request);
    localStorage.setItem('rv_insurance_quotes', JSON.stringify(rows));
    return { data: request, error: null };
  },

  async deleteInsuranceQuote(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('insurance_quote_requests').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_insurance_quotes') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_insurance_quotes', JSON.stringify(rows));
    return { error: null };
  },

  // ─── SPA APPOINTMENTS ──────────────────────────────────────────────

  async getSpaAppointments(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('spa_appointments').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.staff_name) query = query.eq('staff_name', filters.staff_name);
      if (filters.date_from) query = query.gte('start_time', filters.date_from);
      if (filters.date_to) query = query.lte('start_time', filters.date_to);
      if (filters.search) {
        query = query.or(`client_name.ilike.%${filters.search}%,service.ilike.%${filters.search}%`);
      }
      const { data } = await query.order('start_time', { ascending: true });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_appointments') || '[]');
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.staff_name) rows = rows.filter(r => r.staff_name === filters.staff_name);
    if (filters.date_from) rows = rows.filter(r => r.start_time >= filters.date_from);
    if (filters.date_to) rows = rows.filter(r => r.start_time <= filters.date_to);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r =>
        (r.client_name || '').toLowerCase().includes(q) ||
        (r.service || '').toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  },

  async saveSpaAppointment(appt) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (appt.id) {
        appt.updated_at = new Date().toISOString();
        const { data } = await sb.from('spa_appointments').upsert(await this._stampWorkspace(appt)).select().single();
        return data;
      }
      const { data } = await sb.from('spa_appointments').insert(await this._stampWorkspace(appt)).select().single();
      return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_appointments') || '[]');
    if (appt.id) {
      const idx = rows.findIndex(r => r.id === appt.id);
      if (idx >= 0) { Object.assign(rows[idx], appt); rows[idx].updated_at = new Date().toISOString(); }
    } else {
      appt.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      appt.created_at = new Date().toISOString();
      appt.updated_at = appt.created_at;
      rows.push(appt);
    }
    localStorage.setItem('rv_spa_appointments', JSON.stringify(rows));
    return appt;
  },

  async deleteSpaAppointment(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('spa_appointments').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_appointments') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_spa_appointments', JSON.stringify(rows));
    return { error: null };
  },

  // ─── SPA INVENTORY ────────────────────────────────────────────────

  async getSpaInventory(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('spa_inventory').select('*');
      query = await this._scopeQuery(query);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.low_stock) query = query.lte('quantity', sb.raw('reorder_threshold'));
      if (filters.search) {
        query = query.or(`item_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }
      const { data } = await query.order('item_name', { ascending: true });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_inventory') || '[]');
    if (filters.category) rows = rows.filter(r => r.category === filters.category);
    if (filters.low_stock) rows = rows.filter(r => parseFloat(r.quantity) <= parseFloat(r.reorder_threshold));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r =>
        (r.item_name || '').toLowerCase().includes(q) ||
        (r.sku || '').toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
  },

  async saveSpaInventoryItem(item) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (item.id) {
        item.updated_at = new Date().toISOString();
        const { data } = await sb.from('spa_inventory').upsert(await this._stampWorkspace(item)).select().single();
        return data;
      }
      const { data } = await sb.from('spa_inventory').insert(await this._stampWorkspace(item)).select().single();
      return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_inventory') || '[]');
    if (item.id) {
      const idx = rows.findIndex(r => r.id === item.id);
      if (idx >= 0) { Object.assign(rows[idx], item); rows[idx].updated_at = new Date().toISOString(); }
    } else {
      item.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      item.created_at = new Date().toISOString();
      item.updated_at = item.created_at;
      rows.push(item);
    }
    localStorage.setItem('rv_spa_inventory', JSON.stringify(rows));
    return item;
  },

  async deleteSpaInventoryItem(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('spa_inventory').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_spa_inventory') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_spa_inventory', JSON.stringify(rows));
    return { error: null };
  },

  // ─── NONPROFIT: DONORS ─────────────────────────────────────────────

  async getDonors(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('donor_records').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.donor_type) query = query.eq('donor_type', filters.donor_type);
      if (filters.search) query = query.or(`donor_name.ilike.%${filters.search}%,donor_email.ilike.%${filters.search}%,donor_company.ilike.%${filters.search}%`);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_donors') || '[]');
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.donor_type) rows = rows.filter(r => r.donor_type === filters.donor_type);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(r => (r.donor_name||'').toLowerCase().includes(q) || (r.donor_company||'').toLowerCase().includes(q));
    }
    return rows.sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
  },

  async saveDonor(donor) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (donor.id) { donor.updated_at = new Date().toISOString(); const { data } = await sb.from('donor_records').upsert(await this._stampWorkspace(donor)).select().single(); return data; }
      const { data } = await sb.from('donor_records').insert(await this._stampWorkspace(donor)).select().single(); return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_donors') || '[]');
    if (donor.id) { const idx = rows.findIndex(r => r.id === donor.id); if (idx >= 0) { Object.assign(rows[idx], donor); rows[idx].updated_at = new Date().toISOString(); } }
    else { donor.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); donor.created_at = new Date().toISOString(); donor.updated_at = donor.created_at; rows.push(donor); }
    localStorage.setItem('rv_donors', JSON.stringify(rows)); return donor;
  },

  async deleteDonor(id) {
    if (this._useSupabase()) { const sb = getSupabase(); await sb.from('donations').delete().eq('donor_id', id); return await sb.from('donor_records').delete().eq('id', id); }
    let rows = JSON.parse(localStorage.getItem('rv_donors') || '[]'); rows = rows.filter(r => r.id !== id); localStorage.setItem('rv_donors', JSON.stringify(rows));
    let dons = JSON.parse(localStorage.getItem('rv_donations') || '[]'); dons = dons.filter(d => d.donor_id !== id); localStorage.setItem('rv_donations', JSON.stringify(dons));
    return { error: null };
  },

  // ─── NONPROFIT: DONATIONS ─────────────────────────────────────────

  async getDonations(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('donations').select('*');
      query = await this._scopeQuery(query);
      if (filters.donor_id) query = query.eq('donor_id', filters.donor_id);
      if (filters.fund_designation) query = query.eq('fund_designation', filters.fund_designation);
      const { data } = await query.order('donation_date', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_donations') || '[]');
    if (filters.donor_id) rows = rows.filter(r => r.donor_id === filters.donor_id);
    if (filters.fund_designation) rows = rows.filter(r => r.fund_designation === filters.fund_designation);
    return rows.sort((a,b) => (b.donation_date||'').localeCompare(a.donation_date||''));
  },

  async saveDonation(don) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (don.id) { const { data } = await sb.from('donations').upsert(await this._stampWorkspace(don)).select().single(); return data; }
      const { data } = await sb.from('donations').insert(await this._stampWorkspace(don)).select().single(); return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_donations') || '[]');
    if (don.id) { const idx = rows.findIndex(r => r.id === don.id); if (idx >= 0) Object.assign(rows[idx], don); }
    else { don.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); don.created_at = new Date().toISOString(); rows.push(don); }
    localStorage.setItem('rv_donations', JSON.stringify(rows));
    // Update donor totals
    if (don.donor_id) {
      let donors = JSON.parse(localStorage.getItem('rv_donors') || '[]');
      let allDons = JSON.parse(localStorage.getItem('rv_donations') || '[]').filter(d => d.donor_id === don.donor_id);
      let di = donors.findIndex(d => d.id === don.donor_id);
      if (di >= 0) {
        donors[di].total_donated = allDons.reduce((s,d) => s + (parseFloat(d.amount)||0), 0);
        donors[di].donation_count = allDons.length;
        donors[di].last_donation = don.donation_date || new Date().toISOString().split('T')[0];
        localStorage.setItem('rv_donors', JSON.stringify(donors));
      }
    }
    return don;
  },

  // ─── NONPROFIT: VOLUNTEER HOURS ───────────────────────────────────

  async getVolunteerHours(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('volunteer_hours').select('*');
      query = await this._scopeQuery(query);
      if (filters.search) query = query.or(`volunteer_name.ilike.%${filters.search}%,activity.ilike.%${filters.search}%`);
      const { data } = await query.order('volunteer_date', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_volunteer_hours') || '[]');
    if (filters.search) { const q = filters.search.toLowerCase(); rows = rows.filter(r => (r.volunteer_name||'').toLowerCase().includes(q) || (r.activity||'').toLowerCase().includes(q)); }
    return rows.sort((a,b) => (b.volunteer_date||'').localeCompare(a.volunteer_date||''));
  },

  async saveVolunteerHours(entry) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (entry.id) { const { data } = await sb.from('volunteer_hours').upsert(await this._stampWorkspace(entry)).select().single(); return data; }
      const { data } = await sb.from('volunteer_hours').insert(await this._stampWorkspace(entry)).select().single(); return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_volunteer_hours') || '[]');
    if (entry.id) { const idx = rows.findIndex(r => r.id === entry.id); if (idx >= 0) Object.assign(rows[idx], entry); }
    else { entry.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); entry.created_at = new Date().toISOString(); rows.push(entry); }
    localStorage.setItem('rv_volunteer_hours', JSON.stringify(rows)); return entry;
  },

  async deleteVolunteerHours(id) {
    if (this._useSupabase()) { const sb = getSupabase(); return await sb.from('volunteer_hours').delete().eq('id', id); }
    let rows = JSON.parse(localStorage.getItem('rv_volunteer_hours') || '[]'); rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_volunteer_hours', JSON.stringify(rows)); return { error: null };
  },

  // ─── NONPROFIT: GRANTS ────────────────────────────────────────────

  async getGrants(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('grant_tracking').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.search) query = query.or(`grant_name.ilike.%${filters.search}%,funder.ilike.%${filters.search}%`);
      const { data } = await query.order('deadline', { ascending: true });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_grants') || '[]');
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.search) { const q = filters.search.toLowerCase(); rows = rows.filter(r => (r.grant_name||'').toLowerCase().includes(q) || (r.funder||'').toLowerCase().includes(q)); }
    return rows.sort((a,b) => (a.deadline||'').localeCompare(b.deadline||''));
  },

  async saveGrant(grant) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      if (grant.id) { grant.updated_at = new Date().toISOString(); const { data } = await sb.from('grant_tracking').upsert(await this._stampWorkspace(grant)).select().single(); return data; }
      const { data } = await sb.from('grant_tracking').insert(await this._stampWorkspace(grant)).select().single(); return data;
    }
    let rows = JSON.parse(localStorage.getItem('rv_grants') || '[]');
    if (grant.id) { const idx = rows.findIndex(r => r.id === grant.id); if (idx >= 0) { Object.assign(rows[idx], grant); rows[idx].updated_at = new Date().toISOString(); } }
    else { grant.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); grant.created_at = new Date().toISOString(); grant.updated_at = grant.created_at; rows.push(grant); }
    localStorage.setItem('rv_grants', JSON.stringify(rows)); return grant;
  },

  async deleteGrant(id) {
    if (this._useSupabase()) { const sb = getSupabase(); return await sb.from('grant_tracking').delete().eq('id', id); }
    let rows = JSON.parse(localStorage.getItem('rv_grants') || '[]'); rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_grants', JSON.stringify(rows)); return { error: null };
  },

  // ─── PROFESSIONAL PROFILES ─────────────────────────────────────────

  async getProProfiles(filters = {}) {
    if (this._useSupabase()) {
      let q = this._supabase.from('professional_profiles').select('*').eq('is_active', true);
      if (filters.category) q = q.eq('category', filters.category);
      if (filters.location) q = q.eq('location', filters.location);
      if (filters.is_verified) q = q.eq('is_verified', true);
      q = q.order('rating', { ascending: false });
      return q;
    }
    let rows = JSON.parse(localStorage.getItem('rv_pro_profiles') || '[]');
    if (filters.category) rows = rows.filter(r => r.category === filters.category);
    if (filters.location) rows = rows.filter(r => r.location === filters.location);
    return { data: rows, error: null };
  },

  async saveProProfile(profile) {
    if (this._useSupabase()) {
      profile = this._stampWorkspace(profile);
      if (profile.id) {
        profile.updated_at = new Date().toISOString();
        return this._supabase.from('professional_profiles').upsert(profile).select().single();
      }
      return this._supabase.from('professional_profiles').insert(profile).select().single();
    }
    let rows = JSON.parse(localStorage.getItem('rv_pro_profiles') || '[]');
    if (profile.id) {
      const idx = rows.findIndex(r => r.id === profile.id);
      if (idx >= 0) { rows[idx] = { ...rows[idx], ...profile, updated_at: new Date().toISOString() }; }
      else { profile.created_at = new Date().toISOString(); rows.push(profile); }
    } else {
      profile.id = crypto.randomUUID();
      profile.created_at = new Date().toISOString();
      rows.push(profile);
    }
    localStorage.setItem('rv_pro_profiles', JSON.stringify(rows));
    return { data: profile, error: null };
  },

  async deleteProProfile(id) {
    if (this._useSupabase()) {
      return this._supabase.from('professional_profiles').delete().eq('id', id);
    }
    let rows = JSON.parse(localStorage.getItem('rv_pro_profiles') || '[]');
    rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_pro_profiles', JSON.stringify(rows));
    return { data: null, error: null };
  },

  // ─── LEADS (CRM Pipeline) ───────────────────────────────────────────

  async getLeads(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('leads').select('*')).order('created_at', { ascending: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.source) q = q.eq('source', filters.source);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_leads') || '[]');
    if (filters.status) items = items.filter(l => l.status === filters.status);
    if (filters.source) items = items.filter(l => l.source === filters.source);
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveLead(lead) {
    lead.updated_at = new Date().toISOString();
    if (this._useSupabase()) {
      const row = await this._stampWorkspace(lead);
      if (lead.id) { const { data } = await supabase.from('leads').update(row).eq('id', lead.id).select().single(); return data; }
      const { data } = await supabase.from('leads').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_leads') || '[]');
    if (lead.id) { items = items.map(l => l.id === lead.id ? { ...l, ...lead } : l); }
    else { lead.id = 'lead_' + Date.now(); lead.created_at = new Date().toISOString(); lead.business_id = 'demo_biz'; items.push(lead); }
    localStorage.setItem('rv_leads', JSON.stringify(items));
    return lead;
  },

  async deleteLead(id) {
    if (this._useSupabase()) { await supabase.from('leads').delete().eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_leads') || '[]');
    items = items.filter(l => l.id !== id);
    localStorage.setItem('rv_leads', JSON.stringify(items));
  },

  async getLeadActivities(leadId) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('lead_activities').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_lead_activities') || '[]');
    return items.filter(a => a.lead_id === leadId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveLeadActivity(activity) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('lead_activities').insert(activity).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_lead_activities') || '[]');
    activity.id = 'la_' + Date.now();
    activity.created_at = new Date().toISOString();
    items.push(activity);
    localStorage.setItem('rv_lead_activities', JSON.stringify(items));
    return activity;
  },

  // ─── SERVICES (Booking) ────────────────────────────────────────────

  async getServices(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('services').select('*'));
      if (filters.is_public !== undefined) q = q.eq('is_public', filters.is_public);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_services') || '[]');
    if (filters.is_public !== undefined) items = items.filter(s => s.is_public === filters.is_public);
    return items;
  },

  async saveService(svc) {
    if (this._useSupabase()) {
      const row = await this._stampWorkspace(svc);
      if (svc.id) { const { data } = await supabase.from('services').update(row).eq('id', svc.id).select().single(); return data; }
      const { data } = await supabase.from('services').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_services') || '[]');
    if (svc.id) { items = items.map(s => s.id === svc.id ? { ...s, ...svc } : s); }
    else { svc.id = 'svc_' + Date.now(); svc.created_at = new Date().toISOString(); svc.business_id = 'demo_biz'; items.push(svc); }
    localStorage.setItem('rv_services', JSON.stringify(items));
    return svc;
  },

  async deleteService(id) {
    if (this._useSupabase()) { await supabase.from('services').delete().eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_services') || '[]');
    localStorage.setItem('rv_services', JSON.stringify(items.filter(s => s.id !== id)));
  },

  // ─── APPOINTMENTS ──────────────────────────────────────────────────

  async getAppointments(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('appointments').select('*')).order('start_time', { ascending: true });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.date_from) q = q.gte('start_time', filters.date_from);
      if (filters.date_to) q = q.lte('start_time', filters.date_to);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_appointments') || '[]');
    if (filters.status) items = items.filter(a => a.status === filters.status);
    if (filters.date_from) items = items.filter(a => a.start_time >= filters.date_from);
    if (filters.date_to) items = items.filter(a => a.start_time <= filters.date_to);
    return items.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  },

  async saveAppointment(appt) {
    appt.updated_at = new Date().toISOString();
    if (this._useSupabase()) {
      const row = await this._stampWorkspace(appt);
      if (appt.id) { const { data } = await supabase.from('appointments').update(row).eq('id', appt.id).select().single(); return data; }
      const { data } = await supabase.from('appointments').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_appointments') || '[]');
    if (appt.id) { items = items.map(a => a.id === appt.id ? { ...a, ...appt } : a); }
    else { appt.id = 'appt_' + Date.now(); appt.created_at = new Date().toISOString(); appt.business_id = 'demo_biz'; items.push(appt); }
    localStorage.setItem('rv_appointments', JSON.stringify(items));
    return appt;
  },

  async deleteAppointment(id) {
    if (this._useSupabase()) { await supabase.from('appointments').delete().eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_appointments') || '[]');
    localStorage.setItem('rv_appointments', JSON.stringify(items.filter(a => a.id !== id)));
  },

  // ─── REVIEWS ───────────────────────────────────────────────────────

  async getReviews(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('reviews').select('*')).order('created_at', { ascending: false });
      if (filters.is_published !== undefined) q = q.eq('is_published', filters.is_published);
      if (filters.rating) q = q.gte('rating', filters.rating);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_reviews') || '[]');
    if (filters.is_published !== undefined) items = items.filter(r => r.is_published === filters.is_published);
    if (filters.rating) items = items.filter(r => r.rating >= filters.rating);
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveReview(review) {
    if (this._useSupabase()) {
      const row = await this._stampWorkspace(review);
      if (review.id) { const { data } = await supabase.from('reviews').update(row).eq('id', review.id).select().single(); return data; }
      const { data } = await supabase.from('reviews').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_reviews') || '[]');
    if (review.id) { items = items.map(r => r.id === review.id ? { ...r, ...review } : r); }
    else { review.id = 'rev_' + Date.now(); review.created_at = new Date().toISOString(); review.business_id = 'demo_biz'; items.push(review); }
    localStorage.setItem('rv_reviews', JSON.stringify(items));
    return review;
  },

  async deleteReview(id) {
    if (this._useSupabase()) { await supabase.from('reviews').delete().eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_reviews') || '[]');
    localStorage.setItem('rv_reviews', JSON.stringify(items.filter(r => r.id !== id)));
  },

  // ─── GROUPS & COMMUNITY ───────────────────────────────────────────

  async getGroups(filters = {}) {
    if (this._useSupabase()) {
      let q = supabase.from('groups').select('*').order('member_count', { ascending: false });
      if (filters.type) q = q.eq('type', filters.type);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_groups') || '[]');
    if (filters.type) items = items.filter(g => g.type === filters.type);
    return items;
  },

  async saveGroup(group) {
    if (this._useSupabase()) {
      if (group.id) { const { data } = await supabase.from('groups').update(group).eq('id', group.id).select().single(); return data; }
      const { data } = await supabase.from('groups').insert(group).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_groups') || '[]');
    if (group.id) { items = items.map(g => g.id === group.id ? { ...g, ...group } : g); }
    else { group.id = 'grp_' + Date.now(); group.created_at = new Date().toISOString(); items.push(group); }
    localStorage.setItem('rv_groups', JSON.stringify(items));
    return group;
  },

  async getGroupPosts(groupId) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false });
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_group_posts') || '[]');
    return items.filter(p => p.group_id === groupId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveGroupPost(post) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('group_posts').insert(post).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_group_posts') || '[]');
    post.id = 'gp_' + Date.now();
    post.created_at = new Date().toISOString();
    items.push(post);
    localStorage.setItem('rv_group_posts', JSON.stringify(items));
    return post;
  },

  async getRecommendations(businessId) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('recommendations').select('*').eq('to_business_id', businessId).eq('is_published', true);
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_recommendations') || '[]');
    return items.filter(r => r.to_business_id === businessId && r.is_published);
  },

  async saveRecommendation(rec) {
    if (this._useSupabase()) {
      const { data } = await supabase.from('recommendations').insert(rec).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_recommendations') || '[]');
    rec.id = 'rec_' + Date.now();
    rec.created_at = new Date().toISOString();
    rec.is_published = true;
    items.push(rec);
    localStorage.setItem('rv_recommendations', JSON.stringify(items));
    return rec;
  },

  // ─── ACCESS TEMPLATES ───────────────────────────────────────────────

  async getAccessTemplates(role) {
    if (this._useSupabase()) {
      let q = supabase.from('access_templates').select('*');
      if (role) q = q.eq('role', role);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_access_templates') || '[]');
    if (items.length === 0) { items = this._seedTemplates(); }
    if (role) items = items.filter(t => t.role === role);
    return items;
  },

  // ─── ACCESS GRANTS ─────────────────────────────────────────────────

  async getAccessGrants(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('access_grants').select('*')).order('created_at', { ascending: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.professional_id) q = q.eq('professional_id', filters.professional_id);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_access_grants') || '[]');
    if (filters.status) items = items.filter(g => g.status === filters.status);
    if (filters.professional_id) items = items.filter(g => g.professional_id === filters.professional_id);
    return items;
  },

  async saveAccessGrant(grant) {
    if (this._useSupabase()) {
      const row = _stampWorkspace(grant);
      if (grant.id) { const { data } = await supabase.from('access_grants').update(row).eq('id', grant.id).select().single(); return data; }
      const { data } = await supabase.from('access_grants').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_access_grants') || '[]');
    if (grant.id) { items = items.map(g => g.id === grant.id ? { ...g, ...grant } : g); }
    else { grant.id = 'ag_' + Date.now(); grant.created_at = new Date().toISOString(); grant.granted_at = new Date().toISOString(); items.push(grant); }
    localStorage.setItem('rv_access_grants', JSON.stringify(items));
    return grant;
  },

  async revokeAccessGrant(id) {
    if (this._useSupabase()) { await supabase.from('access_grants').update({ status: 'revoked' }).eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_access_grants') || '[]');
    items = items.map(g => g.id === id ? { ...g, status: 'revoked' } : g);
    localStorage.setItem('rv_access_grants', JSON.stringify(items));
  },

  // ─── LOAN PACKAGES ─────────────────────────────────────────────────

  async getLoanPackages(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('loan_packages').select('*')).order('created_at', { ascending: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.loan_officer_id) q = q.eq('loan_officer_id', filters.loan_officer_id);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_loan_packages') || '[]');
    if (filters.status) items = items.filter(p => p.status === filters.status);
    if (filters.loan_officer_id) items = items.filter(p => p.loan_officer_id === filters.loan_officer_id);
    return items;
  },

  async saveLoanPackage(pkg) {
    pkg.updated_at = new Date().toISOString();
    if (this._useSupabase()) {
      const row = _stampWorkspace(pkg);
      if (pkg.id) { const { data } = await supabase.from('loan_packages').update(row).eq('id', pkg.id).select().single(); return data; }
      const { data } = await supabase.from('loan_packages').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_loan_packages') || '[]');
    if (pkg.id) { items = items.map(p => p.id === pkg.id ? { ...p, ...pkg } : p); }
    else { pkg.id = 'lp_' + Date.now(); pkg.created_at = new Date().toISOString(); items.push(pkg); }
    localStorage.setItem('rv_loan_packages', JSON.stringify(items));
    return pkg;
  },

  async updateLoanStatus(id, newStatus, note) {
    var items = JSON.parse(localStorage.getItem('rv_loan_packages') || '[]');
    var pkg = null;
    items = items.map(function(p) {
      if (p.id === id) {
        p.status = newStatus;
        p.updated_at = new Date().toISOString();
        if (!p.status_history) p.status_history = [];
        p.status_history.push({ status: newStatus, date: new Date().toISOString(), note: note || '' });
        pkg = p;
      }
      return p;
    });
    localStorage.setItem('rv_loan_packages', JSON.stringify(items));
    // Create notification
    if (pkg) {
      var labels = { submitted:'Submitted', under_review:'Under Review', pre_approved:'Pre-Approved', funded:'Funded', declined:'Declined' };
      await this.saveMessage({
        to_id: pkg.business_id, from_id: 'system', message_type: 'professional',
        subject: 'Loan Update: ' + (labels[newStatus] || newStatus),
        body: 'Your loan package status changed to ' + (labels[newStatus] || newStatus) + '.' + (note ? ' Note: ' + note : ''),
        related_id: id, related_type: 'loan_package'
      });
    }
    return pkg;
  },

  // ─── MESSAGES ──────────────────────────────────────────────────────

  async getMessages(filters = {}) {
    if (this._useSupabase()) {
      let q = supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (filters.message_type) q = q.eq('message_type', filters.message_type);
      if (filters.to_id) q = q.eq('to_id', filters.to_id);
      if (filters.read !== undefined) q = q.eq('read', filters.read);
      const { data } = await q.limit(100);
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_messages') || '[]');
    if (filters.message_type) items = items.filter(m => m.message_type === filters.message_type);
    if (filters.to_id) items = items.filter(m => m.to_id === filters.to_id);
    if (filters.read !== undefined) items = items.filter(m => m.read === filters.read);
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveMessage(msg) {
    if (this._useSupabase()) {
      const row = _stampWorkspace(msg);
      const { data } = await supabase.from('messages').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_messages') || '[]');
    msg.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    msg.created_at = new Date().toISOString();
    msg.read = false;
    items.push(msg);
    localStorage.setItem('rv_messages', JSON.stringify(items));
    return msg;
  },

  async markMessageRead(id) {
    if (this._useSupabase()) { await supabase.from('messages').update({ read: true }).eq('id', id); return; }
    let items = JSON.parse(localStorage.getItem('rv_messages') || '[]');
    items = items.map(m => m.id === id ? { ...m, read: true } : m);
    localStorage.setItem('rv_messages', JSON.stringify(items));
  },

  async getUnreadCount(type) {
    var msgs = await this.getMessages({ message_type: type, read: false });
    return msgs.length;
  },

  // ─── BUSINESS DEADLINES ─────────────────────────────────────────────

  async getDeadlines(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('business_deadlines').select('*')).order('due_date', { ascending: true });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.deadline_type) q = q.eq('deadline_type', filters.deadline_type);
      if (filters.due_before) q = q.lte('due_date', filters.due_before);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
    if (filters.status) items = items.filter(d => d.status === filters.status);
    if (filters.deadline_type) items = items.filter(d => d.deadline_type === filters.deadline_type);
    if (filters.due_before) items = items.filter(d => d.due_date <= filters.due_before);
    return items.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  },

  async saveDeadline(item) {
    // Auto-update status based on due_date
    var today = new Date().toISOString().split('T')[0];
    var soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    if (item.status !== 'completed' && item.status !== 'dismissed') {
      if (item.due_date < today) item.status = 'overdue';
      else if (item.due_date <= soon) item.status = 'due_soon';
      else item.status = 'upcoming';
    }
    if (this._useSupabase()) {
      const row = _stampWorkspace({ ...item, updated_at: new Date().toISOString() });
      if (item.id) {
        const { data } = await supabase.from('business_deadlines').update(row).eq('id', item.id).select().single();
        return data;
      }
      const { data } = await supabase.from('business_deadlines').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
    if (item.id) {
      items = items.map(d => d.id === item.id ? { ...d, ...item } : d);
    } else {
      item.id = 'dl_' + Date.now();
      item.created_at = new Date().toISOString();
      items.push(item);
    }
    localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
    return item;
  },

  async deleteDeadline(id) {
    if (this._useSupabase()) {
      await supabase.from('business_deadlines').delete().eq('id', id);
      return;
    }
    let items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
    items = items.filter(d => d.id !== id);
    localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
  },

  async completeDeadline(id) {
    if (this._useSupabase()) {
      await supabase.from('business_deadlines').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
      return;
    }
    let items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
    items = items.map(d => d.id === id ? { ...d, status: 'completed', completed_at: new Date().toISOString() } : d);
    localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
  },

  // ─── INVITES ────────────────────────────────────────────────────────

  async getInvites(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('invites').select('*')).order('created_at', { ascending: false });
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.invite_type) q = q.eq('invite_type', filters.invite_type);
      const { data } = await q;
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_invites') || '[]');
    if (filters.status) items = items.filter(i => i.status === filters.status);
    if (filters.invite_type) items = items.filter(i => i.invite_type === filters.invite_type);
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveInvite(invite) {
    if (!invite.referral_code) invite.referral_code = 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    if (!invite.expires_at) invite.expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
    if (this._useSupabase()) {
      const row = _stampWorkspace(invite);
      if (invite.id) { const { data } = await supabase.from('invites').update(row).eq('id', invite.id).select().single(); return data; }
      const { data } = await supabase.from('invites').insert(row).select().single();
      return data;
    }
    let items = JSON.parse(localStorage.getItem('rv_invites') || '[]');
    if (invite.id) { items = items.map(i => i.id === invite.id ? { ...i, ...invite } : i); }
    else { invite.id = 'inv_' + Date.now(); invite.created_at = new Date().toISOString(); invite.sent_at = new Date().toISOString(); items.push(invite); }
    localStorage.setItem('rv_invites', JSON.stringify(items));
    return invite;
  },

  async sendInvite(invite) {
    invite.status = 'sent';
    var saved = await this.saveInvite(invite);
    saved.invite_url = window.location.origin + '/onboarding.html?ref=' + saved.referral_code;
    console.log('[Invite] ' + invite.channel + ' to ' + (invite.recipient_email || invite.recipient_phone) + ' → ' + saved.invite_url);
    return saved;
  },

  async sendBulkInvites(invites) {
    var results = [];
    for (var i = 0; i < invites.length; i++) { results.push(await this.sendInvite(invites[i])); }
    return results;
  },

  // ─── AFFILIATE CLICKS ───────────────────────────────────────────────

  async logAffiliateClick(click) {
    if (this._useSupabase()) {
      const row = _stampWorkspace({ ...click, user_id: (await supabase.auth.getUser()).data?.user?.id });
      await supabase.from('affiliate_clicks').insert(row);
      return;
    }
    let clicks = JSON.parse(localStorage.getItem('rv_affiliate_clicks') || '[]');
    click.id = 'aff_' + Date.now();
    click.created_at = new Date().toISOString();
    clicks.push(click);
    localStorage.setItem('rv_affiliate_clicks', JSON.stringify(clicks));
  },

  async getAffiliateClicks(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('affiliate_clicks').select('*')).order('created_at', { ascending: false });
      if (filters.retailer) q = q.eq('retailer', filters.retailer);
      if (filters.category) q = q.eq('category', filters.category);
      if (filters.event_type) q = q.eq('event_type', filters.event_type);
      const { data } = await q;
      return data || [];
    }
    let clicks = JSON.parse(localStorage.getItem('rv_affiliate_clicks') || '[]');
    if (filters.retailer) clicks = clicks.filter(c => c.retailer === filters.retailer);
    if (filters.category) clicks = clicks.filter(c => c.category === filters.category);
    if (filters.event_type) clicks = clicks.filter(c => c.event_type === filters.event_type);
    return clicks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  // ─── GENERATED DOCUMENTS ─────────────────────────────────────────────

  async getGeneratedDocs(filters = {}) {
    if (this._useSupabase()) {
      let q = _scopeQuery(supabase.from('generated_documents').select('*')).order('created_at', { ascending: false });
      if (filters.template_id) q = q.eq('template_id', filters.template_id);
      if (filters.profession) q = q.eq('profession', filters.profession);
      const { data } = await q;
      return data || [];
    }
    let docs = JSON.parse(localStorage.getItem('rv_generated_docs') || '[]');
    if (filters.template_id) docs = docs.filter(d => d.templateId === filters.template_id);
    if (filters.profession) docs = docs.filter(d => d.profession === filters.profession);
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveGeneratedDoc(doc) {
    if (this._useSupabase()) {
      const row = _stampWorkspace({ ...doc });
      if (doc.id) {
        const { data } = await supabase.from('generated_documents').update(row).eq('id', doc.id).select().single();
        return data;
      }
      const { data } = await supabase.from('generated_documents').insert(row).select().single();
      return data;
    }
    let docs = JSON.parse(localStorage.getItem('rv_generated_docs') || '[]');
    if (doc.id) {
      docs = docs.map(d => d.id === doc.id ? { ...d, ...doc } : d);
    } else {
      doc.id = 'doc_' + Date.now();
      doc.createdAt = new Date().toISOString();
      docs.push(doc);
    }
    localStorage.setItem('rv_generated_docs', JSON.stringify(docs));
    return doc;
  },

  async deleteGeneratedDoc(id) {
    if (this._useSupabase()) {
      await supabase.from('generated_documents').delete().eq('id', id);
      return;
    }
    let docs = JSON.parse(localStorage.getItem('rv_generated_docs') || '[]');
    docs = docs.filter(d => d.id !== id);
    localStorage.setItem('rv_generated_docs', JSON.stringify(docs));
  },

  // ─── COMMERCIAL DEALS ──────────────────────────────────────────────

  async getCommercialDeals(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('commercial_deals').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.deal_type) query = query.eq('deal_type', filters.deal_type);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_commercial_deals') || '[]');
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.deal_type) rows = rows.filter(r => r.deal_type === filters.deal_type);
    return rows;
  },

  async saveCommercialDeal(deal) {
    // Auto-calc commission
    if (deal.commission_rate && deal.asking_price) {
      deal.commission_amount = parseFloat(((deal.asking_price * deal.commission_rate) / 100).toFixed(2));
    } else if (deal.commission_rate && deal.lease_rate_sqft && deal.sqft && deal.lease_term_months) {
      const totalLease = deal.lease_rate_sqft * deal.sqft * (deal.lease_term_months / 12);
      deal.commission_amount = parseFloat(((totalLease * deal.commission_rate) / 100).toFixed(2));
    }
    if (this._useSupabase()) {
      const sb = getSupabase(); await this._stampWorkspace(deal);
      if (deal.id) { const { data, error } = await sb.from('commercial_deals').update(deal).eq('id', deal.id).select().single(); return { data, error }; }
      const { data, error } = await sb.from('commercial_deals').insert(deal).select().single();
      return { data, error };
    }
    let rows = JSON.parse(localStorage.getItem('rv_commercial_deals') || '[]');
    if (deal.id) { rows = rows.map(r => r.id === deal.id ? { ...r, ...deal, updated_at: new Date().toISOString() } : r); }
    else { deal.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); deal.created_at = new Date().toISOString(); rows.unshift(deal); }
    localStorage.setItem('rv_commercial_deals', JSON.stringify(rows));
    return { data: deal, error: null };
  },

  async deleteCommercialDeal(id) {
    if (this._useSupabase()) { const sb = getSupabase(); return await sb.from('commercial_deals').delete().eq('id', id); }
    let rows = JSON.parse(localStorage.getItem('rv_commercial_deals') || '[]'); rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_commercial_deals', JSON.stringify(rows)); return { error: null };
  },

  // ─── PROJECT MATERIALS ─────────────────────────────────────────────

  async getProjectMaterials(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('project_materials').select('*');
      query = await this._scopeQuery(query);
      if (filters.project_id) query = query.eq('project_id', filters.project_id);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.status) query = query.eq('status', filters.status);
      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    }
    let rows = JSON.parse(localStorage.getItem('rv_project_materials') || '[]');
    if (filters.project_id) rows = rows.filter(r => r.project_id === filters.project_id);
    if (filters.category) rows = rows.filter(r => r.category === filters.category);
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    return rows;
  },

  async saveProjectMaterial(item) {
    // Auto-calc total
    if (item.quantity && item.unit_price) {
      item.total_price = parseFloat((item.quantity * item.unit_price).toFixed(2));
    }
    if (this._useSupabase()) {
      const sb = getSupabase(); await this._stampWorkspace(item);
      if (item.id) { const { data, error } = await sb.from('project_materials').update(item).eq('id', item.id).select().single(); return { data, error }; }
      const { data, error } = await sb.from('project_materials').insert(item).select().single();
      return { data, error };
    }
    let rows = JSON.parse(localStorage.getItem('rv_project_materials') || '[]');
    if (item.id) { rows = rows.map(r => r.id === item.id ? { ...r, ...item, updated_at: new Date().toISOString() } : r); }
    else { item.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); item.created_at = new Date().toISOString(); rows.unshift(item); }
    localStorage.setItem('rv_project_materials', JSON.stringify(rows));
    return { data: item, error: null };
  },

  async deleteProjectMaterial(id) {
    if (this._useSupabase()) { const sb = getSupabase(); return await sb.from('project_materials').delete().eq('id', id); }
    let rows = JSON.parse(localStorage.getItem('rv_project_materials') || '[]'); rows = rows.filter(r => r.id !== id);
    localStorage.setItem('rv_project_materials', JSON.stringify(rows)); return { error: null };
  },

  // ─── LISTING SYNDICATION ────────────────────────────────────────────

  async getSyndicationConfig() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('syndication_platforms').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query;
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_syndication_config') || '{}');
  },

  async saveSyndicationConfig(config) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(config);
      return sb.from('syndication_platforms').upsert(config).select().single();
    }
    localStorage.setItem('rv_syndication_config', JSON.stringify(config));
    return { data: config, error: null };
  },

  async getSyndicationListings() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('syndication_listings').select('*');
      query = await this._scopeQuery(query);
      const { data } = await query;
      return data || [];
    }
    return JSON.parse(localStorage.getItem('rv_syndication_listings') || '{}');
  },

  async saveSyndicationListings(listings) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return sb.from('syndication_listings').upsert(listings).select();
    }
    localStorage.setItem('rv_syndication_listings', JSON.stringify(listings));
    return { data: listings, error: null };
  },

  // ─── OWNER STATEMENTS ───────────────────────────────────────────────

  // ─── BILT REFERRALS ──────────────────────────────────────────────

  async getBiltReferrals(filters = {}) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('bilt_referrals').select('*');
      query = await this._scopeQuery(query);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.landlord_id) query = query.eq('landlord_id', filters.landlord_id);
      const { data } = await query.order('clicked_at', { ascending: false });
      return data || [];
    }
    let items = JSON.parse(localStorage.getItem('rv_bilt_referrals') || '[]');
    if (filters.status) items = items.filter(i => i.status === filters.status);
    if (filters.landlord_id) items = items.filter(i => i.landlord_id === filters.landlord_id);
    return items;
  },

  async saveBiltReferral(referral) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      await this._stampWorkspace(referral);
      const { data, error } = await sb.from('bilt_referrals')
        .upsert(referral).select().single();
      return { data, error };
    }
    let items = JSON.parse(localStorage.getItem('rv_bilt_referrals') || '[]');
    if (referral.id) {
      const idx = items.findIndex(i => i.id === referral.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...referral, updated_at: new Date().toISOString() };
      else items.push(referral);
    } else {
      referral.id = 'bilt_' + Date.now();
      referral.created_at = new Date().toISOString();
      referral.updated_at = new Date().toISOString();
      items.push(referral);
    }
    localStorage.setItem('rv_bilt_referrals', JSON.stringify(items));
    return { data: referral, error: null };
  },

  async deleteBiltReferral(id) {
    if (this._useSupabase()) {
      const sb = getSupabase();
      return await sb.from('bilt_referrals').delete().eq('id', id);
    }
    let items = JSON.parse(localStorage.getItem('rv_bilt_referrals') || '[]');
    items = items.filter(i => i.id !== id);
    localStorage.setItem('rv_bilt_referrals', JSON.stringify(items));
    return { error: null };
  },

  async getBiltStats() {
    const all = await this.getBiltReferrals();
    return {
      totalClicks: all.length,
      conversions: all.filter(r => r.converted).length,
      approved: all.filter(r => r.status === 'approved' || r.status === 'paid').length,
      pendingCommission: all.filter(r => r.converted && r.status !== 'paid')
        .reduce((sum, r) => sum + parseFloat(r.commission_amount || 45), 0),
      totalEarned: all.filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + parseFloat(r.commission_amount || 45), 0)
    };
  },

  async getOwnerStatements() {
    if (this._useSupabase()) {
      const sb = getSupabase();
      let query = sb.from('owner_statements').select('*, properties(address)');
      query = await this._scopeQuery(query);
      const { data } = await query.order('statement_month', { ascending: false });
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
      await this._stampWorkspace(prefs);
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
