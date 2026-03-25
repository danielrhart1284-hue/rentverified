# RentVerified — Business Management & Networking Roadmap

> **Vision:** One platform that serves as the operating system for small businesses.
> Handles all basic business needs, adapts per business type, AND connects businesses with each other.

This roadmap covers the transformation from property management tool → **business management + business networking platform**. For revenue/monetization details, see [ROADMAP.md](./ROADMAP.md).

---

## What Already Exists (Foundation)

Before building forward, here's what we're working with today:

| Area | What's Built | Status |
|------|-------------|--------|
| **Verticals** | 13 business types (landlord, commercial, agent, vendor, attorney, contractor, nonprofit, STR, etc.) | ✅ Live |
| **CRM** | `crm.html` — contact management per account | ✅ Live |
| **Booking** | `booking.html` — appointment scheduling | ✅ Live |
| **Messaging** | `messages.html` + Twilio integration — tenant/client comms | ✅ Live |
| **Service Connect** | `service-connect.js` — widget connecting users to loan officers, insurance agents, accountants, attorneys, marketing, bookkeepers | ✅ Live |
| **Loan Connect** | `loan-connect.html` — business funding referral flow | ✅ Live |
| **Client Portal** | `client-portal.html` + `tenant-portal.html` + `guest-portal.html` | ✅ Live |
| **Community / Groups** | `community.html` — industry groups, local groups, topic groups with activity feed | ✅ Live |
| **Professional Network** | `network.html` — professional directory with search, profiles, connections | ✅ Live |
| **Professional Marketplace** | `professional-marketplace.html` — find & hire pros by category | ✅ Live |
| **Referral Dashboard** | `referral-dashboard.html` — track referrals and commissions | ✅ Live |
| **Documents** | `documents.html` + `doc-generator.html` — storage and generation | ✅ Live |
| **E-Signatures** | `e-signature.html` — built-in signing | ✅ Live |
| **Invoicing** | `invoice-builder.html` — create and send invoices | ✅ Live |
| **Accounting** | `accounting.html` — basic bookkeeping | ✅ Live |
| **Workspace System** | `workspace.js` — multi-tenant workspace with branding, roles, invites | ✅ Live |
| **Reviews** | `reviews.html` — ratings and reviews system | ✅ Live |

### How Existing Features Map to the New Vision

| New Vision Feature | Existing Foundation | Gap to Close |
|---|---|---|
| Teams & Connections | `network.html` connections + `community.html` groups | Need project-based teams, not just social connections |
| Collaboration Workspaces | `workspace.js` multi-tenant system | Need deal/project-scoped workspaces with shared checklists |
| Document Sharing Hub | `documents.html` + `doc-generator.html` | Need cross-account sharing + temporary client upload accounts |
| Built-in Business Tools | Accounting, e-sign, invoicing, CRM all exist | Need to unify UX and fill gaps (simple payroll, estimates) |
| Professional Directory | `network.html` + `professional-marketplace.html` | Need "Hire / Request Quote" flow and deeper profiles |
| Referral Network | `referral-dashboard.html` + Service Connect | Need in-platform referral tracking with reputation scoring |

---

## Phase 1 — Team Assembly & Project Connections

**Goal:** Let professionals build working teams and connect on real deals, not just "friend" each other.

**Timeline:** Builds directly on `network.html`, `community.html`, and `workspace.js`.

### 1.1 Project-Based Teams

> Think: Real estate agent assembles a loan officer + insurance agent + title company + inspector for a deal.

- **"Create Team" button** on `network.html` and within each portal dashboard
- Team = named group of connected professionals working toward a shared goal
- Team creator picks members from their connections OR searches the network
- Each team has a purpose label (e.g., "123 Main St Purchase", "Q2 Ad Campaign", "Smith Eviction Case")
- Team types:

| Type | Example | Members |
|------|---------|---------|
| Real Estate Deal | Home purchase at 456 Oak Ave | Realtor, Loan Officer, Insurance Agent, Title Co, Inspector, Client |
| Legal Case | Eviction — Unit 4B | Attorney, Property Manager, Process Server |
| Business Project | Spring marketing campaign | Retailer, Marketing Agency, Graphic Designer, Social Media Manager |
| Financial Review | Year-end tax prep | Business Owner, CPA, Bookkeeper, Attorney |
| Maintenance Job | Roof replacement — Building A | Property Manager, Contractor, Supplier |

- Store in `rv_teams_<userId>` with members, roles, status, and shared workspace ID
- Teams visible in sidebar of each member's portal

### 1.2 Facebook-Style Connection Upgrades

