# Devin Prompt — RentVerified: Landlord Management Profile + Financial Product Education + Business Funding Hub

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)

## Codebase Context (READ THIS FIRST)
- Static HTML/CSS/vanilla JavaScript — no frontend framework
- All data stored in localStorage using `rv_` prefix keys
- Existing portals: `landlord-signup.html`, `tenant-portal.html`, `agent-portal.html`, `vendor-portal.html`, `commercial.html`, `rent-to-own.html`
- Existing auth: email + password stored in localStorage, `rv_doc_role` tracks current session role
- Styles: `styles.css` contains all shared classes — DO NOT modify it. Add page-specific `<style>` blocks only
- Copy ALL changed/new files to `rentverified/` subdirectory after every task
- Existing Settings tab in `landlord-signup.html` has: Payment Settings (card fee toggle) + AI Settings (channels, greeting, Cash App, Zelle)
- Existing `financial-hub.html` has partner cards for Jetty, Rhino, Obligo, LeaseLock — but NO per-landlord accept/reject toggles
- Existing `tenant-portal.html` has rent payment, maintenance, documents, lease expiry

---

## PART A — LANDLORD MANAGEMENT PROFILE (Acceptance Preferences)

### Why This Matters
Not every landlord wants to accept deposit bonds, rent guarantee insurance, or other financial products. Right now there's no way for a landlord to configure what they're willing to offer tenants. This creates a bad experience — tenants see products on the platform that their specific landlord doesn't accept, leading to confusion and wasted time. The Management Profile lets each landlord control exactly what financial products, payment methods, and services they offer.

---

### A1 — New Settings Section: "Management Profile" Tab

In `landlord-signup.html`, add a new sidebar link in the Settings group (below "AI Settings"):

```
Settings
  AI Settings
  Management Profile    ← NEW
```

The "Management Profile" tab (`dtab-mgmt-profile`) contains the landlord's preferences for what they accept and offer to tenants. This is the single source of truth that controls what tenants see in their portal and on property listings.

---

### A2 — Management Profile: Payment Methods Accepted

**Section: "Payment Methods You Accept"**

Show toggle switches for each payment method. ON = you accept it. OFF = tenants won't see it as an option.

```
Payment Methods You Accept
━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Cash App                    [ ON  ]
  ✅ Zelle                       [ ON  ]
  ✅ Venmo                       [ ON  ]
  ✅ Bank Transfer (ACH)         [ ON  ]
  ✅ Credit / Debit Card         [ ON  ]
  ⬜ Check / Money Order         [ OFF ]
  ⬜ PayPal                      [ OFF ]

  Card Fee Policy:  (○) Tenant pays fee  (●) I absorb fees
```

Note: Migrate the existing "Card Processing Fees" toggle from the current Payment Settings tab into this section. The old Payment Settings tab becomes just a payment history/confirmations view.

---

### A3 — Management Profile: Financial Products Accepted

**Section: "Financial Products & Services"**

