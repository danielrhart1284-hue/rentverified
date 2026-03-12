// RentVerified - Shared Application JavaScript
// AI Chat Widget + localStorage Data Layer + Cloudinary Upload + Broadcast + Utilities
// ML-Powered Document Parsing & Scam Detection (Hugging Face Transformers.js)
// Version 3.0 - Full Platform Build + Open-Source ML Models

// ============================================================================
// CONFIGURATION
// ============================================================================
var RV_CONFIG = {
  cloudinaryCloudName: '',
  cloudinaryUploadPreset: 'rentverified_photos',
  calendlyUrl: '',
  smartMoveUrl: 'https://www.mysmartmove.com/',
  websiteUrl: 'https://rentverified.vercel.app',
  companyName: 'Sanders Property Management',
  companyShort: 'Sanders PM',
  supportEmail: 'danielrhart1284@gmail.com',
  cashAppTag: '$SandersRentals',
  zelleContact: 'danielrhart1284@gmail.com',
};

// ============================================================================
// LOCALSTORAGE DATA LAYER
// ============================================================================
var RV_KEYS = {
  LISTINGS: 'rv_listings_',
  ACCOUNT: 'rv_account',
  LEASES: 'rv_leases',
  TENANT_LEASE: 'rv_tenant_lease',
  FEE_POLICY: 'rv_fee_policy',
  CHAT_INBOX: 'rv_chat_inbox',
  BROADCAST: 'rv_broadcast_',
  CLIENTS: 'rv_clients',
  APP_TRACKER: 'rv_app_tracker',
  ASSISTANCE_CASES: 'rv_assistance_cases',
  APPLICATIONS: 'rv_applications',
  EVICTION_DOCS: 'rv_eviction_docs',
  MAINTENANCE_REQUESTS: 'rv_maintenance_requests',
  TENANT_ACCOUNTS: 'rv_tenant_accounts',
};

function rvGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}
function rvSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn('localStorage write failed:', e); }
}
function rvRemove(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

function getListingsForClient(clientId) {
  var key = RV_KEYS.LISTINGS + (clientId || 'sanders-pm');
  var data = rvGet(key);
  if (!data || !Array.isArray(data)) {
    data = [
      { address: '119 E 600 S #119, Orem, UT 84058', beds: 2, baths: 1, sqft: 900, rent: 1200, tenant: 'Jane Doe', status: 'rented', listingId: 'RV-2026-0001', description: '2-bedroom, 1-bathroom condo in Orem. Wood-style flooring and tile. Near UVU & BYU.', photos: [], type: 'Condo' },
      { address: '456 Oak Avenue, Apt 1B', beds: 1, baths: 1, sqft: 620, rent: 950, tenant: 'Robert Lee', status: 'rented', listingId: 'RV-2026-0002', description: 'Cozy 1-bedroom apartment. Updated kitchen, great natural light.', photos: [], type: 'Apartment' },
      { address: '789 Pine Road', beds: 3, baths: 2, sqft: 1400, rent: 1650, tenant: '', status: 'available', listingId: 'RV-2026-0003', description: 'Spacious 3-bedroom house with yard. Family-friendly neighborhood.', photos: [], type: 'House' },
    ];
    rvSet(key, data);
  }
  return data;
}
function saveListingsForClient(clientId, arr) {
  rvSet(RV_KEYS.LISTINGS + (clientId || 'sanders-pm'), arr);
}

function getClients() {
  var data = rvGet(RV_KEYS.CLIENTS);
  if (!data || !Array.isArray(data)) {
    data = [
      { id: 'sanders-pm', name: 'Sanders Property Management', email: 'danielrhart1284@gmail.com', plan: 'pro', role: 'pm', createdAt: '2026-01-15' },
    ];
    rvSet(RV_KEYS.CLIENTS, data);
  }
  return data;
}
function saveClients(arr) { rvSet(RV_KEYS.CLIENTS, arr); }

function getLeases() { return rvGet(RV_KEYS.LEASES) || []; }
function saveLeases(arr) { rvSet(RV_KEYS.LEASES, arr); }

function getTenantLease() { return rvGet(RV_KEYS.TENANT_LEASE); }
function saveTenantLease(obj) { rvSet(RV_KEYS.TENANT_LEASE, obj); }

function getFeePolicy() { return rvGet(RV_KEYS.FEE_POLICY) || {}; }
function saveFeePolicy(obj) { rvSet(RV_KEYS.FEE_POLICY, obj); }

function getChatInbox() { return rvGet(RV_KEYS.CHAT_INBOX) || []; }
function saveChatInbox(arr) { rvSet(RV_KEYS.CHAT_INBOX, arr); }
function addToChatInbox(question, propertyAddress, listingId) {
  var inbox = getChatInbox();
  inbox.push({
    id: 'q-' + Date.now(),
    question: question,
    property: propertyAddress || 'Unknown',
    listingId: listingId || '',
    timestamp: new Date().toISOString(),
    answered: false,
  });
  saveChatInbox(inbox);
}

function getBroadcastStatus(listId) { return rvGet(RV_KEYS.BROADCAST + listId) || {}; }
function saveBroadcastStatus(listId, status) { rvSet(RV_KEYS.BROADCAST + listId, status); }

function getApplications() { return rvGet(RV_KEYS.APP_TRACKER) || []; }
function saveApplications(arr) { rvSet(RV_KEYS.APP_TRACKER, arr); }

function getAssistanceCases() { return rvGet(RV_KEYS.ASSISTANCE_CASES) || []; }
function saveAssistanceCases(arr) { rvSet(RV_KEYS.ASSISTANCE_CASES, arr); }

function getEvictionDocs() { return rvGet(RV_KEYS.EVICTION_DOCS) || []; }
function saveEvictionDocs(arr) { rvSet(RV_KEYS.EVICTION_DOCS, arr); }

function getMaintenanceRequests() { return rvGet(RV_KEYS.MAINTENANCE_REQUESTS) || []; }
function saveMaintenanceRequests(arr) { rvSet(RV_KEYS.MAINTENANCE_REQUESTS, arr); }

// ============================================================================
// AUTHENTICATION
// ============================================================================
var ACCOUNTS = [
  { email: 'danielrhart1284@gmail.com', username: 'danielrhart1284', password: 'SPMdemo2026', name: 'Sanders PM', role: 'admin', clientId: 'sanders-pm' },
  { email: 'admin@rentverified.com', username: 'admin', password: 'RVadmin2026', name: 'Admin', role: 'admin', clientId: 'admin' },
];

function authenticateUser(emailOrUsername, password) {
  var lower = (emailOrUsername || '').toLowerCase().trim();
  return ACCOUNTS.find(function(a) {
    return (a.email.toLowerCase() === lower || a.username.toLowerCase() === lower) && a.password === password;
  }) || null;
}

// ============================================================================
// AI CHAT SYSTEM - Keyword-based with property-aware context
// ============================================================================
window.PROPERTY_DATA = window.PROPERTY_DATA || null;
window.RV_CHAT_API = window.RV_CHAT_API || null;

function buildResponses() {
  var p = window.PROPERTY_DATA || {};
  var addr = p.address || 'this property';
  var rent = p.rent ? '$' + Number(p.rent).toLocaleString() : '$1,200';
  var deposit = p.deposit || rent;
  var beds = p.beds || '2';
  var baths = p.baths || '1';
  var sqft = p.sqft || '';
  var listId = p.listingId || 'RV-2026-0001';
  var petPolicy = p.petPolicy || 'considered on a case-by-case basis';
  var parking = p.parking || 'one off-street parking spot included';
  var utilities = p.utilities || 'Water and trash are included. Tenant pays electricity, gas, and internet.';
  var avail = p.available || 'Now';
  var manager = p.managedBy || RV_CONFIG.companyName;
  var calendly = RV_CONFIG.calendlyUrl;
  var tourMsg = calendly
    ? "I'd love to help you schedule a tour! You can book a 30-minute viewing here: " + calendly
    : "I'd love to help you schedule a tour! Please share your preferred date and time, and we'll get that set up for you.";

  var responses = [
    { keys: ['how do i verify this listing', 'verify this listing'], response: 'Great question! You can verify this listing by entering the listing ID (' + listId + ') on our homepage at ' + RV_CONFIG.websiteUrl + ', or scan the QR code on the listing page. ' + manager + ' will never ask you to wire money or pay via gift cards.' },
    { keys: ['what is the income requirement', 'income requirement', 'how much do i need to make', 'income needed'], response: 'Generally, we look for a monthly income of at least 3x the monthly rent (' + rent + '/mo means roughly $' + (Number(p.rent || 1200) * 3).toLocaleString() + '/mo or $' + (Number(p.rent || 1200) * 36).toLocaleString() + '/year). Employment verification and references are requested on the application.' },
    { keys: ['what utilities are included', 'utilities included', 'who pays utilities', 'what about utilities'], response: utilities },
    { keys: ['is there a processing fee', 'processing fee', 'any fees', 'hidden fees', 'extra fees', 'application fee'], response: 'There are zero processing fees for rent payments! You pay via Cash App (' + RV_CONFIG.cashAppTag + ') or Zelle directly to ' + manager + '. The rental application is also free to submit. The only cost to you is the TransUnion background check (~$40-45), paid directly to TransUnion.' },
    { keys: ['how do i pay rent', 'pay rent', 'rent payment', 'payment method', 'payment options'], response: 'Rent is paid via Cash App (' + RV_CONFIG.cashAppTag + ') or Zelle to ' + RV_CONFIG.zelleContact + '. Zero processing fees! After sending payment, upload a screenshot in your tenant portal and management confirms it.' },
    { keys: ['what is the security deposit', 'security deposit', 'how much is the deposit', 'deposit amount'], response: "The security deposit is " + deposit + " (equal to one month's rent). This is due along with your first month's rent at lease signing." },
    { keys: ['can i schedule a tour', 'schedule a tour', 'schedule a viewing', 'want to see it', 'come see', 'visit the property', 'book a tour', 'tour available', 'can i visit', 'showing'], response: tourMsg },
    { keys: ['how do i apply', 'how to apply', 'rental application', 'start application', 'application process', 'apply for'], response: 'To apply, click the "Request Rental Application" button on the listing page. You will fill out our comprehensive 9-section online application. The application is free! After submission, you will receive a TransUnion SmartMove invite (~$40-45 paid directly to TransUnion).' },
    { keys: ['what is the lease term', 'lease term', 'lease length', 'how long is the lease', 'lease duration', '12 month', 'month to month'], response: 'This property offers a standard 12-month lease. Move-in is available ' + avail + '. Month-to-month arrangements may be available after the initial lease term.' },
    { keys: ['is this a scam', 'is this real', 'is this legitimate', 'scam', 'verify', 'legit'], response: 'This is a 100% legitimate, verified listing managed by ' + manager + ' on RentVerified. You can verify by entering listing ID ' + listId + ' at ' + RV_CONFIG.websiteUrl + ' or scanning the QR code. We will never ask you to wire money, pay via gift cards, or send payment before a signed lease.' },
    { keys: ['are pets allowed', 'pet policy', 'pets ok', 'can i have a pet', 'dog allowed', 'cat allowed', 'pet friendly', 'pets'], response: 'Pets are ' + petPolicy + ' at ' + manager + '. Please mention any pets in your application and management will review. A pet deposit may apply.' },
    { keys: ['is there parking', 'parking available', 'parking included', 'garage', 'carport'], response: 'Yes, ' + parking + ' at no additional charge.' },
    { keys: ['when is it available', 'move in date', 'available date', 'when can i move in', 'move-in', 'availability'], response: addr + ' is available for move-in ' + avail + '. Would you like to schedule a tour or start an application?' },
    { keys: ['what is the rent', 'how much is rent', 'monthly rent', 'rent price', 'cost', 'how much'], response: 'Rent is ' + rent + '/month with zero processing fees. You pay via Cash App or Zelle directly to ' + manager + '.' },
    { keys: ['washer dryer', 'washer and dryer', 'laundry', 'w/d', 'washing machine'], response: p.laundry || 'Please ask about laundry facilities for this specific unit.' },
    { keys: ['tell me about', 'describe', 'property details', 'more info', 'more information', 'about this property'], response: (p.description || 'This is a great rental property.') + ' The monthly rent is ' + rent + ' with zero processing fees.' },
    { keys: ['square footage', 'sq ft', 'how big', 'how large', 'size of'], response: sqft ? 'This property is approximately ' + sqft + ' sq ft with ' + beds + ' bed(s) and ' + baths + ' bath(s).' : 'This property has ' + beds + ' bed(s) and ' + baths + ' bath(s). Contact us for exact square footage.' },
    { keys: ['bedrooms', 'how many beds', 'how many bedrooms'], response: 'This property has ' + beds + ' bedroom(s) and ' + baths + ' bathroom(s).' },
    { keys: ['bathrooms', 'how many baths', 'how many bathrooms'], response: 'This property has ' + baths + ' bathroom(s) and ' + beds + ' bedroom(s).' },
    { keys: ['cash app', 'cashapp'], response: 'Rent is paid via Cash App to ' + RV_CONFIG.cashAppTag + '. Zero processing fees!' },
    { keys: ['zelle'], response: 'Yes, Zelle is accepted! Send to ' + RV_CONFIG.zelleContact + '.' },
    { keys: ['venmo'], response: 'Currently, rent payments are accepted via Cash App (' + RV_CONFIG.cashAppTag + ') and Zelle (' + RV_CONFIG.zelleContact + '). Venmo may be available in the future.' },
    { keys: ['zillow'], response: 'We list on Zillow and right here on RentVerified with AI support, secure applications, and listing verification.' },
    { keys: ['facebook', 'fb marketplace'], response: 'We advertise on Facebook Marketplace. Always verify Facebook listings here at RentVerified before sending money. Our QR codes and listing IDs confirm you are talking to the real ' + manager + '.' },
    { keys: ['craigslist'], response: 'We may list on Craigslist. Always verify any listing by checking the listing ID at ' + RV_CONFIG.websiteUrl + '.' },
    { keys: ['ksl'], response: "Yes, we list on KSL Classifieds. Verify any KSL listing with the listing ID at " + RV_CONFIG.websiteUrl + '.' },
    { keys: ['background check', 'credit check', 'screening', 'smartmove', 'transunion'], response: "After your application is reviewed, you will receive a TransUnion SmartMove invite. You pay ~$40-45 directly to TransUnion. Results are typically available within minutes." },
    { keys: ['lease signing', 'sign lease', 'e-sign', 'electronic signature', 'esign'], response: "Once approved, you will receive a secure link to electronically sign your lease. E-signatures are legally valid under Utah's UETA and federal ESIGN Act." },
    { keys: ['maintenance', 'repair', 'fix something', 'broken', 'maintenance request'], response: 'Submit maintenance requests through the Tenant Portal. Log in, go to Maintenance, describe the issue.' },
    { keys: ['tenant portal', 'my portal', 'log in', 'login', 'my account'], response: 'Access your Tenant Portal at the top of any RentVerified page to view your lease, pay rent, submit maintenance requests, and message your landlord.' },
    { keys: ['contact', 'reach', 'phone', 'email', 'get in touch'], response: 'Reach ' + manager + ' by replying here or via email at ' + RV_CONFIG.supportEmail + '.' },
    { keys: ['neighborhood', 'area', 'nearby', 'location', 'close to'], response: p.neighborhood || 'This property is well-located with convenient access to local amenities.' },
    { keys: ['move out', 'end lease', 'vacate', 'notice to vacate', 'breaking lease'], response: 'Provide written notice as specified in your lease agreement. Contact ' + manager + ' to discuss options.' },
    { keys: ['renew', 'renewal', 'extend lease', 'stay longer'], response: 'Lease renewals are handled through your Tenant Portal. Contact ' + manager + ' to discuss renewal terms.' },
    { keys: ['eviction', 'evict', 'kicked out'], response: 'Eviction is always a last resort. Contact ' + manager + ' immediately if having trouble paying rent.' },
    { keys: ['assistance', 'help paying', 'rental assistance', 'financial help'], response: 'Contact ' + manager + ' and we can help connect you with local rental assistance programs in Utah.' },
    { keys: ['insurance', 'renters insurance'], response: 'Renters insurance is recommended. Typical policies cost $15-30/month.' },
    { keys: ['furnished', 'furniture'], response: p.furnished || 'This property is typically unfurnished. Contact ' + manager + ' for details.' },
    { keys: ['air conditioning', 'a/c', 'heating', 'hvac'], response: p.hvac || 'Contact ' + manager + ' for heating and cooling details.' },
    { keys: ['internet', 'wifi', 'wi-fi'], response: p.internet || 'The unit is wired for high-speed internet. Tenant sets up their own service.' },
    { keys: ['storage', 'closet space'], response: p.storage || 'Contact ' + manager + ' about storage options.' },
    { keys: ['smoking', 'smoke'], response: 'All properties are smoke-free.' },
    { keys: ['roommate', 'sublease', 'sublet'], response: 'All occupants must be on the lease. Subleasing requires written permission from ' + manager + '.' },
    { keys: ['credit score', 'credit requirement'], response: 'Credit history is evaluated via TransUnion SmartMove. No strict minimum score.' },
    { keys: ['garbage', 'trash', 'recycling'], response: p.trash || 'Trash details are in your lease. Contact ' + manager + ' for schedules.' },
    { keys: ['water'], response: p.water || 'Water details vary by property. Check your lease or contact ' + manager + '.' },
    { keys: ['electric', 'electricity', 'power'], response: p.electric || "Electricity is typically the tenant's responsibility." },
    { keys: ['gas', 'natural gas'], response: p.gas || "Natural gas is typically the tenant's responsibility." },
    { keys: ['quiet hours', 'noise', 'loud'], response: 'Quiet hours and noise policies are in your lease agreement.' },
    { keys: ['thank', 'thanks'], response: 'You are welcome! Anything else I can help with? Available 24/7.' },
    { keys: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'], response: 'Hi there! I am the AI assistant for ' + manager + '. I can help with availability, applications, tours, and more. What can I help you with?' },
    { keys: ['bye', 'goodbye', 'see you'], response: 'Goodbye! Come back anytime with questions.' },
    { keys: ['apply', 'application'], response: 'Click the "Request Rental Application" button on the listing page, or share your email and I will send the link.' },
    { keys: ['available', 'vacancy', 'open', 'vacant'], response: addr + ' is currently ' + (p.status === 'available' ? 'available for move-in ' + avail : 'occupied') + '.' },
    { keys: ['rent', 'price'], response: 'Rent is ' + rent + '/month. Zero processing fees via Cash App or Zelle.' },
    { keys: ['deposit'], response: "Security deposit is " + deposit + ", equal to one month's rent." },
    { keys: ['tour', 'view', 'see'], response: tourMsg },
    { keys: ['pet', 'dog', 'cat', 'animal'], response: 'Pets are ' + petPolicy + '. Mention any pets in your application.' },
    { keys: ['parking', 'car'], response: 'Yes, ' + parking + '.' },
  ];

  return responses;
}

function getAIResponse(message) {
  var lower = (message || '').toLowerCase().trim();
  if (!lower) return null;

  var responses = buildResponses();
  var allMatches = [];

  for (var r = 0; r < responses.length; r++) {
    var entry = responses[r];
    for (var k = 0; k < entry.keys.length; k++) {
      if (lower.indexOf(entry.keys[k]) !== -1) {
        allMatches.push({ length: entry.keys[k].length, response: entry.response });
      }
    }
  }

  if (allMatches.length > 0) {
    allMatches.sort(function(a, b) { return b.length - a.length; });
    return allMatches[0].response;
  }

  return null;
}

// ============================================================================
// CHAT WIDGET
// ============================================================================
var chatOpen = false;
var CHAT_FALLBACK_TIMEOUT = 10000;
var TYPING_MIN = 700;
var TYPING_MAX = 1300;

function toggleChat() {
  var win = document.getElementById('chat-window');
  if (!win) return;
  chatOpen = !chatOpen;
  if (chatOpen) {
    win.classList.add('open');
    var input = document.getElementById('chat-input');
    if (input) input.focus();
  } else {
    win.classList.remove('open');
  }
}

function sendChat() {
  var input = document.getElementById('chat-input');
  var messages = document.getElementById('chat-messages');
  if (!input || !messages) return;

  var text = input.value.trim();
  if (!text) return;

  var userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = text;
  messages.appendChild(userMsg);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  var typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span style="opacity:0.6;">AI is typing...</span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  if (window.RV_CHAT_API) {
    var replied = false;
    var apiTimeout = setTimeout(function() {
      if (!replied) {
        replied = true;
        respondWithKeywords(text);
      }
    }, CHAT_FALLBACK_TIMEOUT);

    fetch(window.RV_CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, propertyData: window.PROPERTY_DATA }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      clearTimeout(apiTimeout);
      if (!replied) {
        replied = true;
        autoReply(data.response || getAIResponse(text) || getFallbackResponse(text));
      }
    })
    .catch(function() {
      clearTimeout(apiTimeout);
      if (!replied) {
        replied = true;
        respondWithKeywords(text);
      }
    });
  } else {
    var delay = TYPING_MIN + Math.random() * (TYPING_MAX - TYPING_MIN);
    setTimeout(function() { respondWithKeywords(text); }, delay);
  }
}

