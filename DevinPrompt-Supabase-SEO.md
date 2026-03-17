# Devin Prompt — RentVerified: Supabase Database + SEO Foundation
# (The "Become the Destination" Phase)

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)

## Why This Matters
Right now all listing data is in browser localStorage. Google cannot crawl localStorage.
This means zero organic search traffic. Zero tenants finding us without going through Zillow first.
This task migrates all data to Supabase (permanent cloud database) and adds proper SEO so
Google indexes every single property listing as its own searchable page.
This is the foundation of replacing Zillow long-term.

---

## Task 1 — Supabase Setup

Create the following tables in Supabase. The Supabase project URL and anon key will be
provided as environment variables in Vercel: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
Also add them to a `rentverified/config.js` file as:

```javascript
window.RV_SUPABASE_URL = 'YOUR_SUPABASE_URL';   // filled by Daniel from Supabase dashboard
window.RV_SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'; // filled by Daniel
```

### Table: `landlords`
```sql
id            uuid primary key default gen_random_uuid()
email         text unique not null
company_name  text
phone         text
plan          text default 'starter'  -- starter | pro_monthly | pro_annual
created_at    timestamptz default now()
```

### Table: `listings`
```sql
id            uuid primary key default gen_random_uuid()
listing_id    text unique not null   -- e.g. RV-2026-0001
landlord_id   uuid references landlords(id)
address       text not null
city          text
state         text default 'UT'
zip           text
beds          int
baths         numeric
sqft          int
rent          int
deposit       int
description   text
photos        text[]   -- array of Cloudinary URLs
amenities     text[]
status        text default 'available'  -- available | rented | coming_soon
pet_policy    text
parking       text
utilities     text
created_at    timestamptz default now()
updated_at    timestamptz default now()
slug          text unique   -- e.g. "2br-1ba-orem-ut-119-e-600-s"
```

### Table: `applications`
```sql
id            uuid primary key default gen_random_uuid()
listing_id    uuid references listings(id)
applicant_name text
applicant_email text
applicant_phone text
monthly_income numeric
employer      text
move_in_date  date
message       text
status        text default 'pending'  -- pending | approved | declined
created_at    timestamptz default now()
```

### Table: `tenants`
```sql
id            uuid primary key default gen_random_uuid()
email         text unique not null
name          text
phone         text
current_listing_id uuid references listings(id)
created_at    timestamptz default now()
```

---

## Task 2 — Supabase JavaScript Client

Add the Supabase CDN to every HTML page's `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
```

Create `rentverified/supabase.js` — a shared module that:

```javascript
// RentVerified — Supabase client wrapper
// Falls back to localStorage if Supabase is not configured (dev mode)

const RV_DB = (() => {
  const url = window.RV_SUPABASE_URL;
  const key = window.RV_SUPABASE_KEY;
  if (!url || url === 'YOUR_SUPABASE_URL') {
    console.warn('RV: Supabase not configured — using localStorage fallback');
    return null;
  }
  return supabase.createClient(url, key);
})();

// Save a listing (upsert by listing_id)
async function rvSaveListing(listing) {
  if (!RV_DB) { /* localStorage fallback — existing code */ return; }
  const slug = generateSlug(listing);
  const { error } = await RV_DB.from('listings').upsert({
    listing_id: listing.listingId,
    address: listing.address,
    city: parseCity(listing.address),
    state: 'UT',
    zip: parseZip(listing.address),
    beds: parseInt(listing.beds) || null,
    baths: parseFloat(listing.baths) || null,
    sqft: parseInt(listing.sqft) || null,
    rent: parseInt(listing.rent) || null,
    deposit: parseInt(listing.deposit) || null,
    description: listing.description || '',
    photos: listing.photos || [],
    status: listing.status || 'available',
    slug: slug,
    updated_at: new Date().toISOString()
  }, { onConflict: 'listing_id' });
  if (error) console.error('RV save error:', error);
}

