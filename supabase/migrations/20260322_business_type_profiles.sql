-- Add business_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT
  DEFAULT 'general_business'
  CHECK (business_type IN (
    'landlord','contractor','hairstylist','attorney','accountant',
    'insurance_agent','marketing_agency','restaurant',
    'real_estate_agent','retailer','general_business'
  ));

CREATE INDEX IF NOT EXISTS idx_profiles_business_type ON profiles(business_type);
