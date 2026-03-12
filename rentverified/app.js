// RentVerified - Shared Application JavaScript
// AI Chat Widget + localStorage Data Layer + Cloudinary Upload + Broadcast + Utilities
// Version 2.0 - Full Platform Build

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