// Load all available listings
async function rvGetListings(filters = {}) {
  if (!RV_DB) { /* localStorage fallback */ return getLocalListings(filters); }
  let q = RV_DB.from('listings').select('*').eq('status', 'available');
  if (filters.minRent) q = q.gte('rent', filters.minRent);
  if (filters.maxRent) q = q.lte('rent', filters.maxRent);
  if (filters.beds) q = q.eq('beds', filters.beds);
  if (filters.city) q = q.ilike('city', `%${filters.city}%`);
  q = q.order('created_at', { ascending: false });
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data || [];
}

// Load single listing by listing_id or slug
async function rvGetListing(idOrSlug) {
  if (!RV_DB) { return getLocalListing(idOrSlug); }
  const { data } = await RV_DB.from('listings')
    .select('*')
    .or(`listing_id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();
  return data || null;
}

// Slug generator: "2br-1ba-orem-ut-119-e-600-s"
function generateSlug(listing) {
  const beds = listing.beds ? listing.beds + 'br' : '';
  const baths = listing.baths ? listing.baths + 'ba' : '';
  const city = parseCity(listing.address).toLowerCase().replace(/\s+/g, '-');
  const state = 'ut';
  const street = (listing.address || '').split(',')[0].toLowerCase()
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 30);
  return [beds, baths, city, state, street].filter(Boolean).join('-');
}

function parseCity(address) {
  const parts = (address || '').split(',');
  return parts.length >= 2 ? parts[1].trim().split(' ')[0] : 'Utah';
}

function parseZip(address) {
  const match = (address || '').match(/\b\d{5}\b/);
  return match ? match[0] : '';
}
```

---

## Task 3 — Wire Supabase into Existing Dashboard

In `landlord-signup.html`, modify `saveEditListing()` to call `rvSaveListing(p)` AFTER saving to localStorage (so it writes to both simultaneously during transition):

```javascript
// After existing localStorage save:
if (typeof rvSaveListing === 'function') rvSaveListing(p);
```

In `listings.html`, modify `renderPublicListings()` to call `rvGetListings(filters)` instead of reading localStorage directly. Fall back to localStorage if Supabase is unavailable.

In `property-detail.html`, modify the listing loader to call `rvGetListing(id)` instead of searching localStorage.

---

## Task 4 — SEO: Every Listing Gets Its Own Indexed Page

This is the most important task for long-term growth.

### 4a — Dynamic Meta Tags on property-detail.html

After loading listing data (from Supabase or localStorage), update the page's meta tags dynamically:

```javascript
function setListingSEO(listing) {
  const title = `${listing.beds} Bed ${listing.baths} Bath for Rent — ${listing.address} | RentVerified`;
  const desc = `$${listing.rent}/mo · ${listing.beds} bed, ${listing.baths} bath in ${parseCity(listing.address)}, UT. ${(listing.description || '').substring(0, 120)}. Verified landlord. Apply online.`;
  const img = listing.photos?.[0] || 'https://rentverified.com/og-image.jpg';
  const url = `https://rentverified.com/property-detail.html?id=${listing.listing_id}`;

  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);

  // Open Graph (Facebook, LinkedIn previews)
  setMeta('og:title', title);
  setMeta('og:description', desc);
  setMeta('og:image', img);
  setMeta('og:url', url);
  setMeta('og:type', 'product');

  // Twitter card
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img);

  // Schema.org structured data (Google rich results)
  const schema = {
    "@context": "https://schema.org",
    "@type": "Residence",
    "name": listing.address,
    "description": listing.description || '',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": listing.address.split(',')[0],
      "addressLocality": parseCity(listing.address),
      "addressRegion": "UT",
      "postalCode": parseZip(listing.address),
      "addressCountry": "US"
    },
    "offers": {
      "@type": "Offer",
      "price": listing.rent,
      "priceCurrency": "USD",
      "availability": listing.status === 'available'
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut"
    }
  };
  let schemaTag = document.getElementById('rv-schema');
  if (!schemaTag) {
    schemaTag = document.createElement('script');
    schemaTag.id = 'rv-schema';
    schemaTag.type = 'application/ld+json';
    document.head.appendChild(schemaTag);
  }
  schemaTag.textContent = JSON.stringify(schema);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
