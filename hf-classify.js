// ============================================================================
// RentVerified — Hugging Face AI Integration
// hf-classify.js — Drop-in AI document classifier + utilities
// Version 1.0 | Uses free HF Inference API (no cost)
// ============================================================================
// DROP-IN USAGE:
//   <script src="hf-classify.js"></script>
//   Add data-hf-classify to any <input type="file"> to auto-classify uploads
//   Example: <input type="file" data-hf-classify data-hf-target="#docTypeField">
// ============================================================================

const HF_CONFIG = {
  token: window.HF_TOKEN || '',  // Set via Vercel env var → api/hf-token.js
  models: {
    classify:  'facebook/bart-large-mnli',        // Zero-shot document classification
    caption:   'Salesforce/blip-image-captioning-base', // Photo/maintenance analysis
    ocr:       'microsoft/trocr-base-printed',    // Receipt / payment screenshot OCR
    sentiment: 'distilbert-base-uncased-finetuned-sst-2-english', // Sentiment on reviews
    ner:       'dbmdz/bert-large-cased-finetuned-conll03-english', // Name/address extraction
  },

  // Document label sets for different contexts
  labels: {
    rental: [
      'lease agreement', 'rental application', 'pay stub',
      'bank statement', 'government ID', 'tax return',
      'insurance document', 'eviction notice', 'maintenance request',
      'utility bill', 'move-in checklist', 'other'
    ],
    financial: [
      'invoice', 'receipt', 'bank statement', 'tax document',
      'pay stub', 'contract', 'insurance policy', 'loan document', 'other'
    ],
    maintenance: [
      'plumbing issue', 'electrical issue', 'hvac issue', 'appliance repair',
      'roof damage', 'pest control', 'flooring damage', 'mold or water damage',
      'lock or security issue', 'general maintenance', 'other'
    ],
    business: [
      'contract', 'invoice', 'proposal', 'report', 'permit',
      'license', 'insurance certificate', 'tax document', 'other'
    ]
  }
};

// ============================================================================
// CORE API CALLER
// ============================================================================

const HFAPI = {
  async query(model, payload, retries = 2) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_CONFIG.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        // Model loading — HF free tier cold-starts models
        if (res.status === 503) {
          const data = await res.json();
          const wait = Math.min((data.estimated_time || 20) * 1000, 30000);
          console.log(`HF: Model loading, waiting ${Math.round(wait/1000)}s...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`HF API error ${res.status}: ${err}`);
        }

        return await res.json();
      } catch (e) {
        if (attempt === retries) throw e;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  },

  // Query with binary file (for image models)
  async queryFile(model, file) {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${HF_CONFIG.token}` },
      body: file
    });
    if (res.status === 503) {
      await new Promise(r => setTimeout(r, 20000));
      return this.queryFile(model, file); // one retry
    }
    if (!res.ok) throw new Error(`HF API error ${res.status}`);
    return await res.json();
  }
};

// ============================================================================
// DOCUMENT CLASSIFICATION (Task 2.1)
// Uses: facebook/bart-large-mnli (zero-shot)
// Input: filename + optional text snippet
// Output: { label, confidence, allScores }
// ============================================================================