function respondWithKeywords(userText) {
  var response = getAIResponse(userText);
  if (response) {
    autoReply(response);
  } else {
    var propData = window.PROPERTY_DATA || {};
    addToChatInbox(userText, propData.address, propData.listingId);
    autoReply(getFallbackResponse(userText));
  }
}

function getFallbackResponse() {
  return "That's a great question! I'll flag this for " + RV_CONFIG.companyName + " to respond to personally. I can help with availability, applications, lease terms, pet policies, utilities, rent payment, tours, and listing verification.";
}

function autoReply(responseText) {
  var messages = document.getElementById('chat-messages');
  if (!messages) return;

  var typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();

  var aiMsg = document.createElement('div');
  aiMsg.className = 'chat-msg ai';
  aiMsg.textContent = responseText;
  messages.appendChild(aiMsg);
  messages.scrollTop = messages.scrollHeight;
}

function handleChatKey(event) {
  if (event.key === 'Enter') sendChat();
}

// ============================================================================
// LISTING VERIFICATION
// ============================================================================
function verifyListing(id) {
  if (!id) return null;
  var cleanId = id.toUpperCase().trim();

  var clients = getClients();
  for (var c = 0; c < clients.length; c++) {
    var listings = getListingsForClient(clients[c].id);
    for (var l = 0; l < listings.length; l++) {
      if ((listings[l].listingId || '').toUpperCase().trim() === cleanId) {
        return { verified: true, listing: listings[l], client: clients[c] };
      }
    }
  }

  var knownIds = ['RV-2026-0001', 'RV-2026-0002', 'RV-2026-0003'];
  if (knownIds.indexOf(cleanId) !== -1) {
    return { verified: true, listing: null, client: { name: RV_CONFIG.companyName } };
  }

  return { verified: false };
}

// ============================================================================
// SEARCH
// ============================================================================
function searchListings(query, maxPrice, minBeds) {
  var allListings = [];
  var clients = getClients();
  for (var c = 0; c < clients.length; c++) {
    var listings = getListingsForClient(clients[c].id);
    for (var l = 0; l < listings.length; l++) {
      var copy = {};
      for (var key in listings[l]) { copy[key] = listings[l][key]; }
      copy.clientName = clients[c].name;
      copy.clientId = clients[c].id;
      allListings.push(copy);
    }
  }

  var results = allListings;
  if (query) {
    var q = query.toLowerCase();
    results = results.filter(function(li) {
      return (li.address || '').toLowerCase().indexOf(q) !== -1 ||
        (li.description || '').toLowerCase().indexOf(q) !== -1 ||
        (li.type || '').toLowerCase().indexOf(q) !== -1;
    });
  }
  if (maxPrice) {
    results = results.filter(function(li) { return (li.rent || 0) <= maxPrice; });
  }
  if (minBeds) {
    results = results.filter(function(li) { return (li.beds || 0) >= minBeds; });
  }

  return results;
}

// ============================================================================
// CLOUDINARY PHOTO UPLOAD
// ============================================================================
function uploadToCloudinary(file) {
  if (!RV_CONFIG.cloudinaryCloudName) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.readAsDataURL(file);
    });
  }

  var formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', RV_CONFIG.cloudinaryUploadPreset);

  return fetch(
    'https://api.cloudinary.com/v1_1/' + RV_CONFIG.cloudinaryCloudName + '/image/upload',
    { method: 'POST', body: formData }
  )
  .then(function(response) {
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  })
  .then(function(data) {
    return data.secure_url;
  });
}

function uploadMultiplePhotos(files, progressCallback) {
  var urls = [];
  var chain = Promise.resolve();
  for (var i = 0; i < files.length; i++) {
    (function(idx) {
      chain = chain.then(function() {
        return uploadToCloudinary(files[idx]).then(function(url) {
          urls.push(url);
          if (progressCallback) progressCallback(idx + 1, files.length);
        });
      });
    })(i);
  }
  return chain.then(function() { return urls; });
}

// ============================================================================
// PHOTO ZIP DOWNLOAD (JSZip from CDN)
// ============================================================================
function downloadPhotosAsZip(photoUrls, filename) {
  if (!photoUrls || photoUrls.length === 0) {
    alert('No photos to download.');
    return Promise.resolve();
  }

  function loadJSZip() {
    if (typeof JSZip !== 'undefined') return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return loadJSZip().then(function() {
    var zip = new JSZip();
    var imgFolder = zip.folder('photos');
    var fetches = [];

    for (var i = 0; i < photoUrls.length; i++) {
      (function(idx) {
        fetches.push(
          fetch(photoUrls[idx])
            .then(function(r) { return r.blob(); })
            .then(function(blob) {
              var ext = photoUrls[idx].indexOf('.png') !== -1 ? '.png' : '.jpg';
              imgFolder.file('photo-' + (idx + 1) + ext, blob);
            })
            .catch(function(e) { console.warn('Failed to fetch photo:', photoUrls[idx], e); })
        );
      })(i);
    }

    return Promise.all(fetches).then(function() {
      return zip.generateAsync({ type: 'blob' });
    }).then(function(content) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = filename || 'listing-photos.zip';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });
}

// ============================================================================
// BROADCAST HELPER
// ============================================================================
var BROADCAST_PLATFORMS = {
  fb: { name: 'Facebook Marketplace', url: 'https://www.facebook.com/marketplace/create/rental/' },
  cl: { name: 'Craigslist SLC', url: 'https://saltlakecity.craigslist.org/search/apa' },
  zl: { name: 'Zillow Rental Manager', url: 'https://www.zillow.com/rental-manager/post-a-listing/' },
  ap: { name: 'Apartments.com', url: 'https://www.apartments.com/add-a-property/' },
  ksl: { name: 'KSL Classifieds', url: 'https://classifieds.ksl.com/listing/post' },
};

function generateListingCopy(listing) {
  var l = listing || {};
  var lines = [
    (l.address || 'Property Address'),
    (l.beds || '?') + ' Bed / ' + (l.baths || '?') + ' Bath' + (l.sqft ? ' / ' + l.sqft + ' sqft' : ''),
    '$' + (l.rent || '???') + '/month',
    '',
    l.description || 'Beautiful rental property available now.',
    '',
    'Listing ID: ' + (l.listingId || 'N/A'),
    'Managed by ' + RV_CONFIG.companyName,
    'Verify this listing at ' + RV_CONFIG.websiteUrl,
    '',
    'Apply free at ' + RV_CONFIG.websiteUrl,
    '$0 processing fees - pay via Cash App or Zelle',
  ];
  return lines.join('\n');
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function() { _fallbackCopy(text); });
  } else {
    _fallbackCopy(text);
  }
}

function _fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function broadcastTo(platformKey, listingId) {
  var platform = BROADCAST_PLATFORMS[platformKey];
  if (!platform) return;
  window.open(platform.url, '_blank');
  if (listingId) {
    var status = getBroadcastStatus(listingId);
    status[platformKey] = { posted: true, timestamp: new Date().toISOString() };
    saveBroadcastStatus(listingId, status);
  }
}

function broadcastAll(listingId) {
  var keys = Object.keys(BROADCAST_PLATFORMS);
  for (var i = 0; i < keys.length; i++) {
    broadcastTo(keys[i], listingId);
  }
}

