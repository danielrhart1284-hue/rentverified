/**
 * RentVerified Micro-Interactions
 * Enhanced toasts, button ripples, card hover lift, confetti, page transitions.
 */
(function() {
  'use strict';

  var RVMicro = {};

  // ── Inject all CSS at once ──
  var css = [
    /* Enhanced Toast */
    '.rv-toast-container {',
    '  position: fixed; bottom: 80px; right: 16px; z-index: 99999;',
    '  display: flex; flex-direction: column-reverse; gap: 8px;',
    '  pointer-events: none;',
    '}',
    '.rv-enhanced-toast {',
    '  pointer-events: auto; display: flex; align-items: center; gap: 10px;',
    '  background: #fff; border-radius: 10px; padding: 12px 16px; min-width: 260px; max-width: 380px;',
    '  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);',
    '  cursor: pointer; overflow: hidden; position: relative;',
    '  transform: translateX(120%); opacity: 0;',
    '  animation: rvToastIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;',
    '}',
    '.rv-enhanced-toast.rv-toast-out {',
    '  animation: rvToastOut 0.3s ease forwards;',
    '}',
    '.rv-toast-icon { font-size: 1.25rem; flex-shrink: 0; }',
    '.rv-toast-msg { flex: 1; font-size: 0.88rem; color: #1f2937; font-weight: 500; line-height: 1.3; }',
    '.rv-toast-progress {',
    '  position: absolute; bottom: 0; left: 0; height: 3px;',
    '  border-radius: 0 0 10px 10px;',
    '  animation: rvToastProgress 3.5s linear forwards;',
    '}',
    '.rv-toast-success .rv-toast-progress { background: #10b981; }',
    '.rv-toast-error .rv-toast-progress { background: #ef4444; }',
    '.rv-toast-warning .rv-toast-progress { background: #f59e0b; }',
    '.rv-toast-info .rv-toast-progress { background: #3b82f6; }',
    '.rv-toast-success { border-left: 4px solid #10b981; }',
    '.rv-toast-error { border-left: 4px solid #ef4444; }',
    '.rv-toast-warning { border-left: 4px solid #f59e0b; }',
    '.rv-toast-info { border-left: 4px solid #3b82f6; }',
    '@keyframes rvToastIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }',
    '@keyframes rvToastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }',
    '@keyframes rvToastProgress { from { width: 100%; } to { width: 0%; } }',

    /* Button Ripple */
    '.rv-ripple-host { position: relative; overflow: hidden; }',
    '.rv-ripple {',
    '  position: absolute; border-radius: 50%; background: rgba(255,255,255,0.3);',
    '  transform: scale(0); animation: rvRipple 0.4s ease-out forwards;',
    '  pointer-events: none;',
    '}',
    '@keyframes rvRipple { to { transform: scale(4); opacity: 0; } }',

    /* Card Hover Lift */
    '.pm-card, .stat-card, [class*="card"] {',
    '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '}',
    '.pm-card:hover, .stat-card:hover, [class*="card"]:hover {',
    '  transform: translateY(-2px);',
    '  box-shadow: 0 8px 24px rgba(0,0,0,0.08);',
    '}',

    /* Confetti */
    '.rv-confetti-piece {',
    '  position: fixed; width: 8px; height: 8px; z-index: 999999;',
    '  pointer-events: none; border-radius: 2px;',
    '}',

    /* Smooth Tab Transitions */
    '[data-tab-content], .tab-pane, .tab-content.active, .jobs-view.active {',
    '  animation: rvFadeIn 0.25s ease;',
    '}',
    '@keyframes rvFadeIn {',
    '  from { opacity: 0; transform: translateY(8px); }',
    '  to   { opacity: 1; transform: translateY(0); }',
    '}',

    /* Mobile-scrollable tables (universal) */
    '@media (max-width: 768px) {',
    '  table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }',
    '  th, td { white-space: nowrap; }',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Toast Container ──
  var toastContainer;
  function ensureContainer() {
    if (!toastContainer || !toastContainer.parentNode) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'rv-toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  var icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };

  RVMicro.toast = function(msg, type) {
    type = type || 'success';
    if (type !== 'success' && type !== 'error' && type !== 'warning' && type !== 'info') type = 'success';
    var container = ensureContainer();

    var toast = document.createElement('div');
    toast.className = 'rv-enhanced-toast rv-toast-' + type;
    toast.innerHTML =
      '<span class="rv-toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<span class="rv-toast-msg">' + (msg || '') + '</span>' +
      '<div class="rv-toast-progress"></div>';

    toast.addEventListener('click', function() { dismiss(toast); });
    container.appendChild(toast);

    var timer = setTimeout(function() { dismiss(toast); }, 3500);

    function dismiss(el) {
      clearTimeout(timer);
      el.classList.add('rv-toast-out');
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }

    // Also update legacy rv-toast element if it exists (for backward compat)
    var legacyEl = document.getElementById('rv-toast');
    if (legacyEl) {
      legacyEl.textContent = msg;
      legacyEl.className = 'rv-toast' + (type === 'error' ? ' error' : '');
      legacyEl.classList.add('show');
      setTimeout(function() { legacyEl.classList.remove('show'); }, 3500);
    }
  };

  // Override global showToast
  window.showToast = function(msg, type) {
    RVMicro.toast(msg, type);
  };

  // ── Button Ripple ──
  function addRipple(e) {
    var btn = e.currentTarget;
    if (!btn.classList.contains('rv-ripple-host')) {
      btn.classList.add('rv-ripple-host');
    }
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var ripple = document.createElement('span');
    ripple.className = 'rv-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 450);
  }

  // Delegate ripple to all buttons
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.btn, .qa-btn, button, [class*="btn"]');
    if (btn && !btn.classList.contains('rv-mobile-nav-item')) {
      addRipple(e);
    }
  }, true);

  // ── Confetti ──
  var confettiColors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  RVMicro.confetti = function() {
    var count = 30;
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    var pieces = [];

    for (var i = 0; i < count; i++) {
      var piece = document.createElement('div');
      piece.className = 'rv-confetti-piece';
      piece.style.background = confettiColors[i % confettiColors.length];
      piece.style.left = centerX + 'px';
      piece.style.top = centerY + 'px';
      // Randomize shape
      if (Math.random() > 0.5) {
        piece.style.borderRadius = '50%';
        piece.style.width = '6px';
        piece.style.height = '6px';
      }
      document.body.appendChild(piece);

      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      pieces.push({
        el: piece,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * (3 + Math.random() * 5),
        vy: Math.sin(angle) * -(4 + Math.random() * 4),
        gravity: 0.12 + Math.random() * 0.05,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 15,
        opacity: 1
      });
    }

    var startTime = Date.now();
    var duration = 1500;

    function animate() {
      var elapsed = Date.now() - startTime;
      var progress = elapsed / duration;
      if (progress >= 1) {
        pieces.forEach(function(p) {
          if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        });
        return;
      }

      pieces.forEach(function(p) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity = 1 - progress;

        p.el.style.left = p.x + 'px';
        p.el.style.top = p.y + 'px';
        p.el.style.transform = 'rotate(' + p.rotation + 'deg)';
        p.el.style.opacity = p.opacity;
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  };

  // Expose globally
  window.RVMicro = RVMicro;

})();
