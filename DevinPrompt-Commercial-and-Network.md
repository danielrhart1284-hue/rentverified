# Devin Prompt — RentVerified: Commercial Property Management + Professional Network

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)

## Codebase Context (READ THIS FIRST)
- Static HTML/CSS/vanilla JavaScript — no frontend framework
- All data stored in localStorage using `rv_` prefix keys
- Existing portals: `landlord-signup.html`, `tenant-portal.html`, `agent-portal.html`, `vendor-portal.html`
- Existing auth: email + password stored in localStorage, `rv_doc_role` tracks current session role
- Existing keys in use: `rv_landlord_accounts`, `rv_agent_accounts`, `rv_vendor_accounts`, `rv_properties`, `rv_leases`, `rv_applicants`
- Multi-tenancy: each account has its own scoped localStorage data. Company ID = sanitized email prefix
- Styles: `styles.css` contains all shared classes — `.btn`, `.btn-primary`, `.btn-outline`, `.badge`, `.property-card`, `.dashboard-layout`, `.dash-sidebar`, `.dash-link`, `nav`, etc.
- DO NOT modify `styles.css` — add page-specific `<style>` blocks only
- Copy ALL changed/new files to `rentverified/` subdirectory after every task

---

## PART A — COMMERCIAL PROPERTY MANAGEMENT

### A1 — New Page: `commercial.html`

Create a new page `rentverified/commercial.html` — the Commercial Property Management dashboard.
It follows the same layout as `landlord-signup.html` (sidebar nav + main content area).

**Sidebar tabs:**
1. Overview
2. My Properties
3. Tenants / Lessees
4. Leases
5. CAM Charges
6. Financials
7. Screening
8. Documents
9. Maintenance
10. Settings

**Auth:** Reuse the same login pattern as `landlord-signup.html`:
- Email + password stored in `rv_commercial_accounts` localStorage key
- Session stored as `rv_commercial_session = { email, companyName, plan, id }`
- If not logged in, show signup/login form before dashboard
- On signup, store: `{ id, email, password, companyName, phone, plan: 'commercial_starter', createdAt }`

**Add "Commercial" option to the main nav in `index.html`:**
Add a "Commercial" link in the nav that goes to `commercial.html`.

---

### A2 — Commercial Property Types

In `commercial.html`, the "Add Property" form must support these property types (not in residential):

| Type | Icon | Description |
|------|------|-------------|
| Office | 🏢 | Single-tenant or multi-tenant office space |
| Retail | 🏪 | Storefront, strip mall, standalone retail |
| Industrial | 🏭 | Warehouse, manufacturing, flex space |
| Mixed-Use | 🏘️ | Residential + commercial in same building |
| Medical Office | 🏥 | Medical/dental offices |
| Restaurant | 🍽️ | Food service with kitchen buildout |
| Self-Storage | 📦 | Storage units |

**Property form fields (commercial-specific, on top of address/photos/description):**
- Property Type (dropdown above)
- Total Square Footage
- Available Square Footage
- Number of Units / Suites
- Year Built
- Zoning Classification (C-1, C-2, I-1, etc.)
- Parking Spaces / Ratio (per 1,000 sqft)
- Loading Docks (yes/no + count)
- HVAC Type
- Fiber/Internet Access (yes/no)
- ADA Compliant (yes/no)
- Asking Rent ($/sqft/year — commercial standard, NOT monthly)
- Lease Type (dropdown — see A3)

Save to `rv_commercial_listings_<companyId>` in localStorage.

---

### A3 — Commercial Lease Types

Add a "Lease Type" selector to the commercial property form AND to the lease builder:

| Lease Type | Code | Description |
|-----------|------|-------------|
| Triple Net | NNN | Tenant pays base rent + property taxes + insurance + maintenance |
| Double Net | NN | Tenant pays base rent + property taxes + insurance |
| Single Net | N | Tenant pays base rent + property taxes only |
| Gross Lease | GROSS | Landlord covers all operating expenses |
| Modified Gross | MOD | Hybrid — some expenses split by negotiation |
| Percentage Lease | PCT | Base rent + % of tenant's gross sales (retail) |
| Full Service | FS | All-inclusive — common in office buildings |

