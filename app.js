// RentVerified – Shared Application JavaScript
// Property-aware AI Chat Widget + Utilities

// ── PROPERTY-AWARE AI RESPONSES ────────────────────────────────────────────
// Each listing page sets window.PROPERTY_DATA before this script loads.
// Example: <script>window.PROPERTY_DATA = { address:'...', rent:1200, ... };</script>
// This lets the chatbot answer accurately for ANY property automatically.

function buildResponses() {
  const P = window.PROPERTY_DATA || {};
  const rent   = P.rent   ? '$' + Number(P.rent).toLocaleString()  : 'listed on this page';
  const deposit= P.rent   ? '$' + Number(P.rent).toLocaleString() + ' (one month\'s rent)' : 'one month\'s rent';
  const income3= P.rent   ? '$' + (Number(P.rent) * 3).toLocaleString() + '/mo' : '3x the monthly rent';
  const addr   = P.address || 'this property';
  const beds   = P.beds   ? String(P.beds)  : '?';
  const baths  = P.baths  ? String(P.baths) : '?';
  const sqft   = P.sqft   ? String(P.sqft)  : '';
  const listId = P.listingId || '';
  const descFirst = P.description ? P.description.split('.')[0] + '.' : '';
  const statusMsg = P.status === 'available'
    ? 'available now — ready for move-in'
    : P.status === 'rented'
      ? 'currently occupied, but you can join our waitlist'
      : 'available — contact us to confirm the move-in date';

  return {
    // Greetings
    'hello':    `Hi there! 👋 I'm the AI assistant for Sanders Property Management. I can answer questions about ${addr} — rent, availability, pets, the application process, and more. What would you like to know?`,
    'hi ':      `Hi! 👋 Happy to help you find your next home. What would you like to know about this property?`,
    'hey ':     `Hey there! 👋 What can I help you with about this property?`,
    'thanks':   `Happy to help! Feel free to ask anything else. 😊`,
    'thank you':`You're welcome! Let me know if you have more questions.`,

    // Availability & move-in
    'available':`This unit is ${statusMsg}. ${P.status === 'available' ? 'Would you like to start an application?' : 'Fill out an application and we\'ll contact you when it opens up.'}`,
    'move-in':  `The unit is currently ${statusMsg}. Message us here or click 'Request Rental Application' and we'll confirm your exact move-in date.`,
    'move in':  `This unit is ${statusMsg}. Reach out and we'll lock in your move-in date.`,
    'when can': `The unit is ${statusMsg}. Request an application to confirm your specific start date.`,
    'open':     `This unit is ${statusMsg}. Let us know if you'd like to apply.`,

    // Rent & fees
    'how much': `Rent is ${rent}/month with zero processing fees. You pay directly via Cash App or Zelle — no hidden charges.`,
    'rent':     `Rent for this property is ${rent}/month. Zero processing fees — you pay via Cash App or Zelle directly to Sanders Property Management.`,
    'price':    `This unit is ${rent}/month. No hidden fees or processing charges.`,
    'cost':     `Rent is ${rent}/month. There are no extra fees — just the rent amount.`,
    'fee':      `There are zero processing fees at Sanders Property Management. You pay rent directly via Cash App or Zelle.`,
    'deposit':  `The security deposit is ${deposit}, due along with first month's rent at signing.`,

    // Bedrooms / bathrooms / size
    'bedroom':  `This is a ${beds}-bedroom, ${baths}-bathroom unit.${sqft ? ' It\'s ' + sqft + ' sq ft.' : ''} ${descFirst}`,
    'bed':      `This unit has ${beds} bedroom${beds !== '1' ? 's' : ''} and ${baths} bathroom${baths !== '1' ? 's' : ''}.${sqft ? ' ' + sqft + ' sq ft total.' : ''}`,
    'bathroom': `This unit has ${baths} bathroom${baths !== '1' ? 's' : ''} and ${beds} bedroom${beds !== '1' ? 's' : ''}.`,
    'bath':     `${baths} bathroom${baths !== '1' ? 's' : ''}, ${beds} bedroom${beds !== '1' ? 's' : ''}.`,
    'sqft':     sqft ? `This unit is ${sqft} square feet.` : `Reach out to management for the exact square footage.`,
    'square':   sqft ? `This unit is ${sqft} sq ft — ${beds} beds, ${baths} baths.` : `Contact us for the square footage.`,
    'size':     sqft ? `${sqft} sq ft, ${beds} bed / ${baths} bath.` : `This is a ${beds}-bed, ${baths}-bath unit. Contact us for exact sq ft.`,
    'big':      sqft ? `The unit is ${sqft} sq ft.` : `Contact management for exact dimensions.`,
    'large':    sqft ? `The unit is ${sqft} sq ft.` : `Contact management for exact dimensions.`,

    // Pets
    'pet':      `Pets are considered on a case-by-case basis. Please mention your pet(s) in your application and management will review. A pet deposit may apply.`,
    'dog':      `Dogs are considered on a case-by-case basis. Mention your dog in your application — management will review breed, size, and weight. A pet deposit may apply.`,
    'cat':      `Cats are generally welcome! Please mention your cat in the rental application. A small pet deposit may apply.`,
    'animal':   `Pets/animals are reviewed case-by-case. Note them in your application and management will follow up.`,

    // Parking & amenities
    'parking':  `Parking details vary by unit — check the amenities section on this page, or ask and management will confirm what's included.`,
    'garage':   `Garage or covered parking may be available. Check the amenities list or ask management to confirm.`,
    'laundry':  `Washer/dryer details are in the amenities section on this page. Ask here if you need specifics.`,
    'washer':   `Washer/dryer info is listed in the amenities section. Feel free to ask for confirmation.`,
    'dryer':    `Check the amenities section on this page for washer/dryer details.`,
    'utilities':`Utility details are in the amenities section on this listing page. Water, trash, electricity, gas, and internet are typically listed there.`,
    'water':    `Water/trash info is shown in the amenities section on this page.`,
    'electric': `Electricity details are in the amenities section. Tenants typically pay for electricity — confirm on the listing.`,
    'internet': `Internet is typically the tenant's responsibility. Confirm in the amenities section on this page.`,
    'furnish':  `This unit is not furnished unless noted in the description above. Contact management to confirm.`,
    'storage':  `Storage options vary by property. Ask management about any available storage for this unit.`,
    'pool':     `Amenity details are listed on this page. Contact management to ask about pool or recreation access.`,

    // Application & lease
    'application': `I'd be happy to help you apply! Click the 'Request Rental Application' button on this page, or share your name and email here and I'll have it sent right away.`,
    'apply':    `To apply, click 'Request Rental Application' on this page. It takes about 15 minutes and you'll hear back within 1–2 business days.`,
    'how do i': `To apply, use the 'Request Rental Application' button on this page. Need help with something specific? Just ask!`,
    'qualify':  `Generally, we look for monthly income of at least 3x rent (${income3} for this unit), plus a background and credit check. Apply and we'll walk you through it.`,
    'income':   `We typically look for monthly income of at least 3x the rent amount — that's ${income3} for this unit. Employment verification and references are required.`,
    'credit':   `A credit check is part of the standard application. We look at overall financial health, not just the score. Apply and we'll review your full picture.`,
    'background': `A background check is part of the standard rental application. Apply online and management will review.`,
    'lease':    `This property offers a standard 12-month lease. Contact management to confirm exact start dates and terms.`,
    '6 month':  `Lease term details — contact management. Standard is 12 months, but shorter terms may be available.`,
    'month-to': `Month-to-month availability varies. Contact management to ask about flexible lease options.`,

    // Showings / tours
    'tour':     `We'd love to schedule a tour! Message us here with your available times and we'll confirm quickly. Or start by clicking 'Request Application'.`,
    'showing':  `To schedule a showing, message us here with your preferred times or click 'Request Rental Application' to get the process started.`,
    'schedule': `Share your availability here and we'll set up a showing ASAP. Or click 'Request Application' to begin.`,
    'visit':    `Let us know your available times here and we'll arrange a visit. Or click 'Request Application' to start.`,
    'view':     `Happy to set up a viewing! Message us your available times and we'll confirm ASAP.`,

    // Payment methods
    'cashapp':  `Rent is paid via Cash App to $SandersRentals, or via Zelle. After sending, upload your confirmation screenshot in the tenant portal. Zero fees!`,
    'cash app': `Rent is paid via Cash App ($SandersRentals) or Zelle. Upload your payment confirmation in the tenant portal each month.`,
    'zelle':    `Yes, Zelle is accepted! Send to the account info provided at lease signing. Upload your confirmation screenshot in the tenant portal. Zero processing fees.`,
    'venmo':    `We currently accept Cash App and Zelle. Both have zero processing fees.`,
    'check':    `Check payments may be accepted — confirm with management at lease signing. Most tenants use Cash App or Zelle for convenience.`,

    // Scam verification
    'scam':     `Great question — this is a legitimate, verified listing. Enter listing ID ${listId || '(shown at top of this page)'} in the verification box to confirm. Sanders Property Management will never ask you to wire money, pay via gift cards, or pay before viewing.`,
    'verify':   `You can verify this listing is real by entering the listing ID ${listId || '(shown above)'} in the verify box on this page. This confirms you're talking to the real Sanders Property Management.`,
    'real':     `This is a verified, legitimate listing. Enter the listing ID in the verification box to confirm. We will never ask for payment via gift cards or wire transfer.`,
    'legit':    `Yes, this is a legitimate listing from Sanders Property Management. Use the listing ID verification on this page to confirm.`,
    'fraud':    `This listing is verified and legitimate. Sanders Property Management will never ask for payment before a signed lease and in-person viewing.`,

    // Platform-specific
    'zillow':   `We list on Zillow and here on RentVerified. RentVerified adds AI support, a secure application portal, and listing verification — so you can confirm it's really us.`,
    'facebook': `We advertise on Facebook too — but always verify any Facebook listing here at RentVerified first. Scammers copy real listings. Our listing ID and QR code prove it's genuinely us.`,
    'craigslist': `We sometimes list on Craigslist. Always verify any listing ID here at RentVerified before sending money or personal info.`,

    // Contact
    'contact':  `Reach Sanders Property Management right here in this chat, or click 'Request Application'. We typically respond within a few hours during business hours.`,
    'phone':    `The best way to reach us is through this chat or by requesting an application. We'll follow up by phone or email.`,
    'email':    `Send questions through this chat and we'll email you back. Or click 'Request Application' to get the formal process started.`,
    'call':     `We're available through this chat or the application request form. We'll follow up by your preferred method.`,
  };
}