> Build on existing `network.html` connection system.

- **Mutual connections shown** — "You and Sarah both know 4 people"
- **Connection categories** — tag connections as Colleague, Vendor, Client, Referral Partner
- **Quick-connect from any portal** — "Add to My Network" button on Service Connect results, marketplace listings, and community members
- **Connection strength indicator** — based on shared deals, messages, referrals (not just "connected")
- **"Recommended Connections"** — AI-suggested based on your industry, location, and who your connections work with

### 1.3 Activity Feed Enhancements

> Build on existing `community.html` activity feed.

- Show team activity alongside community posts
- "Daniel just closed a deal with Team 123 Main St" (opt-in milestone sharing)
- "Sarah left a 5-star review for Marcus Johnson, Esq."
- "New RFP posted: Need licensed plumber for 4-unit in Provo"

---

## Phase 2 — Collaboration Workspaces

**Goal:** When a team works on a deal/project, they get a shared workspace with checklists, task tracking, and status updates.

**Timeline:** After Phase 1 teams are working.

### 2.1 Deal/Project Workspaces

> Build on existing `workspace.js` architecture.

Every team gets an auto-created workspace with:

| Component | Description |
|-----------|-------------|
| **Checklist** | Pre-built checklists by deal type (home purchase, lease signing, marketing campaign). Custom items too. |
| **Task Board** | Kanban-style: To Do → In Progress → Waiting → Done. Assign tasks to team members. |
| **Timeline** | Visual timeline of milestones with dates and who's responsible. |
| **Status Updates** | Each member can post updates visible to the whole team. |
| **File Area** | Shared docs specific to this deal (see Phase 3). |
| **Chat Thread** | Team-only message thread (extends existing messaging). |

### 2.2 Template Workspaces by Industry

Pre-built workspace templates so users don't start from scratch:

| Template | Checklist Items (examples) |
|----------|---------------------------|
| **Home Purchase** | Pre-approval → Offer submitted → Inspection scheduled → Appraisal ordered → Title search → Clear to close → Closing day |
| **Lease Signing** | Application received → Screening complete → Lease drafted → Lease signed → Move-in inspection → Keys handed over |
| **Eviction Process** | Notice served → Waiting period → Court filing → Hearing date → Judgment → Writ of restitution → Lockout |
| **Marketing Campaign** | Brief approved → Creative concepts → Design round 1 → Revisions → Final assets → Launch → Performance review |
| **Tax Preparation** | Documents gathered → Bookkeeping reconciled → Draft return → Client review → File → Confirmation |

### 2.3 Client View (Limited Access)

- Clients (homebuyers, tenants, business customers) get a **read-only + upload** view of the workspace
- They can see the checklist progress ("Your loan is in underwriting — step 5 of 8")
- They can upload requested documents
- They can NOT see internal team notes or financials
- Extends existing `client-portal.html` and `guest-portal.html`

---

## Phase 3 — Document Sharing Hub

**Goal:** Upload once, share with anyone involved. No more emailing PDFs back and forth.

**Timeline:** After workspaces exist to give docs a home.

### 3.1 Centralized Document Vault

> Build on existing `documents.html`.

- Each user/business has a **Document Vault** — their private file storage
- Organized by folders: Financial, Legal, Insurance, Tax, Contracts, Personal ID, Other
- Upload any file type (PDF, DOCX, images, spreadsheets)
- Each document has a sharing permission panel

### 3.2 Cross-Account Sharing

| Feature | How It Works |
|---------|--------------|
| **Share with connections** | Click "Share" on any doc → pick from your network connections → set permission (view only / download / edit) |
| **Share with a team** | Drop docs into a team workspace → all members see them (respects client view limits) |
| **Revoke access** | Remove sharing at any time — doc disappears from their view |
| **Audit trail** | See who viewed/downloaded each doc and when |

### 3.3 Temporary Client Upload Accounts

- Professional sends a **secure upload link** to their client (email/text)
- Client clicks link → creates a lightweight temporary account (name + email only)
- Client uploads requested docs (tax returns, bank statements, W-2s, insurance certs, etc.)
- Docs land directly in the professional's vault, tagged with the client's name
- Client can also see docs shared back to them (signed lease, insurance quote, etc.)
- Temporary account expires after 90 days of inactivity (or professional deletes it)

### 3.4 Smart Document Requests

- Professionals can create a **Document Request Checklist** and send it to a client:

```
📋 Documents Needed — Smith Home Purchase
☐ Last 2 years tax returns
☐ Last 2 months pay stubs
☐ Last 2 months bank statements
☐ Photo ID (front and back)
☐ Proof of insurance
☐ Gift letter (if applicable)

[Upload Your Documents →]
```

- Client sees the checklist and uploads against each line item
- Professional sees ✅ as items are completed
- Replaces the "send me your docs" email chain entirely

---

## Phase 4 — Built-in Business Tools (The All-in-One Suite)

**Goal:** Small businesses shouldn't need QuickBooks + DocuSign + Dropbox + Mailchimp + HoneyBook. Bundle it all.

**Timeline:** Iterative — fill gaps in what already exists.

### 4.1 Current Built-in Tools (Already Exist)

| Tool | Page | Replaces |
|------|------|----------|
| Accounting / Bookkeeping | `accounting.html` | QuickBooks (basic) |
| E-Signatures | `e-signature.html` | DocuSign |
| Document Storage | `documents.html` | Dropbox / Google Drive |
| Invoicing | `invoice-builder.html` | FreshBooks / Wave |
| CRM | `crm.html` | HubSpot (basic) |
| Booking / Scheduling | `booking.html` | Calendly |
| Messaging | `messages.html` | Intercom (basic) |
| Form Builder | `form-builder.html` | JotForm / Typeform |
| Ad Builder | `ad-builder.html` | Canva (basic) |
| Time Tracking | `time-tracking.html` | Toggl |

### 4.2 New Tools to Build