When "NNN" or "NN" is selected anywhere, show a tooltip: "Tenant responsible for operating expenses — use CAM Charge calculator."
When "PCT" is selected, show an additional field: "Base Rent % of Sales" (e.g., 5%).

---

### A4 — CAM Charge Calculator

**Tab: "CAM Charges"** — this is the #1 feature that distinguishes commercial PM software.

CAM = Common Area Maintenance. In NNN/NN leases, tenants pay their proportionate share of building operating costs.

**CAM Dashboard shows:**
- Total building square footage
- Each tenant's leased sqft and their "pro-rata share" percentage
- Annual CAM budget inputs
- Monthly CAM invoice per tenant
- Year-end CAM reconciliation

**CAM Input form:**
```
Building: [dropdown of commercial properties]
Total Building Sqft: [auto-filled from property]

Annual Operating Expenses:
  Property Taxes ($): [input]
  Building Insurance ($): [input]
  Common Area Maintenance ($): [input]  ← janitorial, landscaping, snow removal
  Property Management Fee ($): [input]
  Utilities - Common Areas ($): [input]
  Repairs & Maintenance ($): [input]
  Security ($): [input]
  Other ($): [input]

Total Annual CAM Budget: $[=SUM of above — calculated]
```

**Per-tenant CAM calculation:**
For each tenant on that property:
```
Tenant: [name / business name]
Leased Sqft: [from lease]
Pro-Rata Share: [= leased sqft / total building sqft — calculated %]
Annual CAM Obligation: [= total CAM budget × pro-rata share — calculated]
Monthly CAM Estimate: [= annual / 12 — calculated]
```

**Actions:**
- "Send Monthly CAM Invoice" button — generates a printable invoice (HTML print dialog)
- "Year-End Reconciliation" button — compares estimated vs actual CAM, shows over/under payment per tenant
- Download CAM summary as CSV

Store CAM data in `rv_cam_<companyId>` localStorage.

---

### A5 — Commercial Lease Builder

Extend `leases.html` to support commercial leases when accessed from `commercial.html`.
Add a toggle at the top of the lease builder: **[ Residential ] [ Commercial ]**

**Commercial lease builder additional fields:**
- Lessee: Business Name, Entity Type (LLC/Corp/Sole Prop/Partnership), State of Formation
- Personal Guarantee: Yes/No (if yes, add guarantor name + SSN field placeholder)
- Permitted Use clause (what the space can be used for)
- Lease Type (NNN/GROSS/etc. — from A3)
- Base Rent ($/sqft/year) + total annual + monthly breakdown
- Rent Escalation: Fixed % per year (e.g., 3% annual) or CPI-indexed
- Free Rent Period (months of free rent for tenant buildout)
- Tenant Improvement Allowance ($ landlord contributes to buildout)
- CAM Estimate (monthly — pulled from CAM calculator)
- Operating Expense Cap (max % increase per year for NNN)
- Option to Renew (yes/no, how many options, at what terms)
- Option to Purchase (yes/no, at what price/formula)
- Signage Rights (yes/no)
- Subletting / Assignment rights
- Hours of operation (if relevant — retail/restaurant)
- Exclusivity clause (no competing businesses in same building)
- Holdover Rent (% above base rent if tenant stays past lease end)

Save commercial leases to `rv_commercial_leases_<companyId>`.

---

### A6 — Business Entity Screening

In the commercial screening tab, replace the individual TransUnion screening flow with a **Business Entity Screening** form:

**Business Screening Form:**
```
Business Name: [text]
Entity Type: [LLC / Corporation / Partnership / Sole Proprietor]
State of Formation: [dropdown]
EIN / Tax ID: [text — note: do not validate or store full EIN]
Years in Business: [number]
Annual Revenue (self-reported): [$]
Number of Employees: [number]
Business Credit Score (self-reported): [number]
Bank Reference (bank name + years): [text]
Trade References: [2–3 company names + contact]
Personal Guarantor: [yes/no — if yes, name + contact]
D&B Number (Dun & Bradstreet): [optional text]
```

