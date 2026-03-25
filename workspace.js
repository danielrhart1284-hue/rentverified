// ============================================================================
// 3120 Life — Workspace Module
// ============================================================================
// Handles multi-tenant workspace operations:
//   - Create / join / switch workspaces
//   - Invite members via code
//   - Filter all queries by active workspace
//   - Workspace settings & branding
// ============================================================================

const Workspace = (function() {
  'use strict';

  let _activeWorkspace = null;
  let _memberRole = null;

  // ── Core Methods ──────────────────────────────────────────────────────

  /** Get the active workspace for the current user */
  async function getActive() {
    if (_activeWorkspace) return _activeWorkspace;

    const sb = getSupabase();
    if (!sb) return null;

    const profile = await Auth.getProfile();
    if (!profile?.workspace_id) return null;

    const { data, error } = await sb.from('workspaces')
      .select('*')
      .eq('id', profile.workspace_id)
      .single();

    if (data) _activeWorkspace = data;
    return data;
  }

  /** Get the active workspace ID (shortcut) */
  async function getActiveId() {
    const ws = await getActive();
    return ws?.id || null;
  }

  /** Get cached workspace (synchronous — call getActive() first) */
  function cached() {
    return _activeWorkspace;
  }

  /** Create a new workspace */
  async function create({ name, industry = 'real_estate', plan = 'starter' }) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const user = await Auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Math.random().toString(36).substring(2, 6);

    const { data: ws, error } = await sb.from('workspaces').insert({
      name,
      slug,
      owner_id: user.id,
      plan,
      industry
    }).select().single();

    if (error) return { data: null, error };

    // Set as active workspace on profile
    await sb.from('profiles').update({ workspace_id: ws.id }).eq('id', user.id);

    // Add as owner member
    await sb.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'owner'
    });

    _activeWorkspace = ws;
    return { data: ws, error: null };
  }

  /** Join a workspace via invite code */
  async function joinWithCode(inviteCode) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const user = await Auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Look up invite
    const { data: invite, error: inviteErr } = await sb.from('workspace_invites')
      .select('*')
      .eq('invite_code', inviteCode.trim())
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteErr || !invite) {
      return { error: { message: 'Invalid or expired invite code.' } };
    }

    // Add user as member
    const { error: memberErr } = await sb.from('workspace_members').insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role || 'member'
    });

    if (memberErr) {
      if (memberErr.code === '23505') {
        return { error: { message: 'You are already a member of this workspace.' } };
      }
      return { error: memberErr };
    }

    // Mark invite as used
    await sb.from('workspace_invites')
      .update({ used_by: user.id })
      .eq('id', invite.id);

    // Set as active workspace
    await sb.from('profiles').update({ workspace_id: invite.workspace_id }).eq('id', user.id);

    // Reload workspace
    _activeWorkspace = null;
    const ws = await getActive();

    return { data: ws, error: null };
  }

  /** Switch active workspace (for users in multiple workspaces) */
  async function switchTo(workspaceId) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const user = await Auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    // Verify membership
    const { data: membership } = await sb.from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return { error: { message: 'You are not a member of this workspace.' } };
    }

    // Update profile
    await sb.from('profiles').update({ workspace_id: workspaceId }).eq('id', user.id);

    _activeWorkspace = null;
    _memberRole = membership.role;
    const ws = await getActive();

    return { data: ws, error: null };
  }

  /** List all workspaces the current user belongs to */
  async function listMine() {
    const sb = getSupabase();
    if (!sb) return [];

    const user = await Auth.getUser();
    if (!user) return [];

    const { data } = await sb.from('workspace_members')
      .select('role, workspace:workspaces(*)')
      .eq('user_id', user.id);

    return (data || []).map(d => ({ ...d.workspace, memberRole: d.role }));
  }

  // ── Invite Management ─────────────────────────────────────────────────

  /** Create an invite code for the active workspace */
  async function createInvite({ role = 'member', email = null, expiresInDays = 7 } = {}) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const wsId = await getActiveId();
    if (!wsId) return { error: { message: 'No active workspace' } };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await sb.from('workspace_invites').insert({
      workspace_id: wsId,
      role,
      email,
      expires_at: expiresAt.toISOString()
    }).select().single();

    return { data, error };
  }

  /** List pending invites for the active workspace */
  async function listInvites() {
    const sb = getSupabase();
    if (!sb) return [];

    const wsId = await getActiveId();
    if (!wsId) return [];

    const { data } = await sb.from('workspace_invites')
      .select('*')
      .eq('workspace_id', wsId)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return data || [];
  }

  // ── Member Management ─────────────────────────────────────────────────

  /** List members of the active workspace */
  async function listMembers() {
    const sb = getSupabase();
    if (!sb) return [];

    const wsId = await getActiveId();
    if (!wsId) return [];

    const { data } = await sb.from('workspace_members')
      .select('role, joined_at, user:profiles(id, email, first_name, last_name, avatar_url)')
      .eq('workspace_id', wsId)
      .order('joined_at');

    return data || [];
  }

  /** Update a member's role */
  async function updateMemberRole(userId, newRole) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const wsId = await getActiveId();
    if (!wsId) return { error: { message: 'No active workspace' } };

    const { data, error } = await sb.from('workspace_members')
      .update({ role: newRole })
      .eq('workspace_id', wsId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  }

  /** Remove a member from the workspace */
  async function removeMember(userId) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const wsId = await getActiveId();
    if (!wsId) return { error: { message: 'No active workspace' } };

    const { error } = await sb.from('workspace_members')
      .delete()
      .eq('workspace_id', wsId)
      .eq('user_id', userId);

    return { error };
  }

  // ── Workspace Settings ────────────────────────────────────────────────

  /** Update workspace settings */
  async function updateSettings(updates) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const wsId = await getActiveId();
    if (!wsId) return { error: { message: 'No active workspace' } };

    const { data, error } = await sb.from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', wsId)
      .select()
      .single();

    if (data) _activeWorkspace = data;
    return { data, error };
  }

  /** Update feature flags */
  async function updateFeatures(featureUpdates) {
    const ws = await getActive();
    if (!ws) return { error: { message: 'No active workspace' } };

    const newFlags = { ...(ws.feature_flags || {}), ...featureUpdates };
    return await updateSettings({ feature_flags: newFlags });
  }

  /** Check if a feature is enabled */
  function isFeatureEnabled(featureName) {
    if (!_activeWorkspace?.feature_flags) return true; // default to enabled
    return _activeWorkspace.feature_flags[featureName] !== false;
  }

  // ── Industry-Specific Feature Presets ──────────────────────────────────

  const INDUSTRY_PRESETS = {
    property_management: {
      label: 'Property Management',
      features: {
        properties: true, tenants: true, leases: true, maintenance: true,
        accounting: true, screening: true, payments: true, documents: true,
        insurance: true, deposit_bonds: true, credit_builder: true,
        eviction: true, owner_statements: true, listings: true,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    attorney: {
      label: 'Attorney / Law Firm',
      features: {
        properties: false, tenants: false, leases: true, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: true, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    contractor: {
      label: 'Contractor / Trades',
      features: {
        properties: false, tenants: false, leases: false, maintenance: true,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: true, scheduling: true, quotes: true
      }
    },
    construction_trades: {
      label: 'Construction & Skilled Trades',
      description: 'GCs, HVAC, plumbers, electricians, handymen, small crews',
      features: {
        properties: false, tenants: false, leases: false, maintenance: true,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: true, scheduling: true, quotes: true
      }
    },
    insurance: {
      label: 'Insurance Agency',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: true, deposit_bonds: true, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    short_term_rental: {
      label: 'Short-Term Rental',
      features: {
        properties: true, tenants: true, leases: true, maintenance: true,
        accounting: true, screening: true, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: true, listings: true,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    accountant: {
      label: 'Accountant / Bookkeeper',
      description: 'Tax prep, bookkeeping, advisory, CPA firms',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: true, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    cpa: {
      label: 'CPA / Accounting Firm',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: true, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    general: {
      label: 'Other / General Business',
      description: 'Freelancers, service companies, any business',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: true, scheduling: false, quotes: true
      }
    },
    nonprofit: {
      label: 'Nonprofit / Association',
      description: 'Nonprofits, charities, associations, foundations',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: true, listings: false,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    wellness_spa: {
      label: 'Medical Spa / Wellness',
      description: 'Med spas, aesthetics, wellness clinics',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: true, quotes: false
      }
    },
    marketing_consulting: {
      label: 'Marketing / Consultant',
      description: 'Agencies, freelancers, consultants, strategists',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: true, scheduling: false, quotes: false
      }
    },
    commercial_re: {
      label: 'Commercial Real Estate',
      description: 'Commercial brokerages, NNN/CAM, tenant buildout',
      features: {
        properties: true, tenants: true, leases: true, maintenance: true,
        accounting: true, screening: true, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: true, listings: true,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    lending: {
      label: 'Lending / Hard Money',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: true, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: true,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: false, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: false, quotes: false
      }
    },
    restaurant_food: {
      label: 'Restaurant / Food Service',
      description: 'Restaurants, food trucks, catering, bakeries',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: false, invoices: true, crm: true,
        projects: false, scheduling: true, quotes: false
      }
    },
    salon_beauty: {
      label: 'Salon / Barber / Beauty',
      description: 'Hair salons, barbers, nail techs, estheticians',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: false, e_signature: false, invoices: true, crm: true,
        projects: false, scheduling: true, quotes: false
      }
    },
    cleaning: {
      label: 'Cleaning / Janitorial',
      description: 'Residential cleaning, commercial janitorial',
      features: {
        properties: false, tenants: false, leases: false, maintenance: true,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: false, invoices: true, crm: true,
        projects: true, scheduling: true, quotes: true
      }
    },
    auto_services: {
      label: 'Auto / Mechanic',
      description: 'Auto repair, detailing, body shops',
      features: {
        properties: false, tenants: false, leases: false, maintenance: true,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: true, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: false, invoices: true, crm: true,
        projects: true, scheduling: true, quotes: true
      }
    },
    general: {
      label: 'Something Else',
      description: 'Any business — fully customizable feature set',
      features: {
        properties: false, tenants: false, leases: false, maintenance: false,
        accounting: true, screening: false, payments: true, documents: true,
        insurance: false, deposit_bonds: false, credit_builder: false,
        eviction: false, owner_statements: false, listings: false,
        time_tracking: true, e_signature: true, invoices: true, crm: true,
        projects: false, scheduling: true, quotes: false
      }
    }
  };

  /** Get the feature preset for an industry */
  function getIndustryPreset(industry) {
    return INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.property_management;
  }

  /** Apply industry preset to the active workspace */
  async function applyIndustryPreset(industry) {
    const preset = getIndustryPreset(industry);
    if (!preset) return { error: { message: 'Unknown industry' } };
    return await updateFeatures(preset.features);
  }

  /** Get list of available industries */
  function getIndustries() {
    return Object.entries(INDUSTRY_PRESETS).map(function(entry) {
      return { key: entry[0], label: entry[1].label };
    });
  }

  // ── Query Helper ──────────────────────────────────────────────────────

  /**
   * Add workspace filter to any Supabase query.
   * Usage: Workspace.scopeQuery(sb.from('properties').select('*'))
   */
  function scopeQuery(query) {
    if (_activeWorkspace?.id) {
      return query.eq('workspace_id', _activeWorkspace.id);
    }
    return query;
  }

  // ── Public Directory ──────────────────────────────────────────────────

  /** Browse public workspaces (for business directory) */
  async function browsePublic({ industry, city, state, search, limit = 50 } = {}) {
    const sb = getSupabase();
    if (!sb) return [];

    let query = sb.from('workspaces')
      .select('id, name, slug, industry, logo_url, bio, city, state, services, primary_color, created_at')
      .eq('is_public', true)
      .limit(limit);

    if (industry) query = query.eq('industry', industry);
    if (city) query = query.ilike('city', `%${city}%`);
    if (state) query = query.eq('state', state);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data } = await query.order('created_at', { ascending: false });
    return data || [];
  }

  // ── Public API ────────────────────────────────────────────────────────

  return {
    getActive,
    getActiveId,
    cached,
    create,
    joinWithCode,
    switchTo,
    listMine,
    createInvite,
    listInvites,
    listMembers,
    updateMemberRole,
    removeMember,
    updateSettings,
    updateFeatures,
    isFeatureEnabled,
    getIndustryPreset,
    applyIndustryPreset,
    getIndustries,
    INDUSTRY_PRESETS,
    scopeQuery,
    browsePublic
  };
})();

window.Workspace = Workspace;
