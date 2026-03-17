# Devin Prompt 1 of 3 — Landlord Management Profile + Education Cards

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

---

## WHAT YOU'RE BUILDING

A **Management Profile** tab in the landlord dashboard where each landlord toggles ON/OFF what financial products, payment methods, and services they accept. Each product has an expandable education card explaining how it works and how it benefits the landlord.

---

## TASK 1 — New Settings Tab: "Management Profile"

In `landlord-signup.html`, add a new sidebar link in the Settings group (below "AI Settings"):

```
Settings
  AI Settings
  Management Profile    ← NEW
```

Create tab content `dtab-mgmt-profile`. This is the single source of truth that controls what tenants see.

---

## TASK 2 — Payment Methods Section

Inside the Management Profile tab, first section: "Payment Methods You Accept"

Show iOS-style toggle switches (green ON, gray OFF) for each:

| Method | Default |
|--------|---------|
| Cash App | ON |
| Zelle | ON |
| Venmo | ON |
| Bank Transfer (ACH) | ON |
| Credit / Debit Card | ON |
| Check / Money Order | OFF |
| PayPal | OFF |

Below the toggles: Card Fee Policy radio buttons — (○) Tenant pays fee (●) I absorb fees

Migrate the existing card fee toggle from the Payment Settings tab into this section. The old Payment Settings tab becomes just a payment history/confirmations view.

---

## TASK 3 — Financial Products Section with Education Cards

Below payment methods, add "Financial Products & Services" section. Each product gets:
1. Toggle switch (ON/OFF)
2. One-line description
3. Commission indicator
4. Expandable "How does this work?" education card