**AI Scoring for Business Tenants (out of 100):**
- Years in business ≥ 3 = 25 pts
- Annual revenue ≥ 3× annual rent = 30 pts
- Business credit score ≥ 600 = 20 pts (self-reported)
- Bank reference provided = 10 pts
- Trade references provided (2+) = 10 pts
- Personal guarantor provided = 5 pts

Show score with Approve (≥70) / Review (50-69) / Decline (<50) recommendation.

**Partner note:** Add a card below the form:
> "For verified business credit reports, we recommend **First Advantage** or **Experian Business**. [Learn More →]"
> Commission opportunity: $15–25 per business credit report ordered.

---

### A7 — Commercial Financials Tab

The Financials tab in `commercial.html` shows metrics that commercial property owners actually use:

**Key Metrics Dashboard (calculated from lease + CAM data):**

| Metric | Formula | Display |
|--------|---------|---------|
| Gross Potential Rent | Sum of all lease base rents/yr | $X,XXX/yr |
| Effective Gross Income | GPR + CAM recoveries | $X,XXX/yr |
| Operating Expenses | Total CAM budget | $X,XXX/yr |
| Net Operating Income (NOI) | EGI - OpEx | $X,XXX/yr |
| Occupancy Rate | Occupied sqft / Total sqft | XX.X% |
| Vacancy Rate | 100% - occupancy | XX.X% |
| Cap Rate | NOI / Property Value (user inputs value) | X.X% |
| Price Per Sqft | Asking rent / total sqft | $XX/sqft |

Display these as large KPI cards at the top of the Financials tab.
Below the KPIs: a rent roll table listing every tenant, their sqft, lease type, monthly rent, CAM, lease end date, and renewal option status.

Store property value input in `rv_commercial_property_values_<companyId>`.

---

### A8 — Commercial Pricing Tier

In `index.html` pricing section, add a 4th pricing card:

```
COMMERCIAL
$149 /month

Best for commercial PM firms

✓ Unlimited commercial listings
✓ NNN / CAM charge calculator
✓ Business entity screening
✓ Commercial lease builder
✓ NOI / Cap rate dashboard
✓ Rent roll reporting
✓ All Pro features included

[ Start Free Trial ]
```

Style the commercial card with a darker, more professional color — `#0F172A` (dark navy) header instead of blue.
Add "Compare: MRI Software starts at $500+/month" as a comparison line.

---

## PART B — PROFESSIONAL NETWORKING (LinkedIn for Real Estate)

### B1 — New Page: `network.html`

Create `rentverified/network.html` — the RentVerified Professional Network.
Add "Network" to the main nav in `index.html`.

**Page sections:**
1. Hero / Search bar
2. Featured Professionals grid
3. Recent activity feed
4. "Create Your Profile" CTA for non-members

**Design:** Clean, professional. Similar card layout to `listings.html` but for people instead of properties. Use the existing `.property-card` class as a base, adapted for professional profiles.

---

### B2 — Professional Profile Page: `profile.html`

Create `rentverified/profile.html` — individual professional profile page.
Loaded via URL param: `profile.html?id=<profileId>`

**Profile sections:**

**Header Card:**
- Profile photo (uploaded or initials avatar)
- Full name + credentials (e.g., "John Smith, CCIM, CPM")
- Title / Role (Property Manager, Commercial Broker, Attorney, Contractor, etc.)
- Company name + location (City, State)
- Years of experience
- Verified badge (✓ if credentials verified in compliance.html)
- "Connect" button + "Message" button + "Hire / Request Quote" button
- LinkedIn-style connection count ("47 connections")

**About Section:**
- Bio / description (up to 500 chars)
- Specialties tags (e.g., NNN Leases, Multi-Family, Industrial, Evictions, 1031 Exchange)

**Portfolio / Active Listings:**
- Grid of their active properties / listings they manage
- Pulls from their `rv_listings_<id>` or `rv_commercial_listings_<id>` data
- Shows thumbnail, address, type, sqft/rent

**Credentials & Licenses:**
- Pulled from their `rv_compliance_creds` data
- Show verified licenses with expiration dates
- Verified badges for each credential

