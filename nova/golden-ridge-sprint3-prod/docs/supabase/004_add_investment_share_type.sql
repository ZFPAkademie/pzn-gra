-- ===========================================
-- Golden Ridge - Migration: Add investment_share_request type
-- Sprint 4: Nemovitostní produkt
-- ===========================================

-- Update the type constraint to include investment_share_request
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_type_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_type_check 
CHECK (type IN ('rent_inquiry', 'sale_inquiry', 'investment_inquiry', 'investment_share_request', 'general_inquiry'));

-- Update the comment
COMMENT ON COLUMN public.leads.type IS 'rent_inquiry, sale_inquiry, investment_inquiry, investment_share_request, or general_inquiry';
