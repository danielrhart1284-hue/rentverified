-- ============================================================================
-- RentVerified — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS & AUTH (extends Supabase auth.users)
-- ============================================================================

-- Profiles table (linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT NOT NULL DEFAULT 'landlord' CHECK (role IN ('landlord','tenant','vendor','agent','admin','insurance_agent')),
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('free','starter','pro','enterprise')),
  avatar_url TEXT,
  onboarding_done BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROPERTIES
-- ============================================================================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'UT',
  zip TEXT,
  beds INTEGER DEFAULT 0,
  baths NUMERIC(3,1) DEFAULT 0,
  sqft INTEGER DEFAULT 0,
  rent NUMERIC(10,2) DEFAULT 0,
  deposit NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance','unlisted')),
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential','commercial','str','rent_to_own')),
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  listing_id TEXT,
  tenant_name TEXT,
  features JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_status ON public.properties(status);

-- ============================================================================
-- 3. LEASES
-- ============================================================================

CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id),
  tenant_id UUID REFERENCES public.profiles(id),
  tenant_name TEXT,
  tenant_email TEXT,
  start_date DATE,
  end_date DATE,
  rent_amount NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','expired','terminated','renewed')),
  terms JSONB DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leases_landlord ON public.leases(landlord_id);
CREATE INDEX idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX idx_leases_property ON public.leases(property_id);