**Reviews Section:**
- Star rating (1–5) + written review
- Reviewer name + date
- "Leave a Review" button (requires login)
- Average rating displayed prominently

**Activity Feed:**
- Recent listings added
- Recent lease milestones ("Just signed a 3-year NNN lease at 500 W Main St")
- Network updates

Store profiles in `rv_network_profiles` localStorage key.
Profile ID = sanitized version of email.

---

### B3 — Profile Creation / Edit Flow

Add a "Create / Edit Your Professional Profile" section to EACH existing portal:
- In `landlord-signup.html` → Settings tab → "Your Professional Profile" section
- In `agent-portal.html` → Settings tab → "Your Professional Profile" section
- In `vendor-portal.html` → Settings tab → "Your Professional Profile" section
- In `commercial.html` → Settings tab → "Your Professional Profile" section

**Profile form fields:**
```
Profile Photo: [upload or use initials]
Display Name: [text — pre-filled from account]
Professional Title: [text — e.g., "Commercial Property Manager"]
Company: [text — pre-filled from account]
City, State: [text]
Years of Experience: [number]
Bio: [textarea, 500 char max]
Specialties: [tag input — user types and hits enter to add tags]
Website: [url]
LinkedIn URL: [url]
Phone (public): [text — optional]
Email (public): [text — optional, may differ from login email]

Visibility:
  [ ] Show my active listings on my profile
  [ ] Show my credentials/licenses on my profile
  [ ] Allow connection requests
  [ ] Allow direct messages
  [ ] Show my profile in search results

Profile Type: [checkboxes — can select multiple]
  [ ] Property Manager
  [ ] Commercial Broker / Agent
  [ ] Residential Agent
  [ ] Real Estate Attorney
  [ ] Contractor / Maintenance
  [ ] Insurance Agent
  [ ] Mortgage Lender
  [ ] Home Inspector
  [ ] Property Investor
```

On save: write to `rv_network_profiles` under the user's ID.
Show a link to their public profile: "View your profile → [network.html link]"

---

### B4 — Network Search & Discovery

On `network.html`, the search bar filters profiles by:
- Name or company name
- Professional type (from B3 checkboxes)
- Specialty tags
- City / location
- Verified only toggle

**Featured Professionals section:**
Professionals with verified credentials (from compliance.html) and complete profiles get a "Featured" badge and appear at the top of search results.

**"Professionals Near You" section:**
Filter by Utah County, Salt Lake County, Utah Statewide.

---

### B5 — Connect & Message System

**Connections:**
- "Connect" button on any profile sends a connection request
- Stored in `rv_connections_<userId>` as array of `{ toId, status: 'pending'|'connected', sentAt }`
- Connected profiles appear in a "My Network" sidebar on `network.html`
- Connection count shown on profile header

**Direct Messages (basic):**
- "Message" button opens a simple modal with a textarea
- Messages stored in `rv_messages_<userId>` as `{ fromId, toId, text, timestamp, read: false }`
- Unread message count shown as badge on "Network" nav link
- Inbox accessible from `network.html` → "Messages" tab

---

### B6 — Reviews & Ratings

On each profile page, logged-in users can leave a review:

**Review form:**
```
★★★★★  [star rating — clickable]
Review: [textarea]
Your role: [dropdown — Landlord / Tenant / Colleague / Client]
[ Submit Review ]
```

- Stored in `rv_reviews_<profileId>` array
- Average rating recalculated on each page load
- Reviews show reviewer's name + role + date
- No anonymous reviews — must be logged in via any portal
- Reviewer can only leave 1 review per profile (check by reviewer ID)

---

### B7 — Professional Network Access & Advertising Tiers

**IMPORTANT RULE: Any active RentVerified subscriber (any paid plan) gets full network
access included at no extra charge.** A landlord on the $29 Starter plan, a commercial PM
on the $149 plan, an agent on their portal — all get a complete profile, search visibility,
direct messages, unlimited tags, portfolio showcase, and review collection automatically.

The network is a BENEFIT of subscribing, not a separate product.

