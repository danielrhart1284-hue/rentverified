# RentVerified — Technical Brief

Single source of truth for platform type, hosting, data, and planned work. Keep this updated when you change stack or add features.

---

## Platform Type

**Static web application** — HTML5, CSS3, and vanilla JavaScript with no frontend framework. No React, no Vue, no Angular. Pure browser-native code that runs entirely client-side with no build step required.

---

## Hosting & Deployment

| Item | Value |
|------|--------|
| **Host** | Vercel (free tier) |
| **Repository** | GitHub — danielrhart1284-hue/rentverified |
| **Deploy root directory** | `rentverified/` subdirectory within the repo |
| **Deployment trigger** | Automatic on every push to the main branch |
| **CDN** | Vercel's global edge network |
| **Deploy time** | ~60 seconds from push to live |
| **Local development path** | `C:\Users\Owner\OneDrive\Documentos\rentverified\` (Windows) |
| **Sandbox path** | `/sessions/festive-wizardly-ptolemy/mnt/Documentos/rentverified/` |

---

## Pages / Files

| File | Purpose |
|------|---------|
| **index.html** | Public homepage, listing search, scam verification tool |
| **listings.html** | Property listings directory |
| **property-detail.html** | Individual listing page with AI chat widget |
| **landlord-signup.html** | Full landlord / property manager dashboard |
| **tenant-portal.html** | Tenant-facing portal |
| **app.js** | Shared JavaScript (AI chat, keyword responses, verification, tab navigation) |
| **styles.css** | Shared stylesheet |
| **attorney-demo.html**, **accounting.html**, **maintenance.html**, **ad-builder.html** | Additional pages |

---

## Data Storage (Current)

All data currently stored in **browser localStorage**. Key-value pairs:

| Key | Contents |
|-----|----------|
| `rv_listings_{clientId}` | Property listings per client |
| `rv_account` | Logged-in account data |
| `rv_leases` | All lease records |
| `rv_tenant_lease` | Individual tenant's lease |
| `rv_fee_policy` | Fee absorption settings |
| `rv_chat_inbox` | Unanswered tenant chat questions |
| `rv_broadcast_{listId}` | Broadcast posted status per listing |
| `rv_clients` | All client accounts |
| `rv_app_tracker` | Application tracking |
| `rv_assistance_cases` | Tenant assistance cases |

---

## Authentication

- **Current:** Client-side only. `ACCOUNTS` array in **landlord-signup.html** stores credentials. Login matches on email or username plus password.
- **Accounts:** Sanders PM (danielrhart1284@gmail.com) and admin (danielhart1284).
- **Note:** Not production-grade — planned to migrate to **Supabase Auth** when the database layer is added.

---

## AI Chat System

| Aspect | Detail |
|--------|--------|
| **Type** | Keyword-based response engine with property-aware context |
| **Location** | **app.js** — `buildResponses()` and `getAIResponse()` |
| **Patterns** | 50+ matched question types, sorted by phrase length for accuracy |
| **Property data** | Injected via `window.PROPERTY_DATA` on each listing page |
| **Unanswered questions** | Saved to `rv_chat_inbox` in localStorage |
| **API hook** | `window.RV_CHAT_API` — when set (e.g. `/api/chat`), chat uses that endpoint; otherwise keyword replies |
| **Backend** | Optional Vercel serverless **api/chat.js** calls Anthropic Claude API when `ANTHROPIC_API_KEY` is set in Vercel env |
| **Fallback timeout** | 10 seconds before falling back to keyword replies |
| **Typing indicator** | Simulated 700ms–1.3s delay for natural feel |

---

## Photo Storage

| Item | Detail |
|------|--------|
| **Service** | Cloudinary (cloud storage) |
| **Upload method** | Unsigned upload preset `rentverified_photos` via browser fetch to Cloudinary API |
| **Storage format** | Secure HTTPS URLs saved in listing data |
| **Download** | JSZip (Cloudflare CDN) generates client-side ZIP for ad posting |
| **Fallback** | base64 in localStorage if Cloudinary not configured |

---

## Email Automation

- **Service:** Gmail via MCP connection
- **Scheduled task:** Hourly; scans for unread inquiry emails from Zillow, Facebook, Apartments.com, KSL
- **Output:** Gmail draft replies generated using AI response logic
- **Sending:** Nothing auto-sends — all drafts require manual review and send

---

## Third-Party Libraries

| Library | Version | Source | Purpose |
|---------|---------|--------|---------|
| JSZip | 3.10.1 | Cloudflare CDN | Photo ZIP generation |

No npm dependencies on the frontend. No **package.json** for the site itself.

---

## Git Workflow

- Sandbox **cannot push** directly to GitHub (403 proxy restriction).
- **Workflow:** Sandbox makes changes and commits → user runs `git pull && git push` from Windows → Vercel auto-deploys.

---

## Planned Technical Additions (order)

| # | Addition | Technology | Purpose |
|---|----------|------------|---------|
| 1 | Tour scheduling | Calendly embed | 30-min booking slots |
| 2 | Online application form | HTML form | Tenant applications |
| 3 | Permanent database | Supabase (free tier) | Replace localStorage for legal records |
| 4 | Background check | TransUnion SmartMove API | Post-application screening invite |
| 5 | Built-in e-signing | PDF-lib + Signature Pad JS | Lease signing without DocuSign |
| 6 | AI chat upgrade | Vercel serverless + API | Real AI via **/api/chat** (implemented; enable with `ANTHROPIC_API_KEY`) |
| 7 | Eviction documents | PDF generation | One-click legal packet |
| 8 | Backend server | Vercel serverless functions | Unlocks Facebook API, Stripe, proper auth |
| 9 | Authentication | Supabase Auth | Replace client-side ACCOUNTS array |

---

## Current Limitations

- **localStorage** is browser-specific and can be cleared — not reliable for legal records.
- **Authentication** is client-side only — not secure enough for multi-tenant production.
- **No backend** — no Facebook Messenger API, no Stripe, no server-side logic.
- **HTML sync** — all 27 HTML files must be manually synced to the `rentverified/` subfolder before each push (if repo structure uses a parent folder).
- **Cloudinary** — cloud name must be configured before photo uploads go live.

---

*Last updated to match project state and technical decisions. Edit this file when you change stack, hosting, or data flow.*
