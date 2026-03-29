/**
 * 3120 Life — Brand Configuration
 * ================================
 * Single source of truth for all branding, colors, and copy.
 * Every page should reference this instead of hardcoding values.
 *
 * Usage: <script src="brand-config.js"></script>
 *        Then use: BRAND.name, BRAND.colors.accent, etc.
 */

var BRAND = {
  // ── Identity ──
  name: '3120 Life',
  tagline: 'Run your entire business from one place.',
  legal: '3120 Life, LLC',
  founded: 2026,
  location: 'Herriman, Utah',
  domain: '3120life.com',
  support_email: 'support@3120life.com',
  admin_email: 'admin@3120life.com',

  // ── Founder ──
  founder: {
    name: 'Daniel Hart',
    company: '[Your Business Name]',
    email: 'daniel@3120life.com',
    phone: '',
    title: 'Founder & CEO'
  },

  // ── Colors: Executive Visionary Theme ──
  colors: {
    bg: '#121212',
    surface: '#1E1E1E',
    border: '#333333',
    accent: '#00E676',
    accentHover: '#00C853',
    accentDim: 'rgba(0,230,118,0.12)',
    text: '#EAEAEA',
    textSecondary: '#A0AEC0',
    textMuted: '#6B7280',
    danger: '#FF5252',
    warning: '#FFB74D',
    success: '#00E676',
    info: '#448AFF',
    blue: '#448AFF',
    purple: '#8B5CF6'
  },

  // ── Typography ──
  fonts: {
    primary: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    dyslexia: "'Atkinson Hyperlegible', sans-serif"
  },

  // ── Framing (no false claims) ──
  copy: {
    earlyAccess: 'You\'re getting Early Access. New tools and improvements ship weekly.',
    noReviews: 'We\'re new! No reviews yet — be the first to share your experience.',
    noData: 'Nothing here yet. Add your first item to get started.',
    demoBanner: 'Demo Mode — Connect Supabase for live data.',
    cta: 'Start Free',
    ctaSub: 'No credit card required. Pick your industry and you\'re live in 5 minutes.',
    industries: '18 industry types supported',
    tools: '44 tools available'
  },

  // ── Utah Market ──
  market: {
    state: 'UT',
    cities: ['Herriman', 'Salt Lake City', 'Provo', 'Orem', 'Ogden', 'St. George', 'Park City', 'Lehi', 'Sandy', 'Draper'],
    irs_mileage_rate: 0.67,
    year: 2026
  }
};

// Make available globally
if (typeof window !== 'undefined') window.BRAND = BRAND;