The only thing paid advertising upgrades buy is VISIBILITY — getting seen above others.

**Access rules by account status:**

| Feature | Non-subscriber (free) | Any paid subscriber |
|---------|----------------------|---------------------|
| Public profile page | ✓ | ✓ |
| Show up in search results | ✓ (basic) | ✓ (full) |
| Specialty tags | Up to 3 | Unlimited |
| Portfolio showcase | Up to 3 listings | Unlimited |
| Direct message inbox | ✗ | ✓ |
| Review collection | ✗ | ✓ |
| RFP board — post & respond | ✗ | ✓ |
| Connection requests | ✗ | ✓ |

Detect subscriber status by checking if the user's email exists in any of:
`rv_landlord_accounts`, `rv_commercial_accounts`, `rv_rto_accounts`,
`rv_agent_accounts`, `rv_vendor_accounts` with a non-expired plan.

**Paid visibility upgrades (for extra exposure only):**
```
FEATURED PROFESSIONAL — $29/month
  ✓ All subscriber features (already included with any plan)
  + Featured badge on profile
  + Top placement in search results (above standard subscribers)
  + "Recommended [Role]" suggestions on relevant listing pages
  + Monthly analytics: profile views, clicks, message leads

PREMIUM SPONSOR — $99/month
  ✓ Everything in Featured
  + Banner ad slot on listings.html and property-detail.html
  + Priority placement — appears FIRST in all search results
  + "Verified Partner" badge site-wide
  + Dedicated profile highlight on network.html homepage
```

When a subscriber views their profile settings, show:
- "✓ Full network access included with your [Plan Name] subscription"
- A separate "Boost Your Visibility" card showing the Featured/Sponsor upgrade options

When a non-subscriber visits a locked feature (messages, RFP board), show:
- "This feature requires a RentVerified subscription. Plans start at $29/month."
- Link to pricing page

Store visibility plan in `rv_network_profiles[id].advertisingPlan`.
Mark `STRIPE_REQUIRED` comment on upgrade buttons — Stripe needed for Featured/Sponsor payments.

---

### B8 — "RFP Board" (Request for Proposals)

Add a **"RFP / Job Board"** tab to `network.html`:

Property managers and commercial clients can post requests for:
- Contractor bids (roofing, HVAC, plumbing, etc.)
- Legal services (eviction, lease review, 1031)
- Insurance quotes
- Property management proposals
- Inspection requests

**Post an RFP form:**
```
Title: [text — e.g., "Need licensed plumber for 4-unit in Provo"]
Category: [Contractor / Legal / Insurance / Property Manager / Inspector / Other]
Property Type: [Residential / Commercial]
Location: [City, UT]
Budget: [$XXX estimated or "Open to bids"]
Description: [textarea]
Response Deadline: [date]
Contact preference: [Message on RentVerified / Email / Phone]
```

Stored in `rv_rfp_board` localStorage array.
Professionals matching the category see it in their portal's "Opportunities" section.
RFP poster gets responses via the message system (B5).

---

## PART C — MULTI-TENANT ARCHITECTURE IMPROVEMENTS

### C1 — Company Branding Per Account

In `landlord-signup.html` and `commercial.html`, add a "Company Settings" section:
```
Company Name: [text]
Company Logo: [image upload — stored as base64 in localStorage]
Primary Color: [color picker — default #1a56db]
Company Website: [url]
License Number: [text]
```

When a tenant or prospect visits a listing from THIS company, the listing page header
shows the company logo and name instead of generic "Sanders PM."
Store in `rv_company_settings_<companyId>`.

### C2 — Account Switcher

If a user's email is registered across multiple portal types (e.g., both landlord AND commercial),
show an "Account Switcher" dropdown in the top-right of the dashboard nav:

```
[User Avatar] Daniel Hart ▼
  → Residential Dashboard
  → Commercial Dashboard
  → My Network Profile
  → Log Out
```

Detect by checking if the logged-in email exists in multiple `rv_*_accounts` localStorage keys.

### C3 — Admin Overview (Super Admin)

The existing hardcoded admin account (`daniel@sanderspm.com`) should have access to a
**Super Admin** tab visible only when logged in with that email:

