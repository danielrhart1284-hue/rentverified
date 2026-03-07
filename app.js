// RentVerified – Shared Application JavaScript
// AI Chat Widget + Utilities

// ── AI RESPONSES (demo mode – replace with real Claude API calls) ──
const aiResponses = {
  "available": "Yes! 123 Maple Street Unit 2A is currently available for move-in on March 15, 2026. Would you like me to send you a rental application?",
  "application": "I'd be happy to send you a rental application! Just click the 'Request Rental Application' button on the listing page, or share your name and email here and I'll have it sent to you right away.",
  "pet": "Pets are considered on a case-by-case basis at Sanders Property Management. Please mention any pets in your application and management will review. A pet deposit may apply.",
  "deposit": "The security deposit for this unit is $1,200 — equal to one month's rent. This is due along with your first month's rent at signing.",
  "utilities": "Water and trash pickup are included in the monthly rent. You'll be responsible for electricity, gas, and internet. The unit is wired for high-speed internet.",
  "rent": "Rent is $1,200/month. The great news is there are zero processing fees — you pay via Cash App or Zelle directly to Sanders Property Management. No hidden fees.",
  "parking": "Yes, one off-street parking spot is included with this unit at no additional charge.",
  "scam": "Great question — this is a legitimate, verified listing. You can confirm by scanning the QR code on the listing page or entering the listing ID (RV-2026-0001) at rentverified.com/verify. Sanders Property Management will never ask you to wire money or pay via gift cards.",
  "contact": "You can reach Sanders Property Management by replying here, or through email. I'll make sure your message gets to them. Alternatively, click 'Request Application' to start the process.",
  "washer": "Yes! Unit 2A has in-unit washer/dryer hookups. You'd bring your own appliances or the landlord can discuss appliance options.",
  "laundry": "There are in-unit washer/dryer hookups in Unit 2A. You'd need to bring or purchase your own washer and dryer.",
  "income": "Generally, landlords look for a monthly income of at least 3x the monthly rent ($3,600/mo for this unit). Employment verification and references will be requested on the application.",
  "lease": "This property offers a standard 12-month lease. Move-in is available March 15, 2026.",
  "hello": "Hi there! 👋 I'm the AI assistant for Sanders Property Management. I can answer questions about available rentals, help you start an application, or verify this listing is real. What can I help you with today?",
  "hi": "Hi! 👋 Happy to help you find your next home. What would you like to know about our properties?",
  "zillow": "We're listed on both Zillow and right here on RentVerified. RentVerified gives you the added benefit of AI support, a secure application portal, and the ability to verify the listing isn't a scam. You're in the right place!",
  "facebook": "We advertise on Facebook, but you should always verify Facebook listings here at RentVerified before sending any money. Scammers sometimes copy real listings — our QR codes and listing IDs let you confirm you're talking to the real Sanders Property Management.",
  "cashapp": "Rent is paid via Cash App to $SandersRentals, or via Zelle. Once you've sent payment, you upload a screenshot in your tenant portal and management confirms it. Zero processing fees!",
  "zelle": "Yes, Zelle is accepted! Send to (555) 000-0000 or payments@sanderspm.com. After sending, upload your confirmation screenshot in your tenant portal.",
  "apply": "To apply, click the 'Request Rental Application' button on any listing page. Fill out your contact info and the application will be emailed to you immediately. It takes about 15 minutes to complete.",
};

function getAIResponse(message) {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(aiResponses)) {
    if (lower.includes(key)) return response;
  }
  // Default fallback
  return "That's a great question! For the most accurate answer, I'll make sure Sanders Property Management gets back to you. In the meantime, I can answer questions about availability, applications, lease terms, pet policies, utilities, and rent payment. What else can I help with?";
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

  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = text;
  messages.appendChild(userMsg);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Show typing indicator
  const typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = '<span style="opacity:0.6;">AI is typing...</span>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  // Respond after a short delay (simulating AI thinking)
  setTimeout(() => {
    autoReply(text);
  }, 700 + Math.random() * 600);
}

function autoReply(userText) {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;

  // Remove typing indicator
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
  const knownIds = ['RV-2026-0001', 'RV-2026-0002', 'RV-2026-0003'];
  if (!id) return null;
  return knownIds.includes(id.toUpperCase().trim());
}

// ── SEARCH ──
function searchListings(query, price, beds) {
  // In production this would call a real API
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
  // Wire up verify inputs
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
