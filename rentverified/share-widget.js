// ============================================================================
// 3120 Life — Social Share Widget
// ============================================================================
// Drop-in share FAB for any page.  Just add:
//   <script src="share-widget.js"></script>
//
// Optional data-attributes on <body> (or first <script src="share-widget.js">):
//   data-share-title="My Listing"       → custom share title
//   data-share-text="Check this out!"   → custom share description
//   data-share-url="https://..."        → explicit URL (defaults to current page)
//   data-share-position="left"          → put FAB on the bottom-left instead
//   data-share-hide="email,copy"        → hide specific channels
// ============================================================================

(function() {
  'use strict';

  // ── Read config from script tag or body ──
  var scriptTag = document.currentScript ||
    document.querySelector('script[src*="share-widget"]');
  var cfgEl = scriptTag || document.body;

  var cfg = {
    title: cfgEl.getAttribute('data-share-title') || document.title || '3120 Life',
    text:  cfgEl.getAttribute('data-share-text')  || '',
    url:   cfgEl.getAttribute('data-share-url')    || window.location.href,
    position: cfgEl.getAttribute('data-share-position') || 'right',
    hide:  (cfgEl.getAttribute('data-share-hide')  || '').split(',').map(function(s){ return s.trim(); })
  };

  // ── Channels ──
  var channels = [
    {
      key: 'facebook', label: 'Facebook', color: '#1877f2',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      href: function() {
        return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(cfg.url);
      }
    },
    {
      key: 'x', label: 'X / Twitter', color: '#000000',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      href: function() {
        var t = cfg.title + (cfg.text ? ' — ' + cfg.text : '');
        return 'https://x.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(cfg.url);
      }
    },
    {
      key: 'linkedin', label: 'LinkedIn', color: '#0a66c2',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
      href: function() {
        return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(cfg.url);
      }
    },
    {
      key: 'email', label: 'Email', color: '#6b7280',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
      href: function() {
        var subj = cfg.title;
        var body = (cfg.text ? cfg.text + '\n\n' : '') + cfg.url;
        return 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      }
    },
    {
      key: 'copy', label: 'Copy Link', color: '#059669',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71z"/></svg>',
      href: null  // special — uses clipboard
    }
  ];

  // Filter hidden channels
  channels = channels.filter(function(ch) {
    return cfg.hide.indexOf(ch.key) === -1;
  });

  // ── Inject Styles ──
  var style = document.createElement('style');
  style.textContent = [
    '.rv-share-fab{position:fixed;bottom:24px;' + cfg.position + ':24px;z-index:9990;display:flex;flex-direction:column-reverse;align-items:' + (cfg.position === 'left' ? 'flex-start' : 'flex-end') + ';gap:8px;pointer-events:none;}',
    '.rv-share-fab>*{pointer-events:auto;}',
    '.rv-share-trigger{width:52px;height:52px;border-radius:50%;border:none;background:#2563eb;color:white;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,0.35);display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s;}',
    '.rv-share-trigger:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(37,99,235,0.45);}',
    '.rv-share-trigger svg{width:22px;height:22px;}',
    '.rv-share-trigger.open{background:#1e40af;transform:rotate(45deg);}',
    '.rv-share-menu{display:flex;flex-direction:column-reverse;gap:6px;opacity:0;transform:translateY(8px);transition:opacity 0.2s,transform 0.2s;pointer-events:none;}',
    '.rv-share-fab.open .rv-share-menu{opacity:1;transform:translateY(0);pointer-events:auto;}',
    '.rv-share-btn{display:flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;border-radius:99px;border:none;background:white;color:#374151;font-size:0.8rem;font-weight:600;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.12);white-space:nowrap;transition:transform 0.15s,box-shadow 0.15s;}',
    '.rv-share-btn:hover{transform:translateX(' + (cfg.position === 'left' ? '3' : '-3') + 'px);box-shadow:0 4px 16px rgba(0,0,0,0.18);}',
    '.rv-share-btn svg{width:18px;height:18px;flex-shrink:0;}',
    '.rv-share-btn .rv-share-icon-circle{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;}',
    '.rv-share-btn .rv-share-icon-circle svg{width:14px;height:14px;}',
    '.rv-share-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(10px);background:#065f46;color:white;padding:8px 20px;border-radius:99px;font-size:0.82rem;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.25s,transform 0.25s;z-index:9999;pointer-events:none;}',
    '.rv-share-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}',
    '@media(max-width:640px){.rv-share-fab{bottom:16px;' + cfg.position + ':16px;}.rv-share-trigger{width:46px;height:46px;}.rv-share-btn{padding:6px 12px 6px 8px;font-size:0.75rem;}.rv-share-btn .rv-share-icon-circle{width:24px;height:24px;}.rv-share-btn .rv-share-icon-circle svg{width:12px;height:12px;}}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Build DOM ──
  var fab = document.createElement('div');
  fab.className = 'rv-share-fab';

  // Trigger button
  var trigger = document.createElement('button');
  trigger.className = 'rv-share-trigger';
  trigger.setAttribute('aria-label', 'Share');
  trigger.title = 'Share this page';
  trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';

  // Menu
  var menu = document.createElement('div');
  menu.className = 'rv-share-menu';

  channels.forEach(function(ch) {
    var btn = document.createElement('button');
    btn.className = 'rv-share-btn';
    btn.innerHTML = '<span class="rv-share-icon-circle" style="background:' + ch.color + '">' + ch.icon + '</span>' +
      '<span>' + ch.label + '</span>';
    btn.title = 'Share via ' + ch.label;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (ch.key === 'copy') {
        copyToClipboard(cfg.url);
      } else if (ch.key === 'email') {
        window.location.href = ch.href();
      } else {
        // Try native Web Share API for mobile first
        window.open(ch.href(), '_blank', 'width=600,height=500,menubar=no,toolbar=no');
      }
      closeFab();
    });

    menu.appendChild(btn);
  });

  fab.appendChild(menu);
  fab.appendChild(trigger);

  // Toast
  var toast = document.createElement('div');
  toast.className = 'rv-share-toast';
  toast.textContent = 'Link copied to clipboard!';

  // ── Events ──
  var isOpen = false;

  function toggleFab() {
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    trigger.classList.toggle('open', isOpen);
  }

  function closeFab() {
    isOpen = false;
    fab.classList.remove('open');
    trigger.classList.remove('open');
  }

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();

    // Try native share on mobile (if available and supported)
    if (!isOpen && navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({
        title: cfg.title,
        text: cfg.text || cfg.title,
        url: cfg.url
      }).catch(function() {
        // Fallback to manual menu if native share cancelled
        toggleFab();
      });
      return;
    }

    toggleFab();
  });

  document.addEventListener('click', function() {
    if (isOpen) closeFab();
  });

  fab.addEventListener('click', function(e) { e.stopPropagation(); });

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast(); } catch(e) {}
      document.body.removeChild(ta);
    }
  }

  function showToast() {
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2200);
  }

  // ── Mount ──
  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(toast);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // ── Public API (optional) ──
  window.RVShare = {
    open: toggleFab,
    close: closeFab,
    updateConfig: function(newCfg) {
      if (newCfg.title) cfg.title = newCfg.title;
      if (newCfg.text)  cfg.text  = newCfg.text;
      if (newCfg.url)   cfg.url   = newCfg.url;
    }
  };
})();
