// ============================================================================
// 3120 Life — Contractor Permissions Module
// ============================================================================
// Handles granular permission checks for contractors within a workspace.
// Owners/admins can grant fine-grained access per contractor.
// ============================================================================

const ContractorAccess = (function() {
  'use strict';

  // ── Default Permission Sets ──────────────────────────────────────────

  const PERMISSION_DEFS = {
    // ── Maintenance ──
    maintenance_view:    { label: 'View Maintenance Requests',    group: 'Maintenance', default: true },
    maintenance_update:  { label: 'Update Request Status',        group: 'Maintenance', default: true },
    maintenance_create:  { label: 'Create Maintenance Requests',  group: 'Maintenance', default: false },
    // ── Properties ──
    properties_view:     { label: 'View Properties',              group: 'Properties',  default: true },
    properties_edit:     { label: 'Edit Property Details',        group: 'Properties',  default: false },
    // ── Tenants ──
    tenants_view:        { label: 'View Tenant Info',             group: 'Tenants',     default: false },
    tenants_contact:     { label: 'Contact Tenants',              group: 'Tenants',     default: true },
    // ── Documents ──
    documents_view:      { label: 'View Documents',               group: 'Documents',   default: false },
    documents_upload:    { label: 'Upload Documents',             group: 'Documents',   default: true },
    // ── Billing ──
    invoices_create:     { label: 'Submit Invoices',              group: 'Billing',     default: true },
    invoices_view:       { label: 'View Own Invoices',            group: 'Billing',     default: true },
    time_tracking:       { label: 'Log Time Entries',             group: 'Billing',     default: true },
    accounting_view:     { label: 'View Accounting',              group: 'Billing',     default: false },
    // ── Communication ──
    messages_send:       { label: 'Send Messages',                group: 'Communication', default: true },
    messages_view:       { label: 'View Message History',         group: 'Communication', default: true },
    // ── Compliance ──
    compliance_view:     { label: 'View Compliance Status',       group: 'Compliance',  default: true },
    compliance_upload:   { label: 'Upload Licenses/Insurance',    group: 'Compliance',  default: true },
    // ── Projects / Jobs (Construction & Trades) ──
    projects_view:       { label: 'View Jobs / Projects',         group: 'Projects',    default: true },
    projects_create:     { label: 'Create Jobs',                  group: 'Projects',    default: false },
    projects_edit:       { label: 'Edit Job Details',             group: 'Projects',    default: false },
    projects_delete:     { label: 'Delete Jobs',                  group: 'Projects',    default: false },
    tasks_manage:        { label: 'Manage Tasks (add/edit/check)',group: 'Projects',    default: true },
    // ── Scheduling ──
    schedule_view:       { label: 'View Schedule',                group: 'Scheduling',  default: true },
    schedule_edit:       { label: 'Edit Schedule / Dates',        group: 'Scheduling',  default: false },
    // ── Quotes ──
    quotes_view:         { label: 'View Quotes',                  group: 'Quotes',      default: false },
    quotes_create:       { label: 'Create / Edit Quotes',         group: 'Quotes',      default: false },
    quotes_send:         { label: 'Send Quotes to Clients',       group: 'Quotes',      default: false },
    quotes_convert:      { label: 'Convert Quotes to Invoices',   group: 'Quotes',      default: false },
  };

  // Preset permission bundles for quick assignment
  const PRESETS = {
    maintenance_only: {
      label: 'Maintenance Only',
      description: 'Can view and update assigned maintenance requests',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: false,
        properties_view: true, properties_edit: false,
        tenants_view: false, tenants_contact: true,
        documents_view: false, documents_upload: true,
        invoices_create: true, invoices_view: true, time_tracking: true,
        accounting_view: false,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: false, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: false,
        schedule_view: false, schedule_edit: false,
        quotes_view: false, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    full_maintenance: {
      label: 'Full Maintenance Access',
      description: 'Full maintenance + property view + tenant contact + docs',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: true,
        properties_view: true, properties_edit: false,
        tenants_view: true, tenants_contact: true,
        documents_view: true, documents_upload: true,
        invoices_create: true, invoices_view: true, time_tracking: true,
        accounting_view: false,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: false, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: false,
        schedule_view: false, schedule_edit: false,
        quotes_view: false, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    property_manager: {
      label: 'Property Manager',
      description: 'Full access except accounting and compliance management',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: true,
        properties_view: true, properties_edit: true,
        tenants_view: true, tenants_contact: true,
        documents_view: true, documents_upload: true,
        invoices_create: true, invoices_view: true, time_tracking: true,
        accounting_view: true,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: true, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: false,
        schedule_view: true, schedule_edit: false,
        quotes_view: true, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    view_only: {
      label: 'View Only',
      description: 'Read-only access to assigned areas',
      permissions: {
        maintenance_view: true, maintenance_update: false, maintenance_create: false,
        properties_view: true, properties_edit: false,
        tenants_view: false, tenants_contact: false,
        documents_view: true, documents_upload: false,
        invoices_create: false, invoices_view: true, time_tracking: false,
        accounting_view: false,
        messages_send: false, messages_view: true,
        compliance_view: true, compliance_upload: false,
        projects_view: true, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: false,
        schedule_view: true, schedule_edit: false,
        quotes_view: true, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    // ── Construction & Trades Presets ──
    crew_member: {
      label: 'Crew Member',
      description: 'Can view jobs, log time, manage assigned tasks — no create/delete/quote access',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: false,
        properties_view: false, properties_edit: false,
        tenants_view: false, tenants_contact: false,
        documents_view: false, documents_upload: true,
        invoices_create: false, invoices_view: false, time_tracking: true,
        accounting_view: false,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: true, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: true,
        schedule_view: true, schedule_edit: false,
        quotes_view: false, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    foreman: {
      label: 'Foreman / Lead',
      description: 'Can view & edit jobs, manage tasks, log time, view schedule — no delete or quotes',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: true,
        properties_view: true, properties_edit: false,
        tenants_view: false, tenants_contact: true,
        documents_view: true, documents_upload: true,
        invoices_create: true, invoices_view: true, time_tracking: true,
        accounting_view: false,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: true, projects_create: true, projects_edit: true, projects_delete: false, tasks_manage: true,
        schedule_view: true, schedule_edit: true,
        quotes_view: true, quotes_create: false, quotes_send: false, quotes_convert: false
      }
    },
    subcontractor: {
      label: 'Subcontractor',
      description: 'Can view assigned jobs, log time, submit invoices & quotes',
      permissions: {
        maintenance_view: true, maintenance_update: true, maintenance_create: false,
        properties_view: false, properties_edit: false,
        tenants_view: false, tenants_contact: true,
        documents_view: false, documents_upload: true,
        invoices_create: true, invoices_view: true, time_tracking: true,
        accounting_view: false,
        messages_send: true, messages_view: true,
        compliance_view: true, compliance_upload: true,
        projects_view: true, projects_create: false, projects_edit: false, projects_delete: false, tasks_manage: true,
        schedule_view: true, schedule_edit: false,
        quotes_view: true, quotes_create: true, quotes_send: false, quotes_convert: false
      }
    }
  };

  // ── Permission Check Methods ──────────────────────────────────────────

  let _cachedMembership = null;

  /** Get the current user's membership in the active workspace */
  async function getMembership() {
    if (_cachedMembership) return _cachedMembership;

    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return _getLocalMembership();

    const user = await RVAuth.getUser();
    if (!user) return null;

    const wsId = typeof Workspace !== 'undefined' ? await Workspace.getActiveId() : null;
    if (!wsId) return null;

    const { data } = await sb.from('workspace_members')
      .select('*')
      .eq('workspace_id', wsId)
      .eq('user_id', user.id)
      .single();

    _cachedMembership = data;
    return data;
  }

  /** Fallback: local membership from localStorage */
  function _getLocalMembership() {
    const stored = localStorage.getItem('rv_membership');
    if (stored) try { return JSON.parse(stored); } catch(e) {}
    // Default: full access (owner)
    return { role: 'owner', permissions: {} };
  }

  /** Check if the current user has a specific permission */
  async function can(permission) {
    const membership = await getMembership();
    if (!membership) return false;

    // Owners and admins have all permissions
    if (membership.role === 'owner' || membership.role === 'admin') return true;

    // Members get most permissions (except accounting_view by default)
    if (membership.role === 'member') {
      const memberDefaults = { accounting_view: false };
      if (membership.permissions && membership.permissions[permission] !== undefined) {
        return membership.permissions[permission];
      }
      return memberDefaults[permission] !== false;
    }

    // Viewers get read-only
    if (membership.role === 'viewer') {
      return permission.endsWith('_view');
    }

    // Contractors use explicit permissions (or defaults from PERMISSION_DEFS)
    if (membership.role === 'contractor') {
      if (membership.permissions && membership.permissions[permission] !== undefined) {
        return membership.permissions[permission];
      }
      return PERMISSION_DEFS[permission]?.default || false;
    }

    return false;
  }

  /** Check permission synchronously (uses cached membership) */
  function canSync(permission) {
    const membership = _cachedMembership || _getLocalMembership();
    if (!membership) return false;
    if (membership.role === 'owner' || membership.role === 'admin') return true;
    if (membership.role === 'viewer') return permission.endsWith('_view');
    if (membership.role === 'contractor') {
      if (membership.permissions?.[permission] !== undefined) return membership.permissions[permission];
      return PERMISSION_DEFS[permission]?.default || false;
    }
    return true; // members default to allowed
  }

  /** Check multiple permissions (AND) */
  async function canAll(permissions) {
    for (const p of permissions) {
      if (!(await can(p))) return false;
    }
    return true;
  }

  /** Check any of multiple permissions (OR) */
  async function canAny(permissions) {
    for (const p of permissions) {
      if (await can(p)) return true;
    }
    return false;
  }

  // ── Contractor Management (for owners/admins) ────────────────────────

  /** Invite a contractor to the workspace */
  async function inviteContractor({ email, displayName, specialty, hourlyRate, preset = 'maintenance_only' }) {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return _inviteContractorLocal({ email, displayName, specialty, hourlyRate, preset });

    const wsId = typeof Workspace !== 'undefined' ? await Workspace.getActiveId() : null;
    if (!wsId) return { error: { message: 'No active workspace' } };

    // Create invite with contractor role
    const permissions = PRESETS[preset]?.permissions || PRESETS.maintenance_only.permissions;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: invite, error } = await sb.from('workspace_invites').insert({
      workspace_id: wsId,
      role: 'contractor',
      email: email,
      expires_at: expiresAt.toISOString()
    }).select().single();

    if (error) return { data: null, error };

    // Store contractor metadata for when they accept
    await sb.from('contractor_invite_meta').upsert({
      invite_id: invite.id,
      display_name: displayName,
      specialty: specialty,
      hourly_rate: hourlyRate,
      permissions: permissions
    }, { onConflict: 'invite_id' });

    return { data: invite, error: null };
  }

  /** localStorage fallback for contractor invites */
  function _inviteContractorLocal({ email, displayName, specialty, hourlyRate, preset }) {
    const contractors = JSON.parse(localStorage.getItem('rv_contractors') || '[]');
    const permissions = PRESETS[preset]?.permissions || PRESETS.maintenance_only.permissions;
    const contractor = {
      id: 'ctr_' + Date.now(),
      email,
      display_name: displayName,
      specialty,
      hourly_rate: hourlyRate,
      permissions,
      role: 'contractor',
      status: 'invited',
      invited_at: new Date().toISOString()
    };
    contractors.push(contractor);
    localStorage.setItem('rv_contractors', JSON.stringify(contractors));
    return { data: contractor, error: null };
  }

  /** List contractors in the workspace */
  async function listContractors() {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return _listContractorsLocal();

    const wsId = typeof Workspace !== 'undefined' ? await Workspace.getActiveId() : null;
    if (!wsId) return [];

    const { data } = await sb.from('workspace_members')
      .select('*, user:profiles(id, email, first_name, last_name, avatar_url, phone)')
      .eq('workspace_id', wsId)
      .eq('role', 'contractor')
      .order('joined_at', { ascending: false });

    return data || [];
  }

  /** localStorage fallback */
  function _listContractorsLocal() {
    return JSON.parse(localStorage.getItem('rv_contractors') || '[]');
  }

  /** Update a contractor's permissions */
  async function updatePermissions(memberId, newPermissions) {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return _updatePermissionsLocal(memberId, newPermissions);

    const { data, error } = await sb.from('workspace_members')
      .update({ permissions: newPermissions })
      .eq('id', memberId)
      .select()
      .single();

    return { data, error };
  }

  /** localStorage fallback */
  function _updatePermissionsLocal(contractorId, newPermissions) {
    const contractors = JSON.parse(localStorage.getItem('rv_contractors') || '[]');
    const idx = contractors.findIndex(c => c.id === contractorId);
    if (idx >= 0) {
      contractors[idx].permissions = newPermissions;
      localStorage.setItem('rv_contractors', JSON.stringify(contractors));
      return { data: contractors[idx], error: null };
    }
    return { error: { message: 'Contractor not found' } };
  }

  /** Remove a contractor from the workspace */
  async function removeContractor(memberId) {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (!sb) return _removeContractorLocal(memberId);

    const { error } = await sb.from('workspace_members')
      .delete()
      .eq('id', memberId);

    return { error };
  }

  /** localStorage fallback */
  function _removeContractorLocal(contractorId) {
    let contractors = JSON.parse(localStorage.getItem('rv_contractors') || '[]');
    contractors = contractors.filter(c => c.id !== contractorId);
    localStorage.setItem('rv_contractors', JSON.stringify(contractors));
    return { error: null };
  }

  /** Apply a permission preset to a contractor */
  async function applyPreset(memberId, presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return { error: { message: 'Unknown preset: ' + presetKey } };
    return await updatePermissions(memberId, preset.permissions);
  }

  /** Clear cached membership (call on login/logout/workspace switch) */
  function clearCache() {
    _cachedMembership = null;
  }

  // ── UI Helper: Hide/show elements based on permissions ───────────────

  /**
   * Call this after page load to show/hide elements based on permissions.
   * Add data-permission="permission_key" to any element to gate it.
   * Example: <div data-permission="accounting_view">...</div>
   */
  async function enforceUI() {
    const els = document.querySelectorAll('[data-permission]');
    for (const el of els) {
      const perm = el.getAttribute('data-permission');
      const allowed = await can(perm);
      if (!allowed) {
        el.style.display = 'none';
        el.setAttribute('data-perm-hidden', 'true');
      } else {
        if (el.getAttribute('data-perm-hidden') === 'true') {
          el.style.display = '';
          el.removeAttribute('data-perm-hidden');
        }
      }
    }
  }

  // ── Public API ──────────────────────────────────────────────────────

  return {
    PERMISSION_DEFS,
    PRESETS,
    getMembership,
    can,
    canSync,
    canAll,
    canAny,
    inviteContractor,
    listContractors,
    updatePermissions,
    removeContractor,
    applyPreset,
    clearCache,
    enforceUI
  };
})();

window.ContractorAccess = ContractorAccess;
