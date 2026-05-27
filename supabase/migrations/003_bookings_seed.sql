-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 003 — Bookings tabulka + seed apartmánů
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. Přidat chybějící sloupce do apartments
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS base_price_cents int NOT NULL DEFAULT 250000;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS max_guests int NOT NULL DEFAULT 4;

-- ───────────────────────────────────────────────────────────────────
-- 2. BOOKINGS
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id                uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,

  -- Host
  guest_first_name            text NOT NULL,
  guest_last_name             text NOT NULL,
  guest_email                 text NOT NULL,
  guest_phone                 text,
  guests_count                int NOT NULL DEFAULT 1,

  -- Termín
  check_in                    date NOT NULL,
  check_out                   date NOT NULL,
  nights                      int NOT NULL,

  -- Finance (haléře CZK)
  total_amount_cents          int NOT NULL,
  currency                    text NOT NULL DEFAULT 'CZK',

  -- Platba
  payment_method              text NOT NULL DEFAULT 'bank_transfer'
                              CHECK (payment_method IN ('bank_transfer', 'stripe')),
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  paid_at                     timestamptz,

  -- Status
  status                      text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  -- Reference
  confirmation_token          text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes                       text,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_apartment_id_idx   ON public.bookings(apartment_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx         ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_token_idx          ON public.bookings(confirmation_token);
CREATE INDEX IF NOT EXISTS bookings_dates_idx          ON public.bookings(apartment_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS bookings_guest_email_idx    ON public.bookings(guest_email);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Owner vidí rezervace svého apartmánu
DROP POLICY IF EXISTS "bookings_owner_select" ON public.bookings;
CREATE POLICY "bookings_owner_select" ON public.bookings
  FOR SELECT USING (
    apartment_id IN (
      SELECT a.id FROM public.apartments a
      JOIN public.owners o ON o.id = a.owner_id
      WHERE o.user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────────────────────────────
-- 3. SEED — pronájmy (golden-ridge)
-- ───────────────────────────────────────────────────────────────────
INSERT INTO public.apartments (slug, title, unit, layout, for_sale, for_rent, in_rental_program, status, base_price_cents, max_guests)
VALUES
  ('golden-ridge-1',  'Golden Ridge apartmán č. 1',  '1',  '1+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-2',  'Golden Ridge apartmán č. 2',  '2',  '1+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-3',  'Golden Ridge apartmán č. 3',  '3',  '1+kk', false, true, true, 'sold', 250000, 2),
  ('golden-ridge-4',  'Golden Ridge apartmán č. 4',  '4',  '2+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-7',  'Golden Ridge apartmán č. 7',  '7',  '1+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-8',  'Golden Ridge apartmán č. 8',  '8',  '2+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-9',  'Golden Ridge apartmán č. 9',  '9',  '2+kk', false, true, true, 'sold', 250000, 4),
  ('golden-ridge-11', 'Golden Ridge apartmán č. 11', '11', '1+kk', false, true, true, 'sold', 250000, 4)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  for_rent          = true,
  in_rental_program = true,
  base_price_cents  = EXCLUDED.base_price_cents,
  max_guests        = EXCLUDED.max_guests;

-- ───────────────────────────────────────────────────────────────────
-- 4. SEED — prodej
-- ───────────────────────────────────────────────────────────────────
INSERT INTO public.apartments (slug, title, unit, layout, for_sale, for_rent, in_rental_program, status)
VALUES
  ('chata-1-suite-7',  'Apartmán č. 7',  '7',  '1+kk', true, false, false, 'available'),
  ('chata-1-suite-9',  'Apartmán č. 9',  '9',  '2+kk', true, false, false, 'available'),
  ('chata-2-suite-11', 'Apartmán č. 11', '11', '1+kk', true, false, false, 'available')
ON CONFLICT (slug) DO UPDATE SET
  title    = EXCLUDED.title,
  for_sale = true;

-- ───────────────────────────────────────────────────────────────────
-- 5. GRANTS
-- ───────────────────────────────────────────────────────────────────
GRANT SELECT ON public.bookings TO authenticated;
-- anon nepotřebuje přímý přístup, API routes používají admin client
