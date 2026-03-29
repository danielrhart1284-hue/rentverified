// ============================================================================
// 3120 Life — Supabase Configuration
// ============================================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com → New Project
// 2. Copy your Project URL and anon key from Settings → API
// 3. Replace the placeholders below
// ============================================================================

const SUPABASE_URL = 'https://njbgotdtpcabqxbkdfdc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cWbibGA5a1YpSc_rttXX3g_xD2vbfPv';

// Load Supabase client from CDN (added via <script> tag in HTML)
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let _supabaseClient = null;

function getSupabase() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabaseClient;
  }
  console.warn('Supabase JS not loaded — falling back to localStorage');
  return null;
}

// Check if Supabase is configured (not placeholder values)
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

// ============================================================================
// AUTH MODULE — Real authentication via Supabase
// ============================================================================

// RVAuth removed — use Auth module from auth.js instead (single source of truth)

// ============================================================================
// AUDIT LOGGING — Immutable forensic trail via Supabase
// ============================================================================

const RVAudit = {
  /** Log an audit event to the immutable audit_log table */
  async log(action, resourceType, resourceId, metadata) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.rpc('log_audit_event', {
      p_action: action,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_metadata: metadata || {}
    });
    if (error) console.error('Audit log error:', error);
    return data;
  },

  /** Fetch audit log entries (workspace-scoped via RLS) */
  async getLog(options = {}) {
    const sb = getSupabase();
    if (!sb) return [];
    let q = sb.from('audit_log').select('*').order('created_at', { ascending: false });
    if (options.limit) q = q.limit(options.limit);
    if (options.action) q = q.eq('action', options.action);
    if (options.resource_type) q = q.eq('resource_type', options.resource_type);
    if (options.since) q = q.gte('created_at', options.since);
    const { data } = await q;
    return data || [];
  },

  /** Expire stale time-limited grants */
  async expireGrants() {
    const sb = getSupabase();
    if (!sb) return 0;
    const { data } = await sb.rpc('expire_stale_grants');
    return data || 0;
  }
};

if (typeof window !== 'undefined') window.RVAudit = RVAudit;

// ============================================================================
// FILE STORAGE — Supabase Storage for documents, photos, IDs
// ============================================================================

const RVStorage = {
  // Upload a file
  async upload(bucket, path, file) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };

    const { data, error } = await sb.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    return { data, error };
  },

  // Get public URL for a file
  getPublicUrl(bucket, path) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
  },

  // Delete a file
  async remove(bucket, paths) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };
    return await sb.storage.from(bucket).remove(paths);
  },

  // Upload property photo
  async uploadPropertyPhoto(propertyId, file) {
    const ext = file.name.split('.').pop();
    const path = `properties/${propertyId}/${Date.now()}.${ext}`;
    return await this.upload('property-photos', path, file);
  },

  // Upload document
  async uploadDocument(userId, docType, file) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${docType}/${Date.now()}.${ext}`;
    return await this.upload('documents', path, file);
  }
};

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

const STRIPE_CONFIG = {
  publishableKey: 'pk_test_51TBxc1EkuwiyM4jcw0Fu7v6cPkFgJsvhlB5CNX1snQGo2tVq3mmYM1RsnCReEfsFF5FDjqlTrFlAthyY3q1ojTWe007bMAxW3j',
  // Card fee percentage charged to tenant
  cardFeePercent: 0.029,
  cardFeeFixed: 0.30,
  // ACH fee
  achFee: 0.80,
  // Platform fee percentage (what 3120 Life keeps)
  platformFeePercent: 0.02,
};

// ============================================================================
// PAYMENT FUNCTIONS — Stripe Checkout, Connect, Payment Links
// ============================================================================

const RVPayments = {
  // Calculate card processing fee
  calculateCardFee(amount) {
    return Math.round((amount * STRIPE_CONFIG.cardFeePercent + STRIPE_CONFIG.cardFeeFixed) * 100) / 100;
  },

  // Start Stripe Checkout for rent payment
  async payWithStripe(options) {
    const { amount, tenantName, tenantEmail, propertyAddress, paymentMethod, landlordStripeAccountId } = options;
    const fee = paymentMethod === 'card' ? this.calculateCardFee(amount) : 0;

    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke('create-payment', {
        body: { amount, tenantName, tenantEmail, propertyAddress, paymentMethod, landlordStripeAccountId, platformFee: fee }
      });
      if (error) throw error;
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      }
      return data;
    } catch (e) {
      console.error('Payment error:', e);
      return { error: e.message };
    }
  },

  // Generate a payment QR code / link
  async generatePaymentLink(options) {
    const { amount, propertyAddress, tenantName, landlordStripeAccountId } = options;
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke('generate-payment-link', {
        body: { amount, propertyAddress, tenantName, landlordStripeAccountId }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Payment link error:', e);
      return { error: e.message };
    }
  },

  // Start Stripe Connect onboarding for a landlord
  async connectLandlordBank(landlordEmail, landlordName) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke('create-connect-account', {
        body: { action: 'create', landlordEmail, landlordName }
      });
      if (error) throw error;
      if (data.url) {
        // Save account ID locally
        localStorage.setItem('rv_stripe_account_id', data.accountId);
        window.location.href = data.url; // Redirect to Stripe Connect onboarding
      }
      return data;
    } catch (e) {
      console.error('Connect error:', e);
      return { error: e.message };
    }
  },

  // Check Stripe Connect account status
  async checkConnectStatus(accountId) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb.functions.invoke('create-connect-account', {
        body: { action: 'status', accountId }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      return { error: e.message };
    }
  },

  // Get Cash App deep link
  getCashAppLink(cashtag, amount) {
    if (!cashtag) return '#';
    const tag = cashtag.replace('$', '');
    if (!tag) return '#';
    return `https://cash.app/$${tag}/${amount || ''}`;
  },

  // Get Venmo deep link
  getVenmoLink(username, amount, note) {
    const user = username.replace('@', '');
    return `venmo://paycharge?txn=pay&recipients=${user}&amount=${amount}&note=${encodeURIComponent(note || 'Rent Payment')}`;
  },

  // Get PayPal link
  getPayPalLink(username, amount) {
    return `https://paypal.me/${username}/${amount}`;
  },
};

// Make globally available
window.STRIPE_CONFIG = STRIPE_CONFIG;
window.RVPayments = RVPayments;
