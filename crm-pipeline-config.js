/**
 * 3120 Life — CRM Pipeline Stages Per Vertical
 * ============================================================
 * Defines kanban pipeline stages for each industry.
 * 'won' and 'lost' are always the terminal stages so the
 * conversion-rate and pipeline-value stats stay correct.
 *
 * Usage (auto-applies before crm.html init):
 *   <script src="crm-pipeline-config.js"></script>
 *   Then call: CRMPipeline.apply()  — or it auto-runs on load.
 *
 * After apply(), window.STATUSES / STATUS_LABELS / STATUS_COLORS
 * are replaced with the industry-specific values.
 */
(function () {
  'use strict';

  // ── Pipeline definitions per industry ───────────────────────────────────
  // Each entry: STATUSES array + STATUS_LABELS map + STATUS_COLORS map
  // Always ends with won + lost.
  // ─────────────────────────────────────────────────────────────────────────
  var PIPELINES = {

    property_management: {
      label:   'Property Management Pipeline',
      stages:  ['inquiry','toured','applied','screening','won','lost'],
      labels:  { inquiry:'Inquiry', toured:'Toured', applied:'Applied', screening:'Screening', won:'Lease Signed', lost:'Lost' },
      colors:  { inquiry:'#3b82f6', toured:'#8b5cf6', applied:'#f59e0b', screening:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    short_term_rental: {
      label:   'STR Booking Pipeline',
      stages:  ['inquiry','toured','applied','screening','won','lost'],
      labels:  { inquiry:'Inquiry', toured:'Toured', applied:'Applied', screening:'Reviewed', won:'Booking Confirmed', lost:'Declined' },
      colors:  { inquiry:'#3b82f6', toured:'#8b5cf6', applied:'#f59e0b', screening:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    commercial_re: {
      label:   'Commercial Real Estate Pipeline',
      stages:  ['lead','toured','loi','under_contract','won','lost'],
      labels:  { lead:'New Lead', toured:'Toured', loi:'LOI Sent', under_contract:'Under Contract', won:'Closed', lost:'Dead' },
      colors:  { lead:'#3b82f6', toured:'#8b5cf6', loi:'#f59e0b', under_contract:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    contractor: {
      label:   'Contractor Sales Pipeline',
      stages:  ['lead','contacted','site_visit','proposal','won','lost'],
      labels:  { lead:'New Lead', contacted:'Contacted', site_visit:'Site Visit', proposal:'Proposal Sent', won:'Job Won', lost:'Lost' },
      colors:  { lead:'#3b82f6', contacted:'#8b5cf6', site_visit:'#f59e0b', proposal:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    construction_trades: {
      label:   'Construction & Trades Pipeline',
      stages:  ['lead','contacted','site_visit','proposal','won','lost'],
      labels:  { lead:'New Lead', contacted:'Contacted', site_visit:'Site Visit', proposal:'Bid Sent', won:'Contract Signed', lost:'Lost' },
      colors:  { lead:'#3b82f6', contacted:'#8b5cf6', site_visit:'#f59e0b', proposal:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    attorney: {
      label:   'Legal Matters Pipeline',
      stages:  ['inquiry','consultation','retained','active','won','lost'],
      labels:  { inquiry:'Inquiry', consultation:'Consultation', retained:'Retained', active:'Active Matter', won:'Matter Closed', lost:'Not Retained' },
      colors:  { inquiry:'#3b82f6', consultation:'#8b5cf6', retained:'#f59e0b', active:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    accountant: {
      label:   'Accounting Client Pipeline',
      stages:  ['lead','consultation','proposal','engaged','won','lost'],
      labels:  { lead:'New Lead', consultation:'Consultation', proposal:'Proposal Sent', engaged:'Engaged', won:'Client Retained', lost:'Lost' },
      colors:  { lead:'#3b82f6', consultation:'#8b5cf6', proposal:'#f59e0b', engaged:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    cpa: {
      label:   'CPA Client Pipeline',
      stages:  ['lead','consultation','proposal','engaged','won','lost'],
      labels:  { lead:'New Lead', consultation:'Consultation', proposal:'Engagement Letter', engaged:'Filing In Progress', won:'Filed / Closed', lost:'Lost' },
      colors:  { lead:'#3b82f6', consultation:'#8b5cf6', proposal:'#f59e0b', engaged:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    insurance: {
      label:   'Insurance Sales Pipeline',
      stages:  ['lead','needs_analysis','quoted','binding','won','lost'],
      labels:  { lead:'New Lead', needs_analysis:'Needs Analysis', quoted:'Quoted', binding:'Binding', won:'Policy Active', lost:'Lost' },
      colors:  { lead:'#3b82f6', needs_analysis:'#8b5cf6', quoted:'#f59e0b', binding:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    lending: {
      label:   'Loan Pipeline',
      stages:  ['inquiry','application','processing','approved','won','lost'],
      labels:  { inquiry:'Inquiry', application:'Application', processing:'Processing', approved:'Approved', won:'Funded', lost:'Declined' },
      colors:  { inquiry:'#3b82f6', application:'#8b5cf6', processing:'#f59e0b', approved:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    nonprofit: {
      label:   'Donor / Member Pipeline',
      stages:  ['prospect','outreach','interested','committed','won','lost'],
      labels:  { prospect:'Prospect', outreach:'Outreach Sent', interested:'Interested', committed:'Committed', won:'Active Donor', lost:'Disengaged' },
      colors:  { prospect:'#3b82f6', outreach:'#8b5cf6', interested:'#f59e0b', committed:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    wellness_spa: {
      label:   'Wellness Client Pipeline',
      stages:  ['inquiry','consultation','booked','completed','won','lost'],
      labels:  { inquiry:'Inquiry', consultation:'Consultation', booked:'Appointment Booked', completed:'Completed', won:'Recurring Client', lost:'Lost' },
      colors:  { inquiry:'#3b82f6', consultation:'#8b5cf6', booked:'#f59e0b', completed:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    salon_beauty: {
      label:   'Salon Client Pipeline',
      stages:  ['inquiry','consultation','booked','completed','won','lost'],
      labels:  { inquiry:'Inquiry', consultation:'Consultation', booked:'Appointment Booked', completed:'Service Done', won:'VIP / Returning', lost:'Lost' },
      colors:  { inquiry:'#3b82f6', consultation:'#8b5cf6', booked:'#f59e0b', completed:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    restaurant_food: {
      label:   'Catering & Events Pipeline',
      stages:  ['lead','contacted','tasting','proposal','won','lost'],
      labels:  { lead:'New Lead', contacted:'Contacted', tasting:'Tasting / Tour', proposal:'Proposal Sent', won:'Event Booked', lost:'Lost' },
      colors:  { lead:'#3b82f6', contacted:'#8b5cf6', tasting:'#f59e0b', proposal:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    marketing_consulting: {
      label:   'Agency / Consultant Pipeline',
      stages:  ['inquiry','discovery','proposal','negotiation','won','lost'],
      labels:  { inquiry:'Inquiry', discovery:'Discovery Call', proposal:'Proposal Sent', negotiation:'Negotiating', won:'Client Signed', lost:'Lost' },
      colors:  { inquiry:'#3b82f6', discovery:'#8b5cf6', proposal:'#f59e0b', negotiation:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    cleaning: {
      label:   'Cleaning Service Pipeline',
      stages:  ['lead','quoted','scheduled','completed','won','lost'],
      labels:  { lead:'New Lead', quoted:'Quoted', scheduled:'Scheduled', completed:'Job Completed', won:'Recurring Client', lost:'Lost' },
      colors:  { lead:'#3b82f6', quoted:'#8b5cf6', scheduled:'#f59e0b', completed:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    auto_services: {
      label:   'Auto Shop Pipeline',
      stages:  ['lead','estimate','approved','in_progress','won','lost'],
      labels:  { lead:'New Lead', estimate:'Estimate Sent', approved:'Approved', in_progress:'In Shop', won:'Completed & Paid', lost:'Lost' },
      colors:  { lead:'#3b82f6', estimate:'#8b5cf6', approved:'#f59e0b', in_progress:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },

    general: {
      label:   'Sales Pipeline',
      stages:  ['new','contacted','qualified','proposal','won','lost'],
      labels:  { new:'New', contacted:'Contacted', qualified:'Qualified', proposal:'Proposal', won:'Won', lost:'Lost' },
      colors:  { new:'#3b82f6', contacted:'#8b5cf6', qualified:'#f59e0b', proposal:'#06b6d4', won:'#10b981', lost:'#ef4444' },
    },
  };

  // ── Apply pipeline to global CRM variables ───────────────────────────────
  function apply(industry) {
    var cfg = PIPELINES[industry] || PIPELINES['general'];

    // Override the global CRM stage variables
    if (typeof window !== 'undefined') {
      window.STATUSES      = cfg.stages;
      window.STATUS_LABELS = cfg.labels;
      window.STATUS_COLORS = cfg.colors;
    }

    // Update the pipeline label in the UI if present
    var labelEl = document.getElementById('crm-pipeline-label');
    if (labelEl) labelEl.textContent = cfg.label;

    return cfg;
  }

  // ── Auto-detect industry and apply ──────────────────────────────────────
  function autoApply() {
    var industry = 'general';
    try {
      var cfg = JSON.parse(localStorage.getItem('rv_workspace_config') || '{}');
      if (cfg.industry) industry = cfg.industry;
      var ob = JSON.parse(localStorage.getItem('rv_onboarding_config') || '{}');
      if (ob.industry) industry = ob.industry;
    } catch (_) {}
    return apply(industry);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.CRMPipeline = {
    apply:     apply,
    autoApply: autoApply,
    pipelines: PIPELINES,
  };

  // Run immediately so globals are set before crm.html's init() runs
  autoApply();

})();
