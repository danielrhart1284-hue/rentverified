# RentVerified — Backend Setup Guide

## Overview

Your site currently stores everything in browser localStorage. This guide walks you through connecting a real backend so users can create accounts, data syncs across devices, and nothing gets lost.

**What you'll set up:**
1. ✅ Supabase (database + auth + file storage) — FREE tier
2. ✅ Twilio (SMS notifications) — ~$4/mo at 50 tenants
3. 🔜 Stripe (real payments) — 2.9% + $0.30 per transaction

---

## Step 1: Create Supabase Project (10 minutes)

1. Go to **https://supabase.com** → Sign up (use GitHub)
2. Click **"New Project"**
3. Settings:
   - Organization: Create one (e.g., "RentVerified")
   - Project name: `rentverified`
   - Database password: **Save this somewhere safe!**
   - Region: Choose closest to your users (e.g., `us-east-1`)
4. Wait ~2 minutes for project to provision

### Get Your API Keys

1. In your Supabase dashboard → **Settings** → **API**
2. Copy these two values:
   - **Project URL**: `https://xyzcompany.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...` (long string)
3. Open `supabase-config.js` in your project
4. Replace the placeholders:
   ```javascript
   const SUPABASE_URL = 'https://xyzcompany.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
   ```

### Run the Database Schema

1. In Supabase dashboard → **SQL Editor** → **New Query**
2. Open `supabase-schema.sql` from your project
3. Copy the ENTIRE file contents and paste into the SQL editor
4. Click **Run**
5. You should see "Success" — all 22 tables created

### Set Up Storage Buckets

1. In Supabase dashboard → **Storage**
2. Create these buckets:
   - `property-photos` (Public)
   - `documents` (Private)
   - `avatars` (Public)
3. For `property-photos` and `avatars`, click the bucket → **Policies** → **New Policy** → Allow public reads

### Create Your Admin Account

1. In Supabase dashboard → **Authentication** → **Users** → **Add User**
2. Enter your email and a strong password
3. Then in **SQL Editor**, run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', plan = 'enterprise',
       first_name = 'Daniel', last_name = 'Hart',
       company = 'RentVerified'
   WHERE email = 'your-email@example.com';
   ```

---

## Step 2: Add Supabase to Your HTML Pages (5 minutes)

Add these 3 script tags to EVERY HTML file, just before the closing `</body>` tag:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<!-- RentVerified Backend -->
<script src="supabase-config.js"></script>
<script src="data-layer.js"></script>
```

For pages that need SMS features (tenant-portal, landlord-signup), also add:
```html
<script src="twilio-integration.js"></script>
```

**The data layer automatically falls back to localStorage if Supabase isn't configured yet.** So your site continues to work exactly as before — then switches to the real database once you add your keys.

---

## Step 3: Set Up Twilio (15 minutes)

### Create Account
1. Go to **https://www.twilio.com** → Sign up
2. You get $15.50 free trial credit
3. Verify your phone number

### Get a Phone Number
1. In Twilio Console → **Phone Numbers** → **Buy a Number**
2. Search for a local number (e.g., area code 801 for Utah)
3. Make sure it has SMS capability
4. Buy it ($1/month)

### Register for 10DLC (Required for business texting)
1. **Twilio Console** → **Messaging** → **Compliance** → **Bundles**
2. Create a new A2P 10DLC Bundle:
   - Brand name: RentVerified
   - Business type: Company
   - EIN (your business tax ID)
   - Website: your Vercel URL
3. Register a Campaign:
   - Campaign type: **Mixed** (transactional + marketing)
   - Use case: Property management notifications
   - Sample messages: (paste rent reminder + payment confirmation templates)
4. Wait for approval (usually 24-48 hours)

### Connect Twilio to Supabase
1. Install Supabase CLI: `npm install -g supabase`
2. Link to your project: `supabase link --project-ref YOUR_PROJECT_REF`
3. Create the edge function:
   ```bash
   supabase functions new send-sms
   ```
4. Copy the edge function code from `twilio-integration.js` (the commented section) into `supabase/functions/send-sms/index.ts`
5. Set your Twilio secrets:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_PHONE_NUMBER=+18015550199
   ```
6. Deploy: `supabase functions deploy send-sms`

### Set Up Automated Rent Reminders
1. In Supabase Dashboard → **Database** → **Extensions** → Enable `pg_cron` and `pg_net`
2. In SQL Editor, run:
   ```sql
   SELECT cron.schedule(
     'daily-rent-reminders',
     '0 15 * * *',  -- 9 AM MST (3 PM UTC)
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/rent-reminders',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     );
     $$
   );
   ```

---

## Step 4: Configure Authentication

### Email Templates (Optional but Recommended)
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Customize:
   - **Confirm signup**: "Welcome to RentVerified! Click to verify your email."
   - **Reset password**: "Reset your RentVerified password"
   - **Magic link**: "Sign in to RentVerified"

### Auth Settings
1. **Authentication** → **Providers** → **Email**
   - Enable email confirmations: ON
   - Minimum password length: 8
2. **Authentication** → **URL Configuration**
   - Site URL: `https://your-site.vercel.app`
   - Redirect URLs: Add all your page URLs

---

## Step 5: Stripe Integration (When Ready for Real Payments)

This is the final piece. When you're ready to accept real rent payments:

1. Go to **https://stripe.com** → Create account
2. Get your publishable key and secret key
3. Add to your pages:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```
4. Create a Supabase Edge Function for payment processing
5. Set up Stripe Connect for landlord payouts (landlords get paid directly)

I can build the full Stripe integration as a next step.

---

## Cost Summary

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **Supabase** | 50K monthly active users, 500MB database, 1GB storage | $25/mo (Pro) |
| **Twilio** | $15.50 trial credit | ~$4/mo (50 tenants) |
| **Vercel** | 100GB bandwidth, custom domain | $20/mo (Pro) |
| **Stripe** | No monthly fee | 2.9% + $0.30 per transaction |
| **Total at launch** | **$0** | **~$49/mo** after free tiers |

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Database tables, security policies, triggers — run once in SQL Editor |
| `supabase-config.js` | Supabase connection + Auth module + Storage module |
| `data-layer.js` | Drop-in replacement for localStorage — uses Supabase when configured, falls back to localStorage |
| `twilio-integration.js` | SMS templates + Edge Function code for Twilio |
| `SETUP-GUIDE.md` | This file |

---

## What Changes for Users

| Before (localStorage) | After (Supabase) |
|----------------------|-------------------|
| Data only in one browser | Data syncs across all devices |
| Clear cache = data lost | Data safe in cloud database |
| Plain text passwords | Encrypted auth with Supabase |
| No password reset | "Forgot password" email works |
| Everyone sees everything | Row-level security — users only see their data |
| No file uploads | Real document/photo storage |
| Fake payment buttons | Real Stripe payments (when configured) |
| No notifications | SMS + email via Twilio |