Each product has:
1. A toggle switch (accept/don't accept)
2. A one-line description
3. An expandable "How This Works & Why It Benefits You" education card (see Part B)
4. A commission indicator showing what the landlord earns

```
Financial Products & Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEPOSIT ALTERNATIVES
────────────────────
  ✅ Deposit Bonds (Jetty / Obligo)              [ ON  ]
     Tenants pay ~$17/mo instead of full deposit.
     You're still covered for the full deposit amount.
     💰 You earn: ~15% commission on every premium
     [ℹ️ How does this work? ▾]

  ⬜ Deposit-Free (Obligo Bank Verification)      [ OFF ]
     Tenants move in with $0 deposit. Obligo holds
     a bank authorization instead.
     💰 You earn: flat fee per enrollment
     [ℹ️ How does this work? ▾]

INSURANCE PRODUCTS
──────────────────
  ✅ Renters Insurance (Jetty / Sure)             [ ON  ]
     Required or optional — tenants get coverage
     starting at ~$10/mo.
     💰 You earn: $2–5/mo recurring per policy
     [ℹ️ How does this work? ▾]

  ⬜ Rent Guarantee Insurance                     [ OFF ]
     If your tenant stops paying, the insurer
     covers missed rent (up to 6–12 months).
     💰 You earn: $150–200 per policy (15% of annual premium)
     [ℹ️ How does this work? ▾]

  ⬜ Lease Guarantee (LeaseLock)                  [ OFF ]
     Whole-property insurance that replaces
     security deposits entirely.
     💰 You earn: higher commission structure per unit
     [ℹ️ How does this work? ▾]

TENANT FINANCIAL TOOLS
──────────────────────
  ✅ Credit Builder (Boom)                        [ ON  ]
     Tenant's on-time rent payments reported to
     all 3 bureaus. Builds their credit score.
     💰 You earn: $1–2/mo recurring per tenant
     [ℹ️ How does this work? ▾]

  ✅ Rent Flexibility (Flex)                      [ ON  ]
     Tenants split rent into 2 payments/month.
     You still get paid in full on the 1st.
     💰 Tenant pays $14.99/mo for the service
     [ℹ️ How does this work? ▾]

MOVE-IN SERVICES
────────────────
  ✅ Utility Setup Concierge                      [ ON  ]
     We handle power, gas, internet transfers
     for your new tenant.
     💰 You earn: $75 per tenant
     [ℹ️ How does this work? ▾]

  ✅ Internet / Cable Setup (AT&T, Xfinity)       [ ON  ]
     New install referral at move-in.
     💰 You earn: $50–150 per installation
     [ℹ️ How does this work? ▾]

  ⬜ Moving Services Referral                     [ OFF ]
     Connect tenants with vetted movers.
     💰 You earn: $50 per booked move
     [ℹ️ How does this work? ▾]

BUSINESS FUNDING (for commercial tenants)
─────────────────────────────────────────
  ✅ Business Loans & Working Capital             [ ON  ]
     Connect your commercial tenants with funding
     for buildout, equipment, and operations.
     💰 You earn: $200–5,000 per funded deal
     [ℹ️ How does this work? ▾]

  ✅ SBA Loan Referrals                           [ ON  ]
     Government-backed small business loans for
     qualified tenants.
     💰 You earn: $2,500–5,000 per closed SBA loan
     [ℹ️ How does this work? ▾]

  ⬜ Merchant Cash Advance Referral               [ OFF ]
     Quick capital based on future revenue. Good
     for retail/restaurant tenants.
     💰 You earn: $2,000–4,500 per funded MCA
     [ℹ️ How does this work? ▾]
```

**Save button** at bottom: "Save Management Profile"

Store all preferences in `rv_mgmt_profile_<companyId>` localStorage key as:
```json
{
  "paymentMethods": {
    "cashApp": true,
    "zelle": true,
    "venmo": true,
    "ach": true,
    "card": true,
    "check": false,
    "paypal": false
  },
  "cardFeePolicy": "tenant_pays",
  "financialProducts": {
    "depositBonds": true,
    "depositFree": false,
    "rentersInsurance": true,
    "rentGuarantee": false,
    "leaseGuarantee": false,
    "creditBuilder": true,
    "rentFlexibility": true,
    "utilitySetup": true,
    "internetSetup": true,
    "movingServices": false,
    "businessLoans": true,
    "sbaLoans": true,
    "merchantCashAdvance": false
  },
  "updatedAt": "2026-03-15T..."
}
```

---

### A4 — Tenant Portal Respects Landlord Preferences

In `tenant-portal.html`, when displaying available financial products or services to a tenant:

1. Look up the tenant's landlord/property manager from their lease data
2. Load that landlord's `rv_mgmt_profile_<companyId>`
3. **Only show products where the landlord's toggle is ON**

For example, if a landlord has `depositBonds: false`, the tenant should NOT see a "Deposit Bond" option when viewing their lease or move-in checklist.

**Implementation:**
- Add a helper function `getLandlordPreferences(landlordId)` that reads the management profile
- Wrap each financial product section in the tenant portal with a check: `if (prefs.financialProducts.depositBonds) { showDepositBondCard() }`
- If no management profile exists yet (landlord hasn't configured it), default ALL products to ON (opt-out model, not opt-in — maximizes revenue)

---

### A5 — Property Listing Shows Accepted Products

On `property-detail.html`, add a small section below the property details:

```
This Property Accepts
━━━━━━━━━━━━━━━━━━━━

🛡️ Deposit Bond Available — Move in without a full deposit
📋 Renters Insurance — Get covered from $10/mo
📈 Credit Builder — Build your score with on-time rent
💳 Flex Pay — Split rent into 2 payments

[ Apply Now → ]
```

Only show badges for products the landlord has toggled ON in their Management Profile.

This helps tenants see upfront what's available BEFORE they apply — and it's a selling point that attracts more applicants ("I can move in without $2,000 upfront? I'm applying here.")

---

### A6 — Commercial Portal Management Profile

Add the same Management Profile tab to `commercial.html` (Settings section), but with commercial-specific defaults:

- Business Loans & Working Capital: ON by default
- SBA Loan Referrals: ON by default
- Merchant Cash Advance: OFF by default
- Equipment Financing: ON by default (additional toggle for commercial)
- Commercial Mortgage Referrals: ON by default (additional toggle for commercial)
- Deposit alternatives: OFF by default (commercial leases rarely use bonds)
- Renters Insurance: OFF (not applicable)
- Credit Builder: OFF (not relevant for businesses)

Store in `rv_commercial_mgmt_profile_<companyId>`.

---

## PART B — FINANCIAL PRODUCT EDUCATION (Expandable "How This Works" Cards)

### Why This Matters
Landlords won't turn on products they don't understand. And they definitely won't accept deposit bonds if they think it means they lose protection. Each product needs a clear, honest explanation that covers: what it is, how it works for the tenant, how it protects the landlord, and what the landlord earns.

---

### B1 — Expandable Education Cards

Each product toggle in Part A has a clickable "[ℹ️ How does this work? ▾]" link that expands an education card below the toggle. The card should be styled as a light blue/gray info box with a subtle left border (like a callout).

**Card structure for every product:**
```
┌─────────────────────────────────────────────────────┐
│ 🛡️ Deposit Bonds — How They Work                    │
│                                                       │
│ WHAT IT IS                                            │
│ [2-3 sentence plain-English explanation]               │
│                                                       │
│ HOW IT WORKS FOR YOUR TENANT                          │
│ [2-3 sentences from tenant perspective]                │
│                                                       │
│ HOW IT PROTECTS YOU (THE LANDLORD)                    │
│ [2-3 sentences — this is the most important part]      │
│                                                       │
│ WHAT YOU EARN                                         │
│ [Commission details]                                   │
│                                                       │
│ COMMON CONCERNS                                       │
│ Q: "Am I still covered if the tenant causes damage?"  │
│ A: "Yes. The bond covers up to the full deposit..."   │
│                                                       │
│ [✅ Enable This Product]                              │
└─────────────────────────────────────────────────────┘
```

---

### B2 — Education Content for Each Product

Write the following education content for each expandable card. This is the exact copy Devin should use:

---

#### Deposit Bonds (Jetty / Obligo)

**WHAT IT IS**
A deposit bond is a small monthly payment that replaces the traditional upfront security deposit. Instead of your tenant paying $1,500–$2,500 upfront, they pay roughly $17–30/month. A surety company (like Jetty) guarantees the full deposit amount to you.

**HOW IT WORKS FOR YOUR TENANT**
The tenant applies through RentVerified at lease signing. They're approved in minutes based on a soft credit check. Instead of writing a $2,000 check, they pay ~$17/month. If they cause damage or break the lease, the bond company pays you — then collects from the tenant.

**HOW IT PROTECTS YOU**
You are covered for the SAME amount as a traditional deposit. If the tenant causes $1,500 in damage, the surety company pays you up to the bonded amount. You file a claim just like you'd keep a regular deposit — except now you get paid by a company with actual funds, not a tenant who might dispute or be broke. Many landlords find they actually collect MORE with bonds because the surety company pays without argument.

**WHAT YOU EARN**
~15% commission on every premium. On a $17/month bond, that's ~$2.55/month per tenant, recurring for the entire lease. 10 tenants = $25.50/month passive income just from deposit bonds.

**COMMON CONCERNS**
- Q: "What if the tenant causes $3,000 in damage but the bond is only $2,000?"
  A: The bond covers up to the bonded amount (same as a traditional deposit). For damages beyond the bond amount, you pursue the tenant directly — same as you would with a regular deposit.
- Q: "Does this mean I can't also collect a deposit?"
  A: Correct — the bond replaces the deposit. But you can still charge non-refundable move-in fees (pet deposit, admin fee, etc.) separately.
- Q: "What if the tenant stops paying the bond premium?"
  A: The surety company handles collections. Your coverage remains in effect for the lease term regardless.

---

#### Rent Guarantee Insurance

**WHAT IT IS**
Rent guarantee insurance is a policy that pays YOU (the landlord) if your tenant stops paying rent. It typically covers 6–12 months of lost rent plus legal fees for eviction. Think of it as landlord insurance against non-payment.

**HOW IT WORKS FOR YOUR TENANT**
The tenant doesn't pay anything extra. The cost is either built into the lease terms or paid by the landlord (and offset by the premium savings vs. the cost of an actual eviction). Some landlords pass the cost to tenants as a required lease add-on.

**HOW IT PROTECTS YOU**
If your tenant stops paying, the insurance company reimburses your lost rent — usually within 30 days of filing a claim. Most policies also cover legal fees for the eviction process. The average eviction costs landlords $3,500–$10,000 in lost rent + legal fees. One policy at ~$300–500/year can save you from that entire loss.

**WHAT YOU EARN**
$150–200 commission per policy sold (approximately 15% of the annual premium). This is a one-time commission at lease signing, with renewal commissions each year.

**COMMON CONCERNS**
- Q: "What's the waiting period before I can claim?"
  A: Most policies have a 30–60 day waiting period after the first missed payment. After that, they reimburse retroactively.
- Q: "Does this replace screening tenants?"
  A: No. You should still screen thoroughly. The insurance is a safety net, not a replacement for due diligence. Some insurers require minimum screening standards.
- Q: "Is this the same as an umbrella policy?"
  A: No. Rent guarantee specifically covers lost rental income from non-payment. Your property insurance or umbrella policy covers physical damage and liability.

---

#### Credit Builder (Boom)

**WHAT IT IS**
Credit building through rent reporting means your tenant's on-time rent payments are reported to all 3 major credit bureaus (Experian, TransUnion, Equifax). This helps tenants build credit history using a payment they're already making.

**HOW IT WORKS FOR YOUR TENANT**
The tenant enrolls through RentVerified. Boom verifies their rent payments each month and reports them as positive tradelines to the credit bureaus. Most tenants see a credit score increase of 20–50 points within 3–6 months of consistent reporting.

**HOW IT PROTECTS YOU**
Tenants actively building their credit are significantly less likely to default on rent — their payment directly affects their credit score. It's a built-in incentive for on-time payment. Plus, tenants who value this benefit tend to renew leases more often, reducing your turnover costs.

**WHAT YOU EARN**
$1–2/month recurring commission per tenant enrolled. This continues for the entire lease term. It's small per tenant but 100% passive — and with high enrollment rates (tenants want better credit), it adds up across your portfolio.

**COMMON CONCERNS**
- Q: "Does this report late payments too?"
  A: It depends on the provider. Most only report positive (on-time) payments. Late or missed payments are typically not reported to avoid harming the tenant — though some providers offer full reporting.
- Q: "Do I have to do anything?"
  A: No. Once the tenant enrolls, everything is automatic. Boom verifies payments through your payment records in RentVerified.

---

#### Rent Flexibility (Flex)

**WHAT IT IS**
Flex lets tenants split their monthly rent into 2 payments (e.g., pay half on the 1st and half on the 15th). Flex pays YOU the full rent on the 1st — the tenant's second payment goes to Flex, not to you.

**HOW IT WORKS FOR YOUR TENANT**
The tenant signs up for Flex ($14.99/month). On the 1st, Flex pays you the full rent. The tenant pays Flex back in two installments aligned with their paychecks. It's like a short-term interest-free bridge.

**HOW IT PROTECTS YOU**
You get paid in full, on time, on the 1st. Period. Flex takes on the risk of the second half-payment. If the tenant doesn't pay Flex back, that's between Flex and the tenant — you already have your money.

**WHAT YOU EARN**
The tenant pays Flex $14.99/month directly. Potential partnership/referral revenue to be negotiated. The primary benefit to you is fewer late payments and higher tenant satisfaction (which means fewer vacancies and longer leases).

**COMMON CONCERNS**
- Q: "What if the tenant misses their second payment to Flex?"
  A: That's Flex's problem, not yours. You already received full rent on the 1st.
- Q: "Does this change my lease terms?"
  A: No. Your lease still says rent is due on the 1st, and you receive it on the 1st.

---

#### Renters Insurance (Jetty / Sure)

**WHAT IT IS**
Renters insurance covers your tenant's personal belongings and provides liability protection. Many landlords require it as a lease condition. Through RentVerified, tenants can purchase policies starting at ~$10/month.

**HOW IT WORKS FOR YOUR TENANT**
Tenant purchases a policy through RentVerified during lease signing or move-in. Coverage typically includes personal property (theft, fire, water damage), personal liability ($100K+), and additional living expenses if the unit becomes uninhabitable.

**HOW IT PROTECTS YOU**
If a tenant causes accidental damage (kitchen fire, overflowing bathtub), their renters insurance liability coverage can pay for repairs to YOUR property — not just the tenant's belongings. Without renters insurance, you'd be chasing the tenant for repair costs. With it, their insurance handles it. This is why most professional landlords require it.

**WHAT YOU EARN**
$2–5/month recurring commission per active policy. Alternatively, ~$20 one-time referral fee per enrollment depending on the provider. With Jetty's combo product, you can bundle this with a deposit bond in a single enrollment.

**COMMON CONCERNS**
- Q: "Can I require tenants to have renters insurance?"
  A: Yes. In most states (including Utah), landlords can require renters insurance as a lease condition.
- Q: "What if they already have renters insurance?"
  A: They can keep their existing policy. You can still require proof of coverage. You only earn a commission if they purchase through RentVerified.

---

## PART C — BUSINESS FUNDING HUB (New Revenue Stream)

### Why This Matters
RentVerified already has commercial tenants (businesses renting office, retail, industrial space) and residential tenants who might be starting businesses. Both groups frequently need capital — for buildout, equipment, working capital, or emergencies. By embedding a "Funding Hub" directly into the platform, RentVerified earns $200–$5,000 per funded deal with zero cost and zero risk. The tenant gets connected to funding. The landlord's commercial tenant gets the capital to build out their space (which means they sign the lease). Everyone wins.

---

### C1 — New Page: `funding.html`

Create `rentverified/funding.html` — the RentVerified Business Funding Hub.
Add "Funding" to the main nav in `index.html` (between Financial Hub and Network, or wherever logical).

**Page Layout: Two pathways (cards on landing)**

```
🏢 Business Funding                    🏠 Personal Financial Help
━━━━━━━━━━━━━━━━━━━━━                  ━━━━━━━━━━━━━━━━━━━━━━━━━
For business owners and                 For tenants who need help
commercial tenants who                  with deposits, rent gaps,
need working capital,                   or emergency expenses.
equipment, or buildout
funding.

[ Apply for Business Funding → ]       [ Get Financial Assistance → ]
```

---

### C2 — Business Funding Application (Left Path)

Clicking "Apply for Business Funding" shows an intake form:

```
Business Funding Application
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Business Information
  Business Name: [text]
  Business Type: [LLC / Corporation / Sole Proprietor / Partnership]
  Industry: [dropdown — Retail, Restaurant, Office Services, Medical,
             Construction, Real Estate, Other]
  Years in Business: [number]
  State: [dropdown]
  Annual Revenue: [$]
  Monthly Revenue: [$]

Funding Needs
  Amount Needed: [$]  (slider: $5,000 — $500,000)
  Purpose: [dropdown]
    - Tenant Buildout / Improvements
    - Equipment Purchase / Lease
    - Working Capital / Cash Flow
    - Inventory
    - Payroll
    - Expansion / New Location
    - Debt Refinancing
    - Emergency / Bridge Funding
    - Other

  How Soon Do You Need Funding?
    [dropdown — Immediately / Within 1 week / Within 1 month / Just exploring]

  Current Credit Score Range:
    [dropdown — Excellent (750+) / Good (700-749) / Fair (650-699) /
     Below 650 / Not Sure]

Contact Information
  Full Name: [text]
  Email: [text — pre-fill if logged in]
  Phone: [text]

  [ ] I agree to be contacted by RentVerified lending partners
  [ Submit Application → ]
```

**After submission:**
1. Save to `rv_funding_applications` localStorage array
2. Show a "Thank You" screen with:
   - "Your application has been submitted. A funding specialist will contact you within 24 hours."
   - Display 3–4 partner cards (see C4) with "Apply Directly" buttons that open affiliate links
   - Show a "What to Expect" timeline:
     - Step 1: Application Review (24 hours)
     - Step 2: Pre-qualification & Offers (48 hours)
     - Step 3: Choose Your Best Offer
     - Step 4: Funding (as fast as same day)

Mark all "Apply Directly" buttons with `// AFFILIATE_LINK: [partner]` comment — these are the commission-generating clicks.

---

### C3 — Tenant Financial Assistance (Right Path)

Clicking "Get Financial Assistance" shows options for residential tenants:

```
Financial Resources for Tenants
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help with your move-in costs or a tough month?
We connect you with resources — no judgment.

┌─────────────────────────────────────────────┐
│ 🏦 Security Deposit Assistance               │
│ Can't afford the full deposit? See if you    │
│ qualify for a deposit loan or bond.           │
│ [ Check Options → ]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💸 Emergency Rent Help                        │
│ Behind on rent? Find emergency assistance     │
│ programs and short-term options.              │
│ [ Find Help → ]                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📈 Short-Term Personal Loan                   │
│ Need cash for moving costs, first/last        │
│ month, or unexpected expenses?                │
│ [ See Loan Options → ]                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🏠 Rent-to-Own Programs                       │
│ Want to stop renting and start owning?        │
│ See lease-option homes in your area.          │
│ [ Browse Rent-to-Own → ]  ← links to         │
│   listings.html?type=rto                      │
└─────────────────────────────────────────────┘
```

**"Security Deposit Assistance"** expands to show:
- Deposit bond option (if landlord accepts — check management profile)
- Link to deposit loan partners (affiliate)
- Link to local Utah emergency deposit programs (from existing `tenant-assistance.html` data)

**"Emergency Rent Help"** expands to show:
- Utah county-by-county assistance programs (already in `tenant-assistance.html` — reuse that data)
- Flex rent-splitting option (if landlord accepts)
- 211 Utah helpline

**"Short-Term Personal Loan"** expands to show partner cards:
- Round Sky (up to $5,000, fast approval)
- Other personal loan affiliates
- Credit union options

Mark all external partner links with `// AFFILIATE_LINK: [partner]` comments.

---

### C4 — Business Funding Partner Cards

On the business funding results page and inside `commercial.html` → "Funding" tab, show these partner cards:

```
Our Funding Partners
━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────────────────────────┐
│ 🏦 GoKapital                                        │
│ Business Loans · Equipment Leasing · Commercial      │
│ Mortgages · SBA Loans · Hard Money                   │
│                                                      │
│ Loan amounts: $10,000 — $5,000,000                   │
│ Terms: 6 months — 25 years                           │
│ Min requirements: 1+ yr in business, $200K revenue   │
│                                                      │
│ [ Apply Now → ]  // AFFILIATE_LINK: gokapital        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 💼 Clarify Capital                                   │
│ Working Capital · Term Loans · Lines of Credit       │
│                                                      │
│ Loan amounts: $5,000 — $500,000                      │
│ Approval: As fast as 24 hours                        │
│ Min requirements: 6+ months in business              │
│                                                      │
│ [ Apply Now → ]  // AFFILIATE_LINK: clarify          │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 🇺🇸 SBA Loan Referrals                              │
│ Government-backed loans with the lowest rates        │
│                                                      │
│ Loan amounts: $25,000 — $5,000,000                   │
│ Rates: Prime + 2.25% — 4.75%                        │
│ Terms: 7 — 25 years                                  │
│ Best for: Established businesses, real estate         │
│                                                      │
│ [ Check SBA Eligibility → ]  // AFFILIATE_LINK: sba  │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ⚡ National Funding                                  │
│ Fast working capital for small businesses             │
│                                                      │
│ Loan amounts: $5,000 — $500,000                      │
│ Approval: Same day possible                          │
│ Commission: 3% of funded amount                      │
│                                                      │
│ [ Apply Now → ]  // AFFILIATE_LINK: nationalfunding  │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 🏪 Merchant Cash Advance (Kapitus / Credibly)        │
│ Advance on future sales — ideal for retail and       │
│ restaurant tenants with steady revenue               │
│                                                      │
│ Advance amounts: $5,000 — $400,000                   │
│ Repayment: Daily % of sales                          │
│ Best for: Retail, restaurants, service businesses     │
│                                                      │
│ [ Get a Quote → ]  // AFFILIATE_LINK: mca            │
└────────────────────────────────────────────────────┘
```

---

### C5 — Embed Funding Tab in Commercial Portal

In `commercial.html`, add a new sidebar tab: **"Funding"** (between Screening and Documents, or wherever logical).

This tab shows:
1. A summary card: "Connect your tenants with funding for their buildout and operations. You earn $200–$5,000 per funded deal."
2. The partner cards from C4
3. A table of funding applications submitted by tenants of THIS landlord's properties (pulled from `rv_funding_applications` where the property belongs to this landlord)
4. Status tracking: Submitted → In Review → Funded / Declined

---

### C6 — Embed Financial Resources in Tenant Portal

In `tenant-portal.html`, add a new sidebar tab: **"Financial Resources"** (near the bottom).

This tab shows:
1. Only the products/services the tenant's landlord has toggled ON in their Management Profile
2. The tenant-facing cards from C3 (deposit help, emergency rent, personal loans)
3. If the tenant's lease is flagged as commercial, show the business funding option too
4. Credit Builder enrollment CTA if the landlord accepts it

---

### C7 — Funding CTA on Property Detail Page

On `property-detail.html`, for commercial listings, add a card:

```
🏢 Need Funding for Your Buildout?
RentVerified connects commercial tenants with
working capital, equipment financing, and SBA loans.

[ Explore Funding Options → ]  ← links to funding.html
```

For residential RTO listings, show:
```
🏠 Need Help with Move-In Costs?
Deposit alternatives, emergency assistance, and
financial resources to help you get started.

[ See Financial Resources → ]  ← links to funding.html
```

---

## PART D — ROADMAP & REVENUE UPDATES

### D1 — Update ROADMAP.md

Add a new revenue layer to ROADMAP.md:

```
### Layer 6 — Business Funding & Financial Services
- **Business loan referrals** — $200–5,000 per funded deal (GoKapital, Clarify Capital, National Funding)
- **SBA loan referrals** — $2,500–5,000 per closed SBA loan
- **Merchant cash advance** — $2,000–4,500 per funded MCA (Kapitus, Credibly)
- **Equipment financing** — $500–2,000 per funded lease
- **Personal loan leads (tenants)** — $50–300 per qualified lead (Round Sky, Lead Stack Media)
- **Security deposit loan referrals** — $25–100 per funded deposit loan
```

### D2 — Update index.html

On the homepage, add a section (below the property grid or near the pricing section):

```
💰 Financial Services — Built Into Every Transaction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Landlords                          For Tenants
─────────────                          ───────────
Earn passive income from every         Move in easier with deposit
lease signing. Deposit bonds,          alternatives, credit building,
rent guarantee, credit reporting,      flexible payments, and
and business funding referrals —       financial assistance — all
all built into your dashboard.         through your portal.

[ See How It Works → ]                 [ Find Help → ]
```

---

## IMPLEMENTATION ORDER

Do tasks in this order:
1. A1 + A2 (Management Profile tab shell + payment method toggles)
2. A3 (Financial product toggles with all education cards from Part B)
3. B1 + B2 (Expandable education card UI + all content)
4. A4 (Tenant portal respects landlord preferences)
5. A5 (Property detail shows accepted products)
6. A6 (Commercial portal management profile)
7. C1 (funding.html page shell)
8. C2 (Business funding application form)
9. C3 (Tenant financial assistance cards)
10. C4 (Partner cards with affiliate link placeholders)
11. C5 (Commercial portal funding tab)
12. C6 (Tenant portal financial resources tab)
13. C7 (Property detail funding CTAs)
14. D1 + D2 (Roadmap and homepage updates)

---

## DESIGN GUIDELINES

- Management Profile toggles: use iOS-style toggle switches (green when ON, gray when OFF)
- Education cards: light blue background (#EFF6FF), left border 3px solid #3B82F6, rounded corners
- Funding page: professional but accessible. Not intimidating. Use friendly language.
- Partner cards: white background, subtle shadow, partner logo placeholder (colored circle with initials until real logos added)
- All new sections must be mobile-responsive at 375px width
- Reuse existing CSS classes from `styles.css` wherever possible
- No external CSS libraries — inline `<style>` blocks only

---

## TESTING CHECKLIST

After all tasks:
1. Log in as landlord → Settings → Management Profile tab loads with all toggles
2. Toggle deposit bonds OFF → save → reload → toggle is still OFF
3. Log in as tenant of that landlord → deposit bond option is NOT shown
4. Toggle deposit bonds back ON → tenant now sees it
5. Expand "How does this work?" on every product → education card displays correctly
6. Visit property-detail.html for a property → "This Property Accepts" section shows only enabled products
7. Visit funding.html → both Business and Personal pathways display
8. Submit business funding application → saved to localStorage → confirmation screen shows
9. Partner cards display with "Apply Now" buttons (marked as affiliate links)
10. Commercial portal → Funding tab shows partner cards + application tracker
11. Tenant portal → Financial Resources tab shows only landlord-approved products
12. ROADMAP.md updated with Layer 6 revenue data
13. index.html has new Financial Services section
14. Mobile test all new sections at 375px width
15. No console errors on any page after changes

---

## REVENUE CONTEXT FOR DEVIN

The Management Profile + Funding Hub adds these new revenue streams:

| Source | Commission | Volume Estimate | Monthly Revenue |
|--------|-----------|-----------------|-----------------|
| Business loan referrals | $200–5,000/deal | 3–5/month | $1,000–10,000 |
| SBA loan referrals | $2,500–5,000/loan | 1–2/month | $2,500–10,000 |
| MCA referrals | $2,000–4,500/deal | 2–3/month | $4,000–13,500 |
| Personal loan leads | $50–300/lead | 10–20/month | $500–6,000 |
| Deposit loan referrals | $25–100/loan | 5–10/month | $125–1,000 |
| **Subtotal (funding only)** | | | **$8,125–40,500** |

Plus the existing affiliate revenue from products now controlled by the Management Profile:
| Source | Commission | Volume Estimate | Monthly Revenue |
|--------|-----------|-----------------|-----------------|
| Deposit bonds | ~15% of premium | 20 tenants | $51/month |
| Renters insurance | $2–5/mo | 30 tenants | $60–150/month |
| Rent guarantee | $150–200/policy | 5 policies | $750–1,000/month |
| Credit builder | $1–2/mo | 40 tenants | $40–80/month |
| Utility concierge | $75/tenant | 8 tenants | $600/month |
| Internet setup | $50–150/install | 8 installs | $400–1,200/month |

The Management Profile increases attach rates because landlords who understand the products (via education cards) are far more likely to enable them. Education → enablement → revenue.