function openBroadcast(listingIndex, clientId) {
  var cid = clientId || 'sanders-pm';
  var listings = getListingsForClient(cid);
  var listing = listings[listingIndex];
  if (!listing) return;

  var modal = document.getElementById('broadcast-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  var addrEl = document.getElementById('broadcast-address');
  if (addrEl) addrEl.textContent = listing.address;

  var copyEl = document.getElementById('broadcast-copy');
  if (copyEl) copyEl.value = generateListingCopy(listing);

  window._broadcastListingId = listing.listingId;
}

function closeBroadcast() {
  var modal = document.getElementById('broadcast-modal');
  if (modal) modal.style.display = 'none';
}

function copyBroadcastText() {
  var copyEl = document.getElementById('broadcast-copy');
  if (copyEl) {
    copyToClipboard(copyEl.value);
    var confirmEl = document.getElementById('copy-confirm');
    if (confirmEl) {
      confirmEl.style.display = 'block';
      setTimeout(function() { confirmEl.style.display = 'none'; }, 2000);
    }
  }
}

// ============================================================================
// RENTAL APPLICATION (9-section form data)
// ============================================================================
function createApplication(formData) {
  var app = {
    id: 'APP-' + Date.now(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
    listingId: formData.listingId || '',
    propertyAddress: formData.propertyAddress || '',
    primaryApplicant: {
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      dob: formData.dob || '',
      driversLicense: formData.driversLicense || '',
      currentAddress: formData.currentAddress || '',
    },
    coApplicant: formData.coApplicant || null,
    residentialHistory: formData.residentialHistory || [],
    employment: formData.employment || {},
    occupants: formData.occupants || [],
    pets: formData.pets || [],
    financial: {
      monthlyIncome: formData.monthlyIncome || 0,
      otherIncome: formData.otherIncome || 0,
      bankruptcy: formData.bankruptcy || false,
      evictionHistory: formData.evictionHistory || false,
    },
    backgroundDisclosure: formData.backgroundDisclosure || {},
    emergencyContact: formData.emergencyContact || {},
    authorized: formData.authorized || false,
    signature: formData.signature || '',
    signedAt: formData.authorized ? new Date().toISOString() : '',
  };

  var apps = getApplications();
  apps.push(app);
  saveApplications(apps);
  return app;
}

function approveApplication(appId) {
  var apps = getApplications();
  var app = null;
  for (var i = 0; i < apps.length; i++) {
    if (apps[i].id === appId) { app = apps[i]; break; }
  }
  if (app) {
    app.status = 'approved';
    app.approvedAt = new Date().toISOString();
    saveApplications(apps);
  }
  return app;
}

function declineApplication(appId) {
  var apps = getApplications();
  var app = null;
  for (var i = 0; i < apps.length; i++) {
    if (apps[i].id === appId) { app = apps[i]; break; }
  }
  if (app) {
    app.status = 'declined';
    app.declinedAt = new Date().toISOString();
    saveApplications(apps);
  }
  return app;
}

// ============================================================================
// LEASE GENERATION
// ============================================================================
function generateLease(application, leaseDetails) {
  var app = application || {};
  var details = leaseDetails || {};
  var primary = app.primaryApplicant || {};

  var lease = {
    id: 'LEASE-' + Date.now(),
    applicationId: app.id || '',
    status: 'pending_signature',
    createdAt: new Date().toISOString(),
    tenantName: (primary.firstName + ' ' + primary.lastName).trim(),
    coTenantName: app.coApplicant ? ((app.coApplicant.firstName || '') + ' ' + (app.coApplicant.lastName || '')).trim() : '',
    occupants: app.occupants || [],
    landlord: RV_CONFIG.companyName,
    propertyAddress: app.propertyAddress || details.propertyAddress || '',
    county: details.county || 'Utah',
    monthlyRent: details.monthlyRent || 0,
    securityDeposit: details.securityDeposit || 0,
    leaseInitiationFee: details.leaseInitiationFee || 0,
    petDeposit: details.petDeposit || 0,
    proRataRent: details.proRataRent || 0,
    commencementDate: details.commencementDate || '',
    endDate: details.endDate || '',
    tenantSignature: null,
    tenantSignedAt: null,
    landlordSignature: null,
    landlordSignedAt: null,
  };

  var leases = getLeases();
  leases.push(lease);
  saveLeases(leases);
  return lease;
}

function signLease(leaseId, party, signatureData) {
  var leases = getLeases();
  var lease = null;
  for (var i = 0; i < leases.length; i++) {
    if (leases[i].id === leaseId) { lease = leases[i]; break; }
  }
  if (!lease) return null;

  if (party === 'tenant') {
    lease.tenantSignature = signatureData || 'Signed electronically';
    lease.tenantSignedAt = new Date().toISOString();
  } else if (party === 'landlord') {
    lease.landlordSignature = signatureData || 'Signed electronically';
    lease.landlordSignedAt = new Date().toISOString();
  }

  if (lease.tenantSignature && lease.landlordSignature) {
    lease.status = 'signed';
  }

  saveLeases(leases);
  return lease;
}

// ============================================================================
// LEASE EXPIRY WARNINGS
// ============================================================================
function getLeaseExpiryStatus(endDate) {
  if (!endDate) return null;
  var end = new Date(endDate);
  var now = new Date();
  var diffMs = end - now;
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { level: 'expired', days: Math.abs(diffDays), color: '#dc2626', bg: '#fef2f2', border: '#ef4444' };
  if (diffDays <= 30) return { level: 'critical', days: diffDays, color: '#ea580c', bg: '#fff7ed', border: '#f97316' };
  if (diffDays <= 60) return { level: 'warning', days: diffDays, color: '#d97706', bg: '#fffbeb', border: '#f59e0b' };
  return { level: 'ok', days: diffDays, color: '#16a34a', bg: '#f0fdf4', border: '#22c55e' };
}

// ============================================================================
// EVICTION DOCUMENT GENERATION
// ============================================================================
function generateEvictionNotice(type, tenantData, propertyData) {
  var tenant = tenantData || {};
  var property = propertyData || {};
  var now = new Date();
  var dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  var title = '';
  var days = 0;
  var body = '';

  if (type === '3-day-pay') {
    title = 'THREE-DAY NOTICE TO PAY OR QUIT';
    days = 3;
    body = 'You are hereby notified that you are in default of your rental agreement for the premises located at ' +
      (property.address || '_______________') + '. The total amount of rent due and unpaid is $' +
      (property.amountOwed || '___') + '. You are required to pay the full amount within THREE (3) calendar days ' +
      'from the date of service of this notice or vacate and surrender the premises. Failure to comply may result ' +
      'in the commencement of legal proceedings per Utah Code Ann. 78B-6-802.';
  } else if (type === '3-day-cure') {
    title = 'THREE-DAY NOTICE TO CURE OR QUIT';
    days = 3;
    body = 'You are hereby notified that you are in violation of your rental agreement for the premises located at ' +
      (property.address || '_______________') + '. The nature of the violation is: ' +
      (property.violation || '_______________') + '. You are required to cure the violation within THREE (3) calendar days ' +
      'from the date of service of this notice or vacate and surrender the premises.';
  } else if (type === '15-day') {
    title = 'FIFTEEN-DAY NOTICE TO VACATE (Month-to-Month Tenancy)';
    days = 15;
    body = 'You are hereby notified that your month-to-month tenancy for the premises located at ' +
      (property.address || '_______________') + ' is terminated effective FIFTEEN (15) calendar days ' +
      'from the date of service of this notice per Utah Code Ann. 78B-6-802. You are required to vacate ' +
      'and surrender the premises by ' + new Date(now.getTime() + days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '.';
  } else {
    return null;
  }

  var doc = {
    id: 'EVIC-' + Date.now(),
    type: type,
    title: title,
    createdAt: now.toISOString(),
    dateStr: dateStr,
    tenantName: tenant.name || '_______________',
    propertyAddress: property.address || '_______________',
    body: body,
    days: days,
    landlordName: RV_CONFIG.companyName,
  };

  var docs = getEvictionDocs();
  docs.push(doc);
  saveEvictionDocs(docs);
  return doc;
}

function generateAttorneyPacket(tenantName, propertyAddress) {
  var apps = getApplications().filter(function(a) {
    return a.primaryApplicant && (a.primaryApplicant.firstName + ' ' + a.primaryApplicant.lastName).trim().toLowerCase() === (tenantName || '').toLowerCase();
  });
  var leases = getLeases().filter(function(l) {
    return (l.tenantName || '').toLowerCase() === (tenantName || '').toLowerCase();
  });
  var evictions = getEvictionDocs().filter(function(d) {
    return (d.tenantName || '').toLowerCase() === (tenantName || '').toLowerCase();
  });

  return {
    generatedAt: new Date().toISOString(),
    tenantName: tenantName,
    propertyAddress: propertyAddress,
    application: apps[0] || null,
    lease: leases[0] || null,
    evictionNotices: evictions,
    paymentHistory: [],
    communicationLog: getChatInbox().filter(function(q) { return q.property === propertyAddress; }),
  };
}

// ============================================================================
// UTILITIES
// ============================================================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function generateListingId(existingListings) {
  var count = (existingListings || []).length;
  var year = new Date().getFullYear();
  var num = String(1000 + count + 1).slice(-4);
  return 'RV-' + year + '-' + num;
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ============================================================================
// VERIFY TOOL (homepage)
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-verify-btn]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var input = document.querySelector('[data-verify-input]');
      if (!input) return;
      var result = verifyListing(input.value);
      var resultDiv = document.getElementById('verify-result');

      if (result && result.verified) {
        var clientName = (result.client && result.client.name) || RV_CONFIG.companyName;
        if (resultDiv) {
          resultDiv.innerHTML = '<div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:1.25rem;margin-top:1rem;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">&#9989;</span>' +
            '<strong style="color:#166534;font-size:1.1rem;">VERIFIED - This listing is legitimate</strong></div>' +
            '<p style="color:#374151;font-size:0.9rem;">This listing is managed by <strong>' + escapeHtml(clientName) + '</strong> on RentVerified. ' +
            'They will never ask for payment before a signed lease or in-person viewing.</p></div>';
          resultDiv.style.display = 'block';
        } else {
          alert('VERIFIED - This listing is legitimate and managed by ' + clientName + ' on RentVerified.');
        }
      } else if (result && !result.verified) {
        if (resultDiv) {
          resultDiv.innerHTML = '<div style="background:#fef2f2;border:2px solid #ef4444;border-radius:12px;padding:1.25rem;margin-top:1rem;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:0.5rem;">' +
            '<span style="font-size:1.5rem;">&#9888;</span>' +
            '<strong style="color:#991b1b;font-size:1.1rem;">NOT FOUND - Possible scam</strong></div>' +
            '<p style="color:#374151;font-size:0.9rem;">This listing ID was not found in our system. <strong>Do not send any money.</strong> ' +
            'If you saw this listing on Facebook, Craigslist, or another site, it may be a scam.</p></div>';
          resultDiv.style.display = 'block';
        } else {
          alert('NOT FOUND - This listing may be a scam. Do not send any money.');
        }
      } else {
        alert('Please enter a listing ID (e.g. RV-2026-0001)');
      }
    });
  });

  var params = new URLSearchParams(window.location.search);
  if (params.get('ask')) {
    setTimeout(function() {
      toggleChat();
      var input = document.getElementById('chat-input');
      if (input) {
        input.value = decodeURIComponent(params.get('ask'));
        sendChat();
      }
    }, 500);
  }
});

