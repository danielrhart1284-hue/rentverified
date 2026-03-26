/**
 * 3120 Life — Mock Data (Utah-Consistent)
 * =========================================
 * All demo/placeholder data for the platform.
 * ONLY use data from this file — no lorem ipsum, no random names.
 * Every name, business, and address is Utah-consistent.
 *
 * Usage: <script src="mock-data.js"></script>
 *        Then use: MOCK.properties, MOCK.professionals, etc.
 */

var MOCK = {

  // ══════════════════════════════════════════════════════════
  // PROPERTIES (Sanders Property Management portfolio)
  // ══════════════════════════════════════════════════════════
  properties: [
    { address: '119 E 600 S #119', city: 'Orem', state: 'UT', zip: '84058', beds: 2, baths: 1, sqft: 900, rent: 1200, type: 'apartment', status: 'occupied' },
    { address: '456 Oak Avenue, Apt 1B', city: 'Herriman', state: 'UT', zip: '84096', beds: 1, baths: 1, sqft: 620, rent: 950, type: 'apartment', status: 'occupied' },
    { address: '789 Pine Road', city: 'Draper', state: 'UT', zip: '84020', beds: 3, baths: 2, sqft: 1400, rent: 1650, type: 'house', status: 'occupied' },
    { address: '2142 S King St', city: 'Salt Lake City', state: 'UT', zip: '84115', beds: 3, baths: 2, sqft: 1600, rent: 1850, type: 'house', status: 'vacant' },
    { address: '331 W Center St #204', city: 'Provo', state: 'UT', zip: '84601', beds: 2, baths: 1, sqft: 850, rent: 1100, type: 'apartment', status: 'occupied' }
  ],

  // ══════════════════════════════════════════════════════════
  // PROFESSIONALS (Utah-based, realistic names)
  // ══════════════════════════════════════════════════════════
  contractors: [
    { name: 'Utah Valley Electric', contact: 'Jake Morrison', phone: '(801) 555-2201', specialty: 'Electrical', city: 'Lehi', license: 'UT-E-44821' },
    { name: 'Wasatch Plumbing Co', contact: 'Carlos Mendez', phone: '(801) 555-3302', specialty: 'Plumbing', city: 'Sandy', license: 'UT-P-55193' },
    { name: 'Summit HVAC Solutions', contact: 'Tanner Reid', phone: '(801) 555-4403', specialty: 'HVAC', city: 'Draper', license: 'UT-H-33027' },
    { name: 'RedRock Painting', contact: 'Maria Lopez', phone: '(801) 555-5504', specialty: 'Painting', city: 'Herriman', license: 'UT-GC-19384' },
    { name: 'Beehive Roofing', contact: 'Brett Hansen', phone: '(801) 555-6605', specialty: 'Roofing', city: 'Orem', license: 'UT-R-27456' },
    { name: 'Timpanogos Landscaping', contact: 'David Nguyen', phone: '(801) 555-7706', specialty: 'Landscaping', city: 'Provo', license: 'UT-LC-88142' }
  ],

  accountants: [
    { name: 'Alpine CPA Group', contact: 'Sarah Mitchell, CPA', phone: '(801) 555-8100', specialty: 'Real Estate Accounting', city: 'Salt Lake City' },
    { name: 'Granite Tax & Advisory', contact: 'Kevin Park, EA', phone: '(801) 555-8200', specialty: 'Small Business Tax', city: 'Sandy' }
  ],

  attorneys: [
    { name: 'Wasatch Legal Partners', contact: 'Marcus Chen, Esq.', phone: '(801) 555-9100', specialty: 'Landlord-Tenant Law', city: 'Salt Lake City' },
    { name: 'Bonneville Law Group', contact: 'Rachel Adams, Esq.', phone: '(801) 555-9200', specialty: 'Business Formation', city: 'Provo' }
  ],

  insurance: [
    { name: 'Crossroads Insurance', contact: 'Tom Bradley', phone: '(801) 555-1100', specialty: 'Landlord & Commercial', city: 'Salt Lake City', carriers: 15 },
    { name: 'Zion Coverage Group', contact: 'Lisa Patel', phone: '(801) 555-1200', specialty: 'Property & Liability', city: 'Ogden', carriers: 12 }
  ],

  loanOfficers: [
    { name: 'Pinnacle Lending', contact: 'Michael Torres', phone: '(801) 555-2100', specialty: 'SBA & Business Loans', city: 'Salt Lake City', nmls: '445821' },
    { name: 'Mountain West Capital', contact: 'Jennifer Park', phone: '(801) 555-2200', specialty: 'Hard Money & Bridge', city: 'Lehi', nmls: '338901' }
  ],

  cleaningServices: [
    { name: 'Fresh Start Cleaning Co', contact: 'Ana Rivera', phone: '(801) 555-3100', specialty: 'Residential & Move-Out', city: 'Herriman' },
    { name: 'Peak Shine Janitorial', contact: 'James Wright', phone: '(801) 555-3200', specialty: 'Commercial Cleaning', city: 'Salt Lake City' }
  ],

  salons: [
    { name: 'The Hive Salon', contact: 'Jessica Taylor', phone: '(801) 555-4100', specialty: 'Hair & Color', city: 'Draper' },
    { name: 'Canyon Cuts Barbershop', contact: 'Derek Kim', phone: '(801) 555-4200', specialty: 'Men\'s Grooming', city: 'Provo' }
  ],

  // ══════════════════════════════════════════════════════════
  // PLACEHOLDER TEXT (no lorem ipsum — use these)
  // ══════════════════════════════════════════════════════════
  placeholders: {
    description: 'Professional service based in the Wasatch Front area.',
    emptyState: 'Nothing here yet. Add your first item to get started.',
    noReviews: 'We\'re new! No reviews yet — be the first to share your experience.',
    note: 'Notes will appear here once you start adding them.',
    searchHint: 'Search by name, address, or keyword...',
    upcoming: 'No upcoming items scheduled.',
    noLeads: 'No leads yet. Share your profile to start getting inquiries.'
  },

  // ══════════════════════════════════════════════════════════
  // SAMPLE TRANSACTIONS (for accounting demos)
  // ══════════════════════════════════════════════════════════
  transactions: [
    { type: 'income', category: 'Rent', amount: 1200, description: 'Rent - 119 E 600 S #119', date: '2026-03-01', property: '119 E 600 S #119' },
    { type: 'income', category: 'Rent', amount: 950, description: 'Rent - 456 Oak Avenue', date: '2026-03-01', property: '456 Oak Avenue' },
    { type: 'income', category: 'Rent', amount: 1650, description: 'Rent - 789 Pine Road', date: '2026-03-01', property: '789 Pine Road' },
    { type: 'expense', category: 'Maintenance', amount: 275, description: 'Water heater repair - Wasatch Plumbing', date: '2026-03-05', property: '789 Pine Road' },
    { type: 'expense', category: 'Insurance', amount: 180, description: 'Landlord policy premium - Crossroads Insurance', date: '2026-03-10', property: 'Portfolio' },
    { type: 'expense', category: 'Utilities', amount: 95, description: 'Water bill - vacant unit', date: '2026-03-12', property: '2142 S King St' }
  ]
};

// Make available globally
if (typeof window !== 'undefined') window.MOCK = MOCK;
