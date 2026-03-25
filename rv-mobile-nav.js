/**
 * 3120 Life Mobile Bottom Navigation
 * Auto-injects a thumb-friendly bottom nav bar on screens < 768px.
 * Detects current page to show contextually relevant nav items.
 */
(function() {
  'use strict';

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.rv-mobile-nav {',
    '  position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;',
    '  height: 60px; background: #fff; border-top: 1px solid #e5e7eb;',
    '  display: flex; justify-content: space-around; align-items: center;',
    '  padding: 0 4px; box-shadow: 0 -2px 10px rgba(0,0,0,0.06);',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '@media (min-width: 769px) { .rv-mobile-nav { display: none !important; } }',
    '.rv-mobile-nav-item {',
    '  display: flex; flex-direction: column; align-items: center; justify-content: center;',
    '  flex: 1; height: 100%; cursor: pointer; text-decoration: none;',
    '  color: #6b7280; font-size: 0.65rem; font-weight: 500;',
    '  transition: color 0.15s ease; user-select: none; -webkit-user-select: none;',
    '  padding: 4px 2px; border: none; background: none; min-width: 0;',
    '}',
    '.rv-mobile-nav-item:active { background: #f3f4f6; border-radius: 8px; }',
    '.rv-mobile-nav-item.active { color: #2563eb; }',
    '.rv-mobile-nav-icon { font-size: 1.3rem; line-height: 1; margin-bottom: 2px; }',
    '.rv-mobile-nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }',
    '/* Push page content up so bottom nav doesn\'t overlap */',
    '@media (max-width: 768px) { body { padding-bottom: 64px !important; } }'
  ].join('\n');
  document.head.appendChild(style);

  // Detect current page
  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1).replace('.html', '') || 'index';

  // Page-specific nav configurations
  // Each item: [icon, label, action]
  // action can be: a function name string, a tab name prefixed with "tab:", or a URL
  var navConfigs = {
    'landlord-signup': [
      ['\uD83C\uDFE0', 'Home',    'tab:overview'],
      ['\uD83D\uDCB0', 'Pay',     'tab:payments'],
      ['\uD83D\uDD27', 'Maint',   'tab:maintenance'],
      ['\uD83D\uDCCA', 'Reports', 'tab:reports'],
      ['\u2630',       'More',    'sidebar']
    ],
    'jobs': [
      ['\uD83C\uDFD7\uFE0F', 'Jobs',      'view:list'],
      ['\u23F1\uFE0F',       'Time',      'view:timesheet'],
      ['\uD83E\uDDF1',       'Materials', 'url:materials.html'],
      ['\uD83D\uDCC4',       'Invoice',   'url:invoice-builder.html'],
      ['\u2630',             'More',      'sidebar']
    ],
    'accounting': [
      ['\uD83D\uDCCA', 'Overview',   'tab:overview'],
      ['\u2795',       'Add',        'action:openAddEntry'],
      ['\uD83D\uDCCB', 'Statements', 'url:owner-statements.html'],
      ['\uD83D\uDCC4', 'Invoice',    'url:invoice-builder.html'],
      ['\u2630',       'More',       'sidebar']
    ],
    'tenant-portal': [
      ['\uD83C\uDFE0', 'Home',    'tab:overview'],
      ['\uD83D\uDCB0', 'Pay',     'tab:payments'],
      ['\uD83D\uDD27', 'Maint',   'tab:maintenance'],
      ['\uD83D\uDCE6', 'Docs',    'tab:documents'],
      ['\u2630',       'More',    'sidebar']
    ],
    'commercial': [
      ['\uD83C\uDFE2', 'Deals',   'tab:overview'],
      ['\uD83D\uDCC4', 'Leases',  'tab:leases'],
      ['\uD83D\uDCCA', 'Reports', 'tab:reports'],
      ['\uD83D\uDCBC', 'Comps',   'tab:comps'],
      ['\u2630',       'More',    'sidebar']
    ],
    'crm': [
      ['\uD83D\uDCCA', 'Pipeline', 'tab:pipeline'],
      ['\uD83D\uDCCB', 'Leads',    'tab:leads'],
      ['\u2795',       'Add',      'action:openAddLead'],
      ['\uD83D\uDCC8', 'Analytics','tab:analytics'],
      ['\u2630',       'More',     'sidebar']
    ],
    'booking': [
      ['\uD83D\uDCC5', 'Calendar',  'tab:calendar'],
      ['\uD83D\uDCCB', 'Appts',     'tab:appointments'],
      ['\u2795',       'Book',      'action:openNewBooking'],
      ['\u2699\uFE0F', 'Services',  'tab:services'],
      ['\u2630',       'More',      'sidebar']
    ],
    'maintenance': [
      ['\uD83D\uDD27', 'Requests',  'tab:requests'],
      ['\u2795',       'New',       'action:openNewRequest'],
      ['\uD83D\uDCCA', 'Stats',     'tab:stats'],
      ['\uD83D\uDC77', 'Vendors',   'url:vendor-portal.html'],
      ['\u2630',       'More',      'sidebar']
    ],
    'matters': [
      ['\uD83D\uDCCB', 'Cases',   'tab:cases'],
      ['\u2795',       'New',     'action:openNewMatter'],
      ['\uD83D\uDCC5', 'Calendar','tab:calendar'],
      ['\uD83D\uDCC4', 'Docs',    'tab:documents'],
      ['\u2630',       'More',    'sidebar']
    ],
    'str-manager': [
      ['\uD83C\uDFE0', 'Units',     'tab:units'],
      ['\uD83D\uDCC5', 'Calendar',  'tab:calendar'],
      ['\uD83D\uDCB0', 'Revenue',   'tab:revenue'],
      ['\uD83D\uDCE9', 'Messages',  'tab:messages'],
      ['\u2630',       'More',      'sidebar']
    ],
    'messages': [
      ['\uD83D\uDCE8', 'Internal',  'tab:internal'],
      ['\uD83C\uDF10', 'Network',   'tab:network'],
      ['\uD83D\uDCBC', 'Deals',     'tab:deals'],
      ['\uD83D\uDCDD', 'Compose',   'action:openCompose'],
      ['\u2630',       'More',      'sidebar']
    ],
    'field-app': [
      ['\uD83D\uDCCB', 'Jobs',    'tab:jobs'],
      ['\uD83D\uDCF7', 'Photos',  'tab:photos'],
      ['\uD83D\uDCB0', 'Pay',     'tab:payments'],
      ['\u270D\uFE0F', 'Sign',    'tab:signatures'],
      ['\u2630',       'More',    'sidebar']
    ]
  };

  // Default nav for pages not specifically configured
  var defaultNav = [
    ['\uD83C\uDFE0', 'Home',      'url:landlord-signup.html'],
    ['\uD83D\uDCCA', 'Dashboard', 'scroll:top'],
    ['\uD83D\uDCAC', 'Messages',  'url:messages.html'],
    ['\uD83D\uDD0D', 'Search',    'action:focusSearch'],
    ['\u2630',       'More',      'sidebar']
  ];

  var items = navConfigs[page] || defaultNav;

  // Build DOM
  var nav = document.createElement('nav');
  nav.className = 'rv-mobile-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Mobile navigation');

  items.forEach(function(item, index) {
    var btn = document.createElement('button');
    btn.className = 'rv-mobile-nav-item';
    btn.type = 'button';
    btn.innerHTML = '<span class="rv-mobile-nav-icon">' + item[0] + '</span>' +
                    '<span class="rv-mobile-nav-label">' + item[1] + '</span>';
    btn.setAttribute('aria-label', item[1]);

    var action = item[2];

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      // Update active state
      nav.querySelectorAll('.rv-mobile-nav-item').forEach(function(el) {
        el.classList.remove('active');
      });
      btn.classList.add('active');

      if (action === 'sidebar') {
        // Try various sidebar toggle functions
        if (typeof toggleDashSidebar === 'function') {
          toggleDashSidebar();
        } else {
          var sidebar = document.querySelector('.dash-sidebar, .sidebar, [class*="sidebar"]');
          if (sidebar) sidebar.classList.toggle('open');
          var overlay = document.querySelector('.dash-overlay, [class*="overlay"]');
          if (overlay) overlay.classList.toggle('show');
        }
      } else if (action.indexOf('tab:') === 0) {
        var tabName = action.substring(4);
        if (typeof dashTab === 'function') {
          dashTab(tabName);
        } else if (typeof switchTab === 'function') {
          switchTab(tabName);
        } else {
          // Generic tab switching — click the matching tab button
          var tabBtn = document.querySelector('[data-tab="' + tabName + '"], [onclick*="(\'' + tabName + '\')"]');
          if (tabBtn) tabBtn.click();
        }
      } else if (action.indexOf('view:') === 0) {
        var viewName = action.substring(5);
        if (typeof switchView === 'function') {
          switchView(viewName);
        }
      } else if (action.indexOf('url:') === 0) {
        var url = action.substring(4);
        // Handle rentverified/ subdirectory
        if (path.indexOf('/rentverified/') !== -1 && url.indexOf('/') === -1) {
          url = url; // same directory
        }
        window.location.href = url;
      } else if (action.indexOf('action:') === 0) {
        var fnName = action.substring(7);
        if (fnName === 'focusSearch') {
          var searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], .search-input, input[type="text"]');
          if (searchInput) { searchInput.focus(); searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } else if (typeof window[fnName] === 'function') {
          window[fnName]();
        }
      } else if (action === 'scroll:top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    nav.appendChild(btn);
  });

  // Mark first item as active by default
  if (nav.children[0]) nav.children[0].classList.add('active');

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(nav); });
  } else {
    document.body.appendChild(nav);
  }
})();