// ============================================================================
// TAB NAVIGATION (reusable)
// ============================================================================
function switchTab(groupId, tabName) {
  var group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('[data-tab-content]').forEach(function(el) {
    el.style.display = el.dataset.tabContent === tabName ? 'block' : 'none';
  });
  group.querySelectorAll('[data-tab-trigger]').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tabTrigger === tabName);
  });
}

// ============================================================================
// DYNAMIC LISTINGS RENDERER
// ============================================================================
function renderListingCards(containerId, clientId, options) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var opts = options || {};
  var listings = clientId ? getListingsForClient(clientId) : searchListings(opts.query, opts.maxPrice, opts.minBeds);
  var gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #0ea5e9, #0284c7)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #6366f1, #4f46e5)',
  ];

  container.innerHTML = listings.map(function(l, i) {
    var isRented = l.status === 'rented' || (l.tenant && l.status !== 'available');
    var statusBadge = isRented ? '<span class="badge badge-rented">Rented</span>' :
      l.status === 'coming_soon' ? '<span class="badge badge-pending">Coming Soon</span>' :
      '<span class="badge badge-available">Available</span>';
    var gradient = gradients[i % gradients.length];
    var photoHtml = (l.photos && l.photos.length > 0)
      ? '<img src="' + escapeHtml(l.photos[0]) + '" alt="' + escapeHtml(l.address) + '" style="width:100%;height:200px;object-fit:cover;border-radius:12px 12px 0 0;">'
      : '<div class="property-img" style="background:' + gradient + ';">&#127968;</div>';

    return '<div class="property-card"' + (isRented ? ' style="opacity:0.75;"' : '') + '>' +
      photoHtml +
      '<div class="property-info">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">' +
          '<div class="property-price"' + (isRented ? ' style="color:var(--gray-500);"' : '') + '>$' + (l.rent || 0).toLocaleString() + '/mo</div>' +
          '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' + statusBadge +
            (!isRented ? '<span class="badge badge-verified" style="font-size:0.7rem;">&#10003; Verified</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="property-address">&#128205; ' + escapeHtml(l.address) + '</div>' +
        '<div class="property-meta">' +
          '<span>&#128716; ' + (l.beds || '?') + ' Bed' + ((l.beds || 0) !== 1 ? 's' : '') + '</span>' +
          '<span>&#128703; ' + (l.baths || '?') + ' Bath' + ((l.baths || 0) !== 1 ? 's' : '') + '</span>' +
          (l.sqft ? '<span>' + l.sqft + ' sqft</span>' : '') +
        '</div>' +
        '<div style="font-size:0.78rem;color:var(--gray-500);margin-top:0.5rem;">' +
          (l.clientName ? escapeHtml(l.clientName) + ' &middot; ' : '') +
          (isRented ? 'Join waitlist' : '&#128154; Cash App / Zelle &middot; $0 fee') +
        '</div>' +
        '<div style="margin-top:0.75rem;display:flex;gap:0.5rem;">' +
          '<a href="property-detail.html?id=' + encodeURIComponent(l.listingId || '') + '" class="btn btn-primary btn-sm" style="flex:1;justify-content:center;">View Details</a>' +
          '<button class="btn btn-outline btn-sm" onclick="toggleChat()">Ask AI</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
}

// ============================================================================
// INITIALIZE DEFAULT DATA
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  getClients();
  getListingsForClient('sanders-pm');

  if (!getTenantLease()) {
    saveTenantLease({
      address: '119 E 600 S #119, Orem, UT 84058',
      rent: 1200,
      start: '2026-01-15',
      end: '2027-01-14',
      tenant: 'Jane Doe',
      landlord: RV_CONFIG.companyName,
      status: 'active',
    });
  }
});


// ============================================================================
// PHASE 2: ACCOUNTING, PORTFOLIO IMPORT, ADVANCED ONBOARDING
// ============================================================================

// ── Rent Ledger System ──────────────────────────────────────────────────────
function getRentLedger(tenantName, propertyAddress) {
  var key = 'rv_rent_ledger';
  var all = JSON.parse(localStorage.getItem(key) || '[]');
  if (tenantName) {
    return all.filter(function(e) {
      return e.tenant === tenantName || e.property === propertyAddress;
    });
  }
  return all;
}

function addLedgerEntry(entry) {
  var key = 'rv_rent_ledger';
  var all = JSON.parse(localStorage.getItem(key) || '[]');
  entry.id = 'LED-' + Date.now();
  entry.createdAt = new Date().toISOString();
  all.push(entry);
  localStorage.setItem(key, JSON.stringify(all));
  return entry;
}

function seedLedgerData() {
  var key = 'rv_rent_ledger';
  if (localStorage.getItem(key)) return;
  var months = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
                '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
                '2026-01','2026-02'];
  var tenants = [
    { name: 'Jane Doe', property: '123 Maple Street, Unit 2A', rent: 1200, pmFee: 96 },
    { name: 'Robert Lee', property: '456 Oak Avenue, Apt 1B', rent: 950, pmFee: 76 },
  ];
  var entries = [];
  tenants.forEach(function(t) {
    months.forEach(function(m, mi) {
      var paidDate = m + '-0' + (1 + Math.floor(Math.random() * 5));
      var paid = mi < months.length - 1;
      entries.push({
        id: 'LED-seed-' + t.name.replace(/\s/g,'') + '-' + m,
        tenant: t.name,
        property: t.property,
        month: m,
        rentDue: t.rent,
        rentPaid: paid ? t.rent : 0,
        pmFee: t.pmFee,
        pmFeePercent: 8,
        paidDate: paid ? paidDate : null,
        status: paid ? 'paid' : 'due',
        method: paid ? ['Cash App','Zelle','ACH'][mi % 3] : null,
        createdAt: new Date().toISOString()
      });
    });
  });
  localStorage.setItem(key, JSON.stringify(entries));
}

// ── Monthly Owner Statement Generator ─────────────────────────────────────
function generateOwnerStatement(ownerName, propertyAddress, month) {
  var ledger = getRentLedger(null, null);
  var monthEntries = ledger.filter(function(e) { return e.month === month && e.property === propertyAddress; });
  var totalPaid = 0, totalFees = 0;
  monthEntries.forEach(function(e) {
    totalPaid += e.rentPaid || 0;
    totalFees += e.pmFee || 0;
  });
  var expenses = JSON.parse(localStorage.getItem('rv_expenses') || '[]');
  var monthExpenses = expenses.filter(function(e) { return e.month === month && e.property === propertyAddress; });
  var totalExpenses = 0;
  monthExpenses.forEach(function(e) { totalExpenses += e.amount || 0; });
  return {
    ownerName: ownerName || 'Property Owner',
    propertyAddress: propertyAddress,
    month: month,
    generatedAt: new Date().toISOString(),
    rentCollected: totalPaid,
    pmFee: totalFees,
    expenses: totalExpenses,
    expenseDetails: monthExpenses,
    netToOwner: totalPaid - totalFees - totalExpenses,
    entries: monthEntries
  };
}

// ── Year-End Tax Summary Generator ────────────────────────────────────────
function generateTaxSummary(ownerName, propertyAddress, year) {
  var ledger = getRentLedger(null, null);
  var yearEntries = ledger.filter(function(e) {
    return e.property === propertyAddress && e.month && e.month.indexOf(year) === 0;
  });
  var totalRent = 0, totalFees = 0;
  var monthlyBreakdown = {};
  yearEntries.forEach(function(e) {
    totalRent += e.rentPaid || 0;
    totalFees += e.pmFee || 0;
    if (!monthlyBreakdown[e.month]) monthlyBreakdown[e.month] = { rent: 0, fees: 0 };
    monthlyBreakdown[e.month].rent += e.rentPaid || 0;
    monthlyBreakdown[e.month].fees += e.pmFee || 0;
  });
  var expenses = JSON.parse(localStorage.getItem('rv_expenses') || '[]');
  var yearExpenses = expenses.filter(function(e) {
    return e.property === propertyAddress && e.month && e.month.indexOf(year) === 0;
  });
  var totalExpenses = 0;
  yearExpenses.forEach(function(e) { totalExpenses += e.amount || 0; });
  return {
    ownerName: ownerName || 'Property Owner',
    propertyAddress: propertyAddress,
    year: year,
    generatedAt: new Date().toISOString(),
    totalRentCollected: totalRent,
    totalPMFees: totalFees,
    totalExpenses: totalExpenses,
    netIncome: totalRent - totalFees - totalExpenses,
    monthlyBreakdown: monthlyBreakdown,
    expenseDetails: yearExpenses
  };
}

// ── Portfolio Importer (CSV/XLSX) ─────────────────────────────────────────
function parseCSV(text) {
  var lines = text.split(/\r?\n/).filter(function(l) { return l.trim(); });
  if (lines.length < 2) return { headers: [], rows: [] };
  var headers = lines[0].split(',').map(function(h) { return h.trim().replace(/^"|"$/g, ''); });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var vals = lines[i].split(',').map(function(v) { return v.trim().replace(/^"|"$/g, ''); });
    var row = {};
    headers.forEach(function(h, j) { row[h] = vals[j] || ''; });
    rows.push(row);
  }
  return { headers: headers, rows: rows };
}

