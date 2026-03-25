/**
 * 3120 Life — AI Guide
 * ========================
 * Contextual help overlay that teaches users what to click.
 * Works on every page. Detects context from URL + DOM.
 *
 * Usage: <script src="rv-guide.js"></script>
 * Opens with: ? button (bottom-right FAB) or RVGuide.open()
 *
 * Features:
 * - Search "how do I..." → shows step-by-step with highlighted elements
 * - Page-aware: knows what features exist on the current page
 * - Spotlight: dims page and highlights the target element
 * - Multi-step walkthroughs with Next/Back
 * - Recently asked questions persist
 * - Keyboard: Ctrl+/ or Cmd+/ to open
 */
(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════
  // KNOWLEDGE BASE — every page's features + how-to steps
  // ══════════════════════════════════════════════════════════════════════

  var GUIDES = {

    // ── UNIVERSAL (available on every page) ──
    _universal: [
      {
        q: ['navigate','go to','find page','where is','menu'],
        title: 'Navigate the Platform',
        steps: [
          { text: 'Use the navigation bar at the top or sidebar to switch between sections.', selector: 'nav, .sidebar, .admin-sidebar, .dash-sidebar' },
          { text: 'On mobile, tap the ☰ menu button in the bottom-left corner.', selector: '.mobile-menu-btn, .str-mobile-btn, .dash-mobile-btn' }
        ]
      },
      {
        q: ['help','support','contact','stuck','confused'],
        title: 'Get Help',
        steps: [
          { text: 'You\'re using it! Type any question in this search box to get step-by-step guidance.' },
          { text: 'For account issues, visit the Support page or email support@3120life.com.' }
        ]
      },
      {
        q: ['share','social media','post','facebook','twitter','linkedin'],
        title: 'Share on Social Media',
        steps: [
          { text: 'Look for the share button (floating circle) in the bottom-right corner of the page.', selector: '#rv-share-fab, .rv-share-fab' },
          { text: 'Click it to share via Facebook, Twitter/X, LinkedIn, Email, or copy the link.' }
        ]
      },
      {
        q: ['dark mode','theme','appearance'],
        title: 'Change Theme',
        steps: [
          { text: 'Currently, the platform uses a light theme on most pages and dark theme on dashboards. Custom themes are coming soon!' }
        ]
      },
      {
        q: ['logout','sign out','log out'],
        title: 'Sign Out',
        steps: [
          { text: 'Look for the "Sign Out" or "Log Out" link at the bottom of the sidebar.', selector: '.signout, [onclick*="SignOut"], [onclick*="signout"], [onclick*="logout"]' }
        ]
      }
    ],

    // ── LANDLORD DASHBOARD ──
    'landlord-signup': [
      {
        q: ['add property','new property','create property','list property'],
        title: 'Add a New Property',
        steps: [
          { text: 'Click "Properties" in the sidebar to go to the Properties section.', selector: '.dash-link[onclick*="properties"], [data-tab="properties"]' },
          { text: 'Click the "+ Add Property" button at the top.', selector: '[onclick*="addProperty"], [onclick*="newProperty"], .btn-primary' },
          { text: 'Fill in the address, unit count, and property type, then click Save.' }
        ]
      },
      {
        q: ['add tenant','new tenant','create tenant'],
        title: 'Add a Tenant',
        steps: [
          { text: 'Click "Tenants" in the sidebar.', selector: '.dash-link[onclick*="tenants"], [data-tab="tenants"]' },
          { text: 'Click "+ Add Tenant" and fill in their name, email, phone, and unit.', selector: '[onclick*="addTenant"], [onclick*="newTenant"]' },
          { text: 'Once added, you can send them a portal invite so they can pay rent online.' }
        ]
      },
      {
        q: ['collect rent','rent payment','get paid','payment'],
        title: 'Collect Rent',
        steps: [
          { text: 'Go to "Payments" in the sidebar.', selector: '.dash-link[onclick*="payments"], [data-tab="payments"]' },
          { text: 'Click "Record Payment" to log a manual payment, or set up online payments so tenants can pay through their portal.' },
          { text: 'Tenants pay at tenant-portal.html — they\'ll see a "Pay Now" button with their balance.' }
        ]
      },
      {
        q: ['maintenance','repair','fix','work order'],
        title: 'Handle Maintenance Requests',
        steps: [
          { text: 'Click "Maintenance" in the sidebar.', selector: '.dash-link[onclick*="maintenance"], [data-tab="maintenance"]' },
          { text: 'You\'ll see all open requests. Click one to view details, assign a vendor, or update status.' },
          { text: 'Tenants can submit requests through their portal — you\'ll get notified instantly.' }
        ]
      },
      {
        q: ['lease','create lease','new lease','rental agreement'],
        title: 'Create a Lease',
        steps: [
          { text: 'Click "Leases" in the sidebar.', selector: '.dash-link[onclick*="leases"], [data-tab="leases"]' },
          { text: 'Click "+ New Lease" and select the property, tenant, term, and rent amount.' },
          { text: 'For digital signing, use the E-Signature feature (e-signature.html).' }
        ]
      },
      {
        q: ['screen tenant','background check','credit check','screening'],
        title: 'Screen a Tenant',
        steps: [
          { text: 'Click "Screening" in the sidebar.', selector: '.dash-link[onclick*="screening"], [data-tab="screening"]' },
          { text: 'Click "New Screening" and enter the applicant\'s info.' },
          { text: 'The system will run credit, criminal, and eviction checks and show you a report.' }
        ]
      },
      {
        q: ['invoice','send invoice','bill','charge'],
        title: 'Send an Invoice',
        steps: [
          { text: 'Go to the Document Generator (doc-generator.html) from the sidebar.', selector: 'a[href*="doc-generator"], a[href*="invoice"]' },
          { text: 'Select "Invoice" as the template type.' },
          { text: 'Fill in the recipient, items, and amounts. Your logo and QR code will be added automatically.' },
          { text: 'Click "Generate" to preview, then "Download PDF" or "Send" to deliver it.' }
        ]
      },
      {
        q: ['report','financial','statement','accounting','profit','loss','income'],
        title: 'View Financial Reports',
        steps: [
          { text: 'Click "Accounting" in the sidebar or go to accounting.html.', selector: '.dash-link[onclick*="accounting"], a[href*="accounting"]' },
          { text: 'You\'ll see Income, Expenses, and Profit at a glance.' },
          { text: 'Click "Owner Statements" for per-property breakdowns.' }
        ]
      },
      {
        q: ['loan','funding','financing','borrow','capital'],
        title: 'Explore Funding Options',
        steps: [
          { text: 'Look for the blue funding banner on your dashboard — it shows if you qualify.', selector: '#rv-funding-banner, [id*="funding"]' },
          { text: 'Or go to Loan Connect (loan-connect.html) to find a loan officer.', selector: 'a[href*="loan-connect"]' },
          { text: 'The AI will package your financials automatically — you just approve what\'s shared.' }
        ]
      },
      {
        q: ['health score','business health','score','advisor','action'],
        title: 'Check Your Business Health Score',
        steps: [
          { text: 'Scroll down on your dashboard to find the AI Business Advisor widget.', selector: '#rv-advisor' },
          { text: 'It shows your score (0-100) with color coding and a list of priority actions.' },
          { text: 'Click any action button to fix the issue — like renewing a license or sending reminders.' },
          { text: 'Click "Setup Wizard" to configure your business type, licenses, and 90-day checklist.' }
        ]
      },
      {
        q: ['bilt','rewards','rent rewards'],
        title: 'Set Up Bilt Rewards',
        steps: [
          { text: 'Go to the Bilt page (bilt.html) from your sidebar.', selector: 'a[href*="bilt"]' },
          { text: 'Opt into the Bilt Alliance program.' },
          { text: 'When tenants pay rent, they\'ll see a Bilt card signup prompt. You earn commission on approvals.' }
        ]
      }
    ],

    // ── TENANT PORTAL ──
    'tenant-portal': [
      {
        q: ['pay rent','make payment','pay now','rent'],
        title: 'Pay Your Rent',
        steps: [
          { text: 'Your rent balance is shown in the big blue card at the top of your dashboard.', selector: '.rent-card' },
          { text: 'Click the "Pay Now" button.', selector: '[onclick*="payRent"], [onclick*="PayNow"], .btn-primary' },
          { text: 'Choose your payment method (Bank Account, Card, or other options).' },
          { text: 'Confirm the amount and submit. You\'ll get a confirmation instantly.' }
        ]
      },
      {
        q: ['maintenance','repair','request','fix something','broken'],
        title: 'Submit a Maintenance Request',
        steps: [
          { text: 'Click "Maintenance" in the sidebar.', selector: '.sidebar-link[onclick*="maintenance"]' },
          { text: 'Click "New Request" and describe the issue.' },
          { text: 'Add photos if possible — it helps your landlord diagnose the problem faster.' },
          { text: 'You\'ll get status updates as it\'s reviewed and assigned to a vendor.' }
        ]
      },
      {
        q: ['lease','view lease','rental agreement','my lease'],
        title: 'View Your Lease',
        steps: [
          { text: 'Click "My Lease" in the sidebar.', selector: '.sidebar-link[onclick*="lease"]' },
          { text: 'You\'ll see your lease details including term, rent amount, and move-in/out dates.' }
        ]
      },
      {
        q: ['payment history','past payments','receipt'],
        title: 'View Payment History',
        steps: [
          { text: 'Click "Payments" in the sidebar.', selector: '.sidebar-link[onclick*="payments"]' },
          { text: 'You\'ll see a table of all your past payments with dates, amounts, and status.' }
        ]
      },
      {
        q: ['credit','credit builder','build credit','credit score'],
        title: 'Build Your Credit',
        steps: [
          { text: 'Click "Credit Builder" in the sidebar.', selector: '.sidebar-link[onclick*="credit"], a[href*="credit"]' },
          { text: 'Enroll in rent reporting — your on-time payments get reported to credit bureaus.' },
          { text: 'This can improve your credit score over time at no extra cost.' }
        ]
      }
    ],

    // ── CRM ──
    'crm': [
      {
        q: ['add lead','new lead','create lead','prospect'],
        title: 'Add a New Lead',
        steps: [
          { text: 'Click the "+ New Lead" button in the top-right corner.', selector: '[onclick*="newLead"], [onclick*="openLead"], .btn-primary' },
          { text: 'Fill in the lead\'s name, email, phone, source, and estimated value.' },
          { text: 'Click Save — the lead will appear in your pipeline.' }
        ]
      },
      {
        q: ['pipeline','kanban','drag','move lead','stages'],
        title: 'Use the Pipeline View',
        steps: [
          { text: 'Click "Pipeline" at the top to switch to the kanban view.', selector: '[onclick*="Pipeline"], [data-view="pipeline"]' },
          { text: 'Drag and drop lead cards between columns (New → Contacted → Qualified → Won).' },
          { text: 'Click any card to view details and log activities.' }
        ]
      },
      {
        q: ['log activity','call','email','meeting','note'],
        title: 'Log an Activity on a Lead',
        steps: [
          { text: 'Click on a lead card to open the detail view.' },
          { text: 'Scroll to the "Activity Timeline" section.' },
          { text: 'Select the activity type (Call, Email, Meeting, Note) and add details.' },
          { text: 'Click "Log Activity" — it will appear in the timeline.' }
        ]
      },
      {
        q: ['analytics','conversion','report','stats'],
        title: 'View CRM Analytics',
        steps: [
          { text: 'Click "Analytics" in the view tabs at the top.', selector: '[onclick*="analytics"], [data-view="analytics"]' },
          { text: 'You\'ll see your pipeline funnel, source breakdown, conversion rate, and deal values.' }
        ]
      }
    ],

    // ── BOOKING ──
    'booking': [
      {
        q: ['add service','new service','create service'],
        title: 'Add a Bookable Service',
        steps: [
          { text: 'Click the "+ New Service" button.', selector: '[onclick*="newService"], [onclick*="Service"]' },
          { text: 'Enter the service name, duration, price, and category.' },
          { text: 'Toggle "Public" to make it visible on your booking page.' }
        ]
      },
      {
        q: ['appointment','schedule','book','calendar'],
        title: 'Create an Appointment',
        steps: [
          { text: 'Click "+ New Appointment" or click a date on the calendar.', selector: '[onclick*="newAppointment"], [onclick*="Appointment"]' },
          { text: 'Select the customer, service, date, and time.' },
          { text: 'Click Save — the appointment will appear on your calendar.' }
        ]
      },
      {
        q: ['public','booking page','share','customer booking','widget'],
        title: 'Share Your Booking Page',
        steps: [
          { text: 'Click the "Public Booking" tab to preview what customers see.', selector: '[onclick*="public"], [data-tab*="public"]' },
          { text: 'Copy the URL and share it on your website, social media, or email signature.' },
          { text: 'Customers can pick a service, choose a time, and request a booking.' }
        ]
      }
    ],

    // ── CONSTRUCTION / JOBS ──
    'jobs': [
      {
        q: ['create job','new job','add job','start project'],
        title: 'Create a New Job',
        steps: [
          { text: 'Click the "+ New Job" button in the toolbar.', selector: '[onclick*="newJob"], [onclick*="addJob"], .btn-primary' },
          { text: 'Fill in the job name, client, address, and budget.' },
          { text: 'Click Save — the job appears in your list and board views.' }
        ]
      },
      {
        q: ['time track','log hours','timesheet','clock'],
        title: 'Track Time on a Job',
        steps: [
          { text: 'Click "Timesheet" in the view tabs.', selector: '[onclick*="timesheet"], [data-view*="time"]' },
          { text: 'Select the job and crew member, enter hours, then click Log.' },
          { text: 'Or use the Field App (field-app.html) to clock in/out on-site.' }
        ]
      },
      {
        q: ['materials','supplies','price','order'],
        title: 'Look Up Material Prices',
        steps: [
          { text: 'Click "Materials" in the navigation bar.', selector: 'a[href*="materials"]' },
          { text: 'Use the Price Lookup tab to search 60+ construction materials with current prices.' },
          { text: 'Click "Add to Project" to track materials for a specific job.' }
        ]
      },
      {
        q: ['estimate','quote','bid','proposal'],
        title: 'Create an Estimate/Quote',
        steps: [
          { text: 'Click "Quotes" in the view tabs.', selector: '[onclick*="quotes"], [data-view*="quote"]' },
          { text: 'Click "+ New Quote" and itemize the work with labor + materials.' },
          { text: 'Generate a PDF to send to the client.' }
        ]
      }
    ],

    // ── COMMERCIAL RE ──
    'commercial': [
      {
        q: ['deal','pipeline','new deal','create deal'],
        title: 'Create a Commercial Deal',
        steps: [
          { text: 'Click "Deal Pipeline" in the sidebar.', selector: '.dash-link[onclick*="deals"], [data-tab="deals"]' },
          { text: 'Click "+ New Deal" and fill in the property, deal type, client, and value.' },
          { text: 'The deal appears in your kanban pipeline — drag between stages.' }
        ]
      },
      {
        q: ['nnn','cam','triple net','expenses'],
        title: 'Track NNN/CAM Charges',
        steps: [
          { text: 'Click "NNN/CAM" in the sidebar.', selector: '.dash-link[onclick*="nnn"], [data-tab*="nnn"], [data-tab*="cam"]' },
          { text: 'Add operating expenses (taxes, insurance, maintenance) for each property.' },
          { text: 'The system calculates each tenant\'s share based on their square footage.' }
        ]
      }
    ],

    // ── ACCOUNTING ──
    'accounting': [
      {
        q: ['add transaction','record payment','income','expense','log'],
        title: 'Record a Transaction',
        steps: [
          { text: 'Click "Add Transaction" in the sidebar.', selector: '.dash-link[onclick*="transaction"], [data-tab="add"]' },
          { text: 'Toggle between Income and Expense at the top.' },
          { text: 'Enter the amount, date, category, property, and description.' },
          { text: 'Click Save — it shows up in your ledger and reports immediately.' }
        ]
      },
      {
        q: ['report','profit','loss','income statement','financial'],
        title: 'View Financial Reports',
        steps: [
          { text: 'The overview tab shows Income, Expenses, and Profit at a glance.', selector: '[data-tab="overview"]' },
          { text: 'Click "Reports" for detailed breakdowns by property, category, or month.' },
          { text: 'Use "Owner Statements" for per-property reports to send to owners.' }
        ]
      },
      {
        q: ['chart of accounts','categories','account types'],
        title: 'Set Up Account Categories',
        steps: [
          { text: 'Click "Account Categories" (Chart of Accounts) in the sidebar.', selector: '.dash-link[onclick*="chart"], [data-tab*="chart"]' },
          { text: 'These organize how income and expenses are tracked.' },
          { text: 'The default categories work for most businesses — customize only if needed.' }
        ]
      }
    ],

    // ── ATTORNEY / MATTERS ──
    'matters': [
      {
        q: ['new matter','create matter','case','open'],
        title: 'Create a New Matter',
        steps: [
          { text: 'Click the "+ New Matter" button.', selector: '[onclick*="newMatter"], [onclick*="openMatter"], .btn-primary' },
          { text: 'Fill in the matter number, type, title, and client name — those are the only required fields.' },
          { text: 'Expand "Additional Details" for opposing party, court info, and billing details.' },
          { text: 'Click Save — the matter appears in your list with conflict check results.' }
        ]
      },
      {
        q: ['time','bill','hours','track time','billing'],
        title: 'Track Billable Hours',
        steps: [
          { text: 'Click "Time" in the navigation bar.', selector: 'a[href*="time-tracking"]' },
          { text: 'Select the matter, enter hours and description.' },
          { text: 'Your hourly rate from the matter settings is applied automatically.' }
        ]
      },
      {
        q: ['deadline','court date','filing','statute'],
        title: 'Set a Deadline',
        steps: [
          { text: 'Deadlines appear in the bar below the header.', selector: '.deadline-bar, [id*="deadline"]' },
          { text: 'Click on a matter → set SOL Date and court dates in the detail view.' },
          { text: 'The AI Business Advisor also tracks deadlines and sends reminders.' }
        ]
      }
    ],

    // ── STR MANAGER ──
    'str-manager': [
      {
        q: ['add listing','new listing','property','airbnb'],
        title: 'Add a Listing',
        steps: [
          { text: 'Click "Listings" in the sidebar.', selector: '.slink[onclick*="listings"], [data-tab="listings"]' },
          { text: 'Click the "+ Add STR Listing" card.', selector: '[onclick*="addListing"], .add-card' },
          { text: 'Enter the property name, address, nightly rate, and platform.' }
        ]
      },
      {
        q: ['booking','reservation','calendar','guest'],
        title: 'View Bookings & Calendar',
        steps: [
          { text: 'Click "Bookings" to see all reservations.', selector: '.slink[onclick*="bookings"], [data-tab="bookings"]' },
          { text: 'The calendar on the right shows bookings by date.' },
          { text: 'Click "Calendar" for a full monthly view with cleaning schedules.' }
        ]
      },
      {
        q: ['cleaning','turnover','housekeeping','cleaner'],
        title: 'Manage Cleaning Schedules',
        steps: [
          { text: 'Click "Cleaning" in the sidebar.', selector: '.slink[onclick*="cleaning"], [data-tab="cleaning"]' },
          { text: 'Turnovers are auto-generated from checkout→checkin gaps.' },
          { text: 'Assign cleaners and track completion status.' }
        ]
      }
    ],

    // ── INSURANCE ──
    'insurance': [
      {
        q: ['add policy','new policy','create policy','coverage'],
        title: 'Add an Insurance Policy',
        steps: [
          { text: 'Click "Policies" in the sidebar.', selector: '.dash-link[onclick*="policies"], [data-tab="policies"]' },
          { text: 'Click "+ Add Policy" and enter the carrier, policy number, coverage type, and expiration.' },
          { text: 'The system tracks renewals and alerts you before expiration.' }
        ]
      },
      {
        q: ['quote','compare','shop','get quote'],
        title: 'Get Insurance Quotes',
        steps: [
          { text: 'Go to the Insurance Marketplace (insurance-agents.html).', selector: 'a[href*="insurance-agents"]' },
          { text: 'Browse verified agents and request quotes.' },
          { text: 'The Service Connect flow handles data sharing so agents can quote you fast.' }
        ]
      }
    ],

    // ── REVIEWS ──
    'reviews': [
      {
        q: ['request review','ask for review','send review','get review'],
        title: 'Request a Review from a Client',
        steps: [
          { text: 'Click the "Request a Review" button at the top.', selector: '[onclick*="requestReview"], [onclick*="ReviewRequest"], .btn-primary' },
          { text: 'Enter the client\'s name, email or phone, and the service they received.' },
          { text: 'Customize the message template, then click Send.' },
          { text: 'The client gets an email/SMS with a link to leave their review.' }
        ]
      },
      {
        q: ['publish','show review','display','hide review'],
        title: 'Publish or Hide a Review',
        steps: [
          { text: 'Find the review in the list.' },
          { text: 'Click the "Publish" toggle to show it on your public profile, or "Unpublish" to hide it.' },
          { text: 'Published reviews appear on your public page for potential clients to see.' }
        ]
      }
    ],

    // ── MESSAGES ──
    'messages': [
      {
        q: ['send message','compose','new message','write'],
        title: 'Send a Message',
        steps: [
          { text: 'Click the "Compose" or "New Message" button.', selector: '[onclick*="compose"], [onclick*="newMessage"], .btn-primary' },
          { text: 'Choose the recipient and type your message.' },
          { text: 'Messages to service providers go to the "Network" tab. Team messages go to "Internal".' }
        ]
      },
      {
        q: ['tabs','internal','network','deals','inbox'],
        title: 'Understanding Message Tabs',
        steps: [
          { text: 'Internal — messages within your team and system alerts.' },
          { text: 'Network — messages to/from service providers (loan officers, accountants, etc.).' },
          { text: 'Deals — promotional offers, affiliate deals, and marketing. These never mix with your important messages.' }
        ]
      }
    ],

    // ── COMMUNITY ──
    'community': [
      {
        q: ['join group','find group','groups','community'],
        title: 'Join a Group',
        steps: [
          { text: 'Click the "Discover" tab to see available groups.', selector: '[onclick*="discover"], [data-tab="discover"]' },
          { text: 'Click "Join" on any group that matches your industry or interests.' },
          { text: 'Once joined, you\'ll see posts in your "My Groups" feed.' }
        ]
      },
      {
        q: ['recommend','endorsement','vouch'],
        title: 'Recommend a Business',
        steps: [
          { text: 'Click "Write Recommendation" at the top.', selector: '[onclick*="recommend"], [onclick*="Recommend"]' },
          { text: 'Select the business you want to recommend and write a short endorsement.' },
          { text: 'It appears on their profile — this builds trust in the network.' }
        ]
      }
    ],

    // ── FIELD APP ──
    'field-app': [
      {
        q: ['start job','clock in','begin work'],
        title: 'Start a Job',
        steps: [
          { text: 'Your today\'s jobs are listed on the main screen.' },
          { text: 'Tap "Start" on the job card to clock in.' },
          { text: 'Tap "Navigate" to get GPS directions to the job site.' }
        ]
      },
      {
        q: ['photo','picture','camera','document'],
        title: 'Take a Job Photo',
        steps: [
          { text: 'Tap the "Photos" tab at the bottom.', selector: '[data-tab="photos"]' },
          { text: 'Tap the camera button to take a photo.' },
          { text: 'Select which job the photo belongs to — it\'s automatically timestamped.' }
        ]
      },
      {
        q: ['payment','collect','charge','pay'],
        title: 'Collect a Payment On-Site',
        steps: [
          { text: 'Tap the "Payments" tab at the bottom.', selector: '[data-tab="payments"]' },
          { text: 'Enter the amount and select the payment method (Cash, Check, Card, Invoice).' },
          { text: 'Tap "Collect Payment" — a receipt is generated automatically.' }
        ]
      },
      {
        q: ['signature','sign','customer sign'],
        title: 'Collect a Signature',
        steps: [
          { text: 'Open a job detail by tapping on a job card.' },
          { text: 'Scroll to the signature pad at the bottom.' },
          { text: 'Have the customer sign with their finger. Tap "Save Signature" when done.' }
        ]
      }
    ],

    // ── LOAN CONNECT ──
    'loan-connect': [
      {
        q: ['apply','loan','get funded','find officer','start'],
        title: 'Apply for a Loan',
        steps: [
          { text: 'Step 1: Browse and select a verified loan officer from the list.' },
          { text: 'Step 2: Review what data will be shared — you control exactly what the officer sees.' },
          { text: 'Step 3: The AI auto-generates your financial package from your accounting data.' },
          { text: 'Step 4: Track your application status (Submitted → Reviewed → Pre-Approved → Funded).' }
        ]
      }
    ],

    // ── ACCESS CONTROL ──
    'access-control': [
      {
        q: ['revoke','remove access','stop sharing','permissions'],
        title: 'Revoke a Provider\'s Access',
        steps: [
          { text: 'Find the provider in the "Active Grants" tab.' },
          { text: 'Click "Revoke" on their card.' },
          { text: 'Confirm — they immediately lose access to your data.' },
          { text: 'This is logged in the Audit Log tab for your records.' }
        ]
      }
    ]
  };

  // ══════════════════════════════════════════════════════════════════════
  // SEARCH ENGINE
  // ══════════════════════════════════════════════════════════════════════

  function getPageKey() {
    var path = location.pathname.replace(/^.*\//, '').replace('.html', '');
    return path || 'index';
  }

  function searchGuides(query) {
    var q = query.toLowerCase().trim();
    if (!q) return [];

    var pageKey = getPageKey();
    var results = [];

    // Search page-specific guides first, then universal
    var sources = [GUIDES[pageKey] || [], GUIDES._universal || []];

    // Also search ALL guides for cross-page answers
    Object.keys(GUIDES).forEach(function(key) {
      if (key !== pageKey && key !== '_universal') {
        sources.push(GUIDES[key] || []);
      }
    });

    sources.forEach(function(guideList) {
      guideList.forEach(function(guide) {
        // Score by keyword match
        var score = 0;
        var words = q.split(/\s+/);
        words.forEach(function(w) {
          guide.q.forEach(function(keyword) {
            if (keyword.indexOf(w) > -1 || w.indexOf(keyword) > -1) score += 2;
          });
          if (guide.title.toLowerCase().indexOf(w) > -1) score += 3;
          guide.steps.forEach(function(s) {
            if (s.text.toLowerCase().indexOf(w) > -1) score += 1;
          });
        });

        if (score > 0) {
          results.push({ guide: guide, score: score });
        }
      });
    });

    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, 6).map(function(r) { return r.guide; });
  }

  // ══════════════════════════════════════════════════════════════════════
  // SPOTLIGHT — highlight target element
  // ══════════════════════════════════════════════════════════════════════

  var spotlightOverlay = null;
  var spotlightBox = null;

  function spotlight(selector) {
    clearSpotlight();
    if (!selector) return;

    var el = document.querySelector(selector);
    if (!el) return;

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(function() {
      var rect = el.getBoundingClientRect();

      // Create overlay
      spotlightOverlay = document.createElement('div');
      spotlightOverlay.id = 'rv-guide-spotlight';
      spotlightOverlay.style.cssText = 'position:fixed;inset:0;z-index:99990;pointer-events:none;';

      // SVG mask with hole
      var pad = 8;
      var r = 12;
      spotlightOverlay.innerHTML = '<svg width="100%" height="100%" style="position:absolute;inset:0;">' +
        '<defs><mask id="rvgm"><rect width="100%" height="100%" fill="white"/>' +
        '<rect x="' + (rect.left - pad) + '" y="' + (rect.top - pad) + '" width="' + (rect.width + pad * 2) + '" height="' + (rect.height + pad * 2) + '" rx="' + r + '" fill="black"/>' +
        '</mask></defs>' +
        '<rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#rvgm)"/></svg>';

      document.body.appendChild(spotlightOverlay);

      // Pulsing border around element
      spotlightBox = document.createElement('div');
      spotlightBox.style.cssText = 'position:fixed;z-index:99991;border:3px solid #3b82f6;border-radius:' + r + 'px;pointer-events:none;' +
        'left:' + (rect.left - pad) + 'px;top:' + (rect.top - pad) + 'px;width:' + (rect.width + pad * 2) + 'px;height:' + (rect.height + pad * 2) + 'px;' +
        'box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 0 20px rgba(59,130,246,0.2);animation:rvgPulse 1.5s ease infinite;';
      document.body.appendChild(spotlightBox);
    }, 400);
  }

  function clearSpotlight() {
    if (spotlightOverlay) { spotlightOverlay.remove(); spotlightOverlay = null; }
    if (spotlightBox) { spotlightBox.remove(); spotlightBox = null; }
  }

  // ══════════════════════════════════════════════════════════════════════
  // UI — HELP PANEL
  // ══════════════════════════════════════════════════════════════════════

  var currentGuide = null;
  var currentStep = 0;

  function injectStyles() {
    if (document.getElementById('rv-guide-styles')) return;
    var style = document.createElement('style');
    style.id = 'rv-guide-styles';
    style.textContent = [
      '@keyframes rvgPulse{0%,100%{opacity:1}50%{opacity:0.6}}',
      '@keyframes rvgSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}',
      '#rv-guide-fab{position:fixed;bottom:5rem;right:1.25rem;z-index:99980;width:48px;height:48px;border-radius:50%;border:none;' +
        'background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;font-size:1.3rem;font-weight:900;cursor:pointer;' +
        'box-shadow:0 4px 16px rgba(59,130,246,0.4);transition:transform 0.2s,box-shadow 0.2s;}',
      '#rv-guide-fab:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(59,130,246,0.5);}',
      '#rv-guide-panel{display:none;position:fixed;bottom:8rem;right:1.25rem;z-index:99985;width:380px;max-height:70vh;' +
        'background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden;animation:rvgSlide 0.3s ease;}',
      '#rv-guide-panel.open{display:flex;flex-direction:column;}',
      '.rvg-header{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;padding:1.25rem 1.25rem 1rem;}',
      '.rvg-header h3{font-size:1rem;font-weight:800;margin:0 0 0.2rem;}',
      '.rvg-header p{font-size:0.78rem;opacity:0.8;margin:0;}',
      '.rvg-close{position:absolute;top:0.75rem;right:0.75rem;background:rgba(255,255,255,0.2);border:none;color:white;' +
        'width:28px;height:28px;border-radius:8px;font-size:1rem;cursor:pointer;}',
      '.rvg-search{margin:0.75rem 1rem 0;position:relative;}',
      '.rvg-search input{width:100%;padding:0.6rem 0.75rem 0.6rem 2.25rem;border:1px solid #e2e8f0;border-radius:10px;' +
        'font-size:0.88rem;background:white;color:#1e293b;outline:none;transition:border-color 0.2s;}',
      '.rvg-search input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.1);}',
      '.rvg-search input::placeholder{color:#94a3b8;}',
      '.rvg-search-icon{position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.85rem;}',
      '.rvg-body{flex:1;overflow-y:auto;padding:0.75rem 1rem 1rem;}',
      '.rvg-result{padding:0.65rem 0.75rem;border-radius:10px;cursor:pointer;transition:background 0.15s;border:1px solid transparent;margin-bottom:0.4rem;}',
      '.rvg-result:hover{background:#f0f9ff;border-color:#bfdbfe;}',
      '.rvg-result h4{font-size:0.88rem;font-weight:700;color:#1e293b;margin:0 0 2px;}',
      '.rvg-result p{font-size:0.75rem;color:#64748b;margin:0;}',
      '.rvg-step{padding:1rem;background:#f8fafc;border-radius:10px;margin-bottom:0.5rem;border-left:4px solid #3b82f6;}',
      '.rvg-step-num{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;' +
        'background:#3b82f6;color:white;font-size:0.72rem;font-weight:800;margin-right:0.5rem;flex-shrink:0;}',
      '.rvg-step-text{font-size:0.85rem;color:#334155;line-height:1.5;}',
      '.rvg-step-actions{display:flex;gap:0.5rem;margin-top:0.5rem;}',
      '.rvg-btn{padding:0.35rem 0.75rem;border-radius:7px;font-size:0.78rem;font-weight:700;cursor:pointer;border:none;transition:0.15s;}',
      '.rvg-btn-primary{background:#3b82f6;color:white;}.rvg-btn-primary:hover{background:#2563eb;}',
      '.rvg-btn-secondary{background:#f1f5f9;color:#475569;}.rvg-btn-secondary:hover{background:#e2e8f0;}',
      '.rvg-back-btn{background:none;border:none;color:#3b82f6;font-size:0.82rem;font-weight:600;cursor:pointer;padding:0.25rem 0;margin-bottom:0.5rem;}',
      '.rvg-quick{display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.5rem;}',
      '.rvg-chip{padding:0.3rem 0.7rem;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:99px;font-size:0.72rem;' +
        'font-weight:600;color:#2563eb;cursor:pointer;transition:0.15s;white-space:nowrap;}',
      '.rvg-chip:hover{background:#dbeafe;}',
      '.rvg-empty{text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;}',
      '@media(max-width:480px){#rv-guide-panel{right:0.5rem;left:0.5rem;width:auto;bottom:7rem;max-height:65vh;}' +
        '#rv-guide-fab{bottom:4.5rem;right:0.75rem;width:44px;height:44px;font-size:1.1rem;}}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function createUI() {
    injectStyles();

    // FAB
    var fab = document.createElement('button');
    fab.id = 'rv-guide-fab';
    fab.innerHTML = '?';
    fab.title = 'Need help? Click or press Ctrl+/';
    fab.onclick = function() { togglePanel(); };
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'rv-guide-panel';
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    // Event listeners
    var input = document.getElementById('rvg-search-input');
    if (input) {
      input.addEventListener('input', function() { handleSearch(this.value); });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closePanel(); }
      });
    }
  }

  function buildPanelHTML() {
    var pageKey = getPageKey();
    var pageGuides = GUIDES[pageKey] || [];
    var quickSuggestions = pageGuides.slice(0, 6).map(function(g) { return g.title; });

    return '<div class="rvg-header" style="position:relative;">' +
      '<h3>How can I help?</h3>' +
      '<p>Search or pick a topic below</p>' +
      '<button class="rvg-close" onclick="RVGuide.close()">&times;</button>' +
      '</div>' +
      '<div class="rvg-search">' +
        '<span class="rvg-search-icon">🔍</span>' +
        '<input type="text" id="rvg-search-input" placeholder="Type your question... (e.g. how do I add a tenant?)" />' +
      '</div>' +
      '<div class="rvg-body" id="rvg-body">' +
        (quickSuggestions.length > 0 ?
          '<div style="font-size:0.78rem;font-weight:700;color:#64748b;margin:0.5rem 0 0.3rem;">Quick topics for this page:</div>' +
          '<div class="rvg-quick">' +
          quickSuggestions.map(function(t) {
            return '<span class="rvg-chip" onclick="RVGuide.search(\'' + t.replace(/'/g, "\\'") + '\')">' + t + '</span>';
          }).join('') +
          '</div>' : '') +
        '<div style="font-size:0.78rem;font-weight:700;color:#64748b;margin:0.75rem 0 0.3rem;">Or try asking:</div>' +
        '<div class="rvg-quick">' +
          ['Pay rent','Add property','Send invoice','Get a loan','Track time','Book appointment','Collect payment','View reports']
          .map(function(t) {
            return '<span class="rvg-chip" onclick="RVGuide.search(\'' + t + '\')">' + t + '</span>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  function handleSearch(query) {
    var body = document.getElementById('rvg-body');
    if (!body) return;

    if (!query || query.length < 2) {
      // Reset to quick suggestions
      body.innerHTML = buildQuickSuggestions();
      return;
    }

    var results = searchGuides(query);
    if (results.length === 0) {
      body.innerHTML = '<div class="rvg-empty">🤔 No results for "' + query + '"<br><br>Try different words, or browse the quick topics above.</div>';
      return;
    }

    body.innerHTML = results.map(function(guide) {
      var stepCount = guide.steps.length;
      return '<div class="rvg-result" onclick="RVGuide.showGuide(\'' + guide.title.replace(/'/g, "\\'") + '\')">' +
        '<h4>' + guide.title + '</h4>' +
        '<p>' + stepCount + ' step' + (stepCount !== 1 ? 's' : '') + ' &middot; ' + guide.steps[0].text.substring(0, 60) + '...</p>' +
        '</div>';
    }).join('');
  }

  function buildQuickSuggestions() {
    var pageKey = getPageKey();
    var pageGuides = GUIDES[pageKey] || [];
    var html = '';

    if (pageGuides.length > 0) {
      html += '<div style="font-size:0.78rem;font-weight:700;color:#64748b;margin:0.5rem 0 0.3rem;">Quick topics for this page:</div>';
      html += '<div class="rvg-quick">';
      pageGuides.slice(0, 6).forEach(function(g) {
        html += '<span class="rvg-chip" onclick="RVGuide.search(\'' + g.title.replace(/'/g, "\\'") + '\')">' + g.title + '</span>';
      });
      html += '</div>';
    }

    html += '<div style="font-size:0.78rem;font-weight:700;color:#64748b;margin:0.75rem 0 0.3rem;">Common questions:</div>';
    html += '<div class="rvg-quick">';
    ['Pay rent','Add property','Send invoice','Get a loan','Track time','Book appointment','Collect payment','View reports']
    .forEach(function(t) {
      html += '<span class="rvg-chip" onclick="RVGuide.search(\'' + t + '\')">' + t + '</span>';
    });
    html += '</div>';
    return html;
  }

  function showGuide(title) {
    currentGuide = null;
    currentStep = 0;

    // Find the guide by title across all sources
    var all = [];
    Object.keys(GUIDES).forEach(function(k) { all = all.concat(GUIDES[k]); });
    currentGuide = all.find(function(g) { return g.title === title; });

    if (!currentGuide) return;
    renderStep();
    saveRecent(title);
  }

  function renderStep() {
    var body = document.getElementById('rvg-body');
    if (!body || !currentGuide) return;

    var step = currentGuide.steps[currentStep];
    var total = currentGuide.steps.length;

    var html = '<button class="rvg-back-btn" onclick="RVGuide.backToSearch()">← Back to search</button>';
    html += '<div style="font-weight:800;font-size:0.95rem;color:#1e293b;margin-bottom:0.75rem;">' + currentGuide.title + '</div>';

    // Progress dots
    html += '<div style="display:flex;gap:4px;margin-bottom:1rem;">';
    for (var i = 0; i < total; i++) {
      var color = i === currentStep ? '#3b82f6' : i < currentStep ? '#10b981' : '#e2e8f0';
      html += '<div style="flex:1;height:4px;border-radius:2px;background:' + color + ';transition:background 0.3s;"></div>';
    }
    html += '</div>';

    // Current step
    html += '<div class="rvg-step">';
    html += '<div style="display:flex;align-items:flex-start;gap:0.5rem;">';
    html += '<span class="rvg-step-num">' + (currentStep + 1) + '</span>';
    html += '<span class="rvg-step-text">' + step.text + '</span>';
    html += '</div>';

    if (step.selector) {
      html += '<div class="rvg-step-actions">';
      html += '<button class="rvg-btn rvg-btn-primary" onclick="RVGuide.spotlightCurrent()">👆 Show Me</button>';
      html += '</div>';
    }
    html += '</div>';

    // Step indicator
    html += '<div style="font-size:0.75rem;color:#94a3b8;text-align:center;margin:0.5rem 0;">Step ' + (currentStep + 1) + ' of ' + total + '</div>';

    // Navigation
    html += '<div style="display:flex;gap:0.5rem;justify-content:center;">';
    if (currentStep > 0) {
      html += '<button class="rvg-btn rvg-btn-secondary" onclick="RVGuide.prevStep()">← Previous</button>';
    }
    if (currentStep < total - 1) {
      html += '<button class="rvg-btn rvg-btn-primary" onclick="RVGuide.nextStep()">Next →</button>';
    } else {
      html += '<button class="rvg-btn rvg-btn-primary" style="background:#10b981;" onclick="RVGuide.backToSearch()">✓ Got it!</button>';
    }
    html += '</div>';

    body.innerHTML = html;

    // Auto-spotlight if selector exists
    if (step.selector) {
      spotlight(step.selector);
    } else {
      clearSpotlight();
    }
  }

  // ── Recent questions ──
  function saveRecent(title) {
    var recent = JSON.parse(localStorage.getItem('rv_guide_recent') || '[]');
    recent = recent.filter(function(r) { return r !== title; });
    recent.unshift(title);
    if (recent.length > 5) recent = recent.slice(0, 5);
    localStorage.setItem('rv_guide_recent', JSON.stringify(recent));
  }

  // ── Panel toggle ──
  function togglePanel() {
    var panel = document.getElementById('rv-guide-panel');
    if (!panel) return;
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    var panel = document.getElementById('rv-guide-panel');
    if (!panel) return;
    panel.classList.add('open');
    var input = document.getElementById('rvg-search-input');
    if (input) { input.value = ''; input.focus(); }
    handleSearch('');
  }

  function closePanel() {
    var panel = document.getElementById('rv-guide-panel');
    if (panel) panel.classList.remove('open');
    clearSpotlight();
    currentGuide = null;
    currentStep = 0;
  }

  // ── Keyboard shortcut: Ctrl+/ or Cmd+/ ──
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      togglePanel();
    }
    if (e.key === 'Escape') {
      closePanel();
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.RVGuide = {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    search: function(query) {
      openPanel();
      var input = document.getElementById('rvg-search-input');
      if (input) { input.value = query; }
      handleSearch(query);
    },
    showGuide: showGuide,
    spotlightCurrent: function() {
      if (currentGuide && currentGuide.steps[currentStep]) {
        spotlight(currentGuide.steps[currentStep].selector);
      }
    },
    nextStep: function() {
      if (currentGuide && currentStep < currentGuide.steps.length - 1) {
        currentStep++;
        renderStep();
      }
    },
    prevStep: function() {
      if (currentStep > 0) {
        currentStep--;
        renderStep();
      }
    },
    backToSearch: function() {
      currentGuide = null;
      currentStep = 0;
      clearSpotlight();
      var input = document.getElementById('rvg-search-input');
      handleSearch(input ? input.value : '');
    }
  };

  // ── Init ──
  function init() {
    createUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
