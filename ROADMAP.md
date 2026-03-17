# RentVerified — Roadmap & Current State

## What the Website Does Right Now

### Public-facing pages
- **Homepage** — Property search, "Verify a Listing" tool (tenants enter listing ID to confirm legitimacy), overview of Sanders PM rentals.
- **Listings page** — All available properties (rent, beds, baths, availability).
- **Property detail** — Full listing (address, rent, amenities, description, photos, QR for verification). **Live AI chat widget** knows property details (rent, beds, baths, availability, listing ID) and answers tenant questions 24/7: availability, rent, deposit, pets, lease terms, how to apply, payment methods, income requirements, parking, showings, scam verification. Unanswerable questions are saved to the landlord inbox.
- **Tenant portal** — Login, pay rent (Cash App, Zelle, Venmo, check, card), maintenance requests, documents, lease expiration with urgency-based reminders.

### Landlord dashboard (Business Log In)
- **Login** — Admin credentials; full property CRUD (add, edit, delete listings: address, rent, beds, baths, status, description, photos, listing ID).
- **Photos** — Upload to Cloudinary; "Download Photos ZIP" for Zillow, Facebook, Craigslist.
- **Broadcast** — Opens all 5 ad platforms at once (Facebook Marketplace, Craigslist SLC, Zillow, Apartments.com, KSL) and auto-copies formatted listing to clipboard.
- **AI Conversations** — Unanswered tenant questions from chat (property, timestamp, listing ID); "Draft a Reply" for Zillow/Facebook messages → AI-suggested reply.
- **Rent Payments** — Payment confirmations; fee policy toggle (absorb card fees) with live payout calculator.
- **Lease expiry** — Color-coded warnings (orange &lt;30 days, amber &lt;60 days, red expired) in dashboard and tenant portal.
- **Accounts** — See every account; Suspend/Unsuspend; view/edit each account’s listings.

### Gmail auto-draft (hourly)
- Scans Gmail for unread inquiries (Zillow, Facebook, Apartments.com, KSL).
- Generates AI reply using real property/company details; creates Gmail draft. Daniel reviews and sends.

### Documents
- Branded 9-section RentVerified rental application (.docx): Primary Applicant, Co-Applicant, Residential History, Employment, Occupants & Pets, Financial, Background, Emergency Contact, Authorization.

---

## What Still Needs to Be Built

### Immediate next steps (in order)

| # | Item | Notes |
|---|------|------|
| 1 | **Tour scheduling via Calendly** | Embed 30-min booking slots on property pages; AI shares scheduling link. Tenant signs up at calendly.com (free, ~5 min). |
| 2 | **Online application form** | Convert 9-section rental application into a web form on the site. Gating step before everything below. |
| 3 | **TransUnion SmartMove integration** | After application submit, tenant pays RentVerified $45–55 via Stripe for background check. RentVerified pays TransUnion at partner/wholesale rate (~$25–35). RentVerified keeps the spread + earns TransUnion referral commission. Report delivered to landlord dashboard. |
| 4 | **Permanent data storage (Supabase)** | Replace localStorage with real DB: applications, tenant records, leases. Foundation for eviction management. |
| 5 | **Built-in e-signing** | Lease signing inside RentVerified (no DocuSign/PandaDoc). Secure link → pre-filled lease → sign in browser → signed PDF stored + emailed. |
| 6 | **Auto-fill lease from application** | On Approve, AI pulls name, property, rent, deposit, move-in, pet deposit, etc. from application into lease; review then e-sign. |
| 7 | **One-click eviction process** | All tenant data in RentVerified → one-click 3-Day Notice to Pay or Quit / Unlawful Detainer; pre-filled packet for attorney. |

### Later phase (backend server required)
- Facebook Messenger API for true auto-replies.
- Full payment processing (Stripe) for fee-based features.
- Multi-tenant database as more PM companies join.

---

## Overall Goal

**RentVerified = end-to-end property management platform for Utah** — entire leasing pipeline from first inquiry to move-in and beyond.