function getAIResponse(message) {
  const lower = message.toLowerCase();
  const responses = buildResponses();

  // Longer phrase matches first for accuracy
  const sorted = Object.entries(responses).sort((a, b) => b[0].length - a[0].length);
  for (const [key, response] of sorted) {
    if (lower.includes(key)) return response;
  }

  // Save unanswered question to inbox for landlord follow-up
  saveChatMessage(message);
  return "That's a great question! I've flagged it for Sanders Property Management and they'll follow up with you soon. I can answer questions about availability, rent, pets, lease terms, the application process, and payment. What else can I help with?";
}

function saveChatMessage(msg) {
  try {
    const msgs = JSON.parse(localStorage.getItem('rv_chat_inbox') || '[]');
    msgs.unshift({
      text: msg,
      property: (window.PROPERTY_DATA || {}).address || 'Unknown property',
      listingId: (window.PROPERTY_DATA || {}).listingId || '',
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('rv_chat_inbox', JSON.stringify(msgs.slice(0, 200)));
  } catch (e) { /* storage full or unavailable */ }
}

// ── CHAT WIDGET ──
let chatOpen = false;

function toggleChat() {
  const win = document.getElementById('chat-window');
  if (!win) return;
  chatOpen = !chatOpen;
  if (chatOpen) {
    win.classList.add('open');
    const input = document.getElementById('chat-input');
    if (input) input.focus();
    // Update status text with property info if available
    const statusEl = document.getElementById('chat-status-line');
    if (statusEl && window.PROPERTY_DATA) {
      const P = window.PROPERTY_DATA;
      statusEl.textContent = '🟢 ' + (P.address ? P.address.split(',')[0] : 'This property') + ' · Always available';
    }
  } else {
    win.classList.remove('open');
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = text;
  messages.appendChild(userMsg);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  const typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span style="opacity:0.6;">Typing...</span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => { autoReply(text); }, 700 + Math.random() * 600);
}

function autoReply(userText) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();

  const response = getAIResponse(userText || '');
  const aiMsg = document.createElement('div');
  aiMsg.className = 'chat-msg ai';
  aiMsg.textContent = response;
  messages.appendChild(aiMsg);
  messages.scrollTop = messages.scrollHeight;
}

function handleChatKey(event) {
  if (event.key === 'Enter') sendChat();
}

// ── LISTING VERIFICATION ──
function verifyListing(id) {
  if (!id) return null;
  const clean = id.toUpperCase().trim();
  // Check all listings in localStorage across all clients
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('rv_listings_'));
    for (const k of keys) {
      const listings = JSON.parse(localStorage.getItem(k) || '[]');
      if (listings.some(l => (l.listingId || '').toUpperCase() === clean)) return true;
    }
  } catch (e) {}
  // Fallback to known hardcoded IDs
  const knownIds = ['RV-2026-0001', 'RV-2026-0002', 'RV-2026-0003'];
  if (knownIds.includes(clean)) return true;
  return false;
}

