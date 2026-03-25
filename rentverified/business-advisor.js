/**
 * RentVerified — AI Business Advisor
 * ====================================
 * Business Health Score (0–100) + Prioritized Action List + Setup Wizard
 *
 * Usage:
 *   <script src="business-advisor.js" data-industry="construction"></script>
 *   <div id="rv-advisor"></div>
 *   <div id="rv-setup-wizard"></div>
 *
 * Attributes:
 *   data-industry  = property_management|construction|commercial|str|accounting|attorney|insurance|lending|general
 *   data-state     = UT (2-letter state code, default UT)
 *
 * Public API:
 *   RVAdvisor.getScore()        — returns { score, grade, factors, actions }
 *   RVAdvisor.refresh()         — re-calculate and re-render
 *   RVAdvisor.openSetupWizard() — show setup wizard modal
 *   RVAdvisor.runDailyCheck()   — simulate the daily AI check
 */
(function() {
  'use strict';

  // ── Config from script tag ──
  var s = document.currentScript || document.querySelector('script[src*="business-advisor"]');
  var CFG = {
    industry: (s && s.getAttribute('data-industry')) || null,
    state: (s && s.getAttribute('data-state')) || 'UT'
  };

  // ── Detect industry from URL ──
  function getIndustry() {
    if (CFG.industry) return CFG.industry;
    var p = location.pathname;
    if (p.indexOf('jobs') > -1 || p.indexOf('vendor') > -1) return 'construction';
    if (p.indexOf('commercial') > -1) return 'commercial';
    if (p.indexOf('str') > -1) return 'str';
    if (p.indexOf('accounting') > -1) return 'accounting';
    if (p.indexOf('matters') > -1) return 'attorney';
    if (p.indexOf('insurance') > -1) return 'insurance';
    if (p.indexOf('loan') > -1 || p.indexOf('funding') > -1) return 'lending';
    return 'property_management';
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEALTH SCORE ENGINE
  // ══════════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════════
  // BUSINESS CONTEXT PROFILES (per business_type)
  // ══════════════════════════════════════════════════════════════════════
  // Each profile adapts: licenses, deadlines, seasonal patterns,
  // recommended products, network connections, and AI language.

  var BUSINESS_CONTEXT = {
    landlord: {
      label: 'Landlord / Property Manager',
      icon: '🏠',
      licenses: { UT: ['Real Estate License','Business License','E&O Insurance'] },
      deadlines: [
        { month:1, day:31, title:'Issue 1099s to Contractors', type:'tax_filing' },
        { month:3, day:1,  title:'Spring Property Inspections', type:'inspection' },
        { month:6, day:1,  title:'Mid-Year Lease Renewals Review', type:'lease_renewal' },
        { month:9, day:1,  title:'Fall Maintenance & Winterization', type:'inspection' },
        { month:12, day:31, title:'Year-End Financials & Owner Statements', type:'tax_filing' }
      ],
      seasonal: { spring:'Turnover season — prep vacant units', summer:'Peak leasing season', fall:'Winterization & heating checks', winter:'Tax prep & 1099s' },
      affiliateCategories: ['plumbing','electrical','appliances','cleaning','safety','landscaping','painting'],
      networkTypes: ['Contractors','Plumbers','Electricians','Inspectors','Attorneys','Accountants'],
      language: { revenue:'Rent Revenue', client:'Tenant', project:'Property', invoice:'Rent Invoice' },
      checklist90: ['Set up rent collection','Upload all leases','Add tenant contacts','Configure maintenance flow','Set up owner statements','Connect bank account','Create first invoice','Add insurance certs','Schedule inspections','Market first vacancy']
    },
    contractor: {
      label: 'Contractor / Trades',
      icon: '🏗️',
      licenses: { UT: ['Contractor License','Business License','General Liability Insurance','Workers Comp','Vehicle Insurance'] },
      deadlines: [
        { month:1, day:31, title:'Workers Comp Audit Due', type:'insurance_renewal' },
        { month:3, day:15, title:'Contractor License Renewal Check', type:'license_renewal' },
        { month:6, day:1,  title:'Mid-Year Safety Training Update', type:'compliance_audit' },
        { month:9, day:1,  title:'Fall Season Bidding Push', type:'custom' }
      ],
      seasonal: { spring:'Busiest season — book crews early', summer:'Peak construction, hydrate crews', fall:'Wrap outdoor projects, bid winter work', winter:'Indoor remodels & planning season' },
      affiliateCategories: ['plumbing','electrical','hvac','painting','flooring','roofing','safety'],
      networkTypes: ['Subcontractors','Suppliers','Architects','Property Managers','Inspectors'],
      language: { revenue:'Job Revenue', client:'Client', project:'Job', invoice:'Construction Invoice' },
      checklist90: ['Get contractor license on file','Set up job tracking','Add crew members','Create estimate template','Set up time tracking','Configure invoicing','Add insurance certs','Order safety equipment','Create material price list','Set up equipment tracking']
    },
    hairstylist: {
      label: 'Hairstylist / Salon',
      icon: '💇',
      licenses: { UT: ['Cosmetology License','Business License','Salon Permit','General Liability Insurance'] },
      deadlines: [
        { month:1, day:31, title:'Cosmetology License Renewal Check', type:'license_renewal' },
        { month:3, day:1,  title:'Q1 Continuing Education Hours Due', type:'compliance_audit' },
        { month:6, day:1,  title:'Salon Health Inspection Prep', type:'inspection' },
        { month:9, day:1,  title:'Holiday Season Booking Prep', type:'custom' },
        { month:11, day:1, title:'Restock Holiday Gift Sets', type:'custom' }
      ],
      seasonal: { spring:'Prom/wedding season bookings', summer:'Beach hair & color season', fall:'Back-to-school cuts & holiday prep', winter:'Holiday parties & gift certificates' },
      affiliateCategories: ['office','cleaning'],
      networkTypes: ['Other Stylists','Makeup Artists','Photographers','Wedding Planners','Spa Owners'],
      language: { revenue:'Service Revenue', client:'Client', project:'Appointment', invoice:'Service Invoice' },
      checklist90: ['Upload cosmetology license','Set up appointment booking','Add client contacts','Create service menu','Set up invoicing','Add insurance cert','Create social media profiles','Build portfolio page','Set up retail product tracking','Join local stylist network']
    },
    attorney: {
      label: 'Attorney / Law Firm',
      icon: '⚖️',
      licenses: { UT: ['Bar License','Business License','Malpractice Insurance','Trust Account Bond'] },
      deadlines: [
        { month:1, day:15, title:'MCLE Compliance Check', type:'license_renewal' },
        { month:3, day:15, title:'Bar Dues Payment Due', type:'license_renewal' },
        { month:6, day:30, title:'Trust Account Audit', type:'compliance_audit' },
        { month:7, day:31, title:'MCLE Reporting Period Ends', type:'compliance_audit' }
      ],
      seasonal: { spring:'Tax dispute season', summer:'Real estate closings peak', fall:'Business formation & year-end planning', winter:'Tax controversy & estate planning' },
      affiliateCategories: ['office'],
      networkTypes: ['Other Attorneys','Paralegals','Accountants','Real Estate Agents','Mediators'],
      language: { revenue:'Billed Revenue', client:'Client', project:'Matter', invoice:'Legal Invoice' },
      checklist90: ['Set up matter management','Configure billing rates','Create retainer agreement','Set up trust accounting','Configure conflict checking','Add client contacts','Set up deadline tracking','Create engagement letter','Configure document management','Set up court calendar sync']
    },
    accountant: {
      label: 'Accountant / Bookkeeper',
      icon: '📊',
      licenses: { UT: ['CPA License','Business License','E&O Insurance','PTIN Registration'] },
      deadlines: [
        { month:1, day:31, title:'Issue 1099s & W-2s for Clients', type:'tax_filing' },
        { month:4, day:15, title:'Individual Tax Returns Due', type:'tax_filing' },
        { month:6, day:15, title:'CPE Hours Mid-Year Check', type:'compliance_audit' },
        { month:9, day:15, title:'Extended Returns Due', type:'tax_filing' },
        { month:12, day:31, title:'CPE Requirement Completion', type:'compliance_audit' }
      ],
      seasonal: { spring:'Tax season crunch', summer:'Extensions & quarterly filings', fall:'Year-end tax planning', winter:'1099 prep & new client onboarding' },
      affiliateCategories: ['office'],
      networkTypes: ['Attorneys','Financial Advisors','Bookkeepers','Payroll Services','Tax Resolution Specialists'],
      language: { revenue:'Fee Revenue', client:'Client', project:'Engagement', invoice:'Professional Invoice' },
      checklist90: ['Set up chart of accounts','Configure client billing','Create engagement letter','Set up time tracking','Configure invoicing','Add client contacts','Set up document storage','Configure tax deadline reminders','Create report templates','Set up bank feed connections']
    },
    insurance_agent: {
      label: 'Insurance Agent / Broker',
      icon: '🛡️',
      licenses: { UT: ['Insurance Producer License','Business License','E&O Insurance','Surplus Lines License'] },
      deadlines: [
        { month:2, day:28, title:'CE Credits Renewal Check', type:'license_renewal' },
        { month:3, day:31, title:'Carrier Appointment Renewals', type:'license_renewal' },
        { month:6, day:30, title:'Mid-Year Book of Business Review', type:'custom' },
        { month:10, day:1, title:'Open Enrollment Prep (Health/Benefits)', type:'custom' }
      ],
      seasonal: { spring:'Renewals season & new policies', summer:'Mid-year reviews & cross-selling', fall:'Open enrollment & benefit plans', winter:'Year-end renewals & policy audits' },
      affiliateCategories: ['office','safety'],
      networkTypes: ['Real Estate Agents','Mortgage Brokers','Property Managers','Attorneys','Financial Advisors'],
      language: { revenue:'Commission Revenue', client:'Policyholder', project:'Policy', invoice:'Premium Invoice' },
      checklist90: ['Upload producer license','Set up carrier appointments','Create policy tracking','Configure client management','Create quote templates','Set up renewal tracking','Add carrier contacts','Configure commission tracking','Create marketing materials','Join local insurance association']
    },
    marketing_agency: {
      label: 'Marketing Agency',
      icon: '📣',
      licenses: { UT: ['Business License','General Liability Insurance','Cyber Liability Insurance'] },
      deadlines: [
        { month:1, day:15, title:'Annual Client Contract Renewals', type:'contract_renewal' },
        { month:3, day:31, title:'Q1 Campaign Performance Reviews', type:'custom' },
        { month:6, day:30, title:'Mid-Year Strategy Presentations', type:'custom' },
        { month:10, day:1, title:'Holiday Campaign Planning Kickoff', type:'custom' }
      ],
      seasonal: { spring:'Campaign launches & budget season', summer:'Content production peak', fall:'Holiday marketing prep & Black Friday', winter:'Year-end reporting & strategy planning' },
      affiliateCategories: ['office'],
      networkTypes: ['Graphic Designers','Photographers','Videographers','Web Developers','PR Specialists'],
      language: { revenue:'Retainer Revenue', client:'Client', project:'Campaign', invoice:'Agency Invoice' },
      checklist90: ['Set up project management','Create client onboarding flow','Configure invoicing & retainers','Build portfolio page','Set up reporting templates','Add client contacts','Create proposal templates','Configure time tracking','Set up social media tools','Build case study templates']
    },
    restaurant: {
      label: 'Restaurant / Food Service',
      icon: '🍽️',
      licenses: { UT: ['Food Handler Permit','Business License','Health Department Permit','Liquor License','General Liability Insurance','Workers Comp'] },
      deadlines: [
        { month:1, day:31, title:'Health Inspection Prep', type:'inspection' },
        { month:3, day:1,  title:'Food Handler Cert Renewals', type:'license_renewal' },
        { month:5, day:1,  title:'Summer Menu & Staffing Plan', type:'custom' },
        { month:7, day:1,  title:'Health Inspection (Mid-Year)', type:'inspection' },
        { month:10, day:1, title:'Holiday Menu & Catering Prep', type:'custom' },
        { month:12, day:31, title:'Liquor License Renewal', type:'license_renewal' }
      ],
      seasonal: { spring:'Patio season prep & menu refresh', summer:'Peak dining season, manage staffing', fall:'Catering & holiday bookings', winter:'Slow season — optimize costs & plan' },
      affiliateCategories: ['cleaning','appliances','safety'],
      networkTypes: ['Food Suppliers','Equipment Vendors','Health Inspectors','Marketing Agencies','Event Planners'],
      language: { revenue:'Sales Revenue', client:'Customer', project:'Location', invoice:'Vendor Invoice' },
      checklist90: ['Get health permit on file','Set up POS tracking','Add staff schedules','Create vendor contacts','Set up food cost tracking','Add insurance certs','Create menu pricing','Set up inventory system','Build online ordering page','Register for local events']
    },
    real_estate_agent: {
      label: 'Real Estate Agent / Broker',
      icon: '🏢',
      licenses: { UT: ['Real Estate License','Business License','E&O Insurance','MLS Membership'] },
      deadlines: [
        { month:1, day:15, title:'CE Credit Renewal Check', type:'license_renewal' },
        { month:3, day:31, title:'MLS Dues Payment', type:'license_renewal' },
        { month:6, day:30, title:'NAR Membership Renewal', type:'license_renewal' },
        { month:9, day:1,  title:'Fall Market Listing Push', type:'custom' }
      ],
      seasonal: { spring:'Peak listing season — get inventory', summer:'Closings peak & buyer tours', fall:'Market slowing — focus on expired listings', winter:'Investor outreach & off-market deals' },
      affiliateCategories: ['office','safety','cleaning'],
      networkTypes: ['Mortgage Brokers','Inspectors','Title Companies','Contractors','Stagers'],
      language: { revenue:'Commission Revenue', client:'Client', project:'Transaction', invoice:'Commission Invoice' },
      checklist90: ['Upload real estate license','Set up CRM for leads','Create listing presentation','Set up transaction tracking','Configure commission tracking','Add lender contacts','Create market report template','Build personal brand page','Set up email drip campaigns','Join local board committee']
    },
    retailer: {
      label: 'Retailer / Shop Owner',
      icon: '🛍️',
      licenses: { UT: ['Business License','Sales Tax Permit','General Liability Insurance','Workers Comp'] },
      deadlines: [
        { month:1, day:31, title:'Annual Inventory Count', type:'compliance_audit' },
        { month:4, day:30, title:'Q1 Sales Tax Filing', type:'tax_filing' },
        { month:7, day:31, title:'Q2 Sales Tax Filing', type:'tax_filing' },
        { month:9, day:1,  title:'Holiday Inventory Ordering Deadline', type:'custom' },
        { month:10, day:31, title:'Q3 Sales Tax Filing', type:'tax_filing' },
        { month:1, day:31, title:'Q4 Sales Tax Filing', type:'tax_filing' }
      ],
      seasonal: { spring:'Spring clearance & new arrivals', summer:'Back-to-school prep', fall:'Holiday inventory & marketing', winter:'Holiday sales peak & year-end clearance' },
      affiliateCategories: ['office','safety','cleaning'],
      networkTypes: ['Wholesalers','Distributors','Visual Merchandisers','Marketing Agencies','Accountants'],
      language: { revenue:'Sales Revenue', client:'Customer', project:'Store', invoice:'Wholesale Invoice' },
      checklist90: ['Get sales tax permit','Set up POS/inventory tracking','Add vendor contacts','Create pricing strategy','Set up invoicing','Add insurance certs','Build online store','Create social media profiles','Set up loyalty program','Plan first promotional event']
    },
    general_business: {
      label: 'General Business',
      icon: '💼',
      licenses: { UT: ['Business License','General Liability Insurance'] },
      deadlines: [],
      seasonal: { spring:'Q1 review & growth planning', summer:'Mid-year check-in', fall:'Q4 push & year-end planning', winter:'Tax prep & new year goals' },
      affiliateCategories: ['office','cleaning','safety'],
      networkTypes: ['Accountants','Attorneys','Marketing Agencies','IT Services','Business Coaches'],
      language: { revenue:'Revenue', client:'Client', project:'Project', invoice:'Invoice' },
      checklist90: ['Register business entity','Get business license','Set up accounting','Create first invoice','Add client contacts','Set up document storage','Configure email/phone','Create service agreement','Set up social media','Build website/landing page']
    }
  };

  // ── Map old industry keys → business_type ──
  var INDUSTRY_TO_TYPE = {
    property_management: 'landlord',
    construction: 'contractor',
    commercial: 'real_estate_agent',
    str: 'landlord',
    accounting: 'accountant',
    attorney: 'attorney',
    insurance: 'insurance_agent',
    lending: 'general_business',
    general: 'general_business'
  };

  // ── Get active business context ──
  function getBusinessType() {
    // Check localStorage for explicit business_type
    var saved = localStorage.getItem('rv_business_type');
    if (saved && BUSINESS_CONTEXT[saved]) return saved;
    // Fall back to industry → type mapping
    return INDUSTRY_TO_TYPE[getIndustry()] || 'general_business';
  }

  function getContext() {
    return BUSINESS_CONTEXT[getBusinessType()] || BUSINESS_CONTEXT.general_business;
  }

  // ── Legacy compatibility wrapper ──
  var LICENSE_REQS = {};
  Object.keys(BUSINESS_CONTEXT).forEach(function(k) {
    LICENSE_REQS[k] = BUSINESS_CONTEXT[k].licenses;
  });
  // Also map old industry keys
  Object.keys(INDUSTRY_TO_TYPE).forEach(function(k) {
    if (!LICENSE_REQS[k]) LICENSE_REQS[k] = BUSINESS_CONTEXT[INDUSTRY_TO_TYPE[k]].licenses;
  });

  // ── Tax Deadlines (US Federal + UT) ──
  var TAX_DEADLINES = [
    { month:1, day:15, title:'Q4 Estimated Tax Payment', type:'tax_payment' },
    { month:1, day:31, title:'W-2 / 1099 Filing Deadline', type:'tax_filing' },
    { month:3, day:15, title:'S-Corp / Partnership Tax Return (1120S/1065)', type:'tax_filing' },
    { month:4, day:15, title:'Individual / C-Corp Tax Return', type:'tax_filing' },
    { month:4, day:15, title:'Q1 Estimated Tax Payment', type:'tax_payment' },
    { month:6, day:15, title:'Q2 Estimated Tax Payment', type:'tax_payment' },
    { month:9, day:15, title:'Q3 Estimated Tax Payment', type:'tax_payment' },
    { month:9, day:15, title:'Extended S-Corp / Partnership Returns Due', type:'tax_filing' },
    { month:10, day:15, title:'Extended Individual / C-Corp Returns Due', type:'tax_filing' }
  ];

  // ── Score Calculation ──
  function calculateScore() {
    var factors = [];
    var score = 100;
    var industry = getIndustry();
    var state = CFG.state;

    // 1. LICENSE / INSURANCE STATUS (max 30 pts)
    var ctx = getContext();
    var bizType = getBusinessType();
    var reqs = (ctx.licenses || {})[state] || [];
    var deadlines = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
    var today = new Date();
    var todayStr = today.toISOString().split('T')[0];
    var soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    var licDeadlines = deadlines.filter(function(d) {
      return d.deadline_type === 'license_renewal' || d.deadline_type === 'insurance_renewal';
    });

    var overdueLic = licDeadlines.filter(function(d) { return d.due_date < todayStr && d.status !== 'completed'; });
    var soonLic = licDeadlines.filter(function(d) { return d.due_date >= todayStr && d.due_date <= soon && d.status !== 'completed'; });

    if (overdueLic.length > 0) {
      score -= 25;
      factors.push({ label: 'Expired license/insurance', impact: -25, severity: 'red', detail: overdueLic.map(function(d) { return d.title; }).join(', ') });
    } else if (soonLic.length > 0) {
      score -= 10;
      factors.push({ label: 'License/insurance expiring soon', impact: -10, severity: 'yellow', detail: soonLic.map(function(d) { return d.title; }).join(', ') });
    } else if (licDeadlines.length === 0 && reqs.length > 0) {
      score -= 15;
      factors.push({ label: 'No license/insurance deadlines tracked', impact: -15, severity: 'yellow', detail: 'Add your ' + reqs.join(', ') + ' expiration dates' });
    } else {
      factors.push({ label: 'Licenses & insurance current', impact: 0, severity: 'green', detail: 'All tracked items are current' });
    }

    // 2. OUTSTANDING INVOICES (max 20 pts)
    var docs = JSON.parse(localStorage.getItem('rv_generated_docs') || '[]');
    var invoices = docs.filter(function(d) { return d.templateId && d.templateId.indexOf('invoice') > -1; });
    var totalInvoices = invoices.length;
    // Simulate: if no invoices at all, slight penalty
    if (totalInvoices === 0) {
      score -= 5;
      factors.push({ label: 'No invoices sent', impact: -5, severity: 'yellow', detail: 'Start sending invoices to track revenue' });
    } else {
      factors.push({ label: 'Invoicing active', impact: 0, severity: 'green', detail: totalInvoices + ' invoices on file' });
    }

    // 3. REVENUE TREND (max 15 pts) — check transactions
    var transactions = JSON.parse(localStorage.getItem('rv_transactions') || '[]');
    var thisMonth = today.getMonth();
    var thisYear = today.getFullYear();
    var thisMonthRev = transactions.filter(function(t) {
      var d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.type === 'income';
    }).reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);
    var lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    var lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    var lastMonthRev = transactions.filter(function(t) {
      var d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && t.type === 'income';
    }).reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);

    if (transactions.length === 0) {
      score -= 10;
      factors.push({ label: 'No revenue tracked', impact: -10, severity: 'yellow', detail: 'Record transactions in Accounting to track revenue trends' });
    } else if (lastMonthRev > 0 && thisMonthRev < lastMonthRev * 0.7) {
      score -= 15;
      factors.push({ label: 'Revenue declining (30%+)', impact: -15, severity: 'red', detail: 'This month: $' + thisMonthRev.toFixed(0) + ' vs last: $' + lastMonthRev.toFixed(0) });
    } else if (lastMonthRev > 0 && thisMonthRev < lastMonthRev * 0.9) {
      score -= 5;
      factors.push({ label: 'Revenue slightly down', impact: -5, severity: 'yellow', detail: 'This month: $' + thisMonthRev.toFixed(0) + ' vs last: $' + lastMonthRev.toFixed(0) });
    } else {
      factors.push({ label: 'Revenue trend healthy', impact: 0, severity: 'green', detail: transactions.length + ' transactions recorded' });
    }

    // 4. TAX DEADLINES (max 15 pts)
    var taxDeadlines = deadlines.filter(function(d) {
      return (d.deadline_type === 'tax_filing' || d.deadline_type === 'tax_payment') && d.status !== 'completed';
    });
    var overdueTax = taxDeadlines.filter(function(d) { return d.due_date < todayStr; });
    var soonTax = taxDeadlines.filter(function(d) { return d.due_date >= todayStr && d.due_date <= soon; });

    if (overdueTax.length > 0) {
      score -= 15;
      factors.push({ label: 'Overdue tax deadlines', impact: -15, severity: 'red', detail: overdueTax.map(function(d) { return d.title; }).join(', ') });
    } else if (soonTax.length > 0) {
      score -= 5;
      factors.push({ label: 'Tax deadline approaching', impact: -5, severity: 'yellow', detail: soonTax[0].title + ' due ' + soonTax[0].due_date });
    } else {
      factors.push({ label: 'Tax deadlines on track', impact: 0, severity: 'green', detail: 'No upcoming tax deadlines in 30 days' });
    }

    // 5. SOCIAL / MARKETING (max 10 pts)
    var lastPost = localStorage.getItem('rv_last_social_post');
    if (!lastPost) {
      score -= 10;
      factors.push({ label: 'No social media activity tracked', impact: -10, severity: 'yellow', detail: 'Connect social accounts to boost visibility' });
    } else {
      var daysSince = Math.floor((Date.now() - new Date(lastPost).getTime()) / 86400000);
      if (daysSince > 30) {
        score -= 10;
        factors.push({ label: 'No social post in 30+ days', impact: -10, severity: 'red', detail: 'Last post ' + daysSince + ' days ago' });
      } else if (daysSince > 7) {
        score -= 5;
        factors.push({ label: 'Social posting could improve', impact: -5, severity: 'yellow', detail: 'Last post ' + daysSince + ' days ago' });
      } else {
        factors.push({ label: 'Social media active', impact: 0, severity: 'green', detail: 'Posted ' + daysSince + ' days ago' });
      }
    }

    // 6. REVIEWS (max 10 pts)
    var engagements = JSON.parse(localStorage.getItem('rv_pro_engagements') || '[]');
    var reviewCount = engagements.filter(function(e) { return e.status === 'completed'; }).length;
    if (reviewCount === 0) {
      score -= 5;
      factors.push({ label: 'No client reviews', impact: -5, severity: 'yellow', detail: 'Ask completed clients for reviews to build trust' });
    } else {
      factors.push({ label: reviewCount + ' completed engagements', impact: 0, severity: 'green', detail: 'Active client history builds credibility' });
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score: score,
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
      color: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
      label: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Attention' : 'At Risk',
      factors: factors
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // ACTION LIST ENGINE
  // ══════════════════════════════════════════════════════════════════════

  function generateActions() {
    var result = calculateScore();
    var actions = [];
    var industry = getIndustry();

    // Build actions from factors
    result.factors.forEach(function(f) {
      if (f.severity === 'red') {
        if (f.label.indexOf('Expired') > -1 || f.label.indexOf('license') > -1) {
          actions.push({ priority: 1, icon: '🚨', text: 'Renew expired license/insurance immediately', action: 'openDeadlines', btn: 'Manage Deadlines', severity: 'red' });
        }
        if (f.label.indexOf('Revenue declining') > -1) {
          var lang = getContext().language || {};
          actions.push({ priority: 2, icon: '📉', text: (lang.revenue || 'Revenue') + ' down 30%+ — send outstanding ' + (lang.invoice || 'invoice').toLowerCase() + ' reminders', action: 'openInvoices', btn: 'Send Reminders', severity: 'red' });
        }
        if (f.label.indexOf('Overdue tax') > -1) {
          actions.push({ priority: 1, icon: '⚠️', text: 'Overdue tax deadline — file or pay immediately', action: 'openAccounting', btn: 'Open Accounting', severity: 'red' });
        }
        if (f.label.indexOf('social') > -1 && f.label.indexOf('30+') > -1) {
          actions.push({ priority: 3, icon: '📱', text: 'No social posts in 30+ days — share a listing or update', action: 'openShare', btn: 'Post Now', severity: 'red' });
        }
      }
      if (f.severity === 'yellow') {
        if (f.label.indexOf('expiring soon') > -1) {
          actions.push({ priority: 2, icon: '⏰', text: 'License/insurance expiring within 30 days', action: 'openDeadlines', btn: 'View Deadlines', severity: 'yellow' });
        }
        if (f.label.indexOf('No license') > -1 && f.label.indexOf('tracked') > -1) {
          actions.push({ priority: 2, icon: '📋', text: 'Set up license & insurance tracking', action: 'openSetupWizard', btn: 'Setup Now', severity: 'yellow' });
        }
        if (f.label.indexOf('No invoices') > -1) {
          actions.push({ priority: 3, icon: '💰', text: 'Start invoicing clients to track revenue', action: 'openDocGen', btn: 'Create Invoice', severity: 'yellow' });
        }
        if (f.label.indexOf('No revenue') > -1) {
          actions.push({ priority: 3, icon: '📊', text: 'Record your first transaction to track revenue', action: 'openAccounting', btn: 'Add Transaction', severity: 'yellow' });
        }
        if (f.label.indexOf('No social') > -1 && f.label.indexOf('tracked') > -1) {
          actions.push({ priority: 4, icon: '📱', text: 'Share your business on social media', action: 'openShare', btn: 'Share Now', severity: 'yellow' });
        }
        if (f.label.indexOf('Tax deadline') > -1) {
          actions.push({ priority: 2, icon: '📅', text: f.detail, action: 'openAccounting', btn: 'Prepare Filing', severity: 'yellow' });
        }
        if (f.label.indexOf('No client reviews') > -1) {
          actions.push({ priority: 5, icon: '⭐', text: 'Ask a recent client for a review', action: 'openCRM', btn: 'Request Review', severity: 'yellow' });
        }
        if (f.label.indexOf('posting could improve') > -1) {
          actions.push({ priority: 4, icon: '📱', text: 'Post on social media to stay visible', action: 'openShare', btn: 'Share Update', severity: 'yellow' });
        }
        if (f.label.indexOf('Revenue slightly') > -1) {
          actions.push({ priority: 3, icon: '📈', text: 'Revenue dipped — consider a promotion or outreach', action: 'openCRM', btn: 'View CRM', severity: 'yellow' });
        }
      }
    });

    // Always include funding check if score is low
    if (result.score < 60) {
      actions.push({ priority: 4, icon: '🏦', text: 'Explore funding options to stabilize cash flow', action: 'openFunding', btn: 'View Funding', severity: 'yellow' });
    }

    // Sort by priority, limit to 5
    actions.sort(function(a, b) { return a.priority - b.priority; });
    return actions.slice(0, 5);
  }

  // ── Action handlers ──
  var ACTION_HANDLERS = {
    openDeadlines: function() { RVAdvisor.openDeadlineManager(); },
    openInvoices: function() { window.location.href = 'doc-generator.html'; },
    openDocGen: function() { window.location.href = 'doc-generator.html'; },
    openAccounting: function() { window.location.href = 'accounting.html'; },
    openShare: function() { if (typeof RVShare !== 'undefined') RVShare.open(); else window.open('https://facebook.com', '_blank'); },
    openCRM: function() { window.location.href = 'crm.html'; },
    openFunding: function() { window.location.href = 'funding.html'; },
    openSetupWizard: function() { RVAdvisor.openSetupWizard(); }
  };

  // ══════════════════════════════════════════════════════════════════════
  // RENDER — HEALTH SCORE WIDGET
  // ══════════════════════════════════════════════════════════════════════

  function renderAdvisor() {
    var el = document.getElementById('rv-advisor');
    if (!el) return;

    var result = calculateScore();
    var actions = generateActions();

    var html = '<div style="background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:1.5rem;box-shadow:0 1px 4px rgba(0,0,0,.06);">';

    // ── Header ──
    html += '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">';
    var ctx = getContext();
    html += '<div style="display:flex;align-items:center;gap:.75rem;">';
    html += '<span style="font-size:1.4rem;">' + (ctx.icon || '🤖') + '</span>';
    html += '<div><div style="color:#fff;font-weight:800;font-size:1rem;">AI Business Advisor</div>';
    html += '<div style="color:#94a3b8;font-size:.75rem;">' + ctx.label + ' &middot; Daily health check</div></div>';
    html += '</div>';
    html += '<button onclick="RVAdvisor.openSetupWizard()" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;">⚙️ Setup Wizard</button>';
    html += '</div>';

    // ── Score Card ──
    html += '<div style="padding:1.5rem;display:flex;gap:1.5rem;align-items:center;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;">';

    // Score circle
    var circumference = 2 * Math.PI * 45;
    var offset = circumference - (result.score / 100) * circumference;
    html += '<div style="position:relative;width:110px;height:110px;flex-shrink:0;">';
    html += '<svg width="110" height="110" viewBox="0 0 110 110">';
    html += '<circle cx="55" cy="55" r="45" fill="none" stroke="#f1f5f9" stroke-width="8"/>';
    html += '<circle cx="55" cy="55" r="45" fill="none" stroke="' + result.color + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 55 55)" style="transition:stroke-dashoffset 1s ease;"/>';
    html += '</svg>';
    html += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">';
    html += '<div style="font-size:1.8rem;font-weight:900;color:' + result.color + ';">' + result.score + '</div>';
    html += '<div style="font-size:.65rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">' + result.label + '</div>';
    html += '</div></div>';

    // Factor breakdown
    html += '<div style="flex:1;min-width:200px;">';
    html += '<div style="font-weight:700;font-size:.88rem;color:#1e293b;margin-bottom:.5rem;">Health Factors</div>';
    result.factors.forEach(function(f) {
      var dot = f.severity === 'green' ? '🟢' : f.severity === 'yellow' ? '🟡' : '🔴';
      html += '<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;font-size:.82rem;">';
      html += '<span>' + dot + '</span>';
      html += '<span style="flex:1;color:#374151;">' + f.label + '</span>';
      if (f.impact !== 0) html += '<span style="color:' + (f.impact < 0 ? '#ef4444' : '#10b981') + ';font-weight:700;font-size:.78rem;">' + f.impact + '</span>';
      html += '</div>';
    });
    html += '</div></div>';

    // ── Seasonal Insight ──
    var seasons = ctx.seasonal || {};
    var month = new Date().getMonth();
    var season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'fall' : 'winter';
    var seasonTip = seasons[season];
    if (seasonTip) {
      html += '<div style="padding:.75rem 1.5rem;">';
      html += '<div style="background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:10px;padding:.75rem 1rem;display:flex;align-items:center;gap:.5rem;font-size:.82rem;">';
      html += '<span>🗓️</span><span style="color:#1e40af;font-weight:600;">' + season.charAt(0).toUpperCase() + season.slice(1) + ' Tip:</span>';
      html += '<span style="color:#374151;">' + seasonTip + '</span>';
      html += '</div></div>';
    }

    // ── Suggested Network Connections ──
    var netTypes = ctx.networkTypes || [];
    if (netTypes.length > 0) {
      html += '<div style="padding:0 1.5rem .5rem;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">';
      html += '<span style="font-size:.72rem;color:#64748b;font-weight:700;">🤝 Connect with:</span>';
      netTypes.slice(0, 5).forEach(function(n) {
        html += '<span style="font-size:.68rem;padding:2px 8px;background:#f1f5f9;border-radius:99px;color:#475569;font-weight:600;">' + n + '</span>';
      });
      html += '</div>';
    }

    // ── Action List ──
    if (actions.length > 0) {
      html += '<div style="padding:1rem 1.5rem;">';
      html += '<div style="font-weight:700;font-size:.88rem;color:#1e293b;margin-bottom:.75rem;">📋 Priority Action List</div>';

      actions.forEach(function(a, i) {
        var bg = a.severity === 'red' ? '#fef2f2' : '#fffbeb';
        var border = a.severity === 'red' ? '#fecaca' : '#fde68a';
        var btnBg = a.severity === 'red' ? '#dc2626' : '#f59e0b';
        html += '<div style="display:flex;align-items:center;gap:.75rem;padding:.65rem .9rem;background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;margin-bottom:.5rem;">';
        html += '<span style="font-size:1.1rem;">' + a.icon + '</span>';
        html += '<span style="flex:1;font-size:.85rem;color:#374151;font-weight:500;">' + a.text + '</span>';
        html += '<button onclick="RVAdvisor._handleAction(\'' + a.action + '\')" style="background:' + btnBg + ';color:#fff;border:none;border-radius:7px;padding:.4rem .85rem;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;">' + a.btn + '</button>';
        html += '</div>';
      });

      html += '</div>';
    } else {
      html += '<div style="padding:1rem 1.5rem;text-align:center;color:#10b981;font-weight:600;font-size:.9rem;">✨ Looking great! No urgent actions needed.</div>';
    }

    // ── Deadline Quick-View ──
    html += '<div style="padding:0 1.5rem 1rem;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">';
    html += '<span style="font-weight:700;font-size:.85rem;color:#1e293b;">📅 Upcoming Deadlines</span>';
    html += '<button onclick="RVAdvisor.openDeadlineManager()" style="background:none;border:none;color:#3b82f6;font-size:.78rem;font-weight:700;cursor:pointer;">Manage →</button>';
    html += '</div>';
    var deadlines = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]')
      .filter(function(d) { return d.status !== 'completed' && d.status !== 'dismissed'; })
      .sort(function(a, b) { return new Date(a.due_date) - new Date(b.due_date); })
      .slice(0, 3);

    if (deadlines.length === 0) {
      html += '<div style="padding:.75rem;text-align:center;color:#94a3b8;font-size:.82rem;background:#f8fafc;border-radius:8px;">No deadlines tracked. <a href="#" onclick="RVAdvisor.openSetupWizard();return false;" style="color:#3b82f6;font-weight:600;">Set up your business →</a></div>';
    } else {
      deadlines.forEach(function(d) {
        var daysUntil = Math.ceil((new Date(d.due_date) - new Date()) / 86400000);
        var urgency = daysUntil < 0 ? '#ef4444' : daysUntil <= 14 ? '#f59e0b' : '#10b981';
        var label = daysUntil < 0 ? (Math.abs(daysUntil) + 'd overdue') : daysUntil === 0 ? 'Due today' : (daysUntil + 'd left');
        html += '<div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .5rem;border-bottom:1px solid #f1f5f9;font-size:.82rem;">';
        html += '<span style="width:8px;height:8px;border-radius:50%;background:' + urgency + ';flex-shrink:0;"></span>';
        html += '<span style="flex:1;color:#374151;">' + d.title + '</span>';
        html += '<span style="font-weight:700;color:' + urgency + ';font-size:.75rem;">' + label + '</span>';
        html += '<button onclick="RVAdvisor.completeDeadline(\'' + d.id + '\')" style="background:none;border:none;color:#10b981;cursor:pointer;font-size:.9rem;" title="Mark complete">✓</button>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;
  }

  // ══════════════════════════════════════════════════════════════════════
  // DEADLINE MANAGER MODAL
  // ══════════════════════════════════════════════════════════════════════

  function openDeadlineManager() {
    closeModals();
    var deadlines = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]')
      .sort(function(a, b) { return new Date(a.due_date) - new Date(b.due_date); });

    var html = '<div id="rv-advisor-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;">';
    html += '<div style="background:#fff;border-radius:16px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);">';

    // Header
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">';
    html += '<h3 style="font-size:1.05rem;font-weight:800;margin:0;">📅 Deadline Manager</h3>';
    html += '<button onclick="RVAdvisor.closeModals()" style="width:32px;height:32px;border-radius:8px;border:none;background:#f3f4f6;font-size:1.1rem;cursor:pointer;color:#6b7280;">×</button>';
    html += '</div>';

    // Add deadline form
    html += '<div style="padding:1rem 1.5rem;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
    html += '<div style="font-weight:700;font-size:.85rem;margin-bottom:.5rem;">Add New Deadline</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">';
    html += '<select id="adv-dl-type" style="padding:.45rem .6rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.82rem;">';
    html += '<option value="license_renewal">License Renewal</option><option value="insurance_renewal">Insurance Renewal</option>';
    html += '<option value="tax_filing">Tax Filing</option><option value="tax_payment">Tax Payment</option>';
    html += '<option value="permit_renewal">Permit Renewal</option><option value="inspection">Inspection</option>';
    html += '<option value="bond_renewal">Bond Renewal</option><option value="annual_report">Annual Report</option>';
    html += '<option value="custom">Custom</option>';
    html += '</select>';
    html += '<input id="adv-dl-title" placeholder="Title" style="padding:.45rem .6rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.82rem;" />';
    html += '<input id="adv-dl-date" type="date" style="padding:.45rem .6rem;border:1px solid #e2e8f0;border-radius:6px;font-size:.82rem;" />';
    html += '<button onclick="RVAdvisor.addDeadline()" style="padding:.45rem .8rem;background:#1a56db;color:#fff;border:none;border-radius:6px;font-size:.82rem;font-weight:700;cursor:pointer;">+ Add</button>';
    html += '</div></div>';

    // Deadline list
    html += '<div style="padding:1rem 1.5rem;">';
    if (deadlines.length === 0) {
      html += '<div style="text-align:center;padding:2rem;color:#94a3b8;font-size:.88rem;">No deadlines yet. Add your license renewals, tax dates, and insurance expirations above.</div>';
    } else {
      deadlines.forEach(function(d) {
        var daysUntil = Math.ceil((new Date(d.due_date) - new Date()) / 86400000);
        var bg = d.status === 'completed' ? '#f0fdf4' : d.status === 'overdue' ? '#fef2f2' : d.status === 'due_soon' ? '#fffbeb' : '#f8fafc';
        var statusColor = d.status === 'completed' ? '#10b981' : d.status === 'overdue' ? '#ef4444' : d.status === 'due_soon' ? '#f59e0b' : '#64748b';
        html += '<div style="display:flex;align-items:center;gap:.75rem;padding:.65rem .75rem;background:' + bg + ';border-radius:8px;margin-bottom:.5rem;border:1px solid #e5e7eb;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:600;font-size:.85rem;color:#1e293b;">' + d.title + '</div>';
        html += '<div style="font-size:.72rem;color:#64748b;">' + d.deadline_type.replace(/_/g, ' ') + ' · Due ' + d.due_date + '</div>';
        html += '</div>';
        html += '<span style="font-size:.7rem;font-weight:700;color:' + statusColor + ';text-transform:uppercase;">' + d.status.replace(/_/g, ' ') + '</span>';
        if (d.status !== 'completed') {
          html += '<button onclick="RVAdvisor.completeDeadline(\'' + d.id + '\')" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:.3rem .6rem;font-size:.72rem;font-weight:700;cursor:pointer;">Done</button>';
        }
        html += '<button onclick="RVAdvisor.deleteDeadline(\'' + d.id + '\')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.9rem;">🗑️</button>';
        html += '</div>';
      });
    }
    html += '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('rv-advisor-modal').addEventListener('click', function(e) {
      if (e.target === this) RVAdvisor.closeModals();
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SETUP WIZARD
  // ══════════════════════════════════════════════════════════════════════

  function openSetupWizard() {
    closeModals();
    var ctx = getContext();
    var bizType = getBusinessType();
    var state = CFG.state;
    var reqs = (ctx.licenses || {})[state] || [];
    var industryLabel = ctx.label || 'Business';

    // 90-Day Checklist from business context profile
    var checklist = ctx.checklist90 || BUSINESS_CONTEXT.general_business.checklist90;
    var savedChecklist = JSON.parse(localStorage.getItem('rv_setup_checklist_' + bizType) || '[]');

    var html = '<div id="rv-advisor-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;">';
    html += '<div style="background:#fff;border-radius:16px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);">';

    // Header
    html += '<div style="background:linear-gradient(135deg,#1a56db 0%,#7c3aed 100%);padding:1.5rem;border-radius:16px 16px 0 0;color:#fff;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<div><div style="font-size:1.2rem;font-weight:900;">🧙‍♂️ Business Setup Wizard</div>';
    html += '<div style="font-size:.82rem;opacity:.8;">' + industryLabel + ' · ' + state + '</div></div>';
    html += '<button onclick="RVAdvisor.closeModals()" style="width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:1.1rem;cursor:pointer;">×</button>';
    html += '</div></div>';

    // Section 0: Business Type
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">🎯 0. What Type of Business Are You?</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;">';
    Object.keys(BUSINESS_CONTEXT).forEach(function(key) {
      var bc = BUSINESS_CONTEXT[key];
      var active = bizType === key;
      html += '<button onclick="localStorage.setItem(\'rv_business_type\',\'' + key + '\');RVAdvisor.openSetupWizard();" style="padding:.5rem .4rem;border-radius:8px;border:2px solid ' + (active ? '#3b82f6' : '#e5e7eb') + ';background:' + (active ? '#eff6ff' : '#fff') + ';font-size:.72rem;font-weight:600;cursor:pointer;color:' + (active ? '#1d4ed8' : '#374151') + ';text-align:center;">' + bc.icon + ' ' + bc.label + '</button>';
    });
    html += '</div>';
    html += '<div style="font-size:.72rem;color:#94a3b8;margin-top:.5rem;">This controls which licenses, deadlines, and recommendations you see.</div>';
    html += '</div>';

    // Section 1: Business Structure
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">🏢 1. Business Structure</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;">';
    ['Sole Proprietorship','LLC','S-Corp','C-Corp','Partnership','Nonprofit'].forEach(function(type) {
      var saved = localStorage.getItem('rv_biz_structure') === type;
      html += '<button onclick="localStorage.setItem(\'rv_biz_structure\',\'' + type + '\');RVAdvisor.openSetupWizard();" style="padding:.5rem;border-radius:8px;border:2px solid ' + (saved ? '#3b82f6' : '#e5e7eb') + ';background:' + (saved ? '#eff6ff' : '#fff') + ';font-size:.78rem;font-weight:600;cursor:pointer;color:' + (saved ? '#1d4ed8' : '#374151') + ';">' + type + '</button>';
    });
    html += '</div></div>';

    // Section 2: Required Licenses
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">📜 2. Required Licenses & Insurance (' + state + ')</h4>';
    if (reqs.length === 0) {
      html += '<div style="color:#94a3b8;font-size:.85rem;">No specific requirements found for this industry/state combination.</div>';
    } else {
      reqs.forEach(function(req) {
        var deadlines = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
        var exists = deadlines.some(function(d) { return d.title === req; });
        html += '<div style="display:flex;align-items:center;gap:.75rem;padding:.5rem .65rem;background:#f8fafc;border-radius:8px;margin-bottom:.4rem;border:1px solid #e5e7eb;">';
        html += '<span style="font-size:1rem;">' + (exists ? '✅' : '⬜') + '</span>';
        html += '<span style="flex:1;font-size:.85rem;font-weight:500;color:#374151;">' + req + '</span>';
        if (!exists) {
          html += '<button onclick="RVAdvisor.addRequirement(\'' + req.replace(/'/g, "\\'") + '\')" style="background:#1a56db;color:#fff;border:none;border-radius:6px;padding:.3rem .7rem;font-size:.72rem;font-weight:700;cursor:pointer;">+ Track</button>';
        } else {
          html += '<span style="font-size:.72rem;color:#10b981;font-weight:700;">Tracked</span>';
        }
        html += '</div>';
      });
    }
    html += '</div>';

    // Section 3: Payment Setup
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">💳 3. Payment Setup</h4>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;">';
    ['Stripe (Cards/ACH)','Bilt Alliance','Zelle / Venmo','Check / Cash'].forEach(function(method) {
      var saved = (localStorage.getItem('rv_payment_methods') || '').indexOf(method) > -1;
      html += '<label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .75rem;background:' + (saved ? '#f0fdf4' : '#f8fafc') + ';border:1px solid ' + (saved ? '#86efac' : '#e5e7eb') + ';border-radius:8px;cursor:pointer;font-size:.82rem;">';
      html += '<input type="checkbox" ' + (saved ? 'checked' : '') + ' onchange="RVAdvisor.togglePayment(\'' + method + '\',this.checked)" style="accent-color:#10b981;"> ' + method;
      html += '</label>';
    });
    html += '</div></div>';

    // Section 4: Tax Deadlines
    html += '<div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">🗓️ 4. Tax Deadlines (Auto-Generated)</h4>';
    var existingTax = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]').filter(function(d) { return d.deadline_type === 'tax_filing' || d.deadline_type === 'tax_payment'; });
    if (existingTax.length > 0) {
      html += '<div style="color:#10b981;font-size:.85rem;font-weight:600;margin-bottom:.5rem;">✅ ' + existingTax.length + ' tax deadlines already tracked</div>';
    }
    html += '<button onclick="RVAdvisor.seedTaxDeadlines()" style="background:#f59e0b;color:#fff;border:none;border-radius:8px;padding:.5rem 1rem;font-size:.82rem;font-weight:700;cursor:pointer;">📅 Add All Federal Tax Deadlines for ' + new Date().getFullYear() + '</button>';
    html += '</div>';

    // Section 5: 90-Day Checklist
    html += '<div style="padding:1.25rem 1.5rem;">';
    html += '<h4 style="font-size:.92rem;font-weight:700;color:#1e293b;margin-bottom:.75rem;">📋 5. First 90-Day Checklist</h4>';
    var completedCount = savedChecklist.length;
    var pct = Math.round((completedCount / checklist.length) * 100);
    html += '<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;">';
    html += '<div style="flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;"><div style="height:100%;background:linear-gradient(90deg,#10b981,#3b82f6);border-radius:99px;width:' + pct + '%;transition:width .5s;"></div></div>';
    html += '<span style="font-size:.78rem;font-weight:700;color:#374151;">' + pct + '%</span>';
    html += '</div>';

    checklist.forEach(function(item, i) {
      var done = savedChecklist.indexOf(item) > -1;
      html += '<label style="display:flex;align-items:center;gap:.5rem;padding:.4rem .5rem;cursor:pointer;font-size:.82rem;color:' + (done ? '#94a3b8' : '#374151') + ';' + (done ? 'text-decoration:line-through;' : '') + '">';
      html += '<input type="checkbox" ' + (done ? 'checked' : '') + ' onchange="RVAdvisor.toggleChecklist(\'' + item.replace(/'/g, "\\'") + '\',this.checked)" style="accent-color:#10b981;width:16px;height:16px;"> ';
      html += item + '</label>';
    });
    html += '</div>';

    html += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('rv-advisor-modal').addEventListener('click', function(e) {
      if (e.target === this) RVAdvisor.closeModals();
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════

  function closeModals() {
    var modal = document.getElementById('rv-advisor-modal');
    if (modal) modal.remove();
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.RVAdvisor = {
    getScore: calculateScore,
    getActions: generateActions,
    refresh: renderAdvisor,
    openSetupWizard: openSetupWizard,
    openDeadlineManager: openDeadlineManager,
    closeModals: closeModals,
    runDailyCheck: function() {
      // Update all deadline statuses
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      var today = new Date().toISOString().split('T')[0];
      var soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      items = items.map(function(d) {
        if (d.status === 'completed' || d.status === 'dismissed') return d;
        if (d.due_date < today) d.status = 'overdue';
        else if (d.due_date <= soon) d.status = 'due_soon';
        else d.status = 'upcoming';
        return d;
      });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      renderAdvisor();
    },

    completeDeadline: function(id) {
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      items = items.map(function(d) {
        if (d.id === id) { d.status = 'completed'; d.completed_at = new Date().toISOString(); }
        return d;
      });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      renderAdvisor();
      closeModals();
    },

    deleteDeadline: function(id) {
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      items = items.filter(function(d) { return d.id !== id; });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      openDeadlineManager(); // refresh modal
    },

    addDeadline: function() {
      var type = document.getElementById('adv-dl-type').value;
      var title = document.getElementById('adv-dl-title').value;
      var date = document.getElementById('adv-dl-date').value;
      if (!title || !date) { alert('Please enter a title and date.'); return; }
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      items.push({ id: 'dl_' + Date.now(), deadline_type: type, title: title, due_date: date, status: 'upcoming', created_at: new Date().toISOString() });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      openDeadlineManager(); // refresh
    },

    addRequirement: function(name) {
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      var oneYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      var type = name.toLowerCase().indexOf('insurance') > -1 ? 'insurance_renewal' : 'license_renewal';
      items.push({ id: 'dl_' + Date.now(), deadline_type: type, title: name, due_date: oneYear, status: 'upcoming', auto_generated: true, created_at: new Date().toISOString() });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      openSetupWizard(); // refresh
    },

    togglePayment: function(method, checked) {
      var methods = (localStorage.getItem('rv_payment_methods') || '').split(',').filter(Boolean);
      if (checked && methods.indexOf(method) === -1) methods.push(method);
      else methods = methods.filter(function(m) { return m !== method; });
      localStorage.setItem('rv_payment_methods', methods.join(','));
    },

    toggleChecklist: function(item, checked) {
      var bType = getBusinessType();
      var list = JSON.parse(localStorage.getItem('rv_setup_checklist_' + bType) || '[]');
      if (checked && list.indexOf(item) === -1) list.push(item);
      else list = list.filter(function(i) { return i !== item; });
      localStorage.setItem('rv_setup_checklist_' + industry, JSON.stringify(list));
      openSetupWizard(); // refresh for progress bar
    },

    seedTaxDeadlines: function() {
      var items = JSON.parse(localStorage.getItem('rv_business_deadlines') || '[]');
      var year = new Date().getFullYear();
      var added = 0;
      // Add federal tax deadlines
      TAX_DEADLINES.forEach(function(td) {
        var date = year + '-' + String(td.month).padStart(2, '0') + '-' + String(td.day).padStart(2, '0');
        var exists = items.some(function(d) { return d.title === td.title && d.due_date.indexOf(year) > -1; });
        if (!exists) {
          items.push({ id: 'dl_' + Date.now() + '_' + added, deadline_type: td.type, title: td.title, due_date: date, status: 'upcoming', auto_generated: true, recurring: 'annually', created_at: new Date().toISOString() });
          added++;
        }
      });
      // Add industry-specific deadlines from context
      var ctx = getContext();
      (ctx.deadlines || []).forEach(function(td) {
        var date = year + '-' + String(td.month).padStart(2, '0') + '-' + String(td.day).padStart(2, '0');
        var exists = items.some(function(d) { return d.title === td.title && d.due_date.indexOf(year) > -1; });
        if (!exists) {
          items.push({ id: 'dl_' + Date.now() + '_' + added, deadline_type: td.type, title: td.title, due_date: date, status: 'upcoming', auto_generated: true, recurring: 'annually', created_at: new Date().toISOString() });
          added++;
        }
      });
      localStorage.setItem('rv_business_deadlines', JSON.stringify(items));
      alert(added + ' deadlines added for ' + year + ' (' + (ctx.label || 'your business') + ')!');
      openSetupWizard(); // refresh
    },

    _handleAction: function(action) {
      if (ACTION_HANDLERS[action]) ACTION_HANDLERS[action]();
    }
  };

  // ── Auto-init ──
  function init() {
    // Create container if missing
    if (!document.getElementById('rv-advisor')) {
      var targets = ['.portal-main', '.main', '.dash-content', '.page-header'];
      for (var i = 0; i < targets.length; i++) {
        var el = document.querySelector(targets[i]);
        if (el) {
          var div = document.createElement('div');
          div.id = 'rv-advisor';
          // Insert at the beginning of the main content area
          el.insertBefore(div, el.firstChild);
          break;
        }
      }
      if (!document.getElementById('rv-advisor')) {
        var div = document.createElement('div');
        div.id = 'rv-advisor';
        document.body.appendChild(div);
      }
    }

    // Run daily check (update statuses) then render
    RVAdvisor.runDailyCheck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
