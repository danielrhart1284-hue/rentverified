// ============================================================================
// RentVerified — Supabase Configuration
// ============================================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com → New Project
// 2. Copy your Project URL and anon key from Settings → API
// 3. Replace the placeholders below
// ============================================================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // e.g., https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // e.g., eyJhbGciOiJIUzI1NiIs...

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

const RVAuth = {
  // Get current session
  async getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { session } } = await sb.auth.getSession();
    return session;
  },

  // Get current user
  async getUser() {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user } } = await sb.auth.getUser();
    return user;
  },

  // Sign up new user
  async signUp({ email, password, firstName, lastName, phone, company, role = 'landlord', plan = 'starter' }) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          company: company,
          role: role
        }
      }
    });

    if (error) return { data: null, error };

    // Update profile with additional fields
    if (data.user) {
      await sb.from('profiles').update({
        phone,
        company,
        plan,
        role
      }).eq('id', data.user.id);
    }

    return { data, error: null };
  },

  // Sign in
  async signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    // Load profile
    const { data: profile } = await sb.from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { data: { ...data, profile }, error: null };
  },

  // Sign out
  async signOut() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    // Clear any localStorage remnants
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rv_')) localStorage.removeItem(key);
    });
  },

  // Get user profile from database
  async getProfile() {
    const sb = getSupabase();
    if (!sb) return null;
    const user = await this.getUser();
    if (!user) return null;

    const { data } = await sb.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return data;
  },

  // Update profile
  async updateProfile(updates) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };
    const user = await this.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await sb.from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    return { data, error };
  },

  // Password reset
  async resetPassword(email) {
    const sb = getSupabase();
    if (!sb) return { error: 'Supabase not configured' };
    return await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
  },

  // Listen for auth state changes
  onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return;
    return sb.auth.onAuthStateChange(callback);
  }
};

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