const HFClassify = {

  /**
   * Classify a document file by name (and optionally content)
   * @param {File} file - The uploaded file
   * @param {string} context - 'rental' | 'financial' | 'maintenance' | 'business'
   * @returns {Promise<{label, confidence, allScores}>}
   */
  async classifyDocument(file, context = 'rental') {
    const labels = HF_CONFIG.labels[context] || HF_CONFIG.labels.rental;

    // Build input text from filename (clean it up for the model)
    const nameText = file.name
      .replace(/[_\-\.]/g, ' ')
      .replace(/\d{8,}/g, '')  // remove long date strings
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const inputText = `Document: ${nameText}. File type: ${file.type || 'unknown'}.`;

    try {
      const result = await HFAPI.query(HF_CONFIG.models.classify, {
        inputs: inputText,
        parameters: { candidate_labels: labels }
      });

      // Build scored array
      const allScores = result.labels.map((lbl, i) => ({
        label: lbl,
        score: result.scores[i]
      })).sort((a, b) => b.score - a.score);

      return {
        label: allScores[0].label,
        confidence: Math.round(allScores[0].score * 100),
        allScores,
        raw: result
      };
    } catch (e) {
      console.warn('HF classify failed:', e.message);
      return { label: 'unknown', confidence: 0, allScores: [], error: e.message };
    }
  },

  /**
   * Classify free-form text (for chat intent, maintenance descriptions, etc.)
   * @param {string} text
   * @param {string[]|string} labels - array of labels OR preset name
   */
  async classifyText(text, labels = 'rental') {
    if (typeof labels === 'string') labels = HF_CONFIG.labels[labels] || HF_CONFIG.labels.rental;
    try {
      const result = await HFAPI.query(HF_CONFIG.models.classify, {
        inputs: text,
        parameters: { candidate_labels: labels }
      });
      const allScores = result.labels.map((lbl, i) => ({
        label: lbl, score: result.scores[i]
      })).sort((a, b) => b.score - a.score);
      return { label: allScores[0].label, confidence: Math.round(allScores[0].score * 100), allScores };
    } catch (e) {
      return { label: 'unknown', confidence: 0, allScores: [], error: e.message };
    }
  }
};

// ============================================================================
// MAINTENANCE PHOTO ANALYSIS (Task 2.4)
// Uses: Salesforce/blip-image-captioning-base
// Input: image file
// Output: { caption, category, urgency }
// ============================================================================

const HFPhoto = {

  /**
   * Analyze a maintenance/property photo
   * @param {File} imageFile
   * @returns {Promise<{caption, category, urgency}>}
   */
  async analyzeMaintenance(imageFile) {
    try {
      // Step 1: Get image caption
      const captionResult = await HFAPI.queryFile(HF_CONFIG.models.caption, imageFile);
      const caption = Array.isArray(captionResult)
        ? captionResult[0]?.generated_text
        : captionResult?.generated_text || 'Unable to analyze image';

      // Step 2: Classify the caption into maintenance category
      const categoryResult = await HFClassify.classifyText(caption, 'maintenance');

      // Step 3: Determine urgency from caption keywords
      const urgencyKeywords = {
        emergency: ['flood', 'fire', 'gas leak', 'smoke', 'broken glass', 'exposed wire', 'sewage', 'no heat', 'burst pipe'],
        high: ['leak', 'water damage', 'mold', 'no hot water', 'heater', 'electrical', 'pest', 'lock broken'],
        medium: ['damage', 'broken', 'repair', 'not working', 'hvac', 'appliance'],
        low: ['paint', 'crack', 'scratch', 'cosmetic', 'light bulb', 'squeaky']
      };

      let urgency = 'low';
      const captionLower = caption.toLowerCase();
      for (const [level, keywords] of Object.entries(urgencyKeywords)) {
        if (keywords.some(kw => captionLower.includes(kw))) {
          urgency = level;
          break;
        }
      }

      return {
        caption,
        category: categoryResult.label,
        categoryConfidence: categoryResult.confidence,
        urgency,
        summary: `${categoryResult.label} — ${urgency} priority`
      };
    } catch (e) {
      console.warn('HF photo analysis failed:', e.message);
      return { caption: 'Analysis unavailable', category: 'other', urgency: 'medium', error: e.message };
    }
  },

  /**
   * General image description (listings, field app, etc.)
   * @param {File} imageFile
   */
  async describe(imageFile) {
    try {
      const result = await HFAPI.queryFile(HF_CONFIG.models.caption, imageFile);
      return Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || '';
    } catch (e) {
      return '';
    }
  }
};

// ============================================================================
// OCR — PAYMENT SCREENSHOT READER (Task 2.3)
// Uses: microsoft/trocr-base-printed
// Input: image file of a receipt or payment screenshot
// Output: { text, amount, date, confirmed }
// ============================================================================

