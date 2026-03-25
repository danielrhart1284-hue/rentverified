// ============================================================================
// 3120 Life — Service Connect Widget
// ============================================================================
// Universal drop-in widget for connecting landlords with service professionals.
// Self-contained IIFE. Only dependency: data-layer.js (window.RVData).
//
// Public API:
//   RVServiceConnect.open(role?)           — open the connect flow
//   RVServiceConnect.openPermissions(proId, role) — jump to permission screen
//   RVServiceConnect.close()               — close modal
// ============================================================================

(function () {
  'use strict';

  // Force localStorage mode when RVData is present
  if (typeof RVData !== 'undefined') {
    RVData._useSupabase = function () { return false; };
  }

  // ── Service Types ──────────────────────────────────────────────────────

  var SERVICE_TYPES = [
    { role: 'loan_officer',      icon: '\u{1F3E6}', label: 'Loan Officer',       desc: 'Get funded \u2014 SBA, business line, equipment loans' },
    { role: 'insurance_agent',   icon: '\u{1F6E1}',  label: 'Insurance Agent',    desc: 'Property, liability, workers comp quotes' },
    { role: 'accountant',        icon: '\u{1F4CA}', label: 'Accountant / CPA',   desc: 'Tax prep, bookkeeping, financial statements' },
    { role: 'attorney',          icon: '\u2696\uFE0F',  label: 'Attorney',           desc: 'Leases, evictions, entity formation, disputes' },
    { role: 'marketing_agency',  icon: '\u{1F4E3}', label: 'Marketing Agency',   desc: 'Branding, ads, social media, websites' },
    { role: 'bookkeeper',        icon: '\u{1F4D2}', label: 'Bookkeeper',         desc: 'Monthly books, reconciliation, payroll' }
  ];

  // ── Seed Providers (localStorage demo mode) ────────────────────────────

  var SEED_PROVIDERS = [
    { id: 'lo_1', name: 'Michael Torres',      role: 'loan_officer',     company: 'Mountain West Capital',   verified: true, rating: 4.9, initials: 'MT', color: '#1a56db', specialties: ['SBA 7(a)', 'Business Line of Credit', 'Equipment Financing'] },
    { id: 'lo_2', name: 'Jennifer Park',       role: 'loan_officer',     company: 'Valley Business Lending', verified: true, rating: 4.7, initials: 'JP', color: '#7c3aed', specialties: ['Commercial Real Estate', 'Bridge Loans', 'Startup Funding'] },
    { id: 'ia_1', name: 'Rachel Adams',        role: 'insurance_agent',  company: 'Shield Insurance Group',  verified: true, rating: 4.8, initials: 'RA', color: '#f59e0b', specialties: ['Commercial Property', 'General Liability', 'Workers Comp'] },
    { id: 'ia_2', name: 'Kevin Blake',         role: 'insurance_agent',  company: 'Wasatch Insurance',       verified: true, rating: 4.6, initials: 'KB', color: '#059669', specialties: ['Landlord Insurance', 'Umbrella', 'E&O'] },
    { id: 'ac_1', name: 'Sarah Mitchell, CPA', role: 'accountant',       company: 'Mitchell & Associates',   verified: true, rating: 4.9, initials: 'SM', color: '#2563eb', specialties: ['Real Estate Tax', '1031 Exchange', 'Entity Structuring'] },
    { id: 'ac_2', name: 'David Torres, EA',    role: 'accountant',       company: 'Torres Tax Group',        verified: true, rating: 4.7, initials: 'DT', color: '#dc2626', specialties: ['Schedule E', 'Cost Segregation', 'IRS Representation'] },
    { id: 'at_1', name: 'Marcus Johnson, Esq.', role: 'attorney',        company: 'Johnson Legal Group',     verified: true, rating: 4.8, initials: 'MJ', color: '#7c3aed', specialties: ['Evictions', 'Lease Disputes', 'Fair Housing'] },
    { id: 'mk_1', name: 'Ashley Rivera',       role: 'marketing_agency', company: 'Elevate Digital',         verified: true, rating: 4.9, initials: 'AR', color: '#ec4899', specialties: ['Social Media', 'Google Ads', 'Brand Strategy'] },
    { id: 'bk_1', name: 'Lisa Chen',           role: 'bookkeeper',       company: 'Chen Bookkeeping',        verified: true, rating: 4.9, initials: 'LC', color: '#059669', specialties: ['QuickBooks', 'Rent Reconciliation', '1099 Prep'] }
  ];

  // ── Helpers ─────────────────────────────────────────────────────────────

  function humanLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function getProviders(role) {
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem('rv_providers') || '[]'); } catch (e) { /* ignore */ }
    var merged = SEED_PROVIDERS.concat(stored.filter(function (p) {
      return !SEED_PROVIDERS.some(function (s) { return s.id === p.id; });
    }));
    if (role) return merged.filter(function (p) { return p.role === role; });
    return merged;
  }

  function starHTML(rating) {
    var full = Math.floor(rating);
    var half = rating - full >= 0.5;
    var out = '';
    for (var i = 0; i < full; i++) out += '\u2605';
    if (half) out += '\u00BD';
    return '<span style="color:#f59e0b;font-size:14px">' + out + '</span> <span style="color:#6b7280;font-size:13px">' + rating + '</span>';
  }

  // ── Style Injection ────────────────────────────────────────────────────

  var STYLE_ID = 'rv-service-connect-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.rvsc-overlay { position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s; }',
      '.rvsc-overlay.rvsc-open { opacity:1; }',
      '.rvsc-card { background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;animation:rvsc-slide .25s ease; }',
      '@keyframes rvsc-slide { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }',
      '.rvsc-card *{box-sizing:border-box;}',
      '.rvsc-header { padding:24px 24px 0;display:flex;align-items:center;justify-content:space-between; }',
      '.rvsc-header h2 { margin:0;font-size:20px;font-weight:700;color:#111827; }',
      '.rvsc-close { background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;padding:4px 8px;border-radius:6px; }',
      '.rvsc-close:hover { background:#f3f4f6;color:#111827; }',
      '.rvsc-body { padding:16px 24px 24px; }',
      '.rvsc-subtitle { color:#6b7280;font-size:14px;margin:4px 0 16px; }',

      /* Service type grid */
      '.rvsc-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }',
      '.rvsc-type-btn { display:flex;align-items:flex-start;gap:12px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;text-align:left;transition:border-color .15s,box-shadow .15s; }',
      '.rvsc-type-btn:hover { border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1); }',
      '.rvsc-type-icon { font-size:28px;line-height:1; }',
      '.rvsc-type-info h3 { margin:0 0 2px;font-size:15px;font-weight:600;color:#111827; }',
      '.rvsc-type-info p { margin:0;font-size:12px;color:#6b7280;line-height:1.4; }',

      /* Provider list */
      '.rvsc-back { background:none;border:none;color:#2563eb;font-size:14px;cursor:pointer;padding:0;margin-bottom:12px; }',
      '.rvsc-back:hover { text-decoration:underline; }',
      '.rvsc-pro { display:flex;align-items:center;gap:14px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;cursor:pointer;margin-bottom:10px;transition:border-color .15s,box-shadow .15s; }',
      '.rvsc-pro:hover { border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1); }',
      '.rvsc-avatar { width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;flex-shrink:0; }',
      '.rvsc-pro-info { flex:1;min-width:0; }',
      '.rvsc-pro-name { font-weight:600;font-size:15px;color:#111827; }',
      '.rvsc-pro-company { font-size:13px;color:#6b7280; }',
      '.rvsc-badge { display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;margin-left:6px; }',
      '.rvsc-specialties { font-size:12px;color:#9ca3af;margin-top:4px; }',
      '.rvsc-pro-arrow { color:#9ca3af;font-size:18px; }',

      /* Permission screen */
      '.rvsc-perm-header { display:flex;align-items:center;gap:14px;margin-bottom:16px; }',
      '.rvsc-perm-title { font-size:17px;font-weight:700;color:#111827;margin:0; }',
      '.rvsc-perm-sub { font-size:13px;color:#6b7280;margin:2px 0 0; }',
      '.rvsc-perm-section { background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0; }',
      '.rvsc-perm-section h4 { margin:0 0 12px;font-size:14px;font-weight:600;color:#111827; }',
      '.rvsc-perm-item { display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:13px;color:#374151; }',
      '.rvsc-perm-item span.rvsc-lock { flex-shrink:0;font-size:14px; }',
      '.rvsc-perm-label { font-weight:600; }',
      '.rvsc-perm-fields { color:#6b7280;font-size:12px; }',
      '.rvsc-btn-row { display:flex;gap:10px;margin-top:20px; }',
      '.rvsc-btn { flex:1;padding:12px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:opacity .15s; }',
      '.rvsc-btn:hover { opacity:.88; }',
      '.rvsc-btn-primary { background:#16a34a;color:#fff; }',
      '.rvsc-btn-cancel { background:#f3f4f6;color:#374151; }',
      '.rvsc-revoke-note { text-align:center;font-size:12px;color:#9ca3af;margin-top:12px; }',

      /* Toast */
      '.rvsc-toast { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:rvsc-fade .3s ease; }',
      '@keyframes rvsc-fade { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }',

      /* Responsive */
      '@media(max-width:768px){',
      '  .rvsc-grid{grid-template-columns:1fr;}',
      '  .rvsc-card{max-width:100%;border-radius:12px;}',
      '  .rvsc-btn-row{flex-direction:column;}',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────

  var overlay = null;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'className') node.className = attrs[k];
      else if (k === 'onclick') node.onclick = attrs[k];
      else if (k === 'innerHTML') node.innerHTML = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(node.style, attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (children) {
      if (typeof children === 'string') node.innerHTML = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) node.appendChild(c); });
      else node.appendChild(children);
    }
    return node;
  }

  function removeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('rvsc-open');
    setTimeout(function () { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }, 220);
  }

  function showToast(msg, duration) {
    var t = el('div', { className: 'rvsc-toast' }, msg);
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, duration || 3500);
  }

  // ── Screens ─────────────────────────────────────────────────────────────

  function renderCard(header, body) {
    injectStyles();
    if (overlay) removeOverlay();

    overlay = el('div', { className: 'rvsc-overlay' });
    var card = el('div', { className: 'rvsc-card' });

    var hdr = el('div', { className: 'rvsc-header' }, [
      el('h2', null, header),
      el('button', { className: 'rvsc-close', onclick: removeOverlay, 'aria-label': 'Close' }, '\u00D7')
    ]);

    card.appendChild(hdr);
    card.appendChild(body);
    overlay.appendChild(card);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) removeOverlay(); });
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('rvsc-open'); });
  }

  // ── Screen 1: Service Type Selection ───────────────────────────────────

  function showServiceTypes() {
    var body = el('div', { className: 'rvsc-body' });
    body.appendChild(el('p', { className: 'rvsc-subtitle' }, 'Choose the type of professional you want to connect with.'));

    var grid = el('div', { className: 'rvsc-grid' });
    SERVICE_TYPES.forEach(function (svc) {
      var btn = el('button', { className: 'rvsc-type-btn', onclick: function () { showProviderList(svc.role); } }, [
        el('span', { className: 'rvsc-type-icon' }, svc.icon),
        el('div', { className: 'rvsc-type-info' }, [
          el('h3', null, svc.label),
          el('p', null, svc.desc)
        ])
      ]);
      grid.appendChild(btn);
    });

    body.appendChild(grid);
    renderCard('Connect a Service', body);
  }

  // ── Screen 2: Provider Selection ───────────────────────────────────────

  function showProviderList(role) {
    var svc = SERVICE_TYPES.filter(function (s) { return s.role === role; })[0];
    var providers = getProviders(role);

    // Sort: verified first, then by rating
    providers.sort(function (a, b) {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      return b.rating - a.rating;
    });

    var body = el('div', { className: 'rvsc-body' });
    body.appendChild(el('button', { className: 'rvsc-back', onclick: showServiceTypes }, '\u2190 Back to services'));
    body.appendChild(el('p', { className: 'rvsc-subtitle' }, 'Select a ' + (svc ? svc.label : 'provider') + ' to continue.'));

    if (providers.length === 0) {
      body.appendChild(el('p', { style: { color: '#6b7280', textAlign: 'center', padding: '24px 0' } }, 'No providers available for this category yet.'));
    }

    providers.forEach(function (pro) {
      var card = el('div', { className: 'rvsc-pro', onclick: function () { showPermissions(pro, role); } }, [
        el('div', { className: 'rvsc-avatar', style: { background: pro.color || '#6b7280' } }, pro.initials || pro.name.charAt(0)),
        el('div', { className: 'rvsc-pro-info' }, [
          el('div', null, '<span class="rvsc-pro-name">' + pro.name + '</span>' + (pro.verified ? '<span class="rvsc-badge">\u2713 Verified</span>' : '')),
          el('div', { className: 'rvsc-pro-company' }, pro.company),
          el('div', null, starHTML(pro.rating)),
          el('div', { className: 'rvsc-specialties' }, (pro.specialties || []).join(' \u00B7 '))
        ]),
        el('span', { className: 'rvsc-pro-arrow' }, '\u203A')
      ]);
      body.appendChild(card);
    });

    renderCard(svc ? svc.icon + ' ' + svc.label + 's' : 'Select Provider', body);
  }

  // ── Screen 3: Permission / Data Sharing ────────────────────────────────

  function showPermissions(pro, role) {
    var body = el('div', { className: 'rvsc-body' });
    body.appendChild(el('button', { className: 'rvsc-back', onclick: function () { showProviderList(role); } }, '\u2190 Back to providers'));

    // Header with avatar
    var header = el('div', { className: 'rvsc-perm-header' }, [
      el('div', { className: 'rvsc-avatar', style: { background: pro.color || '#6b7280' } }, pro.initials || pro.name.charAt(0)),
      el('div', null, [
        el('p', { className: 'rvsc-perm-title' }, pro.name),
        el('p', { className: 'rvsc-perm-sub' }, pro.company)
      ])
    ]);
    body.appendChild(header);

    // Load access template
    if (typeof RVData === 'undefined') {
      body.appendChild(el('p', { style: { color: '#ef4444' } }, 'Error: data-layer.js is required.'));
      renderCard('\u{1F512} Data Sharing Permission', body);
      return;
    }

    RVData.getAccessTemplates(role).then(function (templates) {
      var template = templates[0];
      if (!template) {
        body.appendChild(el('p', { style: { color: '#6b7280' } }, 'No access template found for this role.'));
        renderCard('\u{1F512} Data Sharing Permission', body);
        return;
      }

      var section = el('div', { className: 'rvsc-perm-section' });
      section.appendChild(el('h4', null, '\u{1F512} Data Sharing Permission'));
      section.appendChild(el('p', { style: { margin: '0 0 12px', fontSize: '13px', color: '#6b7280' } },
        '<strong>' + pro.name + '</strong> needs access to the following data to serve you:'));

      var spec = template.data_spec || {};
      Object.keys(spec).forEach(function (table) {
        var val = spec[table];
        var item = el('div', { className: 'rvsc-perm-item' });
        item.appendChild(el('span', { className: 'rvsc-lock' }, '\u{1F512}'));

        var text = el('div');
        text.appendChild(el('div', { className: 'rvsc-perm-label' }, humanLabel(table)));

        if (val === '*') {
          text.appendChild(el('div', { className: 'rvsc-perm-fields' }, 'Full access to ' + humanLabel(table)));
        } else if (Array.isArray(val)) {
          text.appendChild(el('div', { className: 'rvsc-perm-fields' }, 'Read-only: ' + val.map(humanLabel).join(', ')));
        }

        item.appendChild(text);
        section.appendChild(item);
      });

      body.appendChild(section);

      // Buttons
      var btnRow = el('div', { className: 'rvsc-btn-row' }, [
        el('button', {
          className: 'rvsc-btn rvsc-btn-cancel',
          onclick: function () { showProviderList(role); }
        }, 'Cancel'),
        el('button', {
          className: 'rvsc-btn rvsc-btn-primary',
          onclick: function () { grantAccess(pro, template, role); }
        }, '\u2705 Share & Connect')
      ]);
      body.appendChild(btnRow);
      body.appendChild(el('p', { className: 'rvsc-revoke-note' }, 'You can revoke access at any time from your Access Control settings.'));

      renderCard('\u{1F512} Data Sharing Permission', body);
    });
  }

  // ── Grant Access ───────────────────────────────────────────────────────

  function grantAccess(pro, template, role) {
    RVData.saveAccessGrant({
      business_id: 'demo_biz',
      professional_id: pro.id,
      template_id: template.id,
      status: 'active'
    }).then(function () {
      removeOverlay();
      if (role === 'loan_officer') {
        showToast('\u2705 Connected with ' + pro.name + '! Redirecting to loan application\u2026');
        setTimeout(function () {
          window.location.href = 'loan-connect.html?officer_id=' + encodeURIComponent(pro.id);
        }, 1200);
      } else {
        showToast('\u2705 Connected! ' + pro.name + ' can now access your data.');
        // Show a follow-up toast with link
        setTimeout(function () {
          var t = el('div', { className: 'rvsc-toast', style: { cursor: 'pointer' }, onclick: function () { window.location.href = 'messages.html'; } },
            'Send ' + pro.name + ' a message \u2192');
          document.body.appendChild(t);
          setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
        }, 2000);
      }
    }).catch(function (err) {
      showToast('\u274C Error creating connection. Please try again.');
      console.error('[ServiceConnect] Grant error:', err);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  window.RVServiceConnect = {
    open: function (role) {
      if (role) {
        showProviderList(role);
      } else {
        showServiceTypes();
      }
    },

    openPermissions: function (proId, role) {
      var providers = getProviders(role);
      var pro = providers.filter(function (p) { return p.id === proId; })[0];
      if (!pro) {
        showToast('\u274C Provider not found.');
        return;
      }
      showPermissions(pro, role);
    },

    close: function () {
      removeOverlay();
    }
  };

})();
