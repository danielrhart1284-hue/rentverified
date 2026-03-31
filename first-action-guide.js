/**
 * 3120 Life — Guided First Action
 * ============================================================
 * Drop-in that shows a "Get Started" checklist after onboarding.
 * Industry-specific steps. Progress tracked in localStorage.
 * Disappears when all steps are done or user dismisses.
 *
 * Usage (auto-runs on DOMContentLoaded):
 *   <script src="first-action-guide.js"></script>
 *
 * Manual trigger (call after completeOnboarding()):
 *   FirstActionGuide.show()
 *
 * Each step: { id, title, desc, icon, href, action }
 *   href   → navigates to a page
 *   action → calls a JS function (e.g. dashTab('properties'))
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'rv_first_actions';   // stores { shown, dismissed, done: [] }
  var CONTAINER_ID = 'first-action-guide';

  // ── Per-industry step definitions ────────────────────────────────────────
  var GUIDES = {

    property_management: {
      headline: '🏠 Let\'s set up your property portfolio',
      steps: [
        { id:'add_property',   icon:'🏘️', title:'Add your first property',      desc:'Enter your property address, type, and details.',            action:"dashTab('properties')" },
        { id:'add_tenant',     icon:'👤', title:'Invite or add a tenant',        desc:'Add tenant contact info and link them to a unit.',           action:"dashTab('clients')" },
        { id:'rent_collect',   icon:'💳', title:'Set up rent collection',        desc:'Choose payment methods — card, ACH, Cash App, or Zelle.',    action:"dashTab('payments')" },
        { id:'create_lease',   icon:'📄', title:'Create a lease document',       desc:'Generate a professional lease with e-signature.',            href:'doc-generator.html' },
        { id:'run_screening',  icon:'✅', title:'Screen your next applicant',    desc:'Run a background & credit check in minutes.',               href:'screening.html' },
        { id:'set_calendar',   icon:'📅', title:'Add a business deadline',       desc:'Track license renewals, insurance, and key dates.',         href:'calendar.html' },
      ],
    },

    short_term_rental: {
      headline: '🏖️ Let\'s get your STR running',
      steps: [
        { id:'add_property',   icon:'🏠', title:'Add your first listing',        desc:'Enter property details, photos, and house rules.',           action:"dashTab('properties')" },
        { id:'house_rules',    icon:'📜', title:'Create your house rules doc',   desc:'Generate a house rules document for guests.',               href:'doc-generator.html?template=str-rules' },
        { id:'setup_booking',  icon:'📅', title:'Set up your booking calendar',  desc:'Configure availability, pricing, and check-in times.',      href:'booking.html' },
        { id:'smart_lock',     icon:'🔒', title:'Recommend a smart lock',        desc:'Browse smart lock options for keyless guest access.',       href:'recommended-supplies.html' },
        { id:'guest_invoice',  icon:'🧾', title:'Create a guest invoice',        desc:'Bill guests for stays, cleaning fees, and damage.',         href:'doc-generator.html?template=str-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Track important dates',         desc:'Add tax deadlines, license renewals, and inspections.',     href:'calendar.html' },
      ],
    },

    commercial_re: {
      headline: '🏢 Let\'s set up your commercial portfolio',
      steps: [
        { id:'add_property',   icon:'🏢', title:'Add your first property',       desc:'Enter address, SF, type, and CAM details.',                  action:"dashTab('properties')" },
        { id:'add_tenant',     icon:'🤝', title:'Add a tenant or prospect',      desc:'Create a CRM lead for your first tenant.',                  href:'crm.html' },
        { id:'create_loi',     icon:'✉️', title:'Generate an LOI',               desc:'Create a Letter of Intent for a new lease negotiation.',    href:'doc-generator.html?template=cre-loi' },
        { id:'create_lease',   icon:'📄', title:'Create a lease document',       desc:'Generate a professional commercial lease.',                  href:'doc-generator.html' },
        { id:'set_calendar',   icon:'📅', title:'Track lease expirations',       desc:'Add lease end dates and CAM reconciliation deadlines.',     href:'calendar.html' },
        { id:'run_screening',  icon:'✅', title:'Screen your first tenant',      desc:'Run a business credit & background check.',                 href:'screening.html' },
      ],
    },

    contractor: {
      headline: '🏗️ Let\'s get your first job set up',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM lead for your first project.',                 href:'crm.html' },
        { id:'create_est',     icon:'📝', title:'Create an estimate',            desc:'Build a professional estimate to send to your client.',     href:'doc-generator.html?template=con-estimate' },
        { id:'create_job',     icon:'🔨', title:'Log a job or work order',       desc:'Track job status, photos, and crew assignments.',           href:'jobs.html' },
        { id:'create_invoice', icon:'🧾', title:'Create your first invoice',     desc:'Bill a client for labor and materials.',                    href:'doc-generator.html?template=con-invoice' },
        { id:'supplies',       icon:'🛒', title:'Browse recommended supplies',   desc:'Shop tools and materials from Home Depot & Northern Tool.', href:'recommended-supplies.html' },
        { id:'set_calendar',   icon:'📅', title:'Track permits & license dates', desc:'Set reminders for business license and permit renewals.',   href:'calendar.html' },
      ],
    },

    construction_trades: {
      headline: '🔨 Let\'s get your trades business going',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM lead or contact for your first job.',          href:'crm.html' },
        { id:'create_est',     icon:'📝', title:'Create a bid or estimate',      desc:'Build a professional estimate or quote.',                   href:'doc-generator.html?template=con-estimate' },
        { id:'create_job',     icon:'🔨', title:'Create a job / work order',     desc:'Track job progress, crew, and materials.',                  href:'jobs.html' },
        { id:'create_invoice', icon:'🧾', title:'Send your first invoice',       desc:'Bill clients for labor and materials with one click.',      href:'doc-generator.html?template=con-invoice' },
        { id:'field_app',      icon:'📱', title:'Set up the field app',          desc:'Capture photos, signatures, and time on-site.',             href:'field-app.html' },
        { id:'set_calendar',   icon:'📅', title:'Track license & insurance',     desc:'Stay on top of contractor license and insurance renewals.',  href:'calendar.html' },
      ],
    },

    attorney: {
      headline: '⚖️ Let\'s set up your practice',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client matter',  desc:'Create a CRM record for your first client.',                href:'crm.html' },
        { id:'engage_letter',  icon:'🤝', title:'Create an engagement letter',   desc:'Generate a scope-of-work and fee agreement.',               href:'doc-generator.html?template=atty-engage' },
        { id:'retainer',       icon:'📑', title:'Create a retainer agreement',   desc:'Set up a retainer with trust account details.',             href:'doc-generator.html?template=atty-retainer' },
        { id:'time_track',     icon:'⏱️', title:'Set up time tracking',          desc:'Log billable hours for each matter.',                       href:'accounting.html' },
        { id:'create_invoice', icon:'🧾', title:'Create a legal invoice',        desc:'Generate an itemized time-based billing statement.',        href:'doc-generator.html?template=atty-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Add bar & CLE deadlines',       desc:'Track bar renewals, CLE credits, and court dates.',        href:'calendar.html' },
      ],
    },

    accountant: {
      headline: '📊 Let\'s set up your accounting practice',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record for your first client.',                href:'crm.html' },
        { id:'engage_letter',  icon:'🤝', title:'Create an engagement letter',   desc:'Define scope of services and fee structure.',               href:'doc-generator.html?template=acct-engage' },
        { id:'time_track',     icon:'⏱️', title:'Set up time tracking',          desc:'Log billable hours to generate accurate invoices.',         href:'accounting.html' },
        { id:'create_invoice', icon:'🧾', title:'Create your first invoice',     desc:'Bill a client for professional services.',                  href:'doc-generator.html?template=acct-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Add tax & filing deadlines',    desc:'Track quarterly filings, extension deadlines, and renewals.', href:'calendar.html' },
        { id:'loan_connect',   icon:'🏦', title:'Explore loan connect',          desc:'Refer clients to business loans and earn a referral fee.',  href:'loan-connect.html' },
      ],
    },

    cpa: {
      headline: '📊 Let\'s set up your CPA firm',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record for your first client.',                href:'crm.html' },
        { id:'engage_letter',  icon:'🤝', title:'Create an engagement letter',   desc:'Define scope of services and fee structure.',               href:'doc-generator.html?template=acct-engage' },
        { id:'create_invoice', icon:'🧾', title:'Create your first invoice',     desc:'Bill a client for tax prep or advisory services.',          href:'doc-generator.html?template=acct-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Add tax filing deadlines',      desc:'Track 1040, 1120, 941 deadlines and extension dates.',      href:'calendar.html' },
        { id:'time_track',     icon:'⏱️', title:'Set up time tracking',          desc:'Log hours per client for accurate billing.',                href:'accounting.html' },
        { id:'loan_connect',   icon:'🏦', title:'Explore loan referrals',        desc:'Refer business clients to SBA loans and earn a fee.',       href:'loan-connect.html' },
      ],
    },

    insurance: {
      headline: '🛡️ Let\'s set up your agency',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM lead for your first prospect.',                href:'crm.html' },
        { id:'pol_summary',    icon:'📋', title:'Create a policy summary',       desc:'Document coverage details for a client file.',             href:'doc-generator.html?template=ins-summary' },
        { id:'create_invoice', icon:'🧾', title:'Create a premium invoice',      desc:'Bill a client for premium payments or broker fees.',        href:'doc-generator.html?template=ins-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Track policy renewals',         desc:'Add renewal and expiration dates so nothing lapses.',       href:'calendar.html' },
        { id:'set_booking',    icon:'📅', title:'Enable online booking',         desc:'Let prospects schedule consultations online.',              href:'booking.html' },
        { id:'loan_connect',   icon:'🏦', title:'Explore loan referrals',        desc:'Refer clients to business loans and earn a referral fee.',  href:'loan-connect.html' },
      ],
    },

    lending: {
      headline: '🏦 Let\'s set up your lending pipeline',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first applicant',      desc:'Create a CRM lead for your first loan applicant.',          href:'crm.html' },
        { id:'loan_pkg',       icon:'📦', title:'Build a loan package',          desc:'Compile financials for a business loan submission.',        href:'loan-connect.html' },
        { id:'create_invoice', icon:'🧾', title:'Create a fee invoice',          desc:'Bill for origination or servicing fees.',                   href:'doc-generator.html?template=lend-invoice' },
        { id:'set_calendar',   icon:'📅', title:'Track loan maturity dates',     desc:'Add maturity dates, balloon payments, and review triggers.', href:'calendar.html' },
        { id:'run_screening',  icon:'✅', title:'Run a credit screening',        desc:'Pull credit reports for applicants.',                       href:'screening.html' },
        { id:'set_booking',    icon:'📅', title:'Enable online consultations',   desc:'Let applicants book a call to discuss their loan.',         href:'booking.html' },
      ],
    },

    nonprofit: {
      headline: '💚 Let\'s set up your organization',
      steps: [
        { id:'add_donor',      icon:'🎁', title:'Add your first donor or member', desc:'Create a CRM record for a donor, member, or volunteer.',  href:'crm.html' },
        { id:'donation_rcpt',  icon:'📄', title:'Create a donation receipt',     desc:'Generate an IRS-compliant acknowledgment letter.',         href:'doc-generator.html?template=np-donation' },
        { id:'vol_agree',      icon:'🤝', title:'Create a volunteer agreement',  desc:'Formalize volunteer terms and liability waiver.',           href:'doc-generator.html?template=np-volunteer' },
        { id:'set_calendar',   icon:'📅', title:'Add key program dates',         desc:'Track grant deadlines, fundraisers, and board meetings.',   href:'calendar.html' },
        { id:'set_booking',    icon:'📅', title:'Enable online scheduling',      desc:'Let donors or volunteers book appointments online.',        href:'booking.html' },
        { id:'loan_connect',   icon:'🏦', title:'Explore grant & loan options',  desc:'Find funding options for your programs and operations.',    href:'loan-connect.html' },
      ],
    },

    wellness_spa: {
      headline: '💆 Let\'s set up your clinic',
      steps: [
        { id:'setup_booking',  icon:'📅', title:'Set up your booking calendar',  desc:'Configure services, availability, and appointment types.',  href:'booking.html' },
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record for your first client.',                href:'crm.html' },
        { id:'intake_form',    icon:'📋', title:'Create a client intake form',   desc:'Capture health history and consent before first visit.',    href:'doc-generator.html?template=well-intake' },
        { id:'create_invoice', icon:'🧾', title:'Create a service invoice',      desc:'Bill a client for treatments, packages, or memberships.',   href:'doc-generator.html?template=well-invoice' },
        { id:'set_reviews',    icon:'⭐', title:'Set up review collection',      desc:'Automatically request reviews after each appointment.',     href:'reviews.html' },
        { id:'set_calendar',   icon:'📅', title:'Track license renewals',        desc:'Add practitioner license and certification renewal dates.',  href:'calendar.html' },
      ],
    },

    salon_beauty: {
      headline: '✂️ Let\'s get your salon running',
      steps: [
        { id:'setup_booking',  icon:'📅', title:'Set up your booking calendar',  desc:'Add your services, hours, and stylist availability.',       href:'booking.html' },
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a client record with service history and notes.',    href:'crm.html' },
        { id:'cancel_policy',  icon:'⏰', title:'Set your cancellation policy',  desc:'Create a no-show/cancellation policy for clients to sign.', href:'doc-generator.html?template=sal-policy' },
        { id:'create_invoice', icon:'🧾', title:'Create a service invoice',      desc:'Bill a client for hair, nail, or beauty services.',         href:'doc-generator.html?template=sal-invoice' },
        { id:'set_reviews',    icon:'⭐', title:'Collect reviews',               desc:'Build your reputation — request Google and Yelp reviews.',  href:'reviews.html' },
        { id:'set_calendar',   icon:'📅', title:'Track license renewals',        desc:'Never miss a cosmetology license renewal.',                 href:'calendar.html' },
      ],
    },

    restaurant_food: {
      headline: '🍽️ Let\'s get your restaurant set up',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first corporate client', desc:'Create a CRM lead for catering or recurring accounts.',   href:'crm.html' },
        { id:'event_proposal', icon:'🎉', title:'Create a catering proposal',     desc:'Build an event proposal with menu and guest count.',       href:'doc-generator.html?template=rest-event' },
        { id:'create_invoice', icon:'🧾', title:'Create a catering invoice',      desc:'Bill a client for catering or private dining.',            href:'doc-generator.html?template=rest-catering' },
        { id:'team_invite',    icon:'👥', title:'Invite your team',               desc:'Add front-of-house and kitchen staff to the platform.',    href:'access-control.html' },
        { id:'set_reviews',    icon:'⭐', title:'Collect online reviews',         desc:'Build your Google and Yelp reputation automatically.',      href:'reviews.html' },
        { id:'set_calendar',   icon:'📅', title:'Track permits & renewals',       desc:'Add food handler, liquor license, and health permit dates.', href:'calendar.html' },
      ],
    },

    marketing_consulting: {
      headline: '📣 Let\'s set up your agency',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record and start a deal pipeline.',            href:'crm.html' },
        { id:'create_prop',    icon:'🎯', title:'Create a project proposal',     desc:'Build a client proposal with scope and investment.',        href:'doc-generator.html?template=mkt-proposal' },
        { id:'create_sow',     icon:'📐', title:'Create a statement of work',    desc:'Define deliverables, milestones, and timelines.',           href:'doc-generator.html?template=mkt-sow' },
        { id:'create_invoice', icon:'🧾', title:'Send your first invoice',       desc:'Bill a client for retainer or project services.',           href:'doc-generator.html?template=mkt-invoice' },
        { id:'time_track',     icon:'⏱️', title:'Set up time tracking',          desc:'Log hours per client and project for accurate billing.',    href:'accounting.html' },
        { id:'set_calendar',   icon:'📅', title:'Add project deadlines',         desc:'Track campaign launches, deliverable dates, and reviews.',  href:'calendar.html' },
      ],
    },

    cleaning: {
      headline: '🧹 Let\'s set up your cleaning business',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record and start your client pipeline.',       href:'crm.html' },
        { id:'create_est',     icon:'📝', title:'Create a cleaning estimate',    desc:'Quote a new client for one-time or recurring service.',     href:'doc-generator.html?template=cln-estimate' },
        { id:'service_agree',  icon:'🔄', title:'Create a service agreement',    desc:'Set up a recurring cleaning contract with your client.',    href:'doc-generator.html?template=cln-agreement' },
        { id:'create_invoice', icon:'🧾', title:'Create your first invoice',     desc:'Bill a client after a completed cleaning service.',         href:'doc-generator.html?template=cln-invoice' },
        { id:'field_app',      icon:'📱', title:'Set up the field app',          desc:'Capture before/after photos and get client signatures.',    href:'field-app.html' },
        { id:'set_calendar',   icon:'📅', title:'Track license & insurance',     desc:'Stay on top of business license and liability insurance.',  href:'calendar.html' },
      ],
    },

    auto_services: {
      headline: '🔧 Let\'s get your shop set up',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first customer',       desc:'Create a CRM record for your first vehicle customer.',      href:'crm.html' },
        { id:'service_auth',   icon:'📋', title:'Create a service authorization', desc:'Get customer sign-off before starting repairs.',          href:'doc-generator.html?template=auto-auth' },
        { id:'create_invoice', icon:'🧾', title:'Create a repair invoice',       desc:'Bill a customer for parts and labor.',                      href:'doc-generator.html?template=auto-invoice' },
        { id:'inspection',     icon:'🚗', title:'Run a vehicle inspection',      desc:'Document pre-purchase or safety inspection results.',       href:'doc-generator.html?template=auto-inspection' },
        { id:'set_reviews',    icon:'⭐', title:'Collect customer reviews',      desc:'Build your shop\'s reputation on Google and Yelp.',         href:'reviews.html' },
        { id:'set_calendar',   icon:'📅', title:'Track shop license & permits',  desc:'Add business license, emissions certification renewals.',    href:'calendar.html' },
      ],
    },

    general: {
      headline: '💼 Let\'s get your business going',
      steps: [
        { id:'add_client',     icon:'👤', title:'Add your first client',         desc:'Create a CRM record and start building your pipeline.',     href:'crm.html' },
        { id:'create_invoice', icon:'🧾', title:'Create your first invoice',     desc:'Generate a professional invoice for any service.',          href:'doc-generator.html?template=gen-invoice' },
        { id:'create_prop',    icon:'📄', title:'Create a proposal',             desc:'Send a proposal to win your first deal.',                   href:'doc-generator.html?template=gen-proposal' },
        { id:'setup_booking',  icon:'📅', title:'Enable online booking',         desc:'Let clients schedule appointments with you online.',        href:'booking.html' },
        { id:'set_reviews',    icon:'⭐', title:'Collect reviews',               desc:'Start building your business reputation online.',           href:'reviews.html' },
        { id:'set_calendar',   icon:'📅', title:'Add your first business date',  desc:'Track license renewals, deadlines, and key milestones.',    href:'calendar.html' },
      ],
    },
  };

  // ── State helpers ─────────────────────────────────────────────────────────
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

  function markDone(stepId) {
    var s = getState();
    s.done = s.done || [];
    if (s.done.indexOf(stepId) === -1) s.done.push(stepId);
    saveState(s);
    renderOrHide();
  }

  function dismiss() {
    var s = getState();
    s.dismissed = true;
    saveState(s);
    var el = document.getElementById(CONTAINER_ID);
    if (el) { el.style.animation = 'fag-fade-out .3s forwards'; setTimeout(function(){ el.remove(); }, 300); }
  }

  // ── Detect industry ───────────────────────────────────────────────────────
  function getIndustry() {
    try {
      var cfg = JSON.parse(localStorage.getItem('rv_workspace_config') || '{}');
      if (cfg.industry) return cfg.industry;
      var ob = JSON.parse(localStorage.getItem('rv_onboarding_config') || '{}');
      if (ob.industry) return ob.industry;
    } catch (_) {}
    return 'general';
  }

  // ── Inject CSS ────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('fag-css')) return;
    var s = document.createElement('style');
    s.id = 'fag-css';
    s.textContent = [
      '#' + CONTAINER_ID + '{background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:1.75rem;box-shadow:0 2px 12px rgba(0,0,0,.06);animation:fag-fade-in .4s ease;}',
      '@keyframes fag-fade-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}',
      '@keyframes fag-fade-out{to{opacity:0;transform:translateY(-10px)}}',
      '.fag-header{background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;}',
      '.fag-headline{color:#fff;font-weight:800;font-size:.95rem;}',
      '.fag-progress-wrap{display:flex;align-items:center;gap:.6rem;}',
      '.fag-progress-bar{width:100px;height:6px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden;}',
      '.fag-progress-fill{height:100%;background:#00E676;border-radius:3px;transition:width .4s ease;}',
      '.fag-progress-text{color:rgba(255,255,255,.7);font-size:.72rem;font-weight:600;white-space:nowrap;}',
      '.fag-dismiss{background:rgba(255,255,255,.12);border:none;color:rgba(255,255,255,.6);border-radius:6px;padding:.3rem .65rem;font-size:.72rem;cursor:pointer;white-space:nowrap;}',
      '.fag-dismiss:hover{background:rgba(255,255,255,.2);color:#fff;}',
      '.fag-steps{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0;}',
      '.fag-step{padding:.85rem 1.1rem;border-right:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;gap:.75rem;cursor:pointer;transition:background .15s;text-decoration:none;color:inherit;}',
      '.fag-step:hover{background:#f8fafc;}',
      '.fag-step.done{opacity:.5;}',
      '.fag-step-icon{font-size:1.35rem;flex-shrink:0;margin-top:.05rem;}',
      '.fag-step-body{flex:1;min-width:0;}',
      '.fag-step-title{font-weight:700;font-size:.85rem;color:#1e293b;display:flex;align-items:center;gap:.4rem;}',
      '.fag-step-desc{font-size:.75rem;color:#64748b;margin-top:.15rem;line-height:1.4;}',
      '.fag-check{width:18px;height:18px;border-radius:50%;border:2px solid #e2e8f0;display:inline-flex;align-items:center;justify-content:center;font-size:.65rem;flex-shrink:0;}',
      '.fag-check.done{background:#10b981;border-color:#10b981;color:#fff;}',
      '.fag-all-done{padding:1.5rem;text-align:center;color:#64748b;font-size:.9rem;}',
      '.fag-all-done .fag-done-icon{font-size:2rem;margin-bottom:.5rem;}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderOrHide() {
    var state    = getState();
    var industry = getIndustry();
    var guide    = GUIDES[industry] || GUIDES['general'];
    var done     = state.done || [];
    var doneCount = guide.steps.filter(function (s) { return done.indexOf(s.id) > -1; }).length;
    var total     = guide.steps.length;
    var pct       = Math.round((doneCount / total) * 100);

    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // All done — show a brief celebration then fade out
    if (doneCount === total) {
      container.innerHTML = '<div class="fag-all-done"><div class="fag-done-icon">🎉</div><strong>You\'re all set!</strong><br>Your business is ready to go. You can always find these tools in the sidebar.</div>';
      setTimeout(function () { dismiss(); }, 4000);
      return;
    }

    var stepsHtml = guide.steps.map(function (step) {
      var isDone = done.indexOf(step.id) > -1;
      var tag    = step.href ? 'a' : 'div';
      var attrs  = step.href
        ? 'href="' + step.href + '"'
        : 'onclick="FirstActionGuide.markDone(\'' + step.id + '\')" ';
      if (step.action && !step.href) {
        attrs = 'onclick="' + step.action + ';FirstActionGuide.markDone(\'' + step.id + '\')"';
      }
      return '<' + tag + ' class="fag-step' + (isDone ? ' done' : '') + '" ' + attrs + '>' +
        '<span class="fag-step-icon">' + step.icon + '</span>' +
        '<div class="fag-step-body">' +
          '<div class="fag-step-title">' +
            step.title +
            '<span class="fag-check' + (isDone ? ' done' : '') + '">' + (isDone ? '✓' : '') + '</span>' +
          '</div>' +
          '<div class="fag-step-desc">' + step.desc + '</div>' +
        '</div>' +
      '</' + tag + '>';
    }).join('');

    container.innerHTML =
      '<div class="fag-header">' +
        '<span class="fag-headline">' + guide.headline + '</span>' +
        '<div class="fag-progress-wrap">' +
          '<div class="fag-progress-bar"><div class="fag-progress-fill" style="width:' + pct + '%;"></div></div>' +
          '<span class="fag-progress-text">' + doneCount + ' / ' + total + ' done</span>' +
          '<button class="fag-dismiss" onclick="FirstActionGuide.dismiss()">Dismiss</button>' +
        '</div>' +
      '</div>' +
      '<div class="fag-steps">' + stepsHtml + '</div>';
  }

  // ── Show (insert into dashboard overview) ────────────────────────────────
  function show(force) {
    var state = getState();
    if (!force && state.dismissed) return;

    injectCSS();

    // Find insertion point — before the stat grid in the overview
    var insertBefore = document.querySelector('#dtab-overview .grid-4');
    if (!insertBefore) insertBefore = document.querySelector('#dtab-overview .feature-tiles');
    if (!insertBefore) return;

    // Remove existing if any
    var old = document.getElementById(CONTAINER_ID);
    if (old) old.remove();

    var el = document.createElement('div');
    el.id = CONTAINER_ID;
    insertBefore.parentNode.insertBefore(el, insertBefore);

    renderOrHide();
  }

  // ── Auto-show after onboarding completes ─────────────────────────────────
  function autoShow() {
    // Show if onboarding was just done and guide hasn't been dismissed
    var state = getState();
    if (state.dismissed) return;
    var onboardingDone = localStorage.getItem('rv_onboarding_done');
    if (!onboardingDone) return;
    // Only show on the dashboard overview tab
    if (!document.getElementById('dtab-overview')) return;
    show();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.FirstActionGuide = {
    show:     show,
    dismiss:  dismiss,
    markDone: markDone,
    reset:    function () { localStorage.removeItem(STORAGE_KEY); show(true); },
  };

  // Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoShow);
  } else {
    setTimeout(autoShow, 200); // slight delay so dashboard renders first
  }

})();