function autoMapColumns(headers) {
  var mapping = { property: null, tenant: null, rent: null, pmFee: null, beds: null, baths: null, sqft: null, status: null };
  var patterns = {
    property: /address|property|unit|location|street/i,
    tenant: /tenant|renter|occupant|resident|name/i,
    rent: /rent|amount|monthly|payment|price/i,
    pmFee: /fee|commission|pm.?fee|management/i,
    beds: /bed|bedroom|br/i,
    baths: /bath|bathroom|ba/i,
    sqft: /sq.?ft|square|size|area/i,
    status: /status|occupied|vacant|available/i
  };
  Object.keys(patterns).forEach(function(field) {
    for (var i = 0; i < headers.length; i++) {
      if (patterns[field].test(headers[i]) && !mapping[field]) {
        mapping[field] = headers[i];
        break;
      }
    }
  });
  return mapping;
}

function importPortfolio(parsedData, columnMapping, clientId) {
  var listings = [];
  parsedData.rows.forEach(function(row) {
    var addr = row[columnMapping.property] || '';
    if (!addr) return;
    var tenant = row[columnMapping.tenant] || '';
    var rent = parseFloat(row[columnMapping.rent]) || 0;
    var pmFee = parseFloat(row[columnMapping.pmFee]) || 0;
    var beds = parseInt(row[columnMapping.beds]) || 0;
    var baths = parseInt(row[columnMapping.baths]) || 0;
    var sqft = parseInt(row[columnMapping.sqft]) || 0;
    var status = row[columnMapping.status] || '';
    var normalizedStatus = /vacant|available|empty/i.test(status) ? 'available' : tenant ? 'rented' : 'available';
    listings.push({
      address: addr, tenant: tenant, rent: rent, pmFee: pmFee,
      pmFeePercent: rent > 0 ? Math.round(pmFee / rent * 100) : 0,
      beds: beds, baths: baths, sqft: sqft,
      status: normalizedStatus,
      listingId: generateListingId(),
      importedAt: new Date().toISOString()
    });
  });
  var cid = clientId || 'sanders-pm';
  var key = cid === 'sanders-pm' ? 'rv_sanders_listings' : 'rv_listings_' + cid;
  var existing = JSON.parse(localStorage.getItem(key) || 'null');
  if (!existing) existing = [];
  var merged = existing.concat(listings);
  localStorage.setItem(key, JSON.stringify(merged));
  listings.forEach(function(l) {
    if (l.tenant && l.rent > 0) {
      addLedgerEntry({
        tenant: l.tenant, property: l.address,
        month: new Date().toISOString().slice(0, 7),
        rentDue: l.rent, rentPaid: 0, pmFee: l.pmFee,
        pmFeePercent: l.pmFeePercent, status: 'due', method: null
      });
    }
  });
  return { imported: listings.length, total: merged.length };
}

// ── Google Maps Places Autocomplete Hook ──────────────────────────────────
function initGooglePlaces(inputId) {
  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    console.log('Google Maps Places API not loaded. Using manual address entry.');
    return null;
  }
  var input = document.getElementById(inputId);
  if (!input) return null;
  var autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'us' }
  });
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (place && place.formatted_address) {
      input.value = place.formatted_address;
      if (window.onPlaceSelected) window.onPlaceSelected(place);
    }
  });
  return autocomplete;
}

// ── Drag & Drop Photo Handler ─────────────────────────────────────────────
function initDragDropZone(zoneId, onFilesSelected) {
  var zone = document.getElementById(zoneId);
  if (!zone) return;
  zone.addEventListener('dragover', function(e) {
    e.preventDefault(); e.stopPropagation();
    zone.style.borderColor = '#1a56db'; zone.style.background = '#eff6ff';
  });
  zone.addEventListener('dragleave', function(e) {
    e.preventDefault(); e.stopPropagation();
    zone.style.borderColor = '#d1d5db'; zone.style.background = '';
  });
  zone.addEventListener('drop', function(e) {
    e.preventDefault(); e.stopPropagation();
    zone.style.borderColor = '#d1d5db'; zone.style.background = '';
    var files = [];
    if (e.dataTransfer.items) {
      for (var i = 0; i < e.dataTransfer.items.length; i++) {
        var item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          var entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry && entry.isDirectory) {
            readDirectory(entry, function(dirFiles) {
              files = files.concat(dirFiles);
              if (onFilesSelected) onFilesSelected(files);
            });
            return;
          } else {
            var file = item.getAsFile();
            if (file && /^image\//.test(file.type)) files.push(file);
          }
        }
      }
    } else {
      for (var j = 0; j < e.dataTransfer.files.length; j++) {
        if (/^image\//.test(e.dataTransfer.files[j].type)) files.push(e.dataTransfer.files[j]);
      }
    }
    if (onFilesSelected) onFilesSelected(files);
  });
}

