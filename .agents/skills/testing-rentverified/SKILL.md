# Testing RentVerified Platform

RentVerified is a static HTML5/CSS3/vanilla JavaScript web application with no build step. All data is stored in browser localStorage.

## Local Development Setup

1. Serve the `rentverified/` subdirectory (the Vercel deploy root) with any HTTP server:
   ```bash
   cd /path/to/repo/rentverified && python3 -m http.server 8080
   ```
2. Open `http://localhost:8080/index.html` in the browser.

**Note:** The Vercel preview deployment may have deployment protection enabled, requiring login. Use the local HTTP server as a reliable fallback for testing.

## File Structure

- Root files (`app.js`, `styles.css`, HTML pages) are the source of truth
- `rentverified/` subdirectory contains identical copies for Vercel deployment
- After editing root files, sync to subdirectory: `cp file.html rentverified/file.html`
- Both locations must stay in sync before committing

## Key Test Flows

### Scam Verification (index.html)
- Scroll to "Protect Yourself From Facebook Rental Scams" section (near bottom of homepage)
- Use Ctrl+F to search "Protect Yourself" to find it quickly
- Enter `RV-2026-0001` (valid) -> green verified result
- Enter `RV-9999-FAKE` (invalid) -> red warning result
- The verification input has `data-verify-input` attribute, button has `data-verify-btn`

### Dynamic Listings (listings.html)
- 3 seed listings render automatically from localStorage via `renderListingCards()`
- Cards show: 119 E 600 S Orem, 456 Oak Avenue, 789 Pine Road
- Chat bubble appears in bottom-right corner

### Chat Widget
- Click the chat bubble (bottom-right) on listings.html or index.html
- **Important:** The chat input may not respond well to direct click+type. Use JavaScript via address bar as a workaround:
  ```
  javascript:void(document.getElementById('chat-input').value='your message',sendChat())
  ```
- Test keywords: "is this available?", "what is the rent?", "are pets allowed?"
- AI responds from 60+ keyword patterns in `buildResponses()` in app.js

### Tenant Portal (tenant-portal.html)
- Has a login screen that must be bypassed for testing. Use:
  ```
  javascript:void(document.getElementById('login-screen').style.display='none',document.getElementById('portal-screen').style.display='block')
  ```
- Then click "Maintenance" in the sidebar to access the maintenance request form
- Form fields: Category (#tMCat), Urgency (#tMPri), Description (#tMDesc)
- Submitted requests appear in "My Requests" list and persist in `rv_maintenance_requests` localStorage key

### Landlord Dashboard (landlord-signup.html)
- Has its own login screen with ACCOUNTS array authentication
- Demo credentials are stored in the ACCOUNTS array in app.js (check there for current values)
- Features: lease generation, eviction notice generation, chat inbox, broadcast modal

## localStorage Keys

| Key | Contents |
|-----|----------|
| `rv_listings_{clientId}` | Property listings per client |
| `rv_maintenance_requests` | Tenant maintenance requests |
| `rv_leases` | All lease records |
| `rv_chat_inbox` | Unanswered chat questions |
| `rv_eviction_docs` | Generated eviction documents |
| `rv_applications` | Rental applications |

## Common Issues

- **Chat input not responding to clicks:** The chat widget overlay positioning can interfere with click targeting. Use the JavaScript address bar workaround above.
- **Tenant portal shows blank after login bypass:** Make sure to set `portal-screen` display to `block` (not `flex`). The element ID is `portal-screen`, not `dashboard`.
- **Browser console not accessible:** Chrome must be in the foreground for `browser_console` tool to work. Click on the page body first if getting "Chrome is not in the foreground" errors.

## Devin Secrets Needed

No secrets required for local testing. The app is fully client-side with localStorage.