| Tool | What It Does | Replaces | Priority |
|------|-------------|----------|----------|
| **Estimates / Proposals** | Create, send, and track estimates. Client approves online. Convert to invoice. | HoneyBook / PandaDoc | High |
| **Simple Payroll** | Track hours, calculate pay, generate pay stubs. (Not tax filing — that's complex.) | Gusto (basic) | Medium |
| **Expense Tracking** | Snap receipt photos, categorize expenses, attach to projects. | Expensify | High |
| **Client Intake Forms** | Configurable intake forms per business type. Auto-creates CRM entry. | JotForm | Medium |
| **Email Campaigns** | Simple email blasts to client lists. Templates per industry. | Mailchimp (basic) | Low |
| **Contracts Library** | Pre-built contract templates by industry. Edit, sign, store. | Rocket Lawyer | Medium |

### 4.3 Unified Business Dashboard

- **One dashboard** that shows all tools in one view
- Quick-access cards: Recent invoices, pending signatures, upcoming bookings, unread messages, open tasks
- Configurable — drag/drop to rearrange (see Phase 6)

---

## Phase 5 — Optional Integrations

**Goal:** For businesses that already use external tools, let them connect without forcing a switch. But built-in tools are the default.

**Timeline:** After built-in tools are polished.

### 5.1 Integration Philosophy

> "We build it in. You can also connect what you already use. But you never NEED to."

- Integrations are always **optional add-ons**, never requirements
- Built-in tools work out of the box with zero setup
- Integrations sync data bidirectionally where possible

### 5.2 Priority Integrations

| Integration | What It Does | Why |
|-------------|-------------|-----|
| **QuickBooks Online** | Sync invoices, expenses, chart of accounts | Most-used small biz accounting tool |
| **Google Workspace** | Google Drive file sync, Google Calendar for bookings | Universal |
| **DocuSign** | Use DocuSign for e-sign instead of built-in (if they prefer) | Enterprise clients want this |
| **Stripe** | Payment processing for invoices, subscriptions | Already planned in tech roadmap |
| **Zapier** | Connect to 5,000+ apps via triggers/actions | Catch-all for niche tools |
| **Plaid** | Bank account verification, financial data | For funding/loan features |
| **Twilio** | Already integrated for SMS — extend to voice, WhatsApp | Existing |
| **Google/Facebook Ads** | Pull ad performance into the Ad Builder dashboard | For marketing agencies |

### 5.3 Integration Marketplace Page

- New page: `integrations.html`
- Grid of available integrations with "Connect" buttons
- Each integration shows: what it syncs, setup steps, status (Connected / Not Connected)
- OAuth flow for each (requires Supabase backend — see tech roadmap)

---

## Phase 6 — Configurable Dashboards

**Goal:** A landlord sees different default widgets than a salon owner or an attorney. Everyone can customize.

**Timeline:** After the tool suite is complete enough to have widgets worth showing.

### 6.1 Dashboard Widgets

| Widget | Shows | Default For |
|--------|-------|-------------|
| Revenue Summary | Monthly income, expenses, net | All business types |
| Upcoming Bookings | Next 7 days of appointments | Service businesses, agents |
| Active Deals / Projects | Team workspaces with status | Agents, attorneys, contractors |
| Unread Messages | Message count + preview | All |
| Document Requests | Pending uploads from clients | Attorneys, loan officers, CPAs |
| Task Board Summary | Open tasks across all projects | All |
| Tenant Overview | Occupancy, rent collected, maintenance | Landlords, property managers |
| Invoice Status | Unpaid / overdue / paid this month | All |
| Referral Earnings | Commissions earned this month | Agents, loan officers |
| Network Activity | Recent connections, reviews, RFPs | All |
| Client Pipeline | Kanban summary (leads → active → closed) | Sales-heavy businesses |
| Compliance Alerts | Expiring licenses, insurance renewals | Contractors, agents, landlords |

### 6.2 Dashboard Customization

- **Drag and drop** to rearrange widgets
- **Show/hide** any widget
- **Default layouts per vertical** — e.g., landlord dashboard defaults are different from attorney defaults
- **Save layout** per user
- Possible future: share dashboard layouts ("Use the Landlord Pro layout")

### 6.3 Industry-Specific Defaults

| Business Type | Default Dashboard Widgets |
|---------------|--------------------------|
| Landlord / PM | Tenant Overview, Revenue, Maintenance, Compliance, Invoices |
| Real Estate Agent | Active Deals, Client Pipeline, Referral Earnings, Bookings |
| Attorney | Active Cases, Document Requests, Time Tracking, Invoices, Compliance |
| Contractor | Active Jobs, Task Board, Invoices, Materials, Time Tracking |
| Salon / Service Biz | Bookings, Revenue, Client Pipeline, Reviews, Messages |
| Nonprofit | Grants/Funding, Compliance, Community, Volunteer Tracking |
| CPA / Bookkeeper | Client List, Document Requests, Tax Deadlines, Time Tracking |

---

## Phase 7 — Professional Directory & Marketplace

**Goal:** Network members can be discovered, hired, and paid through the platform.

**Timeline:** After profiles and workspaces exist.

### 7.1 Enhanced Directory

> Build on existing `network.html` + `professional-marketplace.html`.

- **Search by:** location, specialty, rating, availability, verified status, price range
- **Filter categories:** 20+ professional types (contractors, attorneys, CPAs, agents, designers, etc.)
- **Profile completeness score** — incentivize full profiles with better search ranking
- **"Hire / Request Quote" button** on every profile
- **Instant availability indicator** — "Available Now" / "Booked Until April 15"

### 7.2 Request Quote Flow

1. Client clicks "Request Quote" on a professional's profile
2. Short form: describe the job, budget range, timeline, attach files
3. Request goes to the professional's inbox (and email notification)
4. Professional responds with a quote/proposal (using the built-in Estimates tool)
5. Client accepts → auto-creates a team workspace for the project
6. All tracked in CRM on both sides

### 7.3 Service Categories

| Category | Subcategories |
|----------|--------------|
| **Legal** | Real Estate Attorney, Eviction Specialist, Business Formation, Contract Review |
| **Financial** | CPA, Bookkeeper, Tax Preparer, Financial Advisor, Business Loan Broker |
| **Insurance** | Property Insurance, Liability, Workers Comp, Health, Renters |
| **Construction** | General Contractor, Plumber, Electrician, HVAC, Roofer, Painter |
| **Real Estate** | Buyer's Agent, Listing Agent, Commercial Broker, Property Manager |
| **Marketing** | Digital Marketing, Social Media, Graphic Design, Web Development, SEO |
| **IT / Tech** | IT Support, Web Hosting, Software Development, Cybersecurity |
| **Consulting** | Business Coach, HR Consultant, Operations, Compliance |

---

## Phase 8 — Referral Network & Reputation

**Goal:** Professionals refer clients to trusted partners on the platform. Track referrals, build reputation, earn commissions.

**Timeline:** After directory and workspaces are mature.

### 8.1 Referral System

> Build on existing `referral-dashboard.html`.

| Feature | How It Works |
|---------|-------------|
| **Quick Refer** | "Refer a Client" button on any connection's profile. Fill in client name, need, and notes. |
| **Referral Tracking** | Both parties see the referral status: Sent → Contacted → In Progress → Closed / Lost |
| **Referral Commissions** | Optional — set a referral fee agreement between partners (e.g., 10% of first invoice) |
| **Referral Leaderboard** | Top referrers by month, visible on `network.html` — builds reputation |
| **Preferred Partners** | Mark specific connections as "Preferred" — they show first when you refer |

### 8.2 Reputation Scoring

Each professional's reputation score is calculated from:

| Factor | Weight | Source |
|--------|--------|--------|
| Star ratings from reviews | 30% | `reviews.html` |
| Referral volume (received) | 20% | Referral dashboard |
| Response time to messages/quotes | 15% | Messaging data |
| Deal completion rate | 15% | Workspace project outcomes |
| Profile completeness | 10% | Profile fields filled |
| Verified credentials | 10% | `compliance.html` verified badges |

- Score displayed on profile as a "Trust Score" (out of 100)
- Professionals with 80+ score get a "Trusted Pro" badge
- Score visible in search results — helps clients choose

### 8.3 Referral Agreements

- Two professionals can create a **Referral Agreement** (like a mini-contract):
  - "I refer you loan clients, you pay me $500 per closed loan"
  - Or: "We refer each other at no fee — just mutual support"
- Agreement stored in platform, visible to both parties
- When a referral closes, system prompts for commission settlement
- Future: auto-pay via Stripe

---

## Phase Summary & Priority Matrix

| Phase | Name | Builds On | Effort | Impact |
|-------|------|-----------|--------|--------|
| **1** | Team Assembly & Project Connections | `network.html`, `community.html`, `workspace.js` | Medium | 🔥 High |
| **2** | Collaboration Workspaces | Phase 1 teams + `workspace.js` | Large | 🔥 High |
| **3** | Document Sharing Hub | `documents.html` + Phase 2 workspaces | Medium | 🔥 High |
| **4** | Built-in Business Tools | Existing tools + new builds | Large (iterative) | High |
| **5** | Optional Integrations | Phase 4 tools + OAuth backend | Medium | Medium |
| **6** | Configurable Dashboards | All portals + Phase 4 tools | Medium | Medium |
| **7** | Professional Directory & Marketplace | `network.html` + `professional-marketplace.html` | Medium | High |
| **8** | Referral Network & Reputation | `referral-dashboard.html` + Phase 7 | Medium | High |

---

## Technical Dependencies

Some phases require backend infrastructure that's on the main tech roadmap:

| Dependency | Needed For | Status |
|------------|-----------|--------|
| **Supabase Auth** | Real user accounts (not localStorage) | Planned — see TECHNICAL_BRIEF.md |
| **Supabase Database** | Persistent data for teams, workspaces, shared docs | Planned |
| **Supabase Storage** | File uploads for Document Vault | Planned |
| **Stripe** | Invoice payments, referral commission payouts, subscription billing | Planned |
| **OAuth Provider** | Third-party integrations (QuickBooks, Google, etc.) | Phase 5 |
| **Real-time (Supabase Realtime)** | Live workspace updates, chat, notifications | Phase 2 |
| **Email Service (SendGrid/Resend)** | Notifications, document request emails, referral alerts | Phase 3 |

---

## Existing Groundwork Reference

The following spec doc contains detailed implementation specs for the networking foundation (professional profiles, connection system, activity feed, messaging, reviews, RFP board):

> **[DevinPrompt-Commercial-and-Network.md](./DevinPrompt-Commercial-and-Network.md)** — Part B covers the professional network specs in detail.

This roadmap expands significantly beyond that spec by adding:

- ✅ Project-based teams (not just social connections)
- ✅ Shared collaboration workspaces per deal/project
- ✅ Cross-account document sharing with client upload portals
- ✅ Full built-in business tool suite replacing paid SaaS
- ✅ Optional integrations marketplace
- ✅ Configurable dashboards per business type
- ✅ Reputation scoring and referral agreements
- ✅ Quote/proposal flow connecting directory to workspaces

---

## Success Metrics

How we'll know this is working:

| Metric | Target | Measured By |
|--------|--------|-------------|
| Professionals with complete profiles | 500 in first 6 months | Profile completeness > 80% |
| Active teams (2+ members) | 200 in first 6 months | Teams with activity in last 30 days |
| Documents shared cross-account | 1,000/month by month 6 | Sharing events logged |
| Built-in tool adoption | 60% of subscribers use 3+ tools | Tool usage analytics |
| Quote requests via directory | 100/month by month 6 | Request Quote submissions |
| Referrals tracked on platform | 50/month by month 6 | Referral dashboard data |
| Net Promoter Score | 50+ | Post-onboarding survey |

---

*Last updated: March 24, 2026*
*Companion doc: [ROADMAP.md](./ROADMAP.md) (revenue & monetization)*
*Technical specs: [DevinPrompt-Commercial-and-Network.md](./DevinPrompt-Commercial-and-Network.md)*
