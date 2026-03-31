/**
 * 3120 Life — Multi-Business Switcher
 * ============================================================
 * Drop-in widget that adds business switching to the dashboard sidebar.
 * Stores all businesses in localStorage and keeps the active one in sync
 * with rv_account and rv_workspace_config so all other widgets pick it up.
 *
 * Usage:
 *   <div id="biz-switcher-mount"></div>
 *   <script src="business-switcher.js"></script>
 *
 * Public API:
 *   BizSwitcher.getActive()        → { id, name, industry, ... }
 *   BizSwitcher.getAll()           → [...]
 *   BizSwitcher.switchTo(id)       → switches active business
 *   BizSwitcher.addBusiness(opts)  → adds a new business
 */
(function () {
  'use strict';

  var STORAGE_KEY        = 'rv_businesses';
  var ACTIVE_KEY         = 'rv_active_business';
  var WORKSPACE_CFG_KEY  = 'rv_workspace_config';
  var ACCOUNT_KEY        = 'rv_account';

  // Industry emoji icons
  var IND_ICONS = {
    property_management: '🏠', short_term_rental: '🏖️', commercial_re: '🏢',
    contractor: '🏗️', construction_trades: '🔨', attorney: '⚖️',
    accountant: '📊', cpa: '📊', insurance: '🛡️', lending: '🏦',
    nonprofit: '💚', wellness_spa: '💆', salon_beauty: '✂️',
    restaurant_food: '🍽️', marketing_consulting: '📣',
    cleaning: '🧹', auto_services: '🔧', general: '💼',
  };

  var IND_LABELS = {
    property_management: 'Property Management', short_term_rental: 'Short-Term Rental',
    commercial_re: 'Commercial RE', contractor: 'Contractor',
    construction_trades: 'Construction & Trades', attorney: 'Attorney / Law',
    accountant: 'Accounting', cpa: 'CPA / Accounting', insurance: 'Insurance',
    lending: 'Lending', nonprofit: 'Nonprofit', wellness_spa: 'Wellness / Med Spa',
    salon_beauty: 'Salon & Beauty', restaurant_food: 'Restaurant / Food',
    marketing_consulting: 'Marketing / Consulting',
    cleaning: 'Cleaning', auto_services: 'Auto Services', general: 'General Business',
  };

  // Auto-assign a color per business (cycles)
  var COLORS = ['#1a56db','#059669','#7c3aed','#d97706','#0891b2','#e11d48','#0d9488'];

  // ── Storage helpers ───────────────────────────────────────────────────────
  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (_) { return []; }
  }

  function saveAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getActive() {
    try {
      var stored = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
      if (stored) return stored;
      var all = getAll();
      return all.length ? all[0] : null;
    } catch (_) { return null; }
  }

  // ── Seed from existing account data if no businesses yet ─────────────────
  function seedFromAccount() {
    var all = getAll();
    if (all.length > 0) return;

    var name     = '3120Life LLC';
    var industry = 'property_management';
    var plan     = 'Pro';

    try {
      var acct = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
      if (acct.companyName) name = acct.companyName;
      if (acct.plan) plan = acct.plan;
    } catch (_) {}

    try {
      var cfg = JSON.parse(localStorage.getItem(WORKSPACE_CFG_KEY) || '{}');
      if (cfg.industry) industry = cfg.industry;
    } catch (_) {}

    var biz = {
      id:         'biz_default',
      name:       name,
      industry:   industry,
      plan:       plan,
      color:      COLORS[0],
      icon:       IND_ICONS[industry] || '💼',
      created_at: new Date().toISOString(),
    };
    saveAll([biz]);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(biz));
  }

  // ── Switch active business ────────────────────────────────────────────────
  function switchTo(id) {
    var all = getAll();
    var biz = all.find(function (b) { return b.id === id; });
    if (!biz) return;

    localStorage.setItem(ACTIVE_KEY, JSON.stringify(biz));

    // Sync to rv_account
    try {
      var acct = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}');
      acct.companyName = biz.name;
      acct.plan        = biz.plan || acct.plan;
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(acct));
    } catch (_) {}

    // Sync to rv_workspace_config
    try {
      var cfg = JSON.parse(localStorage.getItem(WORKSPACE_CFG_KEY) || '{}');
      cfg.industry      = biz.industry;
      cfg.businessId    = biz.id;
      cfg.businessName  = biz.name;
      localStorage.setItem(WORKSPACE_CFG_KEY, JSON.stringify(cfg));
    } catch (_) {}

    // Notify other systems
    if (typeof IndustryDashboard !== 'undefined') IndustryDashboard.autoApply();
    if (typeof CRMPipeline       !== 'undefined') CRMPipeline.autoApply();
    if (typeof renderFeatureTiles !== 'undefined') renderFeatureTiles();
    if (typeof loadDashboardData  !== 'undefined') loadDashboardData();

    // Re-render the switcher
    render();

    // Update sidebar company name text (if the original span still exists)
    var nameSpan = document.getElementById('sidebar-biz-name');
    if (nameSpan) nameSpan.textContent = biz.name;

    // Update dashboard headline
    var h1 = document.getElementById('dash-industry-headline');
    if (h1) h1.textContent = biz.name;

    showToast('Switched to ' + biz.name);
  }

  // ── Add a new business ────────────────────────────────────────────────────
  function addBusiness(opts) {
    var all    = getAll();
    var color  = COLORS[all.length % COLORS.length];
    var biz = {
      id:         'biz_' + Date.now(),
      name:       opts.name || 'New Business',
      industry:   opts.industry || 'general',
      plan:       opts.plan || 'Pro',
      color:      color,
      icon:       IND_ICONS[opts.industry] || '💼',
      created_at: new Date().toISOString(),
    };
    all.push(biz);
    saveAll(all);
    switchTo(biz.id);
    return biz;
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('biz-switcher-css')) return;
    var s = document.createElement('style');
    s.id = 'biz-switcher-css';
    s.textContent = [
      '.bsw-wrap{position:relative;padding:0 1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:1rem;}',
      '.bsw-btn{display:flex;align-items:center;gap:10px;width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:.55rem .75rem;cursor:pointer;transition:background .15s;}',
      '.bsw-btn:hover{background:rgba(255,255,255,.1);}',
      '.bsw-avatar{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}',
      '.bsw-info{flex:1;min-width:0;text-align:left;}',
      '.bsw-name{color:#fff;font-weight:700;font-size:.83rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}',
      '.bsw-ind{color:#94a3b8;font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}',
      '.bsw-chevron{color:#64748b;font-size:.75rem;flex-shrink:0;transition:transform .2s;}',
      '.bsw-chevron.open{transform:rotate(180deg);}',
      '.bsw-dropdown{position:absolute;left:1rem;right:1rem;top:calc(100% - .5rem);z-index:200;background:#1e293b;border:1px solid rgba(255,255,255,.12);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden;display:none;}',
      '.bsw-dropdown.open{display:block;}',
      '.bsw-item{display:flex;align-items:center;gap:.65rem;padding:.65rem 1rem;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);transition:background .12s;}',
      '.bsw-item:hover{background:rgba(255,255,255,.07);}',
      '.bsw-item.active{background:rgba(0,230,118,.08);}',
      '.bsw-item-avatar{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;}',
      '.bsw-item-name{font-size:.82rem;font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;}',
      '.bsw-item-ind{font-size:.68rem;color:#64748b;}',
      '.bsw-item-check{margin-left:auto;color:#00E676;font-size:.85rem;}',
      '.bsw-add-btn{display:flex;align-items:center;gap:.5rem;padding:.7rem 1rem;cursor:pointer;color:#00E676;font-size:.82rem;font-weight:700;transition:background .12s;}',
      '.bsw-add-btn:hover{background:rgba(0,230,118,.08);}',
      /* Modal */
      '.bsw-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;}',
      '.bsw-modal{background:#fff;border-radius:14px;padding:1.75rem;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.25);}',
      '.bsw-modal h3{font-size:1.1rem;font-weight:800;margin:0 0 1.25rem;color:#1e293b;}',
      '.bsw-modal label{display:block;font-size:.8rem;font-weight:600;color:#374151;margin-bottom:.3rem;}',
      '.bsw-modal input,.bsw-modal select{width:100%;padding:.55rem .75rem;border:1px solid #d1d5db;border-radius:8px;font-size:.9rem;box-sizing:border-box;margin-bottom:1rem;}',
      '.bsw-modal-actions{display:flex;gap:.75rem;margin-top:.25rem;}',
      '.bsw-modal-actions button{flex:1;padding:.6rem;border-radius:8px;font-weight:700;font-size:.9rem;cursor:pointer;border:none;}',
      '.bsw-btn-save{background:#00E676;color:#0f172a;}',
      '.bsw-btn-cancel{background:#f1f5f9;color:#374151;}',
      /* Toast */
      '.bsw-toast{position:fixed;bottom:1.5rem;right:1.5rem;z-index:2000;background:#0f172a;color:#fff;padding:.65rem 1.25rem;border-radius:9px;font-size:.85rem;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.2);border-left:3px solid #00E676;animation:bsw-fadein .2s ease;}',
      '@keyframes bsw-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Render switcher into mount point ─────────────────────────────────────
  function render() {
    var mount = document.getElementById('biz-switcher-mount');
    if (!mount) return;

    var active = getActive();
    var all    = getAll();
    if (!active) return;

    var indLabel = IND_LABELS[active.industry] || active.industry || 'Business';

    mount.innerHTML =
      '<div class="bsw-wrap">' +
        '<button class="bsw-btn" onclick="BizSwitcher._toggle()" aria-haspopup="true">' +
          '<div class="bsw-avatar" style="background:' + active.color + '33;">' + active.icon + '</div>' +
          '<div class="bsw-info">' +
            '<div class="bsw-name" id="sidebar-biz-name">' + esc(active.name) + '</div>' +
            '<div class="bsw-ind">' + esc(indLabel) + '</div>' +
          '</div>' +
          '<span class="bsw-chevron" id="bsw-chevron">▾</span>' +
        '</button>' +

        '<div class="bsw-dropdown" id="bsw-dropdown">' +
          all.map(function (b) {
            var isActive = b.id === active.id;
            return '<div class="bsw-item' + (isActive ? ' active' : '') + '" onclick="BizSwitcher.switchTo(\'' + b.id + '\');BizSwitcher._close();">' +
              '<div class="bsw-item-avatar" style="background:' + b.color + '33;">' + b.icon + '</div>' +
              '<div>' +
                '<div class="bsw-item-name">' + esc(b.name) + '</div>' +
                '<div class="bsw-item-ind">' + esc(IND_LABELS[b.industry] || b.industry) + '</div>' +
              '</div>' +
              (isActive ? '<span class="bsw-item-check">✓</span>' : '') +
            '</div>';
          }).join('') +
          '<div class="bsw-add-btn" onclick="BizSwitcher._openAddModal();BizSwitcher._close();">' +
            '＋ Add Business' +
          '</div>' +
        '</div>' +
      '</div>';

    // Close dropdown on outside click
    document.removeEventListener('click', _outsideClick);
    document.addEventListener('click', _outsideClick);
  }

  function _outsideClick(e) {
    var dd = document.getElementById('bsw-dropdown');
    var btn = document.querySelector('.bsw-btn');
    if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) {
      _close();
    }
  }

  function _toggle() {
    var dd  = document.getElementById('bsw-dropdown');
    var chv = document.getElementById('bsw-chevron');
    if (!dd) return;
    var open = dd.classList.toggle('open');
    if (chv) chv.classList.toggle('open', open);
  }

  function _close() {
    var dd  = document.getElementById('bsw-dropdown');
    var chv = document.getElementById('bsw-chevron');
    if (dd)  dd.classList.remove('open');
    if (chv) chv.classList.remove('open');
  }

  // ── Add Business Modal ────────────────────────────────────────────────────
  function _openAddModal() {
    _removeModal();
    var indOptions = Object.keys(IND_LABELS).map(function (k) {
      return '<option value="' + k + '">' + IND_ICONS[k] + ' ' + IND_LABELS[k] + '</option>';
    }).join('');

    var modal = document.createElement('div');
    modal.className = 'bsw-modal-overlay';
    modal.id = 'bsw-modal';
    modal.innerHTML =
      '<div class="bsw-modal">' +
        '<h3>➕ Add a Business</h3>' +
        '<label>Business Name *</label>' +
        '<input id="bsw-new-name" type="text" placeholder="e.g. Smith Contracting LLC" autofocus>' +
        '<label>Industry</label>' +
        '<select id="bsw-new-industry">' + indOptions + '</select>' +
        '<div class="bsw-modal-actions">' +
          '<button class="bsw-btn-cancel" onclick="BizSwitcher._removeModal()">Cancel</button>' +
          '<button class="bsw-btn-save" onclick="BizSwitcher._saveNewBiz()">Add Business</button>' +
        '</div>' +
      '</div>';

    modal.addEventListener('click', function (e) {
      if (e.target === modal) _removeModal();
    });
    document.body.appendChild(modal);
    setTimeout(function () { var el = document.getElementById('bsw-new-name'); if (el) el.focus(); }, 50);
  }

  function _saveNewBiz() {
    var name     = (document.getElementById('bsw-new-name')     || {}).value || '';
    var industry = (document.getElementById('bsw-new-industry') || {}).value || 'general';
    name = name.trim();
    if (!name) { alert('Please enter a business name.'); return; }
    addBusiness({ name: name, industry: industry });
    _removeModal();
    showToast('Business "' + name + '" added!');
  }

  function _removeModal() {
    var m = document.getElementById('bsw-modal');
    if (m) m.remove();
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'bsw-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ── HTML escape ───────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    seedFromAccount();
    render();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.BizSwitcher = {
    getActive:    getActive,
    getAll:       getAll,
    switchTo:     switchTo,
    addBusiness:  addBusiness,
    _toggle:      _toggle,
    _close:       _close,
    _openAddModal: _openAddModal,
    _saveNewBiz:  _saveNewBiz,
    _removeModal: _removeModal,
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
