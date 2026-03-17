# Devin Prompt 3 of 3 — Embed Funding in Portals + Roadmap Updates

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)

## Codebase Context (READ THIS FIRST)
- Static HTML/CSS/vanilla JavaScript — no frontend framework
- All data stored in localStorage using `rv_` prefix keys
- Styles: `styles.css` contains all shared classes — DO NOT modify it. Add page-specific `<style>` blocks only
- Copy ALL changed/new files to `rentverified/` subdirectory after every task
- **Prerequisites:** Prompts 1 and 2 of 3 must be completed first. This prompt assumes:
  - `landlord-signup.html` has a Management Profile tab with product toggles (from Prompt 1)
  - `commercial.html` has a Management Profile tab with commercial defaults (from Prompt 1)
  - `funding.html` exists with business funding form and partner cards (from Prompt 2)
  - `rv_mgmt_profile_<companyId>` localStorage key stores landlord preferences
  - `rv_funding_applications` localStorage array stores submitted applications

---

## WHAT YOU'RE BUILDING

Embed funding and financial resource features inside the existing portals (commercial and tenant), add funding CTAs to property detail pages, and update the ROADMAP.

---

## TASK 1 — Commercial Portal: "Funding" Tab

In `commercial.html`, add a new sidebar tab: **"Funding"** (place it between Screening and Documents in the sidebar).

Tab content (`dtab-funding`):

**Section 1: Summary Card**
```
Connect Your Tenants with Funding
Earn $200–$5,000 per funded deal when your commercial
tenants get working capital, equipment financing, or
SBA loans through RentVerified.
```

**Section 2: Partner Cards**
Show the same 5 partner cards from `funding.html` (GoKapital, Clarify Capital, SBA, National Funding, Merchant Cash Advance). Each with "Apply Now →" buttons marked `// AFFILIATE_LINK: [partner]`.

But here add context: "Share these with your tenants or apply on their behalf."

**Section 3: Applications from Your Tenants**
A table showing funding applications submitted by tenants of THIS landlord's properties:

| Tenant / Business | Amount | Purpose | Date | Status |
|---|---|---|---|---|
| Mike's Auto Shop | $75,000 | Equipment | Mar 10 | Submitted |
| Provo Dental LLC | $150,000 | Buildout | Mar 8 | In Review |

Pull from `rv_funding_applications` where the applicant's email matches a tenant in this landlord's `rv_commercial_leases_<companyId>`, OR where the application includes a property belonging to this landlord.

Status badges: "Submitted" (blue), "In Review" (yellow), "Funded" (green), "Declined" (red).

**Section 4: Quick Actions**
- "Send Funding Info to a Tenant" button — opens a modal with a textarea pre-filled with a message about available funding + link to funding.html. Saves to `rv_messages` if messaging system exists, otherwise shows copy-to-clipboard.
- "Post Funding Link on My Listings" toggle — if ON, shows the business funding CTA card on all of this landlord's commercial listings on property-detail.html.

---

## TASK 2 — Tenant Portal: "Financial Resources" Tab

In `tenant-portal.html`, add a new sidebar tab: **"Financial Resources"** (place it near the bottom of the sidebar, before Settings if there is one).

Tab content (`dtab-financial`):

**Step 1: Check landlord preferences**
- Get the current tenant's landlord ID from their lease data
- Load `rv_mgmt_profile_<landlordId>` (or `rv_commercial_mgmt_profile_<landlordId>` for commercial)
- If no profile exists, default all to ON

**Step 2: Show only enabled products**

For each product, only display the card if the landlord has it toggled ON:

**Card: Deposit Bond** (if `depositBonds: true`)
- "Move in without a full deposit"
- "Your landlord accepts deposit bonds. Pay ~$17/month instead of $2,000 upfront."
- Button: "Learn More & Apply →" `// AFFILIATE_LINK: jetty`

**Card: Renters Insurance** (if `rentersInsurance: true`)
- "Get covered from $10/mo"
- "Protect your belongings and get liability coverage."
- Button: "Get a Quote →" `// AFFILIATE_LINK: renters_insurance`

**Card: Credit Builder** (if `creditBuilder: true`)
- "Build your credit with rent payments"
- "Your on-time rent payments reported to all 3 credit bureaus."
- Button: "Enroll Now →" `// AFFILIATE_LINK: boom`