**Style the education cards as:** light blue background (#EFF6FF), left border 3px solid #3B82F6, rounded corners, collapsed by default.

### Product List with Education Content:

---

**DEPOSIT ALTERNATIVES**

**Deposit Bonds (Jetty / Obligo)** — Default: ON
- Description: Tenants pay ~$17/mo instead of full deposit. You're still covered for the full deposit amount.
- Commission: ~15% on every premium

Education card content:
- WHAT IT IS: A deposit bond is a small monthly payment that replaces the traditional upfront security deposit. Instead of your tenant paying $1,500-$2,500 upfront, they pay roughly $17-30/month. A surety company (like Jetty) guarantees the full deposit amount to you.
- HOW IT WORKS FOR YOUR TENANT: The tenant applies through RentVerified at lease signing. They're approved in minutes based on a soft credit check. Instead of writing a $2,000 check, they pay ~$17/month. If they cause damage or break the lease, the bond company pays you — then collects from the tenant.
- HOW IT PROTECTS YOU: You are covered for the SAME amount as a traditional deposit. If the tenant causes $1,500 in damage, the surety company pays you up to the bonded amount. You file a claim just like you'd keep a regular deposit — except now you get paid by a company with actual funds, not a tenant who might dispute or be broke.
- WHAT YOU EARN: ~15% commission on every premium. On a $17/month bond, that's ~$2.55/month per tenant, recurring for the entire lease.
- FAQ: Q: "What if damage exceeds the bond?" A: Bond covers up to bonded amount (same as traditional deposit). Beyond that, you pursue the tenant directly. Q: "Can I also collect a deposit?" A: No — the bond replaces the deposit. You can still charge non-refundable move-in fees. Q: "What if tenant stops paying the premium?" A: Surety company handles collections. Your coverage remains in effect.

---

**Deposit-Free (Obligo Bank Verification)** — Default: OFF
- Description: Tenants move in with $0 deposit. Obligo holds a bank authorization instead.
- Commission: flat fee per enrollment

Education card: Obligo verifies the tenant's bank account and places a hold authorization (not a charge) for the deposit amount. If the tenant causes damage, Obligo charges their account. Tenant pays nothing upfront. You're protected by the bank authorization. Good for attracting high-quality tenants who don't want to lock up cash.

---

**INSURANCE PRODUCTS**

**Renters Insurance (Jetty / Sure)** — Default: ON
- Description: Tenants get coverage starting at ~$10/mo. Many landlords require it.
- Commission: $2-5/mo recurring per policy

Education card content:
- WHAT IT IS: Renters insurance covers your tenant's personal belongings and provides liability protection. Through RentVerified, tenants can purchase policies starting at ~$10/month.
- HOW IT PROTECTS YOU: If a tenant causes accidental damage (kitchen fire, overflowing bathtub), their renters insurance liability coverage can pay for repairs to YOUR property. Without it, you'd chase the tenant for repair costs.
- WHAT YOU EARN: $2-5/month recurring commission per active policy. With Jetty's combo product, bundle with deposit bond in one enrollment.
- FAQ: Q: "Can I require it?" A: Yes, in Utah landlords can require renters insurance as a lease condition. Q: "What if they already have it?" A: They keep their existing policy. You only earn commission if they purchase through RentVerified.

---

**Rent Guarantee Insurance** — Default: OFF
- Description: If tenant stops paying, insurer covers missed rent (6-12 months).
- Commission: $150-200 per policy (15% of annual premium)

Education card content:
- WHAT IT IS: A policy that pays YOU if your tenant stops paying rent. Covers 6-12 months of lost rent plus legal fees for eviction.
- HOW IT PROTECTS YOU: Insurance company reimburses lost rent within 30 days of filing. Most policies also cover eviction legal fees. Average eviction costs $3,500-$10,000. One policy at ~$300-500/year prevents that.
- FAQ: Q: "Waiting period?" A: 30-60 days after first missed payment, then retroactive reimbursement. Q: "Replaces screening?" A: No — still screen tenants. Insurance is a safety net.

---

**Lease Guarantee (LeaseLock)** — Default: OFF
- Description: Whole-property insurance that replaces security deposits entirely.
- Commission: higher commission structure per unit

Education card: LeaseLock insures the entire property at the lease level. Replaces deposits for all units. Landlord pays, tenant benefits from zero deposit. Higher per-unit commission. Best for multi-unit properties wanting a consistent no-deposit policy.

---

**TENANT FINANCIAL TOOLS**

**Credit Builder (Boom)** — Default: ON
- Description: Tenant's on-time rent payments reported to all 3 bureaus.
- Commission: $1-2/mo recurring per tenant

Education card content:
- HOW IT PROTECTS YOU: Tenants building credit are less likely to default — their payment directly affects their score. Built-in incentive for on-time payment. Tenants who value this renew more often, reducing turnover.
- WHAT YOU EARN: $1-2/month recurring per tenant enrolled. Small per tenant but 100% passive with high enrollment.
- FAQ: Q: "Reports late payments?" A: Most only report positive payments. Q: "Do I have to do anything?" A: No. Automatic after tenant enrolls.

---

**Rent Flexibility (Flex)** — Default: ON
- Description: Tenants split rent into 2 payments/month. You still get paid in full on the 1st.
- Commission: Tenant pays Flex $14.99/mo directly

Education card content:
- HOW IT WORKS: Flex pays YOU full rent on the 1st. Tenant pays Flex back in two installments aligned with paychecks.
- HOW IT PROTECTS YOU: You get paid in full, on time, on the 1st. Period. If tenant doesn't pay Flex back, that's between Flex and the tenant.
- FAQ: Q: "Tenant misses second payment to Flex?" A: Flex's problem, not yours. Q: "Changes my lease?" A: No — lease still says rent due on 1st.

---

**MOVE-IN SERVICES**

**Utility Setup Concierge** — Default: ON
- Description: We handle power, gas, internet transfers for new tenants.
- Commission: $75 per tenant

**Internet / Cable Setup (AT&T, Xfinity)** — Default: ON
- Description: New install referral at move-in.
- Commission: $50-150 per installation

**Moving Services Referral** — Default: OFF
- Description: Connect tenants with vetted movers.
- Commission: $50 per booked move

(These 3 get shorter education cards — 2-3 sentences each explaining the service and commission.)

---

**BUSINESS FUNDING (for commercial tenants)**

**Business Loans & Working Capital** — Default: ON
- Description: Connect commercial tenants with funding for buildout, equipment, operations.
- Commission: $200-5,000 per funded deal

**SBA Loan Referrals** — Default: ON
- Description: Government-backed small business loans for qualified tenants.
- Commission: $2,500-5,000 per closed SBA loan

**Merchant Cash Advance Referral** — Default: OFF
- Description: Quick capital based on future revenue. Good for retail/restaurant tenants.
- Commission: $2,000-4,500 per funded MCA

(Business funding education cards: 3-4 sentences each explaining the product type, who it's for, and commission.)

---

## TASK 4 — Save to localStorage

"Save Management Profile" button at bottom. Store in `rv_mgmt_profile_<companyId>`:

```json
{
  "paymentMethods": {
    "cashApp": true, "zelle": true, "venmo": true,
    "ach": true, "card": true, "check": false, "paypal": false
  },
  "cardFeePolicy": "tenant_pays",
  "financialProducts": {
    "depositBonds": true, "depositFree": false,
    "rentersInsurance": true, "rentGuarantee": false, "leaseGuarantee": false,
    "creditBuilder": true, "rentFlexibility": true,
    "utilitySetup": true, "internetSetup": true, "movingServices": false,
    "businessLoans": true, "sbaLoans": true, "merchantCashAdvance": false
  },
  "updatedAt": "ISO timestamp"
}
```

If no profile exists yet, default ALL products to ON (opt-out model — maximizes revenue).

---

## TASK 5 — Tenant Portal Respects Preferences

In `tenant-portal.html`, when displaying financial products:
1. Look up tenant's landlord from lease data
2. Load that landlord's `rv_mgmt_profile_<companyId>`
3. Only show products where toggle is ON
4. Add helper function `getLandlordPreferences(landlordId)`
5. If no profile exists, default all ON

---

## TASK 6 — Property Detail Shows Accepted Products

On `property-detail.html`, add section below property details:

```
This Property Accepts
🛡️ Deposit Bond Available — Move in without a full deposit
📋 Renters Insurance — Get covered from $10/mo
📈 Credit Builder — Build your score with on-time rent
💳 Flex Pay — Split rent into 2 payments
[ Apply Now → ]
```

Only show badges for products the landlord toggled ON.

---

## TASK 7 — Commercial Portal Management Profile

Add same Management Profile tab to `commercial.html` Settings, but with commercial defaults:
- Business Loans: ON, SBA Loans: ON, Equipment Financing: ON, Commercial Mortgage: ON
- Merchant Cash Advance: OFF
- Deposit alternatives: OFF, Renters Insurance: OFF, Credit Builder: OFF

Store in `rv_commercial_mgmt_profile_<companyId>`.

---

## DESIGN
- Toggle switches: iOS-style (green #22C55E when ON, gray #D1D5DB when OFF)
- Education cards: #EFF6FF background, 3px left border #3B82F6, 8px border-radius
- Mobile-responsive at 375px
- No external CSS libraries — inline `<style>` blocks only

## TESTING
1. Landlord Settings → Management Profile loads with all toggles
2. Toggle deposit bonds OFF → save → reload → still OFF
3. Tenant of that landlord → deposit bond NOT shown
4. Toggle back ON → tenant sees it
5. Every "How does this work?" expands correctly
6. Property detail shows only enabled products
7. Commercial portal has commercial-specific defaults
8. No console errors
