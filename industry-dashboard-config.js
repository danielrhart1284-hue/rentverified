/**
 * 3120 Life — Industry Dashboard Config
 * ============================================================
 * Drop-in that adapts the main dashboard to the user's industry.
 * Updates headline, KPI stat card labels, and shows/hides
 * property-management-only banners.
 *
 * Usage (auto-applies on DOMContentLoaded):
 *   <script src="industry-dashboard-config.js"></script>
 *
 * Manual call:
 *   IndustryDashboard.apply('contractor');
 */
(function () {
  'use strict';

  // ── Per-industry dashboard config ────────────────────────────────────────
  // kpis: up to 4 stat cards [ { valueId, label, color } ]
  //   valueId matches the existing id="" on each .stat-value element
  //   label    replaces the adjacent .stat-label text
  //   color    class on .stat-card: '' | 'green' | 'yellow' | 'blue' | 'purple'
  // pmBanners: false = hide landlord-specific alert banners for this industry
  // ─────────────────────────────────────────────────────────────────────────
  var CONFIGS = {

    property_management: {
      headline:    'Your Property Portfolio',
      subheadline: 'Listings · Tenants · Rent · Maintenance',
      pmBanners:   true,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Listings',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Active Tenants',     color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Rent Pending',       color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Maintenance Open',   color: '' },
      ],
    },

    short_term_rental: {
      headline:    'Your STR Portfolio',
      subheadline: 'Listings · Bookings · Revenue · Turnover',
      pmBanners:   true,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Listings',   color: '' },
        { valueId: 'dash-tenant-count',  label: 'Booked Nights',     color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Revenue MTD',       color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Turnover Jobs',     color: '' },
      ],
    },

    commercial_re: {
      headline:    'Commercial Real Estate Overview',
      subheadline: 'Listings · Leases · Rent · Maintenance',
      pmBanners:   true,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Listings',   color: '' },
        { valueId: 'dash-tenant-count',  label: 'Active Leases',     color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Rent Collected',    color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Maintenance Tickets', color: '' },
      ],
    },

    contractor: {
      headline:    'Your Jobs & Crew Overview',
      subheadline: 'Jobs · Revenue · Invoices · Crew',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Open Jobs',         color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Out',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Crew Active',       color: '' },
      ],
    },

    construction_trades: {
      headline:    'Jobs, Crew & Financials',
      subheadline: 'Jobs · Revenue · Invoices · Field Workers',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Open Jobs',         color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Out',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Field Workers',     color: '' },
      ],
    },

    attorney: {
      headline:    'Your Practice Overview',
      subheadline: 'Matters · Hours · Invoices · Deadlines',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Matters',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Billable Hrs MTD',  color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Due',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Upcoming Deadlines', color: '' },
      ],
    },

    accountant: {
      headline:    'Client & Billing Overview',
      subheadline: 'Clients · Hours · Invoices · Returns',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Clients',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Hours Billed MTD',  color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Due',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Returns Filed',     color: '' },
      ],
    },

    cpa: {
      headline:    'Firm & Client Overview',
      subheadline: 'Clients · Billing · Invoices · Filings',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Clients',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Hours Billed MTD',  color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Due',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Returns Due',       color: '' },
      ],
    },

    insurance: {
      headline:    'Agency & Policy Overview',
      subheadline: 'Policies · Renewals · Premiums · Referrals',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Policies',   color: '' },
        { valueId: 'dash-tenant-count',  label: 'Renewals Due',      color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Premiums MTD',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Referrals Sent',    color: '' },
      ],
    },

    lending: {
      headline:    'Lending Pipeline Overview',
      subheadline: 'Applications · Active Loans · Funded · Pipeline',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Applications',      color: '' },
        { valueId: 'dash-tenant-count',  label: 'Active Loans',      color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Funded MTD',        color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Pipeline Value',    color: '' },
      ],
    },

    nonprofit: {
      headline:    'Organization Overview',
      subheadline: 'Members · Donations · Programs · Volunteers',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Members',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Donations MTD',     color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Open Programs',     color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Volunteers',        color: '' },
      ],
    },

    wellness_spa: {
      headline:    'Clinic & Booking Overview',
      subheadline: 'Appointments · Revenue · Clients · Reviews',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Appointments Today', color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',        color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Active Clients',     color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Reviews (30d)',      color: '' },
      ],
    },

    salon_beauty: {
      headline:    'Salon & Booking Overview',
      subheadline: 'Appointments · Revenue · Clients · Reviews',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Appointments Today', color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',        color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Active Clients',     color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Reviews (30d)',      color: '' },
      ],
    },

    restaurant_food: {
      headline:    'Restaurant Operations Overview',
      subheadline: 'Reservations · Revenue · Staff · Orders',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Reservations Today', color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue Today',      color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Staff On Today',     color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Open Orders',        color: '' },
      ],
    },

    marketing_consulting: {
      headline:    'Projects & Client Overview',
      subheadline: 'Projects · Revenue · Invoices · Meetings',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Projects',   color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Out',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Client Meetings',   color: '' },
      ],
    },

    cleaning: {
      headline:    'Jobs & Client Overview',
      subheadline: 'Jobs Today · Revenue · Clients · Invoices',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Jobs Today',        color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Active Clients',    color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Invoices Out',      color: '' },
      ],
    },

    auto_services: {
      headline:    'Shop & Service Overview',
      subheadline: 'Jobs Today · Revenue · Clients · Invoices',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Jobs Today',        color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Active Clients',    color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Invoices Out',      color: '' },
      ],
    },

    general: {
      headline:    'Business Overview',
      subheadline: 'Clients · Revenue · Invoices · Tasks',
      pmBanners:   false,
      kpis: [
        { valueId: 'dash-listing-count', label: 'Active Clients',    color: '' },
        { valueId: 'dash-tenant-count',  label: 'Revenue MTD',       color: 'green' },
        { valueId: 'dash-rent-pending',  label: 'Invoices Out',      color: 'yellow' },
        { valueId: 'dash-assist-count',  label: 'Open Tasks',        color: '' },
      ],
    },
  };

  // ── Stat card color classes ───────────────────────────────────────────────
  var COLOR_CLASSES = ['', 'green', 'yellow', 'blue', 'purple'];

  // ── Apply config to DOM ───────────────────────────────────────────────────
  function apply(industry) {
    var cfg = CONFIGS[industry] || CONFIGS['general'];

    // 1. Update dashboard headline
    var h1 = document.getElementById('dash-industry-headline');
    if (h1) h1.textContent = cfg.headline;

    var sub = document.getElementById('dash-industry-sub');
    if (sub) sub.textContent = cfg.subheadline;

    // 2. Update KPI stat card labels
    cfg.kpis.forEach(function (kpi) {
      var valueEl = document.getElementById(kpi.valueId);
      if (!valueEl) return;
      var card = valueEl.closest('.stat-card');
      if (!card) return;

      // Update label
      var labelEl = card.querySelector('.stat-label');
      if (labelEl) labelEl.textContent = kpi.label;

      // Swap color class
      COLOR_CLASSES.forEach(function (cls) { if (cls) card.classList.remove(cls); });
      if (kpi.color) card.classList.add(kpi.color);
    });

    // 3. Show/hide property-management-only banners
    var pmOnly = [
      'ins-trigger-banner',     // insurance alert
      'bilt-dash-tile',         // bilt alliance
      'assistance-feed-wrap',   // tenant assistance feed
      'lease-expiry-banner',    // lease expiry
    ];
    pmOnly.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (!cfg.pmBanners) {
        el.style.display = 'none';
        el.setAttribute('data-ind-hidden', '1');
      } else if (el.getAttribute('data-ind-hidden')) {
        // Only restore if we hid it — don't override existing display:none logic
        el.removeAttribute('data-ind-hidden');
        // Re-show (the existing JS will manage actual visibility)
      }
    });

    // 4. Store config so other scripts can read it
    try {
      var stored = JSON.parse(localStorage.getItem('rv_workspace_config') || '{}');
      stored.dashboardConfig = cfg;
      localStorage.setItem('rv_workspace_config', JSON.stringify(stored));
    } catch (_) {}
  }

  // ── Auto-detect industry from workspace config ────────────────────────────
  function autoApply() {
    var industry = 'property_management'; // default
    try {
      var cfg = JSON.parse(localStorage.getItem('rv_workspace_config') || '{}');
      if (cfg.industry) industry = cfg.industry;
      // Also check onboarding config
      var ob = JSON.parse(localStorage.getItem('rv_onboarding_config') || '{}');
      if (ob.industry) industry = ob.industry;
    } catch (_) {}
    apply(industry);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.IndustryDashboard = {
    apply:     apply,
    autoApply: autoApply,
    configs:   CONFIGS,
  };

  // Auto-run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoApply);
  } else {
    // DOM already ready — but wait a tick for the dashboard to render
    setTimeout(autoApply, 50);
  }

})();