```

### 4b — Add default meta tags to property-detail.html `<head>`
```html
<meta name="description" content="Find verified rentals in Utah — RentVerified" />
<meta property="og:type" content="website" />
<meta property="og:image" content="/og-image.jpg" />
<meta name="twitter:card" content="summary_large_image" />
```

### 4c — Sitemap Generator (Vercel Serverless Function)

Create `api/sitemap.js`:

```javascript
// GET /api/sitemap → returns sitemap.xml with all listing URLs
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const BASE = 'https://rentverified-git-devin-17735-4fa274-sanders-property-management.vercel.app';

  let listingUrls = [];
  if (SUPABASE_URL && SUPABASE_KEY) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=listing_id,updated_at&status=eq.available`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const data = await r.json();
    listingUrls = (data || []).map(l => ({
      url: `${BASE}/property-detail.html?id=${l.listing_id}`,
      lastmod: l.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0]
    }));
  }

  const staticPages = ['index.html','listings.html','tenant-portal.html'].map(p => ({
    url: `${BASE}/${p}`, lastmod: new Date().toISOString().split('T')[0]
  }));

  const allUrls = [...staticPages, ...listingUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url><loc>${u.url}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(xml);
}
```

Also create `rentverified/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://rentverified-git-devin-17735-4fa274-sanders-property-management.vercel.app/api/sitemap
```

---

## Task 5 — Tenant "Save Search" + Email Alerts

Add a banner at the top of `listings.html`:

```
"🔔 Get notified when new rentals match your search"
[ Email address input ]  [ Notify Me ]
```

When submitted:
1. Save to Supabase `tenants` table (email + city/price/beds filter params from URL)
2. Or save to localStorage `rv_search_alerts` array if Supabase not configured
3. Show "✅ You'll get an email when matching listings go live."

This builds an email list of prospective tenants — a huge asset for landlords and for marketing RentVerified.

---

## Task 6 — "Listed On" Backlink Strategy

On every property-detail.html page, add a small section:

```html
<div style="...">
  <p>Also listed on:</p>
  <a href="[zillow listing URL if provided]">Zillow</a>
  <a href="[facebook listing URL if provided]">Facebook</a>
  <strong>✓ Verified source: RentVerified</strong>
</div>
```

In the landlord listing editor, add optional fields:
- "Zillow listing URL (optional)"
- "Facebook post URL (optional)"

If filled, the property detail page shows "Also listed on Zillow" with a link — but always frames RentVerified as the verified source. This builds credibility while pulling traffic from Zillow to us.

---

## Task 7 — "No Fees" + "Verified" Trust Signals

On `listings.html` and `property-detail.html`, add a sticky trust bar just below the nav:

```
✅ All listings verified  ·  🔒 No scam guarantee  ·  💚 $0 application fee  ·  ⚡ AI assistant on every listing
```

Style it as a thin dark navy bar. This directly addresses the #1 tenant fear (scams) and #1 friction point (application fees). It differentiates RentVerified from Zillow and Facebook Marketplace on first glance.

---

## Task 8 — Google Analytics + Search Console Setup

In every HTML page `<head>`, add:
```html
<!-- Google Analytics — Daniel replaces G-XXXXXXXXXX with real ID from analytics.google.com -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Create `rentverified/google-site-verification.html` — empty file for Google Search Console verification:
```html
google-site-verification: googleXXXXXXXXXXXXXXXX.html
```
(Daniel replaces the filename with the real verification code from Google Search Console)

---

## Testing Checklist
1. Add a listing in the dashboard → it appears in Supabase `listings` table
2. Navigate to `listings.html` → real listing shows up in the grid
3. Click "View Details" → `property-detail.html` loads that specific listing
4. View page source on property-detail.html → see proper `<title>` and `<meta description>` with listing data
5. Visit `/api/sitemap` → see XML with listing URLs
6. Visit `/robots.txt` → see sitemap directive
7. Check Google Search Console → submit sitemap URL
8. Mobile test all pages at 375px

## Priority Order
Do tasks in this order: 2 → 3 → 1 → 4 → 7 → 5 → 6 → 8
(Get data flowing first, then make it indexable, then add trust signals)
