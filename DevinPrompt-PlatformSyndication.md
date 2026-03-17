# Devin Prompt — RentVerified Multi-Platform Listing Syndication

## Repository
GitHub: `danielrhart1284-hue/rentverified`
Deploy folder: `rentverified/` subdirectory (Vercel reads from here)
Main file to edit: `rentverified/landlord-signup.html`

---

## Context
RentVerified is a Utah-focused property management SaaS. Landlords manage listings in a dashboard inside `landlord-signup.html`. Each listing has: address, beds, baths, sqft, rent, deposit, description, photos (Cloudinary URLs), listing ID, status.

The current broadcast system (`openBroadcast()`) already opens platform tabs and copies text to clipboard. We need to UPGRADE this with:
1. Platform-specific formatted exports (CSV, deep links with pre-filled data)
2. A Facebook Marketplace deep link that pre-fills listing data using URL params
3. A formatted image share package for Instagram/TikTok
4. A Zillow-compatible CSV download
5. An Apartments.com-compatible CSV download

---

## Task 1 — Facebook Marketplace Deep Link

Facebook Marketplace supports pre-filled listing data via URL parameters when posting a rental. Build a `broadcastTo('fb')` handler that constructs this URL:

```
https://www.facebook.com/marketplace/create/rental/?
  address=<encoded address>
  &price=<rent>
  &bedrooms=<beds>
  &bathrooms=<baths>
  &description=<encoded description + RentVerified listing ID>
  &source=RentVerified
```

- Open the constructed URL in a new tab
- Also copy the listing description to clipboard simultaneously
- The landlord just pastes the description and clicks post — one-click workflow
- Add a "📘 Facebook (Pre-filled)" label so landlords know it pre-fills

---

## Task 2 — Zillow Rental Manager CSV Export

Zillow Rental Manager accepts CSV uploads at: https://www.zillow.com/rental-manager/

Build a `downloadZillowCSV()` function that exports ALL current landlord listings (from `rv_listings_<clientId>` in localStorage) as a CSV file with Zillow's required columns:

```
Street Address, City, State, Zip, Rent, Deposit, Bedrooms, Bathrooms,
Square Feet, Available Date, Description, Pets Allowed, Parking, Laundry
```

- Parse the address field to extract street/city/state/zip (regex: last comma-separated parts)
- Default state = "UT", default city = parsed from address or "Orem"
- Available Date = today's date if status = "available"
- Pets Allowed = "Negotiable"
- Trigger download of `zillow-listings-<date>.csv`
- Add a "⬇️ Export for Zillow (CSV)" button to the broadcast modal

---

## Task 3 — Apartments.com CSV Export

Apartments.com accepts a property data import at: https://www.apartments.com/rental-manager/

Build a `downloadApartmentsCsv()` function with Apartments.com column format:

```
Property Name, Address, City, State, Zip Code, Monthly Rent,
Security Deposit, Bedrooms, Bathrooms, Square Footage,
Unit Description, Available Date, Contact Email, Contact Phone
```

- Contact Email = logged-in landlord's email from `rv_current_user` localStorage
- Contact Phone = from landlord profile if saved
- Add "⬇️ Export for Apartments.com (CSV)" button to broadcast modal

---

## Task 4 — KSL Classifieds Pre-Filled URL (Utah)

KSL Classifieds (ksl.com) is Utah's #1 classifieds site. Build a deep link:

```
https://classifieds.ksl.com/listing/create?
  category=housing
  &subcategory=rentals
  &title=<beds> bed / <baths> bath - <address>
  &price=<rent>
  &description=<full listing copy>
```

- Open in new tab
- Copy listing text to clipboard simultaneously

---

## Task 5 — Instagram/TikTok Image Card Generator

Landlords want to post on Instagram and TikTok. Build a `generateShareCard()` function that:

1. Creates an HTML5 Canvas element (1080x1080px — Instagram square format)
2. Draws a property card with:
   - Background: gradient from #1a56db to #1e3a8a
   - White text: property address (large), rent/bed/bath (medium)
   - "Verified on RentVerified" badge
   - Listing ID in small text at bottom
   - If photos exist (Cloudinary URLs): draws the first photo as background with dark overlay
3. Exports canvas as PNG download: `listing-card-<listingId>.png`
4. Add "📸 Download Share Card (Instagram/TikTok)" button to broadcast modal

---

## Task 6 — Upgrade Broadcast Modal UI

Replace the current simple broadcast modal with a tabbed version:

**Tab 1: Quick Copy** — existing copy-to-clipboard text (keep as-is)

**Tab 2: Platform Export** — grid of export buttons:
- 📘 Facebook Marketplace (Pre-filled link) → `broadcastTo('fb')`
- 🏡 Zillow CSV Export → `downloadZillowCSV()`
- 🏢 Apartments.com CSV Export → `downloadApartmentsCsv()`
- ⭐ KSL Classifieds (Pre-filled link) → `broadcastTo('ksl')`
- 📸 Instagram/TikTok Card → `generateShareCard()`

**Tab 3: Email Templates** — three pre-written email templates the landlord can copy:
- "New Listing Announcement" (to existing tenant waitlist)
- "Price Reduced" announcement
- "Last Unit Available" urgency email

Each template auto-fills property data. One-click copy button per template.

---

## Task 7 — Pricing Page Update

In `rentverified/index.html`, find the pricing section and update the Starter plan:

**Change from:** $29 /listing (one-time per listing)
**Change to:** $29 /month — up to 2 listings

Update the feature list for Starter to say "Up to 2 verified listings" instead of "1 verified listing".

This creates recurring revenue instead of one-time purchases and creates upgrade pressure.

---

## Implementation Notes

- All localStorage keys use `rv_` prefix (e.g., `rv_listings_<clientId>`, `rv_current_user`)
- Client ID comes from `rv_current_user` parsed from localStorage
- All CSV downloads use vanilla JS `Blob` + `URL.createObjectURL` — no libraries needed
- Canvas API is available natively — no libraries needed for the share card
- Do NOT use any external APIs for the CSV/canvas tasks — purely client-side
- The broadcast modal is opened by `openBroadcast()` — find it and upgrade in place
- Keep the existing `broadcastAll()` function working — just add to it

## Hugging Face Secret
Use the `HF_API_KEY` already saved in Devin secrets. The `api/hf.js` serverless proxy is already built. You can call it from any new feature that needs AI-generated text.

## Testing
After implementation:
1. Create a test listing with address "119 E 600 S, Orem, UT 84058", $1200/mo, 2bd/1ba
2. Open broadcast modal → verify all 3 tabs appear
3. Click "Export for Zillow (CSV)" → verify CSV downloads with correct columns
4. Click "Facebook (Pre-filled)" → verify Facebook URL opens with data in params
5. Click "Download Share Card" → verify 1080x1080 PNG downloads
6. Verify pricing page shows $29/month not $29/listing
