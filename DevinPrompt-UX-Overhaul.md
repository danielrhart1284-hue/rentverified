# Devin Prompt — RentVerified UX Overhaul + Platform Syndication

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)
Key files: `rentverified/listings.html`, `rentverified/property-detail.html`, `rentverified/landlord-signup.html`, `rentverified/index.html`, `rentverified/app.js`

---

## ⚠️ CRITICAL BUG — Fix This First (Tasks 1 & 2)

### Task 1 — listings.html must show REAL listings from localStorage

Right now `listings.html` shows 6 hardcoded fake property cards. Landlords add real listings in `landlord-signup.html` which saves them to localStorage under keys like `rv_listings_<clientId>`. The public listings page never shows those real listings. This is broken.

**Fix:** Replace the hardcoded listing cards in the `.listing-grid` div with a JavaScript function `renderPublicListings()` that:

1. Reads ALL `rv_listings_*` keys from localStorage
2. Collects every listing where `status !== 'rented'` (show available + coming_soon)
3. For each listing, renders a property card with:
   - First Cloudinary photo as `<img>` (or a colored gradient placeholder if no photo)
   - Price, address, beds, baths, sqft, status badge, verified badge
   - "View Details" button linking to `property-detail.html?id=<listingId>`
   - "Ask AI" button that opens the chat widget
4. If no listings exist in localStorage, show a friendly empty state:
   ```
   "No listings available right now. Check back soon or contact Sanders Property Management."
   ```
5. Wire the search bar and filter panel checkboxes to actually filter the rendered cards by price range, beds, and availability
6. Wire the sort dropdown to sort by price or newest (use `dateAdded` field or array order)

Keep the existing hardcoded cards as fallback only if localStorage has zero listings total.

---

### Task 2 — property-detail.html must load from URL ?id= parameter

Right now `property-detail.html` shows one hardcoded property. Every "View Details" button on the listings page links to it with no data.

**Fix:**

1. On page load, read `const id = new URLSearchParams(window.location.search).get('id')`
2. Search all `rv_listings_*` localStorage keys for a listing where `listingId === id`
3. If found, populate the page dynamically:
   - Page title, address heading, price, beds/baths/sqft
   - Photo gallery (Cloudinary URLs as `<img>` tags, or placeholder if none)
   - Description text
   - Status badge
   - Listing ID in the verify widget
   - Set `window.PROPERTY_DATA` with the real listing data so the AI chat knows which property it's on
4. If not found (bad ID or direct navigation): show the existing hardcoded Sanders PM property as fallback
5. The "Request Rental Application" button should link to the application page and pass `?id=<listingId>`

---

## Task 3 — Landlord Onboarding Wizard (NEW USERS)

When a landlord signs up or logs in for the first time (detect via `rv_onboarding_done` localStorage key being absent), show a 3-step onboarding overlay BEFORE showing the dashboard:

**Step 1 — "Add Your First Property"**
- Simple form: address, rent, beds, baths
- Big friendly heading: "Let's get your first listing live in under 5 minutes"
- Progress bar showing Step 1 of 3

**Step 2 — "Add Photos"**
- Drag-and-drop photo upload (reuse existing Cloudinary upload logic)
- "Skip for now" option
- Progress bar showing Step 2 of 3

**Step 3 — "You're Live! Share Your Listing"**
- Show the generated listing card preview
- Show 3 big buttons: "Post to Facebook", "Download Share Card", "Copy Link"
- Confetti animation (use canvas-confetti from CDN: `https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js`)
- "Go to Dashboard" button sets `rv_onboarding_done = true` and closes the wizard

---

## Task 4 — Listing Completeness Score

In the landlord dashboard property cards, add a small progress bar under each listing showing how complete it is:

Score out of 100:
- Address filled = 20pts
- Rent filled = 20pts
- At least 1 photo = 25pts
- Description filled (>50 chars) = 20pts
- Listing ID assigned = 15pts

Display as: a thin colored bar (green if ≥80, yellow if 50–79, red if <50) with a label like "85% complete — add a description to finish"

Clicking the bar opens the listing editor for that property.

---

## Task 5 — QR Code Generator

Add a **"Download QR Code"** button to each listing in the landlord dashboard (next to the existing edit/broadcast buttons).

When clicked:
1. Determine the property's public URL: `https://rentverified-git-devin-17735-4fa274-sanders-property-management.vercel.app/property-detail.html?id=<listingId>`
2. Use the QRCode.js library (already added to `<head>`: `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`) to generate a 300x300 QR code
3. Render it in a small modal with:
   - The QR code image
   - The property address as a label below
   - "Download PNG" button that saves `qr-<listingId>.png`
   - "Download with Logo" button that draws the QR on a canvas with the RentVerified logo watermark and address text, then downloads as PNG
