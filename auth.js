// ============================================================================
// 3120 Life — Unified Authentication Module
// ============================================================================
// All pages import this file. It handles:
//   - Supabase Auth (signIn, signUp, signOut, OAuth)
//   - Session management (in-memory, not localStorage)
//   - Route protection (redirect if not logged in)
//   - Role-based access (admin, landlord, tenant, agent, vendor)
// ============================================================================

const Auth = (function() {
  'use strict';

  // In-memory session cache (never persisted to localStorage)
  let _session = null;
  let _profile = null;

  // ── Core Auth Methods ─────────────────────────────────────────────────

  /** Sign in with email + password */
  async function signIn(email, password) {
    const sb = getSupabase();
    if (!sb) return { data: null, error: { message: 'Supabase not configured' } };

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    _session = data.session;

    // Load profile
    const { data: profile, error: profileErr } = await sb.from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) _profile = profile;

    return { data: { session: data.session, user: data.user, profile }, error: profileErr };
  }

  /** Sign up new user */
  async function signUp({ email, password, firstName, lastName, phone, company, role = 'landlord', plan = 'starter' }) {
    const sb = getSupabase();
    if (!sb) return { data: null, error: { message: 'Supabase not configured' } };

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

    // Update profile with additional fields (trigger creates profile row)
    if (data.user) {
      await sb.from('profiles').update({
        phone, company, plan, role
      }).eq('id', data.user.id);
    }

    _session = data.session;
    return { data, error: null };
  }

  /** Sign in with Google OAuth */
  async function signInWithGoogle() {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth-callback.html'
      }
    });
    return { data, error };
  }

  /** Sign out — clears session and all rv_ localStorage keys */
  async function signOut() {
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    _session = null;
    _profile = null;
    // Clean up any legacy localStorage keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rv_')) localStorage.removeItem(key);
    });
  }

  /** Get current session (always checks Supabase for fresh token) */
  async function getSession() {
    const sb = getSupabase();
    if (!sb) return _session || null;
    try {
      const { data: { session } } = await sb.auth.getSession();
      _session = session;
      return session;
    } catch (e) {
      console.warn('getSession failed:', e);
      return _session || null;
    }
  }

  /** Get current user */
  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  /** Get user profile from database (cached) */
  async function getProfile(forceRefresh) {
    if (_profile && !forceRefresh) return _profile;
    const sb = getSupabase();
    if (!sb) return null;
    const user = await getUser();
    if (!user) return null;

    const { data } = await sb.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    _profile = data;
    return data;
  }

  /** Update user profile */
  async function updateProfile(updates) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };
    const user = await getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await sb.from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data) _profile = data;
    return { data, error };
  }

  /** Send password reset email */
  async function resetPassword(email) {
    const sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not configured' } };
    return await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
  }

  /** Listen for auth state changes */
  function onAuthStateChange(callback) {
    const sb = getSupabase();
    if (!sb) return;
    return sb.auth.onAuthStateChange((event, session) => {
      _session = session;
      if (!session) _profile = null;
      callback(event, session);
    });
  }

  // ── Route Protection ──────────────────────────────────────────────────

  /**
   * Protect a page — redirects to login if not authenticated or wrong role.
   * @param {Object} options
   * @param {string|string[]} options.requiredRole - 'admin', 'landlord', 'tenant', 'agent', 'vendor', or array
   * @param {string} options.loginPage - URL to redirect to if not authenticated
   * @param {Function} options.onAuthenticated - Callback when user is verified (receives { user, profile })
   * @param {Function} options.onDenied - Callback when role doesn't match (receives { user, profile })
   */
  async function protect({ requiredRole, loginPage = '/landlord-signup.html', onAuthenticated, onDenied }) {
    const session = await getSession();

    if (!session) {
      window.location.href = loginPage;
      return;
    }

    const profile = await getProfile();
    const userRole = profile?.role || session.user?.user_metadata?.role || 'unknown';

    if (requiredRole) {
      const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowed.includes(userRole)) {
        if (onDenied) {
          onDenied({ user: session.user, profile });
        } else {
          window.location.href = loginPage;
        }
        return;
      }
    }

    if (onAuthenticated) {
      onAuthenticated({ user: session.user, profile, session });
    }
  }

  // ── Utility ───────────────────────────────────────────────────────────

  /** Check if user is currently logged in (synchronous check of cache) */
  function isLoggedIn() {
    return !!_session;
  }

  /** Get cached profile (synchronous — call getProfile() first) */
  function cachedProfile() {
    return _profile;
  }

  /** Get user display name */
  function displayName() {
    if (_profile) {
      const first = _profile.first_name || '';
      const last = _profile.last_name || '';
      if (first || last) return (first + ' ' + last).trim();
      if (_profile.company) return _profile.company;
    }
    return _session?.user?.email || 'User';
  }

  // ── Public API ────────────────────────────────────────────────────────

  return {
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getSession,
    getUser,
    getProfile,
    updateProfile,
    resetPassword,
    onAuthStateChange,
    protect,
    isLoggedIn,
    cachedProfile,
    displayName
  };
})();

// Make globally available
window.Auth = Auth;