**Super Admin tab shows:**
- Total registered accounts by type (landlord, commercial, agent, vendor)
- Total active listings across all accounts
- Total applications submitted this month
- Revenue estimate (subscriptions × plan price)
- List of all accounts with ability to: view, suspend, or delete
- List of all pending professional verifications (agents, vendors, contractors)
  with Approve / Deny buttons
- "Broadcast Message" — send a notice to all users (stored in `rv_admin_notices`)
  which appears as a banner on each user's next login

---

## IMPLEMENTATION ORDER

Do tasks in this order:
1. C1 (company settings — needed by everything else)
2. A1 (commercial.html shell + auth)
3. A2 + A3 (property types + lease types)
4. A4 (CAM calculator — most important commercial feature)
5. A5 (commercial lease builder)
6. A6 (business screening)
7. A7 (commercial financials)
8. A8 (commercial pricing tier on index.html)
9. B3 (profile creation embedded in each portal)
10. B2 (profile.html page)
11. B1 (network.html discovery page)
12. B4 (search + discovery)
13. B5 (connect + message)
14. B6 (reviews)
15. B7 (advertising tiers)
16. B8 (RFP board)
17. C2 (account switcher)
18. C3 (super admin)

---

## DESIGN GUIDELINES

- Commercial pages should feel more professional/corporate than residential
- Use dark navy (`#0F172A`) as the accent color for commercial (vs blue `#1a56db` for residential)
- Network/profile pages should feel like LinkedIn — clean white cards, subtle shadows
- All new pages must be mobile-responsive at 375px width
- Reuse existing CSS classes from `styles.css` wherever possible
- No external CSS libraries — inline `<style>` blocks only

---

## PART D — RENT-TO-OWN (Lease-Option) MANAGEMENT

### D1 — New Page: `rent-to-own.html`

Create `rentverified/rent-to-own.html` — a dedicated portal for rent-to-own companies
and individual landlords offering lease-option programs.

Add "Rent to Own" to the main nav in `index.html` and to the listings.html filter panel.

**Auth:** Same pattern as other portals — email + password stored in `rv_rto_accounts`.
Session: `rv_rto_session = { email, companyName, plan, id }`.
Pricing: $99/month (between residential Pro and Commercial).

**Dashboard tabs:**
1. Overview
2. RTO Properties
3. Tenant/Buyer Pipeline
4. Option Agreements
5. Credit Progress Tracker
6. Financials
7. Mortgage Referral
8. Settings

---

### D2 — RTO Property Listing Type

In `listings.html` and `property-detail.html`, add "Rent to Own" as a listing badge/filter
alongside Available / Rented / Coming Soon.

**RTO-specific listing fields (add to the listing editor in landlord-signup.html):**
```
Listing Type: [ Standard Rental ] [ Rent to Own ] ← toggle
  ↓ (shown only when Rent to Own selected)

Option Purchase Price: [$]          ← agreed purchase price
Option Fee: [$]                     ← upfront fee for the option (1–5% of price)
Option Period: [months]             ← how long tenant has to exercise option (12–36 mo)
Monthly Rent Credit: [$]            ← portion of rent credited toward down payment each month
Monthly Rent: [$]                   ← total monthly payment (higher than market rate)
Total Credits Possible: [calculated = Monthly Rent Credit × Option Period]
Required Down Payment at Exercise: [calculated = Option Price × typical LTV floor]
```

On `property-detail.html`, RTO listings show a special "Path to Ownership" card:
```
🏠 Rent-to-Own Opportunity
Option Price: $285,000
Monthly Rent: $1,800  ($200/mo credited toward your purchase)
Option Period: 24 months
Potential Credits: $4,800 toward down payment
Option Fee: $5,700 (applied to purchase price)

[ Start Application ] [ Calculate My Path ]
```

The "Calculate My Path" button opens a modal calculator:
- Input: current credit score, monthly income
- Output: estimated mortgage readiness timeline, credit needed to qualify, monthly savings needed
- Includes a "Get pre-qualified" CTA linking to mortgage partner

---