const HFOCR = {

  /**
   * Extract text from a payment screenshot or receipt image
   * @param {File} imageFile
   * @returns {Promise<{text, amount, date, confirmed}>}
   */
  async readPaymentScreenshot(imageFile) {
    try {
      const result = await HFAPI.queryFile(HF_CONFIG.models.ocr, imageFile);
      const text = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || '';

      // Parse dollar amount from OCR text
      const amountMatch = text.match(/\$[\d,]+\.?\d{0,2}|\d+\.\d{2}/);
      const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : null;

      // Parse date
      const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},? \d{4}/);
      const date = dateMatch ? dateMatch[0] : null;

      // Look for confirmation number
      const confirmMatch = text.match(/(?:conf|confirmation|ref|reference|transaction)[#:\s]+([A-Z0-9]{6,})/i);
      const confirmed = confirmMatch ? confirmMatch[1] : null;

      return { text, amount, date, confirmed, raw: result };
    } catch (e) {
      console.warn('HF OCR failed:', e.message);
      return { text: '', amount: null, date: null, confirmed: null, error: e.message };
    }
  },

  /**
   * General OCR for any document image
   */
  async readImage(imageFile) {
    try {
      const result = await HFAPI.queryFile(HF_CONFIG.models.ocr, imageFile);
      return Array.isArray(result) ? result[0]?.generated_text : result?.generated_text || '';
    } catch (e) {
      return '';
    }
  }
};

// ============================================================================
// SMART REPLY SUGGESTIONS (Task 2.6)
// Uses: facebook/bart-large-mnli for intent + template matching
// Input: message text
// Output: { intent, suggestedReplies[] }
// ============================================================================