function readDirectory(dirEntry, callback) {
  var reader = dirEntry.createReader();
  var allFiles = [];
  function readEntries() {
    reader.readEntries(function(entries) {
      if (entries.length === 0) { callback(allFiles); return; }
      var pending = entries.length;
      entries.forEach(function(entry) {
        if (entry.isFile) {
          entry.file(function(file) {
            if (/^image\//.test(file.type)) allFiles.push(file);
            pending--;
            if (pending === 0) readEntries();
          });
        } else {
          pending--;
          if (pending === 0) readEntries();
        }
      });
    });
  }
  readEntries();
}

// ── PDF Generator (uses jsPDF from CDN) ───────────────────────────────────
function loadJsPDF(callback) {
  if (window.jspdf && window.jspdf.jsPDF) { callback(window.jspdf.jsPDF); return; }
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = function() { callback(window.jspdf.jsPDF); };
  s.onerror = function() { alert('Failed to load PDF library. Please check your internet connection.'); };
  document.head.appendChild(s);
}

function generateStatementPDF(statement) {
  loadJsPDF(function(jsPDF) {
    var doc = new jsPDF();
    var y = 20;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('Monthly Owner Statement', 105, y, { align: 'center' }); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Sanders Property Management', 105, y, { align: 'center' }); y += 5;
    doc.text('danielrhart1284@gmail.com', 105, y, { align: 'center' }); y += 10;
    doc.setDrawColor(200); doc.line(15, y, 195, y); y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold'); doc.text('Owner:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(statement.ownerName, 50, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Property:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(statement.propertyAddress, 50, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Period:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(statement.month, 50, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Generated:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(new Date(statement.generatedAt).toLocaleDateString(), 50, y); y += 12;

    doc.setDrawColor(200); doc.line(15, y, 195, y); y += 8;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 15, y); y += 10;

    doc.setFontSize(11);
    var items = [
      ['Rent Collected', '$' + (statement.rentCollected || 0).toFixed(2)],
      ['Management Fee (8%)', '-$' + (statement.pmFee || 0).toFixed(2)],
      ['Maintenance / Expenses', '-$' + (statement.expenses || 0).toFixed(2)],
    ];
    items.forEach(function(item) {
      doc.setFont('helvetica', 'normal');
      doc.text(item[0], 20, y); doc.text(item[1], 180, y, { align: 'right' }); y += 7;
    });
    y += 3; doc.setDrawColor(100); doc.line(15, y, 195, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Net to Owner', 20, y);
    doc.text('$' + (statement.netToOwner || 0).toFixed(2), 180, y, { align: 'right' }); y += 15;

    if (statement.expenseDetails && statement.expenseDetails.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Expense Details', 15, y); y += 8;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      statement.expenseDetails.forEach(function(e) {
        doc.text(e.description || 'Expense', 20, y);
        doc.text('$' + (e.amount || 0).toFixed(2), 180, y, { align: 'right' }); y += 6;
      });
    }
    y += 10; doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Generated by RentVerified — Sanders Property Management', 105, y, { align: 'center' });
    doc.save('Owner_Statement_' + statement.month + '.pdf');
  });
}

function generateTaxPDF(summary) {
  loadJsPDF(function(jsPDF) {
    var doc = new jsPDF();
    var y = 20;
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(summary.year + ' Annual Tax Summary', 105, y, { align: 'center' }); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Sanders Property Management', 105, y, { align: 'center' }); y += 10;
    doc.setDrawColor(200); doc.line(15, y, 195, y); y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold'); doc.text('Owner:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(summary.ownerName, 50, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Property:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(summary.propertyAddress, 50, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Tax Year:', 15, y);
    doc.setFont('helvetica', 'normal'); doc.text(summary.year, 50, y); y += 12;

    doc.setDrawColor(200); doc.line(15, y, 195, y); y += 8;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('Annual Summary', 15, y); y += 10;

    doc.setFontSize(11);
    var items = [
      ['Total Rent Collected', '$' + (summary.totalRentCollected || 0).toFixed(2)],
      ['Total Management Fees', '-$' + (summary.totalPMFees || 0).toFixed(2)],
      ['Total Expenses', '-$' + (summary.totalExpenses || 0).toFixed(2)],
    ];
    items.forEach(function(item) {
      doc.setFont('helvetica', 'normal');
      doc.text(item[0], 20, y); doc.text(item[1], 180, y, { align: 'right' }); y += 7;
    });
    y += 3; doc.setDrawColor(100); doc.line(15, y, 195, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Net Rental Income', 20, y);
    doc.text('$' + (summary.netIncome || 0).toFixed(2), 180, y, { align: 'right' }); y += 15;

    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Monthly Breakdown', 15, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Month', 20, y); doc.text('Rent', 80, y); doc.text('PM Fee', 120, y); doc.text('Net', 160, y); y += 6;
    doc.setFont('helvetica', 'normal');
    var months = Object.keys(summary.monthlyBreakdown || {}).sort();
    months.forEach(function(m) {
      var d = summary.monthlyBreakdown[m];
      doc.text(m, 20, y);
      doc.text('$' + (d.rent || 0).toFixed(2), 80, y);
      doc.text('$' + (d.fees || 0).toFixed(2), 120, y);
      doc.text('$' + ((d.rent || 0) - (d.fees || 0)).toFixed(2), 160, y);
      y += 5;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 10; doc.setFontSize(8); doc.setTextColor(150);
    doc.text('For informational purposes only. Consult a tax professional for official filings.', 105, y, { align: 'center' }); y += 5;
    doc.text('Generated by RentVerified on ' + new Date().toLocaleDateString(), 105, y, { align: 'center' });
    doc.save('Tax_Summary_' + summary.year + '.pdf');
  });
}

// ── Work In Progress Modal (for dead-click buttons) ───────────────────────
function showWIP(feature) {
  var modal = document.getElementById('wip-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wip-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:2rem;';
    modal.innerHTML = '<div style="background:white;border-radius:16px;max-width:400px;width:100%;padding:2rem;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.25);">' +
      '<div style="font-size:2.5rem;margin-bottom:.75rem;">\u{1F6A7}</div>' +
      '<h3 style="font-size:1.1rem;font-weight:800;margin-bottom:.5rem;">Work in Progress</h3>' +
      '<p id="wip-feature" style="color:#6B7280;font-size:.9rem;margin-bottom:1.25rem;"></p>' +
      '<button onclick="document.getElementById(\'wip-modal\').style.display=\'none\'" class="btn btn-primary" style="padding:.6rem 2rem;">Got it</button>' +
      '</div>';
    document.body.appendChild(modal);
  }
  var featureEl = document.getElementById('wip-feature');
  if (featureEl) featureEl.textContent = feature || 'This feature is coming soon!';
  modal.style.display = 'flex';
}

// ============================================================================
// HUGGING FACE TRANSFORMERS.JS — OPEN-SOURCE ML MODELS (Browser-Side)
// Uses zero-shot classification for document parsing & scam detection
// Models run entirely in-browser via ONNX Runtime Web — zero API costs
// ============================================================================

var RV_ML = {
  classifier: null,
  loading: false,
  ready: false,
  error: null,
  pipeline: null,
  env: null,
  MODEL_ID: 'Xenova/nli-deberta-v3-xsmall',
};

// Load Transformers.js dynamically from CDN
function loadTransformersJS() {
  if (RV_ML.pipeline) return Promise.resolve();
  return new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.type = 'module';
    // Use inline module to import and expose Transformers.js globally
    var blob = new Blob([
      'import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";\n' +
      'env.allowLocalModels = false;\n' +
      'env.useBrowserCache = true;\n' +
      'window.__RV_TRANSFORMERS__ = { pipeline: pipeline, env: env };\n' +
      'window.dispatchEvent(new Event("rv-transformers-loaded"));\n'
    ], { type: 'text/javascript' });
    script.src = URL.createObjectURL(blob);
    script.onerror = function() { reject(new Error('Failed to load Transformers.js')); };
    window.addEventListener('rv-transformers-loaded', function() {
      RV_ML.pipeline = window.__RV_TRANSFORMERS__.pipeline;
      RV_ML.env = window.__RV_TRANSFORMERS__.env;
      resolve();
    }, { once: true });
    document.head.appendChild(script);
  });
}

// Initialize the zero-shot classification pipeline
function initMLClassifier(statusCallback) {
  if (RV_ML.ready) return Promise.resolve(RV_ML.classifier);
  if (RV_ML.loading) {
    return new Promise(function(resolve) {
      var check = setInterval(function() {
        if (RV_ML.ready) { clearInterval(check); resolve(RV_ML.classifier); }
        if (RV_ML.error) { clearInterval(check); resolve(null); }
      }, 500);
    });
  }

  RV_ML.loading = true;
  RV_ML.error = null;
  if (statusCallback) statusCallback('loading-lib', 'Loading Transformers.js library...');

  return loadTransformersJS().then(function() {
    if (statusCallback) statusCallback('loading-model', 'Downloading ML model (' + RV_ML.MODEL_ID + ')...');
    return RV_ML.pipeline('zero-shot-classification', RV_ML.MODEL_ID, {
      progress_callback: function(progress) {
        if (statusCallback && progress.status === 'progress') {
          var pct = Math.round((progress.progress || 0));
          statusCallback('downloading', 'Downloading model... ' + pct + '%');
        }
      }
    });
  }).then(function(classifier) {
    RV_ML.classifier = classifier;
    RV_ML.ready = true;
    RV_ML.loading = false;
    if (statusCallback) statusCallback('ready', 'ML model ready');
    return classifier;
  }).catch(function(err) {
    console.warn('ML model failed to load:', err);
    RV_ML.error = err;
    RV_ML.loading = false;
    if (statusCallback) statusCallback('error', 'ML model unavailable — using regex fallback');
    return null;
  });
}

// ── ML-Enhanced Document Parsing (Portfolio Import) ──────────────────────
// Uses zero-shot classification to understand column semantics
var ML_COLUMN_LABELS = {
  property: ['property address', 'street address', 'unit location', 'building address'],
  tenant: ['tenant name', 'renter name', 'occupant name', 'resident'],
  rent: ['monthly rent', 'rent amount', 'rent payment', 'rent price'],
  pmFee: ['management fee', 'PM fee', 'property management commission', 'manager fee'],
  beds: ['number of bedrooms', 'bedroom count'],
  baths: ['number of bathrooms', 'bathroom count'],
  sqft: ['square footage', 'property size', 'area in square feet'],
  status: ['occupancy status', 'vacancy status', 'rental status', 'available or rented'],
};

function mlAutoMapColumns(headers, statusCallback) {
  return initMLClassifier(statusCallback).then(function(classifier) {
    if (!classifier) {
      if (statusCallback) statusCallback('fallback', 'Using regex-based column mapping');
      return autoMapColumns(headers);
    }

    var mapping = { property: null, tenant: null, rent: null, pmFee: null, beds: null, baths: null, sqft: null, status: null };
    var fields = Object.keys(ML_COLUMN_LABELS);
    var allLabels = [];
    var labelToField = {};

    for (var f = 0; f < fields.length; f++) {
      var labels = ML_COLUMN_LABELS[fields[f]];
      for (var lb = 0; lb < labels.length; lb++) {
        allLabels.push(labels[lb]);
        labelToField[labels[lb]] = fields[f];
      }
    }

    if (statusCallback) statusCallback('classifying', 'Analyzing ' + headers.length + ' columns with ML...');

    var chain = Promise.resolve();
    var results = [];

    for (var h = 0; h < headers.length; h++) {
      (function(header) {
        chain = chain.then(function() {
          return classifier(header, allLabels, { multi_label: false }).then(function(result) {
            results.push({ header: header, topLabel: result.labels[0], topScore: result.scores[0] });
          });
        });
      })(headers[h]);
    }

    return chain.then(function() {
      // Sort by confidence descending to assign best matches first
      results.sort(function(a, b) { return b.topScore - a.topScore; });
      var assigned = {};

      for (var r = 0; r < results.length; r++) {
        var res = results[r];
        var field = labelToField[res.topLabel];
        if (field && !mapping[field] && !assigned[res.header] && res.topScore > 0.3) {
          mapping[field] = res.header;
          assigned[res.header] = true;
        }
      }

      // Fall back to regex for any unmapped fields
      var regexMapping = autoMapColumns(headers);
      for (var key in regexMapping) {
        if (!mapping[key] && regexMapping[key]) {
          mapping[key] = regexMapping[key];
        }
      }

      if (statusCallback) statusCallback('done', 'ML column mapping complete');
      return mapping;
    });
  });
}

// ── ML-Powered Scam Detection ────────────────────────────────────────────
// Analyzes listing descriptions for fraud indicators using zero-shot classification

var SCAM_INDICATORS = [
  'requests wire transfer or Western Union payment',
  'asks for payment before viewing the property',
  'requests gift cards as payment',
  'price is suspiciously below market rate',
  'uses urgency pressure tactics like act now or limited time',
  'asks for personal financial information upfront',
  'refuses to meet in person or show the property',
  'listing copied from another source or generic description',
  'no verifiable contact information provided',
  'legitimate rental listing with normal terms',
];

var SCAM_SAFE_LABEL = 'legitimate rental listing with normal terms';

function analyzeListingForFraud(listingText, statusCallback) {
  if (!listingText || listingText.trim().length < 20) {
    return Promise.resolve({
      score: 0, level: 'insufficient', flags: [],
      summary: 'Not enough text to analyze. Please provide a full listing description.'
    });
  }

  return initMLClassifier(statusCallback).then(function(classifier) {
    if (!classifier) {
      // Fallback to keyword-based scam detection
      return keywordScamDetection(listingText);
    }

    if (statusCallback) statusCallback('analyzing', 'Running ML scam analysis...');

    return classifier(listingText, SCAM_INDICATORS, { multi_label: true }).then(function(result) {
      var flags = [];
      var riskScore = 0;

      for (var i = 0; i < result.labels.length; i++) {
        if (result.labels[i] === SCAM_SAFE_LABEL) continue;
        if (result.scores[i] > 0.35) {
          flags.push({
            indicator: result.labels[i],
            confidence: Math.round(result.scores[i] * 100),
          });
          riskScore += result.scores[i] * 15;
        }
      }

      // Find the safe label score
      var safeIdx = result.labels.indexOf(SCAM_SAFE_LABEL);
      var safeScore = safeIdx !== -1 ? result.scores[safeIdx] : 0;

      // Adjust risk: high safe score reduces risk
      riskScore = Math.max(0, riskScore - (safeScore * 20));
      riskScore = Math.min(100, Math.round(riskScore));

      // Also run keyword checks and combine
      var keywordResult = keywordScamDetection(listingText);
      for (var k = 0; k < keywordResult.flags.length; k++) {
        var kFlag = keywordResult.flags[k];
        var isDuplicate = flags.some(function(f) {
          return f.indicator.toLowerCase().indexOf(kFlag.indicator.toLowerCase().split(' ')[0]) !== -1;
        });
        if (!isDuplicate) {
          flags.push(kFlag);
          riskScore = Math.min(100, riskScore + kFlag.confidence * 0.3);
        }
      }

      riskScore = Math.round(Math.min(100, riskScore));

      var level = riskScore < 25 ? 'low' : riskScore < 55 ? 'medium' : 'high';
      var summary = level === 'low'
        ? 'This listing appears legitimate. No significant fraud indicators detected.'
        : level === 'medium'
          ? 'Some potential concerns detected. Review the flagged items below before proceeding.'
          : 'High risk of fraud detected. Multiple scam indicators found. Proceed with extreme caution.';

      if (statusCallback) statusCallback('done', 'Analysis complete');

      return {
        score: riskScore,
        level: level,
        flags: flags.sort(function(a, b) { return b.confidence - a.confidence; }),
        summary: summary,
        mlPowered: true,
        safeScore: Math.round(safeScore * 100),
      };
    });
  }).catch(function(err) {
    console.warn('ML scam analysis failed, falling back to keywords:', err);
    return keywordScamDetection(listingText);
  });
}

// Keyword-based fallback scam detection (no ML required)
function keywordScamDetection(text) {
  var lower = (text || '').toLowerCase();
  var flags = [];

  var patterns = [
    { pattern: /wire\s*transfer|western\s*union|moneygram/i, indicator: 'Mentions wire transfer or money order services', weight: 30 },
    { pattern: /gift\s*card|itunes|google\s*play\s*card|steam\s*card/i, indicator: 'Requests gift card payment', weight: 35 },
    { pattern: /pay\s*(before|without)\s*(seeing|viewing|visit)|deposit\s*before\s*tour/i, indicator: 'Asks for payment before viewing', weight: 30 },
    { pattern: /act\s*now|hurry|limited\s*time|won't\s*last|going\s*fast|urgent/i, indicator: 'Uses urgency pressure tactics', weight: 15 },
    { pattern: /send\s*(your|me)\s*(ssn|social\s*security|bank\s*account|credit\s*card)/i, indicator: 'Requests sensitive financial information', weight: 35 },
    { pattern: /can't\s*show|cannot\s*meet|out\s*of\s*(town|country|state)|overseas/i, indicator: 'Claims inability to meet or show property', weight: 25 },
    { pattern: /too\s*good\s*to\s*be\s*true|unbelievable\s*(price|deal)/i, indicator: 'Language suggesting unrealistic deal', weight: 15 },
    { pattern: /no\s*credit\s*check.*no\s*background|guaranteed\s*approval/i, indicator: 'Promises no screening (unusual for legitimate rentals)', weight: 15 },
    { pattern: /\$(1|2|3|4)\d{2}\s*\/?\s*(mo|month)/i, indicator: 'Price appears significantly below market rate', weight: 20 },
    { pattern: /refundable\s*deposit.*right\s*away|deposit.*immediately/i, indicator: 'Pressures for immediate deposit', weight: 20 },
  ];

  var riskScore = 0;
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].pattern.test(lower)) {
      flags.push({
        indicator: patterns[i].indicator,
        confidence: patterns[i].weight,
      });
      riskScore += patterns[i].weight;
    }
  }

  riskScore = Math.min(100, riskScore);
  var level = riskScore < 25 ? 'low' : riskScore < 55 ? 'medium' : 'high';
  var summary = riskScore === 0
    ? 'No fraud indicators detected by keyword analysis.'
    : level === 'low'
      ? 'Minor concerns detected. This may be legitimate but review flagged items.'
      : level === 'medium'
        ? 'Multiple potential concerns found. Verify the listing carefully before proceeding.'
        : 'High risk! Multiple scam indicators detected. Do not send money or personal information.';

  return {
    score: riskScore,
    level: level,
    flags: flags,
    summary: summary,
    mlPowered: false,
  };
}

// ── ML-Enhanced Accounting: Document Text Extraction ─────────────────────
// Classify extracted text snippets into accounting categories
var ACCOUNTING_CATEGORIES = [
  'rent payment received',
  'maintenance or repair expense',
  'property management fee',
  'insurance payment',
  'property tax payment',
  'utility bill payment',
  'security deposit transaction',
  'late fee or penalty',
  'lease-related income',
  'capital improvement expense',
];

function classifyAccountingEntry(textDescription, statusCallback) {
  return initMLClassifier(statusCallback).then(function(classifier) {
    if (!classifier) {
      return { category: 'unknown', confidence: 0, mlPowered: false };
    }

    return classifier(textDescription, ACCOUNTING_CATEGORIES, { multi_label: false }).then(function(result) {
      return {
        category: result.labels[0],
        confidence: Math.round(result.scores[0] * 100),
        allCategories: result.labels.map(function(label, idx) {
          return { label: label, score: Math.round(result.scores[idx] * 100) };
        }).slice(0, 3),
        mlPowered: true,
      };
    });
  }).catch(function() {
    return { category: 'unknown', confidence: 0, mlPowered: false };
  });
}

// ── Scam Detection UI Integration (homepage verify tool) ─────────────────
function renderScamAnalysis(containerId, result) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var levelColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', insufficient: '#9ca3af' };
  var levelBgs = { low: '#f0fdf4', medium: '#fffbeb', high: '#fef2f2', insufficient: '#f9fafb' };
  var levelIcons = { low: '\u{1F6E1}\uFE0F', medium: '\u26A0\uFE0F', high: '\u{1F6A8}', insufficient: '\u2139\uFE0F' };
  var levelLabels = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk', insufficient: 'Insufficient Data' };

  var color = levelColors[result.level] || '#9ca3af';
  var bg = levelBgs[result.level] || '#f9fafb';
  var icon = levelIcons[result.level] || '';
  var label = levelLabels[result.level] || 'Unknown';

  var html = '<div style="background:' + bg + ';border:2px solid ' + color + ';border-radius:12px;padding:1.25rem;margin-top:1rem;">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">';
  html += '<span style="font-size:1.5rem;">' + icon + '</span>';
  html += '<strong style="color:' + color + ';font-size:1.1rem;">AI Scam Analysis: ' + label + '</strong>';
  if (result.mlPowered) {
    html += '<span style="background:#dbeafe;color:#1d4ed8;font-size:0.65rem;padding:2px 8px;border-radius:999px;font-weight:700;">ML-POWERED</span>';
  }
  html += '</div>';

  // Risk score bar
  if (result.level !== 'insufficient') {
    html += '<div style="margin-bottom:0.75rem;">';
    html += '<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#6b7280;margin-bottom:4px;">';
    html += '<span>Risk Score</span><span>' + result.score + '/100</span></div>';
    html += '<div style="background:#e5e7eb;border-radius:999px;height:8px;overflow:hidden;">';
    html += '<div style="background:' + color + ';height:100%;width:' + result.score + '%;border-radius:999px;transition:width 0.5s;"></div>';
    html += '</div></div>';
  }

  html += '<p style="color:#374151;font-size:0.9rem;margin-bottom:0.5rem;">' + escapeHtml(result.summary) + '</p>';

  // Flags
  if (result.flags && result.flags.length > 0) {
    html += '<div style="margin-top:0.75rem;">';
    html += '<p style="font-weight:700;font-size:0.85rem;color:#374151;margin-bottom:0.5rem;">Detected Indicators:</p>';
    for (var i = 0; i < result.flags.length; i++) {
      var flag = result.flags[i];
      var flagColor = flag.confidence > 50 ? '#ef4444' : flag.confidence > 25 ? '#f59e0b' : '#6b7280';
      html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.85rem;">';
      html += '<span style="color:' + flagColor + ';">\u25CF</span>';
      html += '<span style="color:#374151;">' + escapeHtml(flag.indicator) + '</span>';
      html += '<span style="color:#9ca3af;font-size:0.75rem;">(' + flag.confidence + '% confidence)</span>';
      html += '</div>';
    }
    html += '</div>';
  }

  if (result.safeScore !== undefined && result.safeScore > 0) {
    html += '<p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem;">Legitimacy confidence: ' + result.safeScore + '%</p>';
  }

  html += '</div>';
  container.innerHTML = html;
  container.style.display = 'block';
}

// ── ML Status Badge (for Portfolio Import UI) ────────────────────────────
function renderMLStatusBadge(containerId, status, message) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var colors = {
    'loading-lib': { bg: '#dbeafe', text: '#1d4ed8', icon: '\u23F3' },
    'loading-model': { bg: '#dbeafe', text: '#1d4ed8', icon: '\u{1F9E0}' },
    'downloading': { bg: '#dbeafe', text: '#1d4ed8', icon: '\u2B07\uFE0F' },
    'classifying': { bg: '#fef3c7', text: '#92400e', icon: '\u{1F50D}' },
    'analyzing': { bg: '#fef3c7', text: '#92400e', icon: '\u{1F50D}' },
    'ready': { bg: '#d1fae5', text: '#065f46', icon: '\u2705' },
    'done': { bg: '#d1fae5', text: '#065f46', icon: '\u2705' },
    'fallback': { bg: '#fef3c7', text: '#92400e', icon: '\u26A0\uFE0F' },
    'error': { bg: '#fee2e2', text: '#991b1b', icon: '\u274C' },
  };

  var c = colors[status] || { bg: '#f3f4f6', text: '#374151', icon: '\u2139\uFE0F' };
  container.innerHTML = '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:' + c.bg +
    ';color:' + c.text + ';border-radius:999px;font-size:0.78rem;font-weight:600;">' +
    '<span>' + c.icon + '</span><span>' + escapeHtml(message || status) + '</span></div>';
  container.style.display = 'block';
}

// Check if ML is available (lightweight check)
function isMLAvailable() {
  return RV_ML.ready;
}

function getMLStatus() {
  if (RV_ML.ready) return 'ready';
  if (RV_ML.loading) return 'loading';
  if (RV_ML.error) return 'error';
  return 'idle';
}

// Seed ledger data on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', seedLedgerData);
}