4. The PNG should be print-ready at 300dpi — suitable for yard signs and flyers

---

## Task 6 — Instagram / Share Card Generator

Add a **"📸 Share Card"** button to the broadcast modal (opened by clicking "Post Listing" on a property).

When clicked:
1. Create a 1080x1080 canvas (Instagram square)
2. If the listing has a Cloudinary photo: draw it as background, add a dark gradient overlay (bottom 40%)
3. If no photo: use a solid gradient background (`#1a56db` to `#1e3a8a`)
4. Draw white text:
   - Property address (large, top area or over photo)
   - `$X,XXX/mo  ·  X bed / X bath` (medium)
   - Description first sentence (small, italic)
   - "Verified on RentVerified ✓" badge (bottom left)
   - Listing ID (bottom right, small)
5. Export as PNG download: `share-card-<listingId>.png`
6. Also show a preview in the modal before downloading

---

## Task 7 — Facebook Page Post (Graph API)

Add a "Connect Facebook Page" button to the landlord dashboard settings tab.

When clicked:
1. Launch Facebook OAuth popup: `https://www.facebook.com/dialog/oauth?client_id=<FB_APP_ID>&redirect_uri=<REDIRECT>&scope=pages_manage_posts,pages_read_engagement`
2. After auth, store the Page Access Token in localStorage as `rv_fb_page_token` and the Page ID as `rv_fb_page_id`
3. Show "✓ Facebook Connected — [Page Name]" in the settings tab

Then in the broadcast modal, add a **"Post to Facebook Page"** button that:
1. Calls the Graph API: `POST /v19.0/<page_id>/feed` with:
   - `message`: the full listing copy text (address, price, beds/baths, description, RentVerified URL)
   - `link`: the property detail URL
2. If the listing has photos, first upload them via `POST /<page_id>/photos?published=false` and attach the photo IDs to the feed post
3. On success: show "✅ Posted to Facebook!" confirmation
4. On failure: show the error and suggest re-connecting

**Facebook App ID:** Store as `window.RV_FB_APP_ID` at the top of the page — Devin should leave it as `'YOUR_FB_APP_ID'` placeholder for Daniel to fill in from Meta Developer Console.

---

## Affiliate Revenue Integration Reference

When building any feature that touches tenant move-in or applications, add referral CTAs for these partners:

| Layer | Partner | Commission | Trigger |
|-------|---------|------------|---------|
| Verification | TransUnion SmartMove | $12/applicant + fee spread | After application submit |
| Verification | NOLO / Rocket Lawyer | $20/landlord | Lease creation step |
| Fintech | LeaseLock / Obligo | $25/bond | Move-in approval step |
| Fintech | Rent guarantee insurer | $150–200/policy | Lease signing |
| Fintech | Boom (credit builder) | $1–2/mo recurring | Tenant portal activation |
| Fintech | Lemonade (renters insurance) | $2–5/mo recurring | Move-in confirmation |
| Lifestyle | AT&T / Xfinity | $50–150/install | Move-in checklist |
| Lifestyle | Utility concierge | $75/tenant | Move-in checklist |
| Lifestyle | Moving services | $50/referral | Move-in checklist |
| Lifestyle | Amazon Associates | 5–10% on order | Smart home upsell |

Each affiliate CTA should be a non-intrusive card or inline suggestion — never a popup. Example: after a lease is signed, show a "Move-In Checklist" card with one-click links to each service.

---

## Task 8 — Platform CSV Exports (Zillow + Apartments.com)

Add to the broadcast modal:

**"⬇️ Export for Zillow"** — downloads a CSV with columns:
`Street Address, City, State, Zip, Monthly Rent, Security Deposit, Bedrooms, Bathrooms, Square Feet, Available Date, Description, Pets Allowed`

**"⬇️ Export for Apartments.com"** — downloads a CSV with columns:
`Property Name, Address, City, State, Zip Code, Monthly Rent, Security Deposit, Bedrooms, Bathrooms, Square Footage, Unit Description, Available Date`

Both parse the address field with regex to extract street/city/state/zip. Default state = "UT". Trigger download via `Blob` + `URL.createObjectURL` — no libraries needed.

---

## Task 9 — Mobile Responsiveness Pass

Do a full mobile pass on these pages — they need to work well on a phone since landlords will use them in the field:

- `landlord-signup.html` dashboard: sidebar should collapse to a bottom tab bar on mobile (<768px)
- `listings.html`: filter panel should be a collapsible "Filters ▼" button on mobile, not always visible
- `property-detail.html`: photo gallery should be a horizontal swipe strip on mobile
- All modals: ensure they are full-screen on mobile with a clear close button at top

---

## Task 10 — Pricing Page Fix

In `rentverified/index.html`, find the pricing section and update:

**Starter plan:** Change from `$29 /listing` (one-time) → `$29 /month` for up to 2 listings
- Update the subheading to: "Great for 1–2 properties · billed monthly"
- Update the feature list: "Up to 2 verified listings" (was "1 verified listing")

This creates recurring revenue instead of one-time purchases.

---

## Implementation Rules
- All localStorage keys use `rv_` prefix
- Client ID comes from `JSON.parse(localStorage.getItem('rv_current_user') || '{}').id`
- All listings stored as arrays under `rv_listings_<clientId>`
- CSV downloads: vanilla JS `Blob` + `URL.createObjectURL` only — no libraries
- Canvas API only for share card and QR — no external image libraries
- Never break existing functionality — always test that login/logout, listing save, and chat still work after changes
- Copy all changed files to the `rentverified/` subdirectory after every change

## Task 11 — Background Check Payment Flow (Stripe)

This is a core revenue stream. After a tenant submits their application, they must pay for
the background check through RentVerified before the SmartMove screening is initiated.

### Revenue model:
- Tenant pays RentVerified **$45** via Stripe for background check
- RentVerified pays TransUnion at partner wholesale rate (~$25–35)
- RentVerified keeps the spread + earns TransUnion referral commission
- Net profit: ~$15–20 per applicant screened

### Implementation:

**Step 1 — After application form submit**, instead of immediately sending the SmartMove link, show a payment step:

```
"Almost done! One last step — background check fee"

To complete your application for [Property Address], a background
and credit check is required.

Background Check Fee: $45.00
  ✓ Full credit report
  ✓ Criminal background check
  ✓ Eviction history
  ✓ Powered by TransUnion SmartMove

[ Pay $45 & Submit Application ]  ← Stripe Checkout button
```

**Step 2 — Stripe integration:**

Create `api/create-checkout.js` (Vercel serverless function):

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { listingId, applicantEmail, applicantName } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Rental Application Background Check',
          description: `TransUnion SmartMove screening for listing ${listingId}. Includes credit, criminal, and eviction report.`,
        },
        unit_amount: 4500, // $45.00
      },
      quantity: 1,
    }],
    mode: 'payment',
    customer_email: applicantEmail,
    metadata: { listingId, applicantName },
    success_url: `${req.headers.origin}/screening.html?session_id={CHECKOUT_SESSION_ID}&listing=${listingId}`,
    cancel_url: `${req.headers.origin}/property-detail.html?id=${listingId}`,
  });

  res.status(200).json({ url: session.url });
}
```

**Step 3 — After successful payment**, `screening.html` verifies the Stripe session and:
1. Shows "✅ Payment received — your background check has been initiated"
2. Displays the TransUnion SmartMove link for the tenant to complete their portion
3. Sends notification to landlord dashboard that a paid application is ready for review
4. Saves payment record to localStorage `rv_applications` with `paymentStatus: 'paid'`

**Step 4 — Landlord dashboard** shows a green "💳 Paid" badge on applications where payment was received.
Applications without payment show as "⏳ Pending Payment" and the SmartMove link is NOT shared until payment clears.

**Stripe keys:** Use `STRIPE_SECRET_KEY` from Vercel environment variables (Daniel adds this from stripe.com dashboard).
Use Stripe.js CDN on the frontend: `https://js.stripe.com/v3/`

---

## Hugging Face
`HF_API_KEY` is in Devin secrets. `api/hf.js` serverless proxy is already built. Use it for:
- AI listing description generator (already added — keep it)
- Application risk summary when reviewing tenant applications

## Testing Checklist
After all tasks:
1. Sign up as new landlord → onboarding wizard appears
2. Add listing "123 Main St, Provo UT 84601" $1,100/mo 2bd/1ba → appears on listings.html
3. Click "View Details" → property-detail.html shows correct data, AI chat knows the property
4. Click "Download QR Code" → PNG downloads, QR scans to correct property URL
5. Click "📸 Share Card" → 1080x1080 PNG downloads with property data
6. Click "Export for Zillow" → CSV downloads with correct columns
7. Starter plan on pricing page shows $29/month
8. Mobile: test all pages at 375px width
9. Submit test application → payment step appears showing $45 fee
10. After Stripe test payment → screening.html shows SmartMove link
11. Landlord dashboard shows "💳 Paid" badge on completed application
