-- ============================================================
-- 002_booking_engine.sql
-- Booking engine: pricing_rules, blocked_dates, apartment flags
-- ============================================================

-- Přidat chybějící sloupce do apartments
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS for_rent boolean DEFAULT false;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS in_rental_program boolean DEFAULT false;

-- ============================================================
-- PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_per_night_cents int NOT NULL,
  min_nights int DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_rules_select_published"
  ON public.pricing_rules FOR SELECT
  USING (true);

-- ============================================================
-- BLOCKED DATES (per-date, UNIQUE constraint)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text DEFAULT 'BOOKED' CHECK (reason IN ('BOOKED', 'OWNER_BLOCK', 'MAINTENANCE')),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  UNIQUE (apartment_id, date)
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_dates_select_all"
  ON public.blocked_dates FOR SELECT
  USING (true);

-- ============================================================
-- SEED: aktivace pronájmu pro existující apartmány
-- ============================================================
UPDATE public.apartments
SET for_rent = true, in_rental_program = true
WHERE slug IN ('labaska-suite-1', 'labaska-suite-2', 'labaska-suite-3',
               'golden-ridge-1', 'golden-ridge-2', 'golden-ridge-3',
               'golden-ridge-4', 'golden-ridge-7', 'golden-ridge-8',
               'golden-ridge-9', 'golden-ridge-11');

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT SELECT ON public.blocked_dates TO anon, authenticated;
GRANT INSERT, UPDATE ON public.pricing_rules TO authenticated;
GRANT INSERT, DELETE ON public.blocked_dates TO authenticated;
