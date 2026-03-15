# RentVerified Platform Roadmap

## Current State — Sanders Property Management ERP

### Layer 1 — Core Platform
- Homepage with verified listings, AI scam detection
- Landlord dashboard with property onboarding, client CRM
- Tenant portal with payments, maintenance, messaging
- Admin approval queue with role-based access

### Layer 2 — Advanced Infrastructure
- Portfolio import (CSV/XLSX) with AI column mapping
- Relational client architecture (owners → properties → tenants)
- Dynamic PM fee editor with real-time calculations
- SPM-format accounting ledger

### Layer 3 — Command Center
- Tile-based property hub (Lease, Tenants, Maintenance, Finances, Docs, Settings)
- Unified messaging with permission walls
- Attorney document management
- Professional profiles with QR verification
- Sidebar customization (drag-reorder)

### Layer 4 — Professional ERP
- Breadcrumb navigation + contextual sidebar
- Advanced accounting board (SPM-format ledger)
- Ad builder for Facebook/Craigslist/KSL
- QR-verified listing pages with lead capture
- Vendor repair dollar limits with owner approval

### Layer 5 — Pre-Launch Polish
- Production data reset (SPM Rent Collections import)
- Admin approval queue (/admin.html)
- Stripe subscription gate ($29/$79/$59/$99/$149 tiers)
- Mobile audit (property-detail + tenant portal)
- Inspection scheduling with photo documentation
- 1099 tax reporting ($600 threshold)

### Layer 6 — Revenue Integration & Financial Services
- **Hugging Face AI**: Serverless proxy (`api/hf.js`), browser-side scam detection, smart document parsing
- **Stripe Subscriptions**: Starter $29/mo, Pro $79/mo, Pro Annual $59/mo, Rent to Own $99/mo, Commercial $149/mo
- **Credit Builder**: $6.99/mo subscription, reports to 3 credit bureaus (Boom Pay integration)
- **Renters Insurance**: Lemonade affiliate integration
- **Vendor Paywall**: $99/mo vendor subscription tier

### Layer 6b — Business Funding & Financial Services (Phase 8)

#### Management Profile (Landlord Settings)
- Per-company profile stored in `rv_mgmt_profile_<companyId>` localStorage key
- 7 payment method toggles: Cash App, Zelle, Venmo, ACH, Credit/Debit Card, Check/Money Order, PayPal
- 13 financial product toggles organized by category:
  - **Deposit Alternatives**: Deposit Bonds (Jetty/Obligo), Deposit-Free (Obligo)
  - **Insurance**: Renters Insurance, Rent Guarantee, Lease Guarantee (LeaseLock)
  - **Tenant Tools**: Credit Builder (Boom), Rent Flexibility (Flex)
  - **Move-In Services**: Utility Setup, Internet/Cable Setup, Moving Services
  - **Business Funding**: Business Loans, SBA Loans, Merchant Cash Advance
- Opt-out model: all products default ON if no profile exists
- Education cards for each product (5 sections: What It Is, How It Works, Protections, Earnings, Concerns)

#### Tenant Portal Financial Resources
- Financial Resources tab filtered by landlord management profile
- Only shows products the landlord has enabled
- Product catalog: deposit bonds, deposit-free, insurance, credit builder, flex pay, utilities, internet, moving

#### Property Detail Enhancements
- "This Property Accepts" badge section showing enabled products/payment methods
- Financial Resources CTAs linking to funding hub

#### Commercial Portal (`commercial.html`)
- Separate portal for commercial property management
- Commercial-specific management profile with different defaults:
  - Business funding referrals: ON by default
  - Deposit alternatives: OFF by default (commercial leases rarely use bonds)
  - Renters Insurance: OFF (not applicable)
  - Credit Builder: OFF (not relevant for businesses)
- Funding tab with partner cards + application tracker

#### Funding Hub (`funding.html`)
- Two pathways: Business Funding vs Tenant Financial Assistance
- Business funding application form → saved to localStorage → confirmation screen
- Partner cards with affiliate link placeholders:
  - **GoKapital**: $5K-$800K business loans, equipment financing
  - **Clarify Capital**: $10K-$5M working capital, same-day approval
  - **SBA Loan Network**: Government-backed $50K-$5M, 7-25yr terms
  - **National Funding**: $5K-$500K with early payoff discounts
  - **MCA Network**: Revenue-based financing, adjusts with sales
- Tenant assistance cards: deposit bonds, deposit-free, credit builder, flex pay, insurance, utilities, emergency rent help, personal loans

#### Revenue Estimates (Monthly)
| Product | Revenue Range |
|---------|--------------|
| Business Loans | $1,000 - $10,000 |
| SBA Loans | $2,500 - $10,000 |
| Merchant Cash Advance | $4,000 - $13,500 |
| Personal Loans | $500 - $6,000 |
| Deposit Loans | $125 - $1,000 |
| Deposit Bonds | ~$51 |
| Renters Insurance | $60 - $150 |
| Rent Guarantee | $750 - $1,000 |
| Credit Builder | $40 - $80 |
| Utility Setup | ~$600 |
| Internet/Cable Setup | $400 - $1,200 |

**Total Estimated Monthly Revenue**: $10,026 - $43,581 (at scale)

---

## Planned Features
- Supabase migration (persistent database)
- E-signing integration
- Eviction pipeline automation
- TransUnion SmartMove background checks
- Stripe Connect split-pay ($15/$35 platform fee)
- Real affiliate URL integration (replace placeholders)
