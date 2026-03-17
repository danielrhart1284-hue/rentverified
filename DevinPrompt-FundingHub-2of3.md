# Devin Prompt 2 of 3 — Business Funding Hub (funding.html)

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)

## Codebase Context (READ THIS FIRST)
- Static HTML/CSS/vanilla JavaScript — no frontend framework
- All data stored in localStorage using `rv_` prefix keys
- Styles: `styles.css` contains all shared classes — DO NOT modify it. Add page-specific `<style>` blocks only
- Copy ALL changed/new files to `rentverified/` subdirectory after every task
- Existing `tenant-assistance.html` has Utah county-by-county emergency assistance programs — reuse that data
- Existing `financial-hub.html` has Jetty/Rhino/Obligo/LeaseLock partner cards as reference for card styling
- This prompt depends on Prompt 1 of 3 (Management Profile) being done first — it reads `rv_mgmt_profile_<companyId>` to check what landlords accept

---

## WHAT YOU'RE BUILDING

A new `funding.html` page — the RentVerified Funding Hub — with two pathways: business funding for commercial tenants/business owners, and personal financial assistance for residential tenants. Also embed a "Funding" tab inside `commercial.html` and a "Financial Resources" tab inside `tenant-portal.html`.

---

## TASK 1 — Create `funding.html`

Create `rentverified/funding.html`. Add "Funding" to the main nav in `index.html`.

Use the same nav/header pattern as other pages (copy from `index.html`).

**Landing layout — two pathway cards side by side:**

LEFT CARD:
- Icon: building/business icon
- Title: "Business Funding"
- Subtitle: "For business owners and commercial tenants who need working capital, equipment, or buildout funding."
- Button: "Apply for Business Funding →"

RIGHT CARD:
- Icon: house/person icon
- Title: "Personal Financial Help"
- Subtitle: "For tenants who need help with deposits, rent gaps, or emergency expenses."
- Button: "Get Financial Assistance →"

Clicking either card scrolls down to the relevant section on the same page.

---

## TASK 2 — Business Funding Application Form

Below the two cards, section: "Business Funding Application"

Form fields:

**Business Information:**
- Business Name (text)
- Business Type (dropdown: LLC / Corporation / Sole Proprietor / Partnership)
- Industry (dropdown: Retail, Restaurant, Office Services, Medical, Construction, Real Estate, Other)
- Years in Business (number)
- State (dropdown)
- Annual Revenue ($)
- Monthly Revenue ($)

**Funding Needs:**
- Amount Needed ($ — range slider: $5,000 to $500,000 with displayed value)
- Purpose (dropdown: Tenant Buildout / Improvements, Equipment Purchase / Lease, Working Capital / Cash Flow, Inventory, Payroll, Expansion / New Location, Debt Refinancing, Emergency / Bridge Funding, Other)
- How Soon Do You Need Funding? (dropdown: Immediately / Within 1 week / Within 1 month / Just exploring)
- Current Credit Score Range (dropdown: Excellent 750+ / Good 700-749 / Fair 650-699 / Below 650 / Not Sure)

**Contact Information:**
- Full Name (text — pre-fill if user is logged in via any rv_*_session)
- Email (text — pre-fill if logged in)
- Phone (text)
- Checkbox: "I agree to be contacted by RentVerified lending partners"

**Submit button:** "Submit Application →"

On submit:
1. Validate required fields
2. Save to `rv_funding_applications` localStorage array with timestamp and status "submitted"
3. Show confirmation screen (see below)

---

## TASK 3 — Confirmation Screen After Business Application

After submission, replace the form with:

**"Application Submitted" hero:**
- Checkmark icon
- "Your application has been submitted!"
- "A funding specialist will contact you within 24 hours."

**"What to Expect" timeline (horizontal steps):**
1. Application Review (24 hours)
2. Pre-qualification & Offers (48 hours)
3. Choose Your Best Offer
4. Funding (as fast as same day)

**"Apply Directly With Our Partners" — show partner cards:**

Card 1: **GoKapital**
- Types: Business Loans, Equipment Leasing, Commercial Mortgages, SBA Loans, Hard Money
- Amounts: $10,000 — $5,000,000
- Terms: 6 months — 25 years
- Min: 1+ yr in business, $200K revenue
- Button: "Apply Now →" `// AFFILIATE_LINK: gokapital`