const HFReplies = {

  INTENT_LABELS: [
    'rent payment inquiry', 'maintenance request', 'lease question',
    'move-in question', 'move-out question', 'noise complaint',
    'general inquiry', 'emergency', 'application status'
  ],

  REPLY_TEMPLATES: {
    'rent payment inquiry': [
      'Hi {name}, your rent payment portal is available at your tenant dashboard. You can pay by card or ACH anytime.',
      'Hi {name}, I received your message about rent. Your current balance and payment options are in your tenant portal.',
      'Thanks for reaching out! You can pay rent online 24/7 through your tenant portal link.'
    ],
    'maintenance request': [
      'Hi {name}, I received your maintenance request and will schedule a technician within 24-48 hours.',
      'Thanks for reporting this. I\'ll have someone look at it by {next_business_day}. Can you send a photo?',
      'Got it — I\'m scheduling this repair now. You\'ll receive a confirmation with the appointment time.'
    ],
    'lease question': [
      'Hi {name}, great question about your lease. I\'ll review it and get back to you within one business day.',
      'You can view your full lease anytime in your tenant portal under "Documents." Let me know if you have questions.',
      'I\'d be happy to clarify that lease term. Can you specify which section you\'re asking about?'
    ],
    'application status': [
      'Hi {name}, your application is currently under review. You\'ll receive a decision within 2-3 business days.',
      'We received your application and are processing it now. We\'ll notify you by email as soon as a decision is made.',
      'Your application is in queue. Background check results typically take 24-48 hours.'
    ],
    'emergency': [
      'URGENT: For emergencies involving gas, fire, or flooding — call 911 immediately and then contact me at {phone}.',
      'I\'m treating this as urgent and will respond within the hour. Is everyone safe? Please call me at {phone}.',
      'Emergency received. I\'m dispatching a technician now. ETA: within 2 hours. My cell: {phone}.'
    ],
    'general inquiry': [
      'Hi {name}, thanks for reaching out! I\'ll get back to you within one business day.',
      'Got your message — I\'ll follow up shortly. Is there anything urgent I should address first?',
      'Thanks for contacting us. I\'ll review your message and respond within 24 hours.'
    ]
  },

  /**
   * Get smart reply suggestions for a message
   * @param {string} messageText
   * @param {object} context - { tenantName, landlordPhone }
   * @returns {Promise<{intent, suggestions[]}>}
   */
  async suggest(messageText, context = {}) {
    try {
      const result = await HFClassify.classifyText(messageText, this.INTENT_LABELS);
      const intent = result.label;
      const templates = this.REPLY_TEMPLATES[intent] || this.REPLY_TEMPLATES['general inquiry'];

      // Fill in context variables
      const suggestions = templates.map(t => t
        .replace('{name}', context.tenantName || 'there')
        .replace('{phone}', context.landlordPhone || 'your property manager')
        .replace('{next_business_day}', this._nextBusinessDay())
      );

      return {
        intent,
        intentConfidence: result.confidence,
        suggestions,
        allIntents: result.allScores?.slice(0, 3) || []
      };
    } catch (e) {
      return {
        intent: 'general inquiry',
        intentConfidence: 0,
        suggestions: this.REPLY_TEMPLATES['general inquiry'],
        error: e.message
      };
    }
  },

  _nextBusinessDay() {
    const d = new Date();
    d.setDate(d.getDate() + (d.getDay() === 5 ? 3 : d.getDay() === 6 ? 2 : 1));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
};

// ============================================================================
// CHAT INTENT DETECTION (Task 2.2)
// Route simple FAQs locally, only hit Claude API for complex queries
// ============================================================================

const HFChat = {

  SIMPLE_INTENTS: ['rent payment inquiry', 'application status', 'general inquiry'],
  COMPLEX_INTENTS: ['lease question', 'emergency', 'maintenance request', 'noise complaint'],

  LOCAL_RESPONSES: {
    'rent payment inquiry': 'You can pay rent online through your tenant portal. We accept credit/debit cards and ACH bank transfers.',
    'application status': 'Your application is being reviewed. You\'ll receive an email with the decision within 2-3 business days.',
    'general inquiry': 'Thanks for your message! A property manager will follow up with you shortly.'
  },

  /**
   * Decide whether to answer locally or escalate to AI
   * @param {string} message
   * @returns {Promise<{route: 'local'|'ai', response?, intent}>}
   */
  async route(message) {
    const result = await HFClassify.classifyText(message, HFReplies.INTENT_LABELS);
    const intent = result.label;
    const isSimple = this.SIMPLE_INTENTS.includes(intent) && result.confidence > 70;

    if (isSimple) {
      return {
        route: 'local',
        intent,
        confidence: result.confidence,
        response: this.LOCAL_RESPONSES[intent]
      };
    }

    return {
      route: 'ai',
      intent,
      confidence: result.confidence,
      response: null // caller should hit Claude API
    };
  }
};

// ============================================================================
// AUTO-ATTACH — Drop-in UI for file inputs with data-hf-classify
// ============================================================================

(function autoAttach() {
  if (typeof document === 'undefined') return;

  function attachToInput(input) {
    input.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;

      const context = input.dataset.hfContext || 'rental';
      const targetSelector = input.dataset.hfTarget;
      const badgeId = input.dataset.hfBadge || (input.id + '-hf-badge');

      // Show loading badge
      let badge = document.getElementById(badgeId);
      if (!badge) {
        badge = document.createElement('span');
        badge.id = badgeId;
        badge.style.cssText = 'display:inline-block;margin-left:8px;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;';
        input.parentNode.insertBefore(badge, input.nextSibling);
      }

      badge.textContent = '🤖 Analyzing...';
      badge.style.background = '#f0f4ff';
      badge.style.color = '#4f46e5';

      const result = await HFClassify.classifyDocument(file, context);

      if (result.error || result.label === 'unknown') {
        badge.textContent = '⚠️ Could not classify';
        badge.style.background = '#fff3cd';
        badge.style.color = '#856404';
      } else {
        badge.textContent = `✅ ${result.label} (${result.confidence}%)`;
        badge.style.background = '#d1fae5';
        badge.style.color = '#065f46';

        // Optionally populate a target field
        if (targetSelector) {
          const target = document.querySelector(targetSelector);
          if (target) {
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
              target.value = result.label;
            } else {
              target.textContent = result.label;
            }
          }
        }
      }

      // Dispatch event so page JS can react
      input.dispatchEvent(new CustomEvent('hf:classified', {
        bubbles: true,
        detail: result
      }));
    });
  }

  function init() {
    document.querySelectorAll('input[type="file"][data-hf-classify]').forEach(attachToInput);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.HFClassify  = HFClassify;
  window.HFPhoto     = HFPhoto;
  window.HFOCR       = HFOCR;
  window.HFReplies   = HFReplies;
  window.HFChat      = HFChat;
  window.HFAPI       = HFAPI;
}

console.log('✅ hf-classify.js loaded — HF AI ready (classify, photo, OCR, replies, chat routing)');
