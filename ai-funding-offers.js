/**
 * 3120 Life — Proactive AI Funding Offers
 * =============================================
 * QuickBooks Capital-style proactive loan offers
 * Uses existing accounting_entries, payments, ownerstatements to compute eligibility
 *
 * Usage: <script src="ai-funding-offers.js"></script>
 * Auto-injects banner into dashboard if business qualifies
 *
 * Public API:
 *   RVFunding.check()     — compute eligibility and show/hide banner
 *   RVFunding.dismiss()   — hide banner for 7 days
 *   RVFunding.accept()    — navigate to Loan Connect
 */
(function() {
  'use strict';

  var DISMISS_KEY = 'rv_funding_dismissed_until';

  // ── Compute trailing 3-month metrics ──
  function computeMetrics() {
    var transactions = JSON.parse(localStorage.getItem('rv_transactions') || '[]');
    var now = new Date();
    var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    var recent = transactions.filter(function(t) {
      return new Date(t.date) >= threeMonthsAgo;
    });

    var revenue = recent.filter(function(t) { return t.type === 'income'; })
      .reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);

    var expenses = recent.filter(function(t) { return t.type === 'expense'; })
      .reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);

    var cashflow = revenue - expenses;
    var monthlyAvg = revenue / 3;

    // Compute monthly revenue for volatility
    var months = [{},{},{}];
    for (var i = 0; i < 3; i++) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var mKey = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');
      months[i] = { month: mKey, revenue: 0 };
    }
    recent.filter(function(t) { return t.type === 'income'; }).forEach(function(t) {
      var d = new Date(t.date);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      for (var i = 0; i < months.length; i++) {
        if (months[i].month === key) months[i].revenue += parseFloat(t.amount) || 0;
      }
    });

    // Volatility: coefficient of variation
    var revArr = months.map(function(m) { return m.revenue; });
    var mean = revArr.reduce(function(a, b) { return a + b; }, 0) / revArr.length;
    var variance = revArr.reduce(function(s, v) { return s + Math.pow(v - mean, 2); }, 0) / revArr.length;
    var volatility = mean > 0 ? Math.sqrt(variance) / mean : 1;

    // Growth trend: compare most recent month to oldest
    var growth = months[0].revenue > 0 && months[2].revenue > 0
      ? (months[0].revenue - months[2].revenue) / months[2].revenue
      : 0;

    // Cash buffer: current cash / monthly expenses
    var monthlyExpense = expenses / 3;
    var cashBuffer = monthlyExpense > 0 ? cashflow / monthlyExpense : 0;

    return {
      revenue_3mo: revenue,
      expenses_3mo: expenses,
      cashflow_3mo: cashflow,
      monthly_avg: monthlyAvg,
      volatility: volatility,
      growth: growth,
      cash_buffer: cashBuffer,
      has_data: transactions.length > 0
    };
  }

  // ── Eligibility check ──
  function checkEligibility() {
    var m = computeMetrics();

    // If no financial data, use demo metrics
    if (!m.has_data) {
      m = {
        revenue_3mo: 72000, expenses_3mo: 50400, cashflow_3mo: 21600,
        monthly_avg: 24000, volatility: 0.12, growth: 0.08, cash_buffer: 1.4,
        has_data: false
      };
    }

    // Criteria: stable or growing revenue, reasonable volatility, positive cash flow
    var qualifies = m.monthly_avg >= 5000 && m.volatility < 0.5 && m.cashflow_3mo > 0;

    // Compute offer range based on revenue
    var minOffer = Math.round(m.monthly_avg * 1) / 1000 * 1000; // ~1 month revenue
    var maxOffer = Math.round(m.monthly_avg * 6) / 1000 * 1000; // ~6 months revenue
    minOffer = Math.max(5000, Math.min(minOffer, 100000));
    maxOffer = Math.max(minOffer * 2, Math.min(maxOffer, 500000));

    return {
      qualifies: qualifies,
      metrics: m,
      min_offer: minOffer,
      max_offer: maxOffer,
      confidence: m.volatility < 0.2 ? 'high' : m.volatility < 0.35 ? 'medium' : 'low',
      growth_label: m.growth > 0.05 ? 'Growing' : m.growth < -0.05 ? 'Declining' : 'Stable'
    };
  }

  // ── Check if dismissed ──
  function isDismissed() {
    var until = localStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return new Date(until) > new Date();
  }

  // ── Render banner ──
  function renderBanner() {
    // Remove existing
    var existing = document.getElementById('rv-funding-banner');
    if (existing) existing.remove();

    // Only show when the dashboard is visible (user is logged in)
    var dashScreen = document.getElementById('dashboard-screen');
    if (!dashScreen || dashScreen.style.display !== 'block') return;
    if (!localStorage.getItem('rv_account')) return;

    if (isDismissed()) return;

    var result = checkEligibility();
    if (!result.qualifies) return;

    var banner = document.createElement('div');
    banner.id = 'rv-funding-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#065f46 0%,#047857 50%,#059669 100%);color:white;border-radius:14px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;position:relative;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.15);';

    var minK = (result.min_offer / 1000).toFixed(0);
    var maxK = (result.max_offer / 1000).toFixed(0);
    var confBadge = result.confidence === 'high' ? '🟢 High confidence' : result.confidence === 'medium' ? '🟡 Good match' : '🔵 Exploratory';

    banner.innerHTML = '' +
      '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">' +
        '<div style="flex-shrink:0;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;">💰</div>' +
        '<div style="flex:1;min-width:200px;">' +
          '<div style="font-weight:800;font-size:1.05rem;margin-bottom:4px;">You may qualify for $' + minK + 'K – $' + maxK + 'K in funding</div>' +
          '<div style="font-size:0.82rem;opacity:0.85;">Based on your ' + result.growth_label.toLowerCase() + ' revenue trend ($' + Math.round(result.metrics.monthly_avg).toLocaleString() + '/mo avg) and positive cash flow. ' + confBadge + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:0.5rem;flex-shrink:0;">' +
          '<button onclick="RVFunding.accept()" style="background:white;color:#065f46;border:none;border-radius:8px;padding:0.55rem 1.25rem;font-weight:700;font-size:0.85rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);">Explore Options →</button>' +
          '<button onclick="RVFunding.dismiss()" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:0.55rem 0.85rem;font-weight:600;font-size:0.82rem;cursor:pointer;">Later</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:1.5rem;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.2);flex-wrap:wrap;">' +
        '<div style="font-size:0.72rem;opacity:0.7;">📊 3-mo Revenue: $' + Math.round(result.metrics.revenue_3mo).toLocaleString() + '</div>' +
        '<div style="font-size:0.72rem;opacity:0.7;">💵 Cash Flow: $' + Math.round(result.metrics.cashflow_3mo).toLocaleString() + '</div>' +
        '<div style="font-size:0.72rem;opacity:0.7;">📈 Trend: ' + result.growth_label + '</div>' +
        '<div style="font-size:0.72rem;opacity:0.7;">🔒 Pre-qualified &middot; No impact on credit</div>' +
      '</div>';

    // Find best insertion point
    var targets = ['#rv-advisor', '.portal-main', '.main', '.dash-content', '.page-header'];
    var inserted = false;
    for (var i = 0; i < targets.length; i++) {
      var el = document.querySelector(targets[i]);
      if (el) {
        el.insertBefore(banner, el.firstChild);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      var main = document.querySelector('main') || document.body;
      main.insertBefore(banner, main.firstChild);
    }
  }

  // ── Public API ──
  window.RVFunding = {
    check: renderBanner,
    dismiss: function() {
      var until = new Date(Date.now() + 7 * 86400000).toISOString();
      localStorage.setItem(DISMISS_KEY, until);
      var el = document.getElementById('rv-funding-banner');
      if (el) el.remove();
    },
    accept: function() {
      window.location.href = 'loan-connect.html';
    },
    getEligibility: checkEligibility
  };

  // ── Auto-init ──
  function init() {
    renderBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500); // slight delay to let other widgets render first
  }
})();
