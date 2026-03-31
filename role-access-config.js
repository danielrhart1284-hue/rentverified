/**
 * 3120 Life — Role-Based Access Control
 * ============================================================
 * Drop-in that enforces role permissions on every page.
 * Reads rv_member_role from localStorage and blocks/hides
 * sections the current role cannot access.
 *
 * Roles:  owner | admin | staff | agent | vendor
 *
 * Usage (add to every page that needs protection):
 *   <script src="role-access-config.js"></script>
 *
 * Manual check:
 *   RoleAccess.can('view_financials')  → true/false
 *   RoleAccess.getRole()               → 'staff'
 *   RoleAccess.isOwner()               → false
 */
(function () {
  'use strict';

  // ── Role definitions ─────────────────────────────────────────────────────
  var ROLES = {
    owner: {
      label: 'Owner',
      icon:  '👑',
      color: '#7c3aed',
      description: 'Full access. Manages billing, team, and all business data.',
      permissions: {
        view_dashboard:     true,
        view_financials:    true,
        view_billing:       true,
        view_accounting:    true,
        view_owner_stmts:   true,
        manage_team:        true,
        manage_access:      true,
        view_tenants:       true,
        view_crm:           true,
        view_jobs:          true,
        view_bookings:      true,
        view_calendar:      true,
        view_messages:      true,
        view_field_app:     true,
        view_reviews:       true,
        view_documents:     true,
        view_listings:      true,
        edit_settings:      true,
      },
    },

    admin: {
      label: 'Admin',
      icon:  '🔑',
      color: '#1d4ed8',
      description: 'Full operational access. Cannot manage billing or subscription.',
      permissions: {
        view_dashboard:     true,
        view_financials:    true,
        view_billing:       false,  // no billing
        view_accounting:    true,
        view_owner_stmts:   true,
        manage_team:        true,
        manage_access:      true,
        view_tenants:       true,
        view_crm:           true,
        view_jobs:          true,
        view_bookings:      true,
        view_calendar:      true,
        view_messages:      true,
        view_field_app:     true,
        view_reviews:       true,
        view_documents:     true,
        view_listings:      true,
        edit_settings:      true,
      },
    },

    staff: {
      label: 'Staff',
      icon:  '👤',
      color: '#059669',
      description: 'Operational access. Cannot view financials, billing, or manage team.',
      permissions: {
        view_dashboard:     true,
        view_financials:    false,
        view_billing:       false,
        view_accounting:    false,
        view_owner_stmts:   false,
        manage_team:        false,
        manage_access:      false,
        view_tenants:       true,
        view_crm:           true,
        view_jobs:          true,
        view_bookings:      true,
        view_calendar:      true,
        view_messages:      true,
        view_field_app:     true,
        view_reviews:       true,
        view_documents:     true,
        view_listings:      true,
        edit_settings:      false,
      },
    },

    agent: {
      label: 'Agent',
      icon:  '🏘️',
      color: '#0891b2',
      description: 'Leasing & CRM access. Cannot view accounting, vendor jobs, or team settings.',
      permissions: {
        view_dashboard:     true,
        view_financials:    false,
        view_billing:       false,
        view_accounting:    false,
        view_owner_stmts:   false,
        manage_team:        false,
        manage_access:      false,
        view_tenants:       true,
        view_crm:           true,
        view_jobs:          false,
        view_bookings:      true,
        view_calendar:      true,
        view_messages:      true,
        view_field_app:     false,
        view_reviews:       true,
        view_documents:     true,
        view_listings:      true,
        edit_settings:      false,
      },
    },

    vendor: {
      label: 'Vendor',
      icon:  '🔧',
      color: '#d97706',
      description: 'Job & invoice access only. Can view assigned work orders and submit invoices.',
      permissions: {
        view_dashboard:     false,
        view_financials:    false,
        view_billing:       false,
        view_accounting:    false,
        view_owner_stmts:   false,
        manage_team:        false,
        manage_access:      false,
        view_tenants:       false,
        view_crm:           false,
        view_jobs:          true,   // own jobs only
        view_bookings:      false,
        view_calendar:      false,
        view_messages:      true,
        view_field_app:     true,
        view_reviews:       false,
        view_documents:     false,
        view_listings:      false,
        edit_settings:      false,
      },
    },
  };

  // ── Page → required permission map ───────────────────────────────────────
  var PAGE_PERMS = {
    'accounting.html':        'view_accounting',
    'financial-hub.html':     'view_financials',
    'access-control.html':    'manage_access',
    'pricing.html':           'view_billing',
    'jobs.html':              'view_jobs',
    'crm.html':               'view_crm',
    'booking.html':           'view_bookings',
    'calendar.html':          'view_calendar',
    'messages.html':          'view_messages',
    'reviews.html':           'view_reviews',
    'field-app.html':         'view_field_app',
    'doc-generator.html':     'view_documents',
    'listing-syndication.html': 'view_listings',
  };

  // ── CSS selector → required permission (hide if no permission) ───────────
  var SECTION_PERMS = {
    '[data-require="financials"]':  'view_financials',
    '[data-require="billing"]':     'view_billing',
    '[data-require="accounting"]':  'view_accounting',
    '[data-require="team"]':        'manage_team',
    '[data-require="access"]':      'manage_access',
    '[data-require="owner_stmts"]': 'view_owner_stmts',
    '[data-require="settings"]':    'edit_settings',
  };

  // ── Get current role ─────────────────────────────────────────────────────
  function getRole() {
    try {
      var stored = JSON.parse(localStorage.getItem('rv_member_role') || '{}');
      return stored.role || null;
    } catch (_) { return null; }
  }

  function getRoleConfig(role) {
    return ROLES[role] || null;
  }

  // ── Check a specific permission ──────────────────────────────────────────
  function can(permission) {
    var role = getRole();
    if (!role) return true; // no role set = owner (backward compat)
    var cfg = ROLES[role];
    if (!cfg) return true;
    return cfg.permissions[permission] !== false;
  }

  function isOwner() { var r = getRole(); return !r || r === 'owner'; }

  // ── Enforce page-level access ─────────────────────────────────────────────
  function enforcePage() {
    var role = getRole();
    if (!role || role === 'owner') return; // owners always pass

    var path = window.location.pathname.split('/').pop();
    var requiredPerm = PAGE_PERMS[path];
    if (!requiredPerm) return; // page has no restriction

    if (!can(requiredPerm)) {
      // Show access-denied overlay instead of page content
      document.addEventListener('DOMContentLoaded', function () {
        var cfg = ROLES[role] || {};
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:#f8fafc;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;text-align:center;padding:2rem;';
        overlay.innerHTML =
          '<div style="font-size:3rem;">🔒</div>' +
          '<h2 style="font-size:1.4rem;font-weight:800;color:#1e293b;margin:0;">Access Restricted</h2>' +
          '<p style="color:#64748b;max-width:360px;margin:0;">Your role (<strong>' + (cfg.label || role) + '</strong>) does not have permission to view this page.</p>' +
          '<p style="color:#94a3b8;font-size:.85rem;">Contact your account owner to request access.</p>' +
          '<a href="landlord-signup.html" style="background:#00E676;color:#0f172a;padding:.6rem 1.4rem;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;">← Back to Dashboard</a>';
        document.body.appendChild(overlay);
      });
    }
  }

  // ── Hide restricted sections in the DOM ──────────────────────────────────
  function enforceSections() {
    var role = getRole();
    if (!role || role === 'owner') return;

    document.addEventListener('DOMContentLoaded', function () {
      Object.keys(SECTION_PERMS).forEach(function (selector) {
        if (!can(SECTION_PERMS[selector])) {
          document.querySelectorAll(selector).forEach(function (el) {
            el.style.display = 'none';
          });
        }
      });

      // Show the role indicator badge in nav (if .rv-role-badge container exists)
      showRoleBadge(role);
    });
  }

  // ── Show role badge in nav ────────────────────────────────────────────────
  function showRoleBadge(role) {
    var cfg = ROLES[role];
    if (!cfg) return;
    var containers = document.querySelectorAll('.rv-role-badge');
    containers.forEach(function (el) {
      el.textContent = cfg.icon + ' ' + cfg.label;
      el.style.cssText += ';background:' + cfg.color + '22;color:' + cfg.color + ';padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700;';
    });
  }

  // ── Set role (called by invite acceptance flow) ────────────────────────
  function setRole(role, memberInfo) {
    localStorage.setItem('rv_member_role', JSON.stringify({
      role:       role,
      name:       (memberInfo && memberInfo.name) || '',
      email:      (memberInfo && memberInfo.email) || '',
      set_at:     new Date().toISOString(),
    }));
  }

  function clearRole() {
    localStorage.removeItem('rv_member_role');
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.RoleAccess = {
    ROLES:      ROLES,
    getRole:    getRole,
    getRoleConfig: getRoleConfig,
    can:        can,
    isOwner:    isOwner,
    setRole:    setRole,
    clearRole:  clearRole,
    enforce:    function () { enforcePage(); enforceSections(); },
  };

  // Auto-enforce immediately
  enforcePage();
  enforceSections();

})();