**Target flow:**  
Tenant inquires → AI answers 24/7 → AI schedules tour → tour → AI follows up → tenant applies online → application stored → AI sends background check invite → tenant pays TransUnion → landlord reviews report → approve/decline → AI auto-fills lease → e-sign → tenant auto-added to portal → lease expiry monitored → if eviction needed, one-click doc generation with pre-filled data for attorney.

**Competitive position:** vs. AppFolio/Buildium ($250–500/mo). RentVerified: same core, Utah-focused, AI communication, built-in e-signing, eviction pipeline no competitor automates this way.

**Revenue streams:**

### Layer 1 — Verification (triggered every application)
- **TransUnion SmartMove** — $12.00 commission per applicant screened
- **Tenant screening fee** — Tenant pays RentVerified $45 via Stripe; RentVerified orders SmartMove; net ~$12 commission + spread
- **Legal forms (NOLO / Rocket Lawyer)** — $20.00 per landlord for custom lease docs / legal consults

### Layer 2 — Fintech (triggered at lease signing)
- **Deposit bonds (LeaseLock / Obligo)** — $25.00 flat fee per bond issued
- **Rent guarantee insurance** — $150–200 per policy (≈15% of annual premium)
- **Credit builder (Boom)** — $1–2/month recurring for life of lease
- **Renters insurance** — $2–5/month recurring, or ~$20 one-time referral

### Layer 3 — Lifestyle (triggered at move-in)
- **Internet / Cable setup (AT&T, Xfinity)** — $50–150 per new installation
- **Utility concierge** — $75 per tenant (white-glove utility transfer service)
- **Moving services** — $50 flat fee per booked referral
- **Smart home hardware (Amazon Associates)** — 5–10% on locks, cameras, etc.

### Subscription (landlord/PM)
- Starter: $29/month (up to 2 listings)
- Pro Monthly: $79/month (unlimited listings + full platform)
- Pro Annual: $59/month billed $708/yr
- Rent to Own: $99/month (lease-option management + credit tracker + mortgage referral)
- Commercial: $149/month (NNN/CAM tools + business screening + NOI dashboard)

### Layer 4 — Rent-to-Own (highest single commission)
- **Mortgage referral** — $500–1,500 per closed loan when tenant exercises purchase option
- **Credit builder (Boom)** — $1–2/month per RTO tenant (nearly 100% attach rate)
- **Mortgage lender featured placement** — $99–299/month for partner lenders
- **Option agreement e-sign fee** — future per-document charge

### Layer 5 — Commercial
- **Business entity screening (First Advantage / Experian Business)** — $15–25/commission
- **Professional network** — included FREE with any subscription. Visibility upgrades (Featured/Sponsor) $29–99/month for extra placement only
- **RFP board transaction fee** — future monetization

### Layer 6 — Business Funding & Financial Services
- **Business loan referrals** — $200–5,000 per funded deal (GoKapital, Clarify Capital, National Funding)
- **SBA loan referrals** — $2,500–5,000 per closed SBA loan
- **Merchant cash advance** — $2,000–4,500 per funded MCA (Kapitus, Credibly)
- **Equipment financing** — $500–2,000 per funded lease
- **Personal loan leads (tenants)** — $50–300 per qualified lead (Round Sky, Lead Stack Media)
- **Security deposit loan referrals** — $25–100 per funded deposit loan

### Later phase
- Lease e-signing fee per document
- Eviction packet generation fee
- Vendor lead paywall (contractors, maintenance)

---

## Target Markets Summary

| Market | Monthly Plan | Key Revenue | Status |
|--------|-------------|-------------|--------|
| Residential PM | $29–79/mo | Screening fees, insurance, lifestyle | Building |
| Rent to Own | $99/mo | Mortgage referrals ($500–1,500/loan) | Planned |
| Commercial PM | $149/mo | CAM tools, business screening | Planned |
| RE Professionals | $29–99/mo | Network advertising | Planned |
| Tenants | Free | All affiliate commissions | Active |
| Funding Hub | Free (affiliate) | Loan referrals ($200–5,000/deal) | Built |