-- ============================================================================
-- 4. PAYMENTS / TRANSACTIONS
-- ============================================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID REFERENCES public.leases(id),
  property_id UUID REFERENCES public.properties(id),
  payer_id UUID REFERENCES public.profiles(id),
  payee_id UUID REFERENCES public.profiles(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT DEFAULT 'rent' CHECK (payment_type IN ('rent','deposit','fee','maintenance','refund','commission','other')),
  payment_method TEXT CHECK (payment_method IN ('cash_app','zelle','venmo','ach','card','check','paypal','stripe','other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  due_date DATE,
  paid_date TIMESTAMPTZ,
  late_fee NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_payer ON public.payments(payer_id);
CREATE INDEX idx_payments_payee ON public.payments(payee_id);
CREATE INDEX idx_payments_lease ON public.payments(lease_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- ============================================================================
-- 5. ACCOUNTING (ledger entries)
-- ============================================================================

CREATE TABLE public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income','expense')),
  category TEXT,
  party TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  description TEXT,
  entry_date DATE DEFAULT CURRENT_DATE,
  reconciled BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounting_owner ON public.accounting_entries(owner_id);
CREATE INDEX idx_accounting_property ON public.accounting_entries(property_id);

-- ============================================================================
-- 6. MAINTENANCE REQUESTS & WORK ORDERS
-- ============================================================================

CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id),
  landlord_id UUID REFERENCES public.profiles(id),
  tenant_id UUID REFERENCES public.profiles(id),
  vendor_id UUID REFERENCES public.profiles(id),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','emergency')),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','assigned','in_progress','completed','cancelled')),
  description TEXT NOT NULL,
  source TEXT DEFAULT 'tenant',
  photos TEXT[] DEFAULT '{}',
  notes JSONB DEFAULT '[]',
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_landlord ON public.maintenance_requests(landlord_id);
CREATE INDEX idx_maintenance_tenant ON public.maintenance_requests(tenant_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_requests(status);

-- ============================================================================
-- 7. VENDORS
-- ============================================================================

CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  trades TEXT[] DEFAULT '{}',
  service_zips TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  insurance_carrier TEXT,
  insurance_policy TEXT,
  insurance_coverage NUMERIC(10,2),
  insurance_expiry DATE,
  bond_amount NUMERIC(10,2),
  hourly_rate NUMERIC(8,2),
  rating NUMERIC(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. MESSAGES / INBOX
-- ============================================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_id UUID REFERENCES public.profiles(id),
  to_id UUID REFERENCES public.profiles(id),
  from_role TEXT,
  to_role TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  read BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'direct' CHECK (message_type IN ('direct','ai_inquiry','system','broadcast','notification')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_to ON public.messages(to_id);
CREATE INDEX idx_messages_from ON public.messages(from_id);
CREATE INDEX idx_messages_read ON public.messages(read);

-- ============================================================================
-- 9. AI CHAT INBOX (tenant inquiries via AI)
-- ============================================================================

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id),
  landlord_id UUID REFERENCES public.profiles(id),
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  question TEXT NOT NULL,
  ai_response TEXT,
  answered BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  listing_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_convos_landlord ON public.ai_conversations(landlord_id);

-- ============================================================================
-- 10. MANAGEMENT PROFILES (landlord preferences)
-- ============================================================================

CREATE TABLE public.management_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_methods JSONB DEFAULT '{"cashApp":true,"zelle":true,"venmo":true,"ach":true,"card":true,"check":false,"paypal":false}',
  card_fee_policy TEXT DEFAULT 'tenant_pays' CHECK (card_fee_policy IN ('tenant_pays','landlord_absorbs')),
  financial_products JSONB DEFAULT '{"depositBonds":true,"depositFree":false,"rentersInsurance":true,"rentGuarantee":false,"leaseGuarantee":false,"creditBuilder":true,"rentFlexibility":true,"utilitySetup":true,"internetSetup":true,"movingServices":false,"businessLoans":true,"sbaLoans":true,"merchantCashAdvance":false}',
  ai_settings JSONB DEFAULT '{"channels":["website","sms"],"greeting":"","cashAppHandle":"","zelleHandle":""}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. APPLICANTS / SCREENING
-- ============================================================================

CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  income NUMERIC(10,2),
  credit_score INTEGER,
  eviction_history BOOLEAN DEFAULT FALSE,
  bankruptcy BOOLEAN DEFAULT FALSE,
  employment_length TEXT,
  score NUMERIC(5,2),
  decision TEXT DEFAULT 'pending' CHECK (decision IN ('pending','approved','denied','review')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_applicants_landlord ON public.applicants(landlord_id);

-- ============================================================================
-- 12. SCREENING CRITERIA
-- ============================================================================

CREATE TABLE public.screening_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  min_income NUMERIC(10,2) DEFAULT 0,
  min_credit INTEGER DEFAULT 0,
  eviction_check BOOLEAN DEFAULT TRUE,
  bankruptcy_check BOOLEAN DEFAULT TRUE,
  custom_rules JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. DOCUMENTS
-- ============================================================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  doc_type TEXT CHECK (doc_type IN ('lease','notice','eviction','legal','insurance','inspection','photo','id','other')),
  title TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_owner ON public.documents(owner_id);
CREATE INDEX idx_documents_property ON public.documents(property_id);

-- ============================================================================
-- 14. EVICTION CASES
-- ============================================================================

CREATE TABLE public.eviction_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  tenant_name TEXT,
  tenant_id UUID REFERENCES public.profiles(id),
  case_type TEXT,
  status TEXT DEFAULT 'filed' CHECK (status IN ('draft','filed','served','hearing','judgment','enforced','closed')),
  filed_date DATE,
  court_date DATE,
  notes TEXT,
  documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.eviction_notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.eviction_cases(id) ON DELETE CASCADE,
  notice_type TEXT NOT NULL,
  served_date DATE,
  days_to_respond INTEGER DEFAULT 3,
  response_received BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. FUNDING APPLICATIONS
-- ============================================================================

CREATE TABLE public.funding_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID REFERENCES public.profiles(id),
  landlord_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  application_type TEXT DEFAULT 'business' CHECK (application_type IN ('business','personal','deposit','emergency')),
  business_name TEXT,
  business_type TEXT,
  industry TEXT,
  years_in_business INTEGER,
  annual_revenue NUMERIC(12,2),
  monthly_revenue NUMERIC(12,2),
  amount_needed NUMERIC(12,2),
  purpose TEXT,
  urgency TEXT,
  credit_range TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','in_review','pre_approved','funded','declined')),
  partner_referrals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funding_landlord ON public.funding_applications(landlord_id);
CREATE INDEX idx_funding_status ON public.funding_applications(status);

-- ============================================================================
-- 16. REFERRALS
-- ============================================================================

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_name TEXT,
  referred_email TEXT,
  referral_type TEXT CHECK (referral_type IN ('landlord','tenant','contractor','agent','insurance_agent','other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','signed_up','active','paid')),
  credit_amount NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ============================================================================
-- 17. OWNER STATEMENTS
-- ============================================================================

CREATE TABLE public.owner_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  statement_month DATE,
  rental_income NUMERIC(10,2) DEFAULT 0,
  expenses NUMERIC(10,2) DEFAULT 0,
  management_fee NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) DEFAULT 0,
  line_items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','acknowledged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 18. AGENT DATA
-- ============================================================================

CREATE TABLE public.agent_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id),
  client_name TEXT,
  client_email TEXT,
  property_id UUID REFERENCES public.properties(id),
  commission_rate NUMERIC(5,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.agent_clients(id),
  amount NUMERIC(10,2),
  commission_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 19. INSURANCE AGENTS
-- ============================================================================

CREATE TABLE public.insurance_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  company TEXT,
  license_number TEXT,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic','featured','elite')),
  policies_sold INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 20. ADMIN SETTINGS (platform-wide)
-- ============================================================================

CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('platform', '{"name":"RentVerified","supportEmail":"support@rentverified.com","feePolicy":"tenant_pays","maintenanceMode":false}'),
  ('products', '{"smart_move":true,"deposit_bonds":true,"deposit_free":true,"renters_insurance":true,"rent_guarantee":true,"lease_guarantee":true,"credit_builder":true,"rent_flexibility":true,"utility_setup":true,"internet_setup":true,"moving_services":true,"business_loans":true,"sba_loans":true,"merchant_cash_advance":true}'),
  ('commission_rates', '{"deposit_bond":15,"insurance":12,"credit_builder":10,"utility":75,"business_loan":5}');

-- ============================================================================
-- 21. NOTIFICATION PREFERENCES (for Twilio / email)
-- ============================================================================

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  rent_reminders BOOLEAN DEFAULT TRUE,
  payment_confirmations BOOLEAN DEFAULT TRUE,
  maintenance_updates BOOLEAN DEFAULT TRUE,
  lease_alerts BOOLEAN DEFAULT TRUE,
  marketing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 22. SMS LOG (Twilio message tracking)
-- ============================================================================

CREATE TABLE public.sms_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  phone_to TEXT NOT NULL,
  phone_from TEXT,
  message_body TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('rent_reminder','payment_confirmation','late_notice','maintenance_update','lease_alert','verification','marketing','other')),
  twilio_sid TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','undelivered')),
  cost NUMERIC(6,4),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_user ON public.sms_log(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Users can only access their own data
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eviction_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eviction_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read/update their own profile; admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PROPERTIES: owners see their own; tenants see properties they're leased to; public sees available
CREATE POLICY "Owners manage own properties" ON public.properties FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Anyone can view available properties" ON public.properties FOR SELECT USING (status = 'available');

-- LEASES: landlords and tenants see their own leases
CREATE POLICY "Landlords manage own leases" ON public.leases FOR ALL USING (landlord_id = auth.uid());
CREATE POLICY "Tenants view own leases" ON public.leases FOR SELECT USING (tenant_id = auth.uid());

-- PAYMENTS: payer and payee can see their payments
CREATE POLICY "Payers see own payments" ON public.payments FOR ALL USING (payer_id = auth.uid());
CREATE POLICY "Payees see own payments" ON public.payments FOR SELECT USING (payee_id = auth.uid());

-- ACCOUNTING: owners see their own entries
CREATE POLICY "Owners manage accounting" ON public.accounting_entries FOR ALL USING (owner_id = auth.uid());

-- MAINTENANCE: landlords manage; tenants see their own
CREATE POLICY "Landlords manage maintenance" ON public.maintenance_requests FOR ALL USING (landlord_id = auth.uid());
CREATE POLICY "Tenants view own maintenance" ON public.maintenance_requests FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "Tenants create maintenance" ON public.maintenance_requests FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- VENDORS: public read for verified vendors; vendors manage own
CREATE POLICY "Vendors manage own profile" ON public.vendors FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Anyone view verified vendors" ON public.vendors FOR SELECT USING (verification_status = 'verified');

-- MESSAGES: users see messages to/from them
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT USING (from_id = auth.uid() OR to_id = auth.uid());
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (from_id = auth.uid());

-- AI CONVERSATIONS: landlords see their property inquiries
CREATE POLICY "Landlords manage AI convos" ON public.ai_conversations FOR ALL USING (landlord_id = auth.uid());

-- MANAGEMENT PROFILES: owners manage their own
CREATE POLICY "Owners manage own mgmt profile" ON public.management_profiles FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Anyone can read mgmt profiles" ON public.management_profiles FOR SELECT USING (true);

-- APPLICANTS: landlords manage their applicants
CREATE POLICY "Landlords manage applicants" ON public.applicants FOR ALL USING (landlord_id = auth.uid());

-- SCREENING CRITERIA: owners manage their own
CREATE POLICY "Owners manage screening criteria" ON public.screening_criteria FOR ALL USING (owner_id = auth.uid());

-- DOCUMENTS: owners manage their own
CREATE POLICY "Owners manage documents" ON public.documents FOR ALL USING (owner_id = auth.uid());

-- EVICTION CASES: landlords manage their own
CREATE POLICY "Landlords manage evictions" ON public.eviction_cases FOR ALL USING (landlord_id = auth.uid());
CREATE POLICY "Landlords manage eviction notices" ON public.eviction_notices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.eviction_cases WHERE id = eviction_notices.case_id AND landlord_id = auth.uid())
);

-- FUNDING: applicants see their own; landlords see their tenants' apps
CREATE POLICY "Applicants see own funding" ON public.funding_applications FOR ALL USING (applicant_id = auth.uid());
CREATE POLICY "Landlords see tenant funding" ON public.funding_applications FOR SELECT USING (landlord_id = auth.uid());

-- REFERRALS: referrers see their own
CREATE POLICY "Users manage own referrals" ON public.referrals FOR ALL USING (referrer_id = auth.uid());

-- OWNER STATEMENTS: owners see their own
CREATE POLICY "Owners manage statements" ON public.owner_statements FOR ALL USING (owner_id = auth.uid());

-- AGENT CLIENTS: agents manage their own
CREATE POLICY "Agents manage clients" ON public.agent_clients FOR ALL USING (agent_id = auth.uid());
CREATE POLICY "Agents manage commissions" ON public.agent_commissions FOR ALL USING (agent_id = auth.uid());

-- INSURANCE AGENTS: manage own
CREATE POLICY "Insurance agents manage own" ON public.insurance_agents FOR ALL USING (user_id = auth.uid());

-- ADMIN SETTINGS: admins only
CREATE POLICY "Admins manage settings" ON public.admin_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can read settings" ON public.admin_settings FOR SELECT USING (true);

-- NOTIFICATION PREFERENCES: users manage their own
CREATE POLICY "Users manage notifications" ON public.notification_preferences FOR ALL USING (user_id = auth.uid());

-- SMS LOG: users see their own; admins see all
CREATE POLICY "Users see own SMS" ON public.sms_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins see all SMS" ON public.sms_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- FUNCTIONS: Auto-create profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'landlord')
  );
  -- Auto-create notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON public.leases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_mgmt_profile_updated_at BEFORE UPDATE ON public.management_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_eviction_updated_at BEFORE UPDATE ON public.eviction_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_funding_updated_at BEFORE UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_notification_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