Card 2: **Clarify Capital**
- Types: Working Capital, Term Loans, Lines of Credit
- Amounts: $5,000 — $500,000
- Approval: As fast as 24 hours
- Min: 6+ months in business
- Button: "Apply Now →" `// AFFILIATE_LINK: clarify`

Card 3: **SBA Loan Referrals**
- Types: Government-backed loans, lowest rates
- Amounts: $25,000 — $5,000,000
- Rates: Prime + 2.25% — 4.75%
- Terms: 7 — 25 years
- Button: "Check SBA Eligibility →" `// AFFILIATE_LINK: sba`

Card 4: **National Funding**
- Types: Fast working capital for small businesses
- Amounts: $5,000 — $500,000
- Approval: Same day possible
- Button: "Apply Now →" `// AFFILIATE_LINK: nationalfunding`

Card 5: **Merchant Cash Advance (Kapitus / Credibly)**
- Types: Advance on future sales — ideal for retail/restaurant tenants
- Amounts: $5,000 — $400,000
- Repayment: Daily % of sales
- Button: "Get a Quote →" `// AFFILIATE_LINK: mca`

Style partner cards as: white background, subtle box-shadow, colored left border (each partner different color), partner initials in a colored circle as logo placeholder.

---

## TASK 4 — Tenant Financial Assistance Section

Below the business section (or scrolled to when clicking "Get Financial Assistance"):

**Section title:** "Financial Resources for Tenants"
**Subtitle:** "Need help with your move-in costs or a tough month? We connect you with resources — no judgment."

Four expandable cards:

**Card 1: Security Deposit Assistance**
- Icon: bank/shield
- "Can't afford the full deposit? See if you qualify for a deposit loan or bond."
- Expands to show:
  - Deposit bond option (note: "Ask your landlord if they accept deposit bonds")
  - Link to deposit loan partners `// AFFILIATE_LINK: deposit_loan`
  - Links to Utah emergency deposit programs (pull from existing tenant-assistance.html data: Utah County, Salt Lake County, etc.)

**Card 2: Emergency Rent Help**
- Icon: cash/lifeline
- "Behind on rent? Find emergency assistance programs and short-term options."
- Expands to show:
  - Utah county-by-county assistance programs (reuse data from tenant-assistance.html)
  - Flex rent-splitting option mention
  - 211 Utah helpline: dial 211 or visit 211utah.org

**Card 3: Short-Term Personal Loan**
- Icon: money/lightning
- "Need cash for moving costs, first/last month, or unexpected expenses?"
- Expands to show:
  - Round Sky — personal loans up to $5,000, fast approval `// AFFILIATE_LINK: roundsky`
  - Credit union options (general mention)
  - Note: "Compare rates before committing. RentVerified does not endorse any specific lender."

**Card 4: Rent-to-Own Programs**
- Icon: house/key
- "Want to stop renting and start owning? See lease-option homes in your area."
- Button: "Browse Rent-to-Own →" links to `listings.html?type=rto`

---

## TASK 5 — Homepage Section

On `index.html`, add a section (below the property grid or near the pricing section):

Two-column layout:

LEFT: "For Landlords" — "Earn passive income from every lease signing. Deposit bonds, rent guarantee, credit reporting, and business funding referrals — all built into your dashboard." Button: "See How It Works →" links to `financial-hub.html`

RIGHT: "For Tenants" — "Move in easier with deposit alternatives, credit building, flexible payments, and financial assistance — all through your portal." Button: "Find Help →" links to `funding.html`

Section title: "Financial Services — Built Into Every Transaction"

---

## DESIGN
- Match existing site styling — use classes from styles.css
- Partner cards: white bg, box-shadow: 0 1px 3px rgba(0,0,0,0.1), 8px border-radius, colored left border
- Amount slider: styled range input with displayed dollar value
- Expandable cards: smooth CSS transition, chevron rotates on expand
- Mobile-responsive at 375px — cards stack vertically
- No external CSS libraries — inline `<style>` blocks only

## TESTING
1. funding.html loads with two pathway cards
2. Business application form validates and saves to localStorage
3. Confirmation screen shows partner cards with "Apply Now" buttons
4. All partner buttons have `// AFFILIATE_LINK` comments in the code
5. Tenant assistance cards expand with correct content
6. Utah emergency programs display correctly
7. Rent-to-Own link goes to listings.html?type=rto
8. index.html shows new Financial Services section
9. "Funding" link appears in main nav
10. Mobile test at 375px
11. No console errors