**Card: Flex Pay** (if `rentFlexibility: true`)
- "Split your rent into 2 payments"
- "Pay half now, half on the 15th. Your landlord gets paid in full on the 1st."
- Button: "Set Up Flex →" links to flex info

**Card: Emergency Help**
- Always shown (not dependent on landlord toggle)
- "Need help this month?"
- "Find emergency rent assistance programs in Utah."
- Button: "Find Help →" links to `funding.html` tenant section or `tenant-assistance.html`

**Card: Business Funding** (if tenant's lease is commercial AND `businessLoans: true`)
- "Need funding for your business?"
- "Working capital, equipment financing, and SBA loans available."
- Button: "Explore Options →" links to `funding.html`

**Card: Personal Loan**
- Always shown
- "Short on cash for move-in costs?"
- "Compare personal loan options."
- Button: "See Options →" links to `funding.html` tenant section

---

## TASK 3 — Property Detail Funding CTAs

On `property-detail.html`, add conditional cards below the property details:

**For commercial listings** (detect by checking if property came from `rv_commercial_listings_*`):
```
Need Funding for Your Buildout?
RentVerified connects commercial tenants with working capital,
equipment financing, and SBA loans.
[ Explore Funding Options → ]  ← links to funding.html
```

**For RTO listings** (detect by checking `isRTO: true` on the listing):
```
Need Help with Move-In Costs?
Deposit alternatives, emergency assistance, and financial
resources to help you get started.
[ See Financial Resources → ]  ← links to funding.html
```

**For standard residential listings** (always show):
```
This Property Accepts
[badges for enabled products from landlord's management profile]
```
(This was built in Prompt 1 Task 6 — just verify it's working here.)

---

## TASK 4 — Update ROADMAP.md

Add to the existing revenue layers in `ROADMAP.md`:

```markdown
### Layer 6 — Business Funding & Financial Services
- **Business loan referrals** — $200–5,000 per funded deal (GoKapital, Clarify Capital, National Funding)
- **SBA loan referrals** — $2,500–5,000 per closed SBA loan
- **Merchant cash advance** — $2,000–4,500 per funded MCA (Kapitus, Credibly)
- **Equipment financing** — $500–2,000 per funded lease
- **Personal loan leads (tenants)** — $50–300 per qualified lead (Round Sky, Lead Stack Media)
- **Security deposit loan referrals** — $25–100 per funded deposit loan
```

Also update the Target Markets Summary table to add:
```
| Funding Hub | Free (affiliate) | Loan referrals ($200–5,000/deal) | Planned |
```

---

## TASK 5 — Verify Cross-Page Consistency

After all changes, verify:

1. **Landlord toggles a product OFF** → that product disappears from:
   - Tenant portal Financial Resources tab
   - Property detail "This Property Accepts" badges
   - (But NOT from funding.html — funding.html is a standalone page for anyone)

2. **Landlord toggles a product ON** → that product appears in all the above places

3. **No management profile saved yet** → all products default to ON everywhere

4. **Commercial landlord** uses commercial management profile (`rv_commercial_mgmt_profile_*`), not residential

---

## DESIGN
- Match existing portal card styles (white bg, subtle shadow, rounded corners)
- Financial Resources tab cards: use consistent icon + title + description + CTA button pattern
- Status badges in funding table: colored pills (blue/yellow/green/red)
- Funding CTAs on property-detail: styled as accent cards with colored left border
- Mobile-responsive at 375px
- No external CSS libraries — inline `<style>` blocks only

## TESTING
1. Commercial portal → Funding tab loads with partner cards
2. Commercial portal → Funding tab shows applications from tenants
3. Tenant portal → Financial Resources tab shows only landlord-enabled products
4. Tenant portal → Emergency Help and Personal Loan always shown
5. Property detail (commercial) → shows business funding CTA
6. Property detail (RTO) → shows move-in costs CTA
7. Property detail (residential) → shows "This Property Accepts" badges
8. ROADMAP.md has Layer 6 content
9. Toggling products OFF in management profile hides them in tenant portal
10. Default behavior (no profile saved) shows all products
11. Mobile test at 375px
12. No console errors
