# Testing RentVerified Landlord Dashboard

## Local Setup
- Serve files with `python3 -m http.server 8095` from the repo root
- Access at `http://localhost:8095/landlord-signup.html`

## Login
- Use the QA demo credentials stored in secrets management
- Login function: `doLogin()` at landlord-signup.html line ~2037
- Fields: `#login-email`, `#login-password`

## Tab Navigation
- All tabs use `dashTab('tabname')` function
- New Phase 3 tabs: `advaccounting`, `profile`, `bulkmsg`, `permissions`
- Tab content divs: `#tab-advaccounting`, `#tab-profile`, `#tab-bulkmsg`, `#tab-permissions`
- Sidebar links are at the bottom of the sidebar — scroll down to find them
- Triple-nested dashTab wrappers exist (Phase 3 monkey-patches) — be aware of this when debugging tab issues

## Global Search
- Input: `#global-search-input` in top nav bar
- Results dropdown: `#global-search-results`
- Function: `handleGlobalSearch()` calls `globalSearch()` from app.js
- Searches: properties (by address/tenant/listingId), clients (by name/email), messages (by from/subject/body), enhanced docs (by name/listingId)
- **Important**: Search results depend on localStorage data. If no SPM import has been done in the session, property/client results will be empty. Messages are seeded automatically.

## Advanced Accounting
- `renderAdvancedLedger()` is called on tab switch
- `seedAdvancedLedger()` auto-populates from client hub data on first render
- If no client hub data exists, ledger will be empty — use "+ Add Entry" to test manually
- **PM Fee 0% edge case**: Setting fee to 0% must show $0 fee and full rent as net. Was a bug (falsy-zero pattern `|| 7`), now fixed with explicit null check.

## Key localStorage Keys
- `rv_advanced_ledger` — Advanced accounting entries
- `rv_branding` — Company branding/logo
- `rv_team_members` — Team member list
- `rv_public_profile` — Company profile
- `rv_bulk_messages` — Sent broadcast history
- `rv_permission_overrides` — Permission settings
- `rv_client_hub` — Client/owner data (flat array, NOT object with .owners)
- `rv_property_docs_enhanced` — Enhanced document storage (separate from legacy `rv_property_docs`)

## Common Issues
- Google Maps API warnings in console are expected (no API key configured) — not errors
- If tabs don't render, check if tab divs are inside `.dash-main` container
- `getClientHub()` returns a flat array, not `{owners: [...]}` — code that accesses `.owners` will silently fail
- Deploy subdirectory (`rentverified/`) must stay in sync with root files
