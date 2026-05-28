-- ===========================================
-- Golden Ridge - COMPLETE PRODUCTION SQL
-- Run this in Supabase SQL Editor
-- ===========================================

-- ===========================================
-- 1. LEADS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead type (includes Sprint 4: investment_share_request)
  type TEXT NOT NULL CHECK (type IN (
    'rent_inquiry', 
    'sale_inquiry', 
    'investment_inquiry', 
    'investment_share_request', 
    'general_inquiry'
  )),
  
  -- Source info
  apartment_slug TEXT,
  apartment_title TEXT,
  source_url TEXT,
  
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Message & preferences
  message TEXT,
  preferred_dates TEXT,
  guest_count INTEGER,
  
  -- Consent (GDPR)
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed', 'spam')),
  notes TEXT,
  
  -- Metadata
  language TEXT DEFAULT 'cs',
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================
-- 2. INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_type ON public.leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- ===========================================
-- 3. AUTO-UPDATE TIMESTAMP TRIGGER
-- ===========================================

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- ===========================================
-- 4. ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public can insert (contact forms)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role can do everything (admin API)
DROP POLICY IF EXISTS "Service role can manage leads" ON public.leads;
CREATE POLICY "Service role can manage leads"
  ON public.leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- DONE! Verify with:
-- ===========================================
-- SELECT * FROM public.leads LIMIT 1;
