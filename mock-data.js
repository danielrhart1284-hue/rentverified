/**
 * 3120 Life — Mock Data (FICTIONAL — NOT REAL BUSINESSES)
 * ========================================================
 * All names below are COMPLETELY FICTIONAL.
 * They are NOT real companies, NOT real people, NOT real addresses.
 * They exist ONLY as UI placeholders for development/demo.
 *
 * IMPORTANT: These should NEVER appear on the live public site.
 * On the live site, all data comes from real user signups.
 * Mock data is for ADMIN TESTING ONLY.
 *
 * Usage: <script src="mock-data.js"></script>
 */

var MOCK = {

  // ── DISCLAIMER — shown wherever mock data appears ──
  disclaimer: 'Sample data for demonstration only. Names and businesses shown are fictional.',

  // ══════════════════════════════════════════════════════════
  // PROPERTIES (fictional addresses — NOT real)
  // ══════════════════════════════════════════════════════════
  properties: [
    { address: '100 Demo Street #1', city: 'Anytown', state: 'UT', zip: '84000', beds: 2, baths: 1, sqft: 900, rent: 1200, type: 'apartment', status: 'example' },
    { address: '200 Sample Ave #2B', city: 'Anytown', state: 'UT', zip: '84000', beds: 1, baths: 1, sqft: 620, rent: 950, type: 'apartment', status: 'example' },
    { address: '300 Test Lane', city: 'Anytown', state: 'UT', zip: '84000', beds: 3, baths: 2, sqft: 1400, rent: 1650, type: 'house', status: 'example' }
  ],

  // ══════════════════════════════════════════════════════════
  // PROFESSIONALS (ALL FICTIONAL — NOT REAL BUSINESSES)
  // ══════════════════════════════════════════════════════════
  contractors: [
    { name: '[Your Electrician Here]', contact: 'Available after signup', phone: '', specialty: 'Electrical', city: '', license: '' },
    { name: '[Your Plumber Here]', contact: 'Available after signup', phone: '', specialty: 'Plumbing', city: '', license: '' },
    { name: '[Your HVAC Tech Here]', contact: 'Available after signup', phone: '', specialty: 'HVAC', city: '', license: '' }
  ],

  accountants: [
    { name: '[Your CPA Here]', contact: 'Available after signup', phone: '', specialty: 'Accounting', city: '' }
  ],

  attorneys: [
    { name: '[Your Attorney Here]', contact: 'Available after signup', phone: '', specialty: 'Legal', city: '' }
  ],

  insurance: [
    { name: '[Your Insurance Agent Here]', contact: 'Available after signup', phone: '', specialty: 'Insurance', city: '', carriers: 0 }
  ],

  loanOfficers: [
    { name: '[Your Loan Officer Here]', contact: 'Available after signup', phone: '', specialty: 'Lending', city: '', nmls: '' }
  ],

  cleaningServices: [
    { name: '[Your Cleaning Service Here]', contact: 'Available after signup', phone: '', specialty: 'Cleaning', city: '' }
  ],

  salons: [
    { name: '[Your Salon Here]', contact: 'Available after signup', phone: '', specialty: 'Beauty', city: '' }
  ],

  // ══════════════════════════════════════════════════════════
  // PLACEHOLDER TEXT
  // ══════════════════════════════════════════════════════════
  placeholders: {
    description: 'Your business description will appear here.',
    emptyState: 'Nothing here yet. Add your first item to get started.',
    noReviews: 'No reviews yet — your reviews will appear here after clients leave feedback.',
    noProfessionals: 'No professionals have joined the network yet. Be the first!',
    note: 'Notes will appear here once you start adding them.',
    searchHint: 'Search by name, address, or keyword...',
    upcoming: 'No upcoming items scheduled.',
    noLeads: 'No leads yet. Share your profile to start getting inquiries.'
  },

  // ══════════════════════════════════════════════════════════
  // SAMPLE TRANSACTIONS (generic, no real business names)
  // ══════════════════════════════════════════════════════════
  transactions: [
    { type: 'income', category: 'Revenue', amount: 1200, description: 'Monthly revenue - Unit 1', date: '2026-03-01', property: 'Unit 1' },
    { type: 'income', category: 'Revenue', amount: 950, description: 'Monthly revenue - Unit 2', date: '2026-03-01', property: 'Unit 2' },
    { type: 'expense', category: 'Maintenance', amount: 275, description: 'Repair expense', date: '2026-03-05', property: 'Unit 3' },
    { type: 'expense', category: 'Insurance', amount: 180, description: 'Insurance premium', date: '2026-03-10', property: 'Portfolio' }
  ]
};

if (typeof window !== 'undefined') window.MOCK = MOCK;
