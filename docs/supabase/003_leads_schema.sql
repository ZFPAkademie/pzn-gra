-- ===========================================
-- Golden Ridge - Leads Schema
-- Production v1: Lead Capture System
-- ===========================================

-- Drop existing tables if needed (for fresh setup)
-- DROP TABLE IF EXISTS public.leads CASCADE;

-- ===========================================
-- LEADS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead type and source
  type TEXT NOT NULL CHECK (type IN ('rent_inquiry', 'sale_inquiry', 'investment_inquiry', 'general_inquiry')),
  apartment_slug TEXT,
  apartment_title TEXT,
  source_url TEXT,
  
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Message
  message TEXT,
  
  -- Preferences (for rent inquiries)
  preferred_dates TEXT,
  guest_count INTEGER,
  
  -- Consent
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_type ON public.leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_apartment_slug ON public.leads(apartment_slug);

-- Updated at trigger
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
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (public form)
CREATE POLICY "Anyone can insert leads"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only service role can read/update leads (admin)
CREATE POLICY "Service role can manage leads"
  ON public.leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.leads IS 'Lead capture from public forms';
COMMENT ON COLUMN public.leads.type IS 'rent_inquiry, sale_inquiry, investment_inquiry, or general_inquiry';
COMMENT ON COLUMN public.leads.status IS 'new, in_progress, closed, or spam';