### D3 — Option Agreement Builder

In the `rent-to-own.html` portal → "Option Agreements" tab, build a lease-option
agreement generator with these fields:

```
Property address
Tenant/Buyer name(s)
Landlord/Seller name
Agreement date
Option fee amount ($)
Purchase price ($)
Option period (months)
Monthly rent ($)
Monthly rent credit ($) applied toward purchase
Option exercise deadline date (auto-calculated)
Permitted use of property
Right of first refusal clause (yes/no)
Option fee applied to purchase price (yes/no)
Lease terms (by reference to standard lease)
Default / forfeiture terms (if tenant doesn't exercise, option fee is forfeited)
Inspection rights before exercise
Financing contingency (tenant has X days to secure mortgage after exercising)
```

Generate a printable/e-signable option agreement using the existing e-sign framework
from `leases.html`. Store in `rv_rto_agreements_<companyId>`.

---

### D4 — Credit Progress Tracker (Tenant-Facing)

This is the most valuable feature for RTO tenants — a dashboard showing their path to mortgage readiness.

In `tenant-portal.html`, when the tenant's lease is flagged as RTO (`isRTO: true`):
Show a new "My Path to Ownership" tab with:

**Credits Accumulated:**
```
Month 1: $200 credited  ✓
Month 2: $200 credited  ✓
Month 3: $200 credited  ✓
...
Month 12: $200 credited (this month)
───────────────────────────────
Total Accumulated: $2,400 of $4,800 (50% of the way there)
Progress bar: ████████░░░░░░░░ 50%
```

**Credit Score Goal Tracker:**
```
Your reported credit score:  [ input — tenant self-updates monthly ]
Target score for mortgage:   680  (FHA minimum — typical for first-time buyers)
Gap:                         45 points
Estimated time to reach goal: ~8 months at typical improvement rate

[ Enroll in Credit Builder → ]   ← links to Boom credit builder (commission: $1–2/mo)
[ Get a Free Credit Report → ]   ← links to AnnualCreditReport.com
```

**Mortgage Readiness Checklist:**
```
✓ On-time rent payments (12 months)
✓ Option agreement in place
○ Credit score ≥ 680
○ DTI ratio < 43%
○ 2 years employment history documented
○ Savings for closing costs (~$5,000–8,000)

[ Get Pre-Qualified Now → ]  ← mortgage referral CTA (commission: $500–1,500)
```

Store credit score history in `rv_rto_credit_<tenantId>`.

---

### D5 — Mortgage Referral Integration

In `rent-to-own.html` → "Mortgage Referral" tab, and in the tenant Credit Progress Tracker:

**Mortgage Partner Referral Card:**
```
🏦 Ready to Exercise Your Option?

When your tenant is ready to buy, connect them with a
licensed mortgage lender. RentVerified earns $500–1,500
per closed loan referral.

Partner lenders: [Utah mortgage broker partners — placeholder]
  • Guild Mortgage
  • CrossCountry Mortgage
  • Utah First Credit Union

[ Refer My Tenant to a Lender → ]
```

Clicking opens a referral form:
```
Tenant name:          [text — pre-filled]
Property address:     [text — pre-filled]
Purchase price:       [text — pre-filled from option agreement]
Tenant email:         [text — pre-filled]
Tenant phone:         [text]
Estimated credit:     [number — from credit tracker]
Message to lender:    [textarea]
[ Send Referral → ]   ← saves to rv_mortgage_referrals, shows success toast
```

Note: Mark with `// STRIPE_REQUIRED: mortgage referral tracking` — future backend will
confirm closed loans and credit commissions.

---

### D6 — RTO Company Portal Features

For institutional rent-to-own companies (like Divvy Homes competitors):

**Overview tab KPIs:**
- Properties under management
- Active option agreements
- Tenants on-track (credit score improving)
- Tenants at-risk (missed payments, credit declining)
- Options exercised YTD (became buyers)
- Options expired/forfeited YTD
- Total option fee revenue collected
- Total rent credits issued

**Tenant/Buyer Pipeline (kanban):**
```
[ Applicant ] → [ Option Signed ] → [ Building Credit ] → [ Pre-Qualified ] → [ Exercised Option ]
                                                        ↘ [ Option Expired ]
```

