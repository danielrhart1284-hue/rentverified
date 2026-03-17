# RentVerified — Minimal-Input Build Guide

Use this so you can drive the build with **short prompts** and minimal back-and-forth. The AI (Cursor) works in **this repo only** — it cannot open or click your live Vercel site. Keep this folder as the source of truth and deploy to Vercel from here (e.g. GitHub → Vercel).

---

## How to Get “Minimal Input” Working

1. **One source of truth**  
   Work in `C:\Users\Owner\OneDrive\Documentos\rentverified` (this repo). Whatever you deploy to Vercel should come from this codebase so Cursor and you are always editing the same thing.

2. **Use the rulebook**  
   The file `.cursorrules` in this repo tells Cursor how RentVerified is built (Supabase, LandlordID, no DocuSign, Utah eviction, etc.). New chats in this project will follow those rules.

3. **One clear prompt per task**  
   Instead of long explanations, give one concrete ask per step. Examples are below.

---

## Phased Prompts (Copy-Paste When Ready)

Do these **in order**. Each step assumes the previous one is done.

### Phase 1 — Database (do this first)

When you’re ready to move off localStorage:

- **Prompt:**  
  *“Add Supabase to this project. Create tables: `landlords` (id, name, email, company_name, created_at), `properties` (id, landlord_id, address, rent, beds, baths, sqft, status, listing_id, created_at), `applications` (id, property_id, landlord_id, plus columns for all 9 sections of the rental application — primary applicant, co-applicant, residential history, employment, occupants_pets, financial, background, emergency_contact, authorization — and created_at). Use Supabase JS client; keep existing UI but have the landlord dashboard load/save properties from Supabase instead of localStorage where possible. Don’t break existing behavior.”*

You’ll need a Supabase project and env vars (e.g. `SUPABASE_URL`, `SUPABASE_ANON_KEY`). Create the project at supabase.com first, then add a `.env.example` with those two keys so Cursor can wire them in.

---

### Phase 2 — Online application form

After Supabase (and `applications` table) exists:

- **Prompt:**  
  *“Create an online rental application page that matches our 9-section application (Primary Applicant, Co-Applicant, Residential History, Employment, Occupants & Pets, Financial, Background, Emergency Contact, Authorization). One page or multi-step is fine. On submit: save to the Supabase `applications` table and show a confirmation. Add a link to this application page from the property detail page and from the AI chat so the AI can say ‘Apply here: [link]’.”*

---

### Phase 3 — Calendly on property pages

- **Prompt:**  
  *“Add tour scheduling with Calendly. On each property detail page, add a ‘Schedule a tour’ button or section that embeds or links to a Calendly event type (I’ll add the Calendly URL in config). Update the AI chat so when a tenant asks to schedule a tour it gives them the Calendly link for this property.”*

You’ll create a Calendly event type and paste the link into config or env.

---

### Phase 4 — SmartMove after application

After the online form submits to Supabase:

- **Prompt:**  
  *“When an application is submitted to Supabase, the system should send the tenant an email (or show a screen) with the TransUnion SmartMove invite link. Document what SmartMove partner link or API we need and where to put it; for now use a placeholder link in env so we can replace it with the real one.”*

---

### Phase 5 — E-signing (built-in)

- **Prompt:**  
  *“Add built-in e-signing for leases. Tenant gets a secure link, sees the lease text, checks a consent box, and signs (e.g. canvas or typed name). Store in Supabase: signed PDF or equivalent, signer name, IP, timestamp, user agent. Emit a signed PDF and email it to tenant and landlord. No DocuSign.”*

---

### Phase 6 — Auto-fill lease from application

After e-signing and `applications` data exist:

- **Prompt:**  
  *“When the landlord clicks Approve on an application in the dashboard, auto-fill the Utah Residential Rental Agreement from the application (name, address, rent, deposit, move-in date, etc.). Show a review screen, then send to e-signing. Use our existing e-sign flow.”*

---

### Phase 7 — One-click eviction docs

After applications and leases are in Supabase:

- **Prompt:**  
  *“Add one-click eviction document generation. From a tenant record, generate a 3-Day Notice to Pay Rent or Quit (and optionally Cure or Quit, 15-Day) pre-filled from Supabase (tenant name, address, rent, amounts owed, dates). Output a PDF or printable doc and a packet (application + lease + payment history + notices) for the attorney.”*

---

## What Cursor Can and Can’t Do

| Can do | Can’t do |
|--------|----------|
| Edit all files in this repo | Open or browse the live Vercel URL |
| Add Supabase, Calendly, SmartMove wiring | Log into your Supabase/Gmail/Calendly for you |
| Generate SQL, JS, HTML, CSS | Run your Vercel or local server long-term (you run it) |
| Follow .cursorrules for consistency | Access external APIs without you adding keys/env |

---

## If Something Breaks

- Say: *“Revert the last change to [file or feature]”* or *“Fix the error in [file]: [paste error].”*
- For Supabase: *“Here’s my Supabase schema [paste]. Make our app match it.”*

Keep prompts to one goal at a time for best results.
