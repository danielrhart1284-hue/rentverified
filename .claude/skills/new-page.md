---
name: new-page
description: Create a new HTML page with full RentVerified boilerplate (navbar, scripts, mobile CSS, widgets)
user_invocable: true
args: "<filename> <page-title> [theme-color]"
---

# /new-page — Create a New Page with Full Boilerplate

Creates a new HTML page following the exact RentVerified patterns. Includes all standard boilerplate so nothing is missed.

## Arguments

- `filename` (required) — e.g., `my-feature.html`
- `page-title` (required) — e.g., `"My Feature"`
- `theme-color` (optional) — primary color hex, default `#1a56db` (blue)

## Template

Create the file with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{page-title} – RentVerified</title>
  <link rel="stylesheet" href="styles.css" />
  <style>
    /* ── Page-Specific Styles ── */
    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
    .page-hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white; padding: 2.5rem 2rem; text-align: center;
    }
    .page-hero h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; }
    .page-hero p { font-size: 0.95rem; opacity: 0.8; max-width: 500px; margin: 0 auto; }

    /* ── Toast ── */
    .rv-toast {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 99999;
      background: #065f46; color: white; padding: 0.85rem 1.5rem;
      border-radius: 10px; font-weight: 600; font-size: 0.88rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      transform: translateY(120%); opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .rv-toast.error { background: #991b1b; }
    .rv-toast.show { transform: translateY(0); opacity: 1; }

    /* ── Quick Actions ── */
    .quick-actions-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #f0f9ff, #f0fdf4); border: 1px solid #bfdbfe; border-radius: 12px; }
    .qa-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1rem; border-radius: 9px; font-size: 0.82rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
    .qa-btn-primary { background: {theme-color}; color: white; }

    /* ── Progressive Disclosure ── */
    details.form-more { margin-top: 0.75rem; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    details.form-more summary { padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 600; color: #6b7280; cursor: pointer; background: #f9fafb; }
    details.form-more summary:hover { color: #3b82f6; background: #f0f9ff; }
    details.form-more > div { padding: 0.75rem 1rem; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .page-hero h1 { font-size: 1.5rem; }
      .page-wrap { padding: 1rem; }
      nav .nav-links { display: none; }
      nav .nav-cta { display: none; }
      .rv-toast { left: 1rem; right: 1rem; bottom: 5rem; text-align: center; }
      .quick-actions-bar .qa-btn { flex: 1; justify-content: center; min-width: 140px; }
    }
  </style>
</head>
<body>

<nav>
  <a href="index.html" class="nav-logo">
    <svg viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="9" fill="#1a56db"/><path d="M18 8L8 14v14h6v-8h8v8h6V14L18 8z" fill="white"/><circle cx="22" cy="12" r="3" fill="#93c5fd"/></svg>
    <span style="font-weight:800;">Sanders PM</span> <span style="font-weight:500;opacity:0.9;">· RentVerified</span>
  </a>
  <div class="nav-links">
    <a href="index.html">Dashboard</a>
    <a href="crm.html">CRM</a>
    <a href="booking.html">Booking</a>
    <a href="messages.html">Messages</a>
    <a href="{filename}" style="color:#2563eb;font-weight:700;">{page-title}</a>
  </div>
  <div class="nav-cta">
    <a href="tenant-portal.html" class="btn btn-outline btn-sm">Log In</a>
    <a href="landlord-signup.html" class="btn btn-primary btn-sm">Get Started</a>
  </div>
</nav>

<!-- Toast -->
<div class="rv-toast" id="rv-toast"></div>

<!-- HERO -->
<section class="page-hero">
  <h1>{page-title}</h1>
  <p>Description goes here.</p>
</section>

<div class="page-wrap">
  <!-- PAGE CONTENT GOES HERE -->
</div>

<!-- FOOTER -->
<footer style="background:#111827;color:#9CA3AF;text-align:center;padding:2rem;font-size:0.8rem;margin-top:3rem;">
  &copy; 2026 Sanders Property Management &middot; RentVerified &middot;
  <a href="index.html" style="color:#93c5fd;">Home</a>
</footer>

<script src="supabase-config.js"></script>
<script src="data-layer.js"></script>
<script>
  // Force localStorage mode for testing
  if (typeof RVData !== 'undefined') RVData._useSupabase = function() { return false; };

  // Toast helper
  function showToast(msg, type) {
    var el = document.getElementById('rv-toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'rv-toast' + (type === 'error' ? ' error' : '');
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 3500);
  }

  // ═══════════════════════════════════════════
  // PAGE LOGIC GOES HERE
  // ═══════════════════════════════════════════

</script>
<script src="share-widget.js" data-share-title="{page-title}"></script>
<script src="service-connect.js"></script>
<script src="business-advisor.js"></script>
<script src="rv-micro.js"></script>
<script src="rv-mobile-nav.js"></script>
</body>
</html>
```

## After Creating

1. Replace all `{page-title}`, `{filename}`, and `{theme-color}` placeholders
2. Copy the new file to `rentverified/` subdirectory
3. Report: "✅ Created {filename} with full boilerplate. Ready to add page logic."
