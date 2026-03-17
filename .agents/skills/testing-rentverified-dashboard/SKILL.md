# Testing RentVerified Dashboard

## Devin Secrets Needed
- `RENTVERIFIED_DEMO_EMAIL` - Demo PM login email
- `RENTVERIFIED_DEMO_PASSWORD` - Demo PM login password
- No other secrets required (app is fully client-side)

## Local Development Setup

1. Navigate to the repo root: `/home/ubuntu/rentverified`
2. Start a local HTTP server: `python3 -m http.server 8090` (from repo root, NOT the `rentverified/` subdirectory)
3. Open `http://localhost:8090/landlord-signup.html` in the browser
4. The app is pure static HTML/CSS/JS with no build step

## Authentication

- Use the demo credentials stored in Devin secrets
- Login form is on `landlord-signup.html` in a centered card with email and password fields
- After login, the dashboard loads with sidebar navigation
- Credentials are hardcoded in the `ACCOUNTS` array in `landlord-signup.html`

## Data Layer

- All data stored in `localStorage` with `rv_` prefix keys
- Seed data is generated on first load by functions like `seedLedgerData()`, `seedMessages()`
- To reset state: run `localStorage.clear()` in browser console and reload
- Key localStorage keys: `rv_account`, `rv_listings_*`, `rv_messages`, `rv_rent_ledger`, `rv_client_hub`

## File Structure

- **IMPORTANT**: Files must exist in BOTH root AND `rentverified/` subdirectory. The `rentverified/` subdirectory is the Vercel deploy root.
- Always sync changes: `cp file.html rentverified/file.html` before committing
- Key files: `landlord-signup.html` (main dashboard, 3900+ lines), `app.js` (shared JS library, 2500+ lines)

## Common Testing Flows

### Property Command Center (Phase 3)
1. Login -> Click "My Properties" in sidebar
2. Verify "Command" buttons appear on each property row
3. Click "Command" -> 6 tiles appear (Lease, Accounting, Maintenance, Docs, Communications, History)
4. Click any tile to expand its detail panel
5. "Back to Properties" link returns to the property list

### Inbox Central
1. Click "Inbox" in sidebar
2. Seed messages appear with role badges (owner/tenant/vendor)
3. "+ New Message" opens compose modal with role dropdown

### Rent Status Board
1. Click "Rent Status" in sidebar
2. Properties listed with Owed/Paid/Status columns
3. Aggregates shown at bottom (total owed, collection rate %)

### Legal Document Library
1. Click "Legal Library" in sidebar
2. Shows drag-drop upload zone for attorney forms

## Common Bugs to Watch For

- **Variable redeclaration**: The codebase uses `var` extensively. Adding `const` or `let` for a variable already declared with `var` in the same scope causes a `SyntaxError` that silently breaks ALL subsequent JS. Always check if a variable name is already used.
- **Missing data attributes**: The Command button injection relies on `data-listing-id` attribute on `.property-row` elements. If property row templates are modified, ensure this attribute is preserved.
- **Monkey-patched functions**: Phase 3 wraps `dashTab` and `renderPropertiesList` via monkey-patching. Order of script execution matters -- Phase 3 code must run AFTER the original functions are defined.
- **Duplicate file sync**: Changes to `app.js` or `landlord-signup.html` must be copied to the `rentverified/` subdirectory before committing, otherwise Vercel deploys stale code.
- **DevTools console**: Always check the browser console for SyntaxErrors after making JS changes. A single SyntaxError can silently break the entire app.

## Vercel Preview

- PRs automatically get Vercel preview deployments
- Preview URL format: `rentverified-git-{branch-slug}-sanders-property-management.vercel.app`
- Production: `rentverified.vercel.app` (deploys from `main` branch)