Drag-and-drop cards between stages.
Each card shows: tenant name, property, credit score, months remaining on option, credits accumulated.

---

### D7 — RTO Listings on Public Site

On `listings.html`, RTO properties show a distinct card style:
- Gold/amber accent color instead of blue
- "🔑 Rent to Own" badge
- "Path to ownership starting at $X/mo" tagline
- "Option price: $XXX,XXX" displayed prominently
- Separate filter: "Show Rent-to-Own Only" checkbox in filter panel

On `index.html`, add a new section between the hero and the property grid:
```
🔑 Your Path to Homeownership
Not ready to buy? Rent-to-own lets you lock in a price today,
build credit, and buy when you're ready.

[ Browse Rent-to-Own Homes → ]  ← links to listings.html?type=rto
```

---

### D8 — RTO Pricing Tier

In `index.html` pricing section, add a 5th pricing card for RTO companies:

```
RENT TO OWN
$99 /month

For lease-option programs

✓ Unlimited RTO listings
✓ Option agreement builder + e-sign
✓ Credit progress tracker per tenant
✓ Mortgage referral dashboard
✓ Tenant/buyer pipeline (kanban)
✓ Path to Ownership tenant portal
✓ All Pro residential features

[ Start Free Trial ]
```

Style with gold/amber accent (`#D97706`) to distinguish from residential (blue) and commercial (navy).
Add: "Compare: Divvy Homes charges landlords nothing — and takes the spread. You keep yours."

---

### D9 — Update Implementation Order

Add these tasks to the implementation order (run after Part C):
19. D1 (rent-to-own.html shell + auth)
20. D2 (RTO listing type + property detail card)
21. D3 (option agreement builder)
22. D4 (credit progress tracker in tenant portal)
23. D5 (mortgage referral tab)
24. D6 (RTO company kanban pipeline)
25. D7 (RTO listings on public site)
26. D8 (RTO pricing tier)

---

## REVENUE CONTEXT FOR DEVIN

These features generate revenue via:

**Commercial:**
- Commercial plan subscriptions: $149/month per commercial PM company
- Featured/Sponsor visibility upgrades: $29–99/month (basic network access is FREE with any subscription)
- Business entity screening referrals: $15–25/commission (First Advantage, Experian Business)
- RFP board lead fees: future monetization
- All affiliate commissions from ROADMAP.md still apply to commercial tenants at move-in

**Rent-to-Own:**
- RTO subscription: $99/month per RTO company or landlord
- Mortgage referral commission: $500–1,500 per closed loan (highest single commission)
- Credit builder recurring: $1–2/month per RTO tenant (almost guaranteed — they all need it)
- Option agreement e-sign fee: future per-document charge
- Mortgage lender featured placement: $99–299/month for partner lenders to appear first

---

## TESTING CHECKLIST

After all tasks:
1. Sign up as new commercial PM → dashboard loads with commercial tabs
2. Add a NNN office building listing → property appears with $/sqft/yr rent format
3. Add 2 tenants to the building → CAM calculator shows pro-rata share for each
4. CAM invoice generates and is printable
5. Commercial lease builder shows NNN-specific fields
6. Business screening form scores a test business application
7. Financials tab shows NOI and occupancy rate
8. Commercial pricing card appears on index.html at $149/month
9. Create a professional profile from landlord dashboard → appears on network.html
10. Search network.html by "Property Manager" → profile appears
11. Leave a review on a profile → shows with star rating
12. Post an RFP → appears in RFP board tab
13. Super admin login → sees all accounts + pending verifications
14. Account switcher appears when same email has both residential and commercial accounts
15. Sign up as RTO company → dashboard with pipeline loads
16. Add RTO listing with option price $285,000 → appears on listings.html with gold badge
17. Tenant portal shows "My Path to Ownership" tab with credit tracker
18. Mortgage referral form submits and saves to rv_mortgage_referrals
19. RTO pricing card appears on index.html at $99/month with amber styling
20. Mobile test all new pages at 375px