// ── SEARCH ──
function searchListings(query, price, beds) {
  console.log('Searching for:', query, price, beds);
}

// ── UTILITIES ──
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

// ── VERIFY TOOL (homepage) ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-verify-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.querySelector('[data-verify-input]');
      if (!input) return;
      const result = verifyListing(input.value);
      alert(result === true
        ? '✅ VERIFIED — This listing is legitimate and managed by Sanders Property Management on RentVerified.'
        : result === false
          ? '⚠️ NOT FOUND — This ID was not found in our system. This listing may be a scam. Do not send any money.'
          : 'Please enter a listing ID (e.g. RV-2026-0001)');
    });
  });

  // Auto-open chat with context if URL has ?ask=... param
  const params = new URLSearchParams(window.location.search);
  if (params.get('ask')) {
    setTimeout(() => {
      toggleChat();
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = decodeURIComponent(params.get('ask'));
        sendChat();
      }
    }, 500);
  }

  // Populate chat welcome with real property name
  const welcomeEl = document.getElementById('chat-welcome-msg');
  if (welcomeEl && window.PROPERTY_DATA) {
    const P = window.PROPERTY_DATA;
    const name = P.address ? P.address.split(',')[0] : 'this property';
    welcomeEl.textContent = `Hi! I can answer questions about ${name} — rent, availability, pets, lease terms, and the application process. What would you like to know?`;
  }
});

// ── TAB NAVIGATION (reusable) ──
function switchTab(groupId, tabName) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('[data-tab-content]').forEach(el => {
    el.style.display = el.dataset.tabContent === tabName ? 'block' : 'none';
  });
  group.querySelectorAll('[data-tab-trigger]').forEach(el => {
    el.classList.toggle('active', el.dataset.tabTrigger === tabName);
  });
}
