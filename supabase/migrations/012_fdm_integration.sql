-- ─────────────────────────────────────────────────────────────────
-- 012: Front Desk Master (FDM) integrace — 12. 10. 2026
-- FDM je master PMS: dostupnost + ceny se čtou z FDM, rezervace z webu
-- se do FDM zapisují. Viz FDM_INTEGRATION_REFERENCE.md (lokální).
-- ─────────────────────────────────────────────────────────────────

-- 1) Mapování apartmán ↔ typ pokoje v FDM (RoomUseId)
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS fdm_room_use_id int UNIQUE;

UPDATE public.apartments SET fdm_room_use_id = v.room_use_id
FROM (VALUES
  ('golden-ridge-1', 18),
  ('golden-ridge-2', 10),
  ('golden-ridge-3', 12),
  ('golden-ridge-4', 15),
  ('golden-ridge-7', 22),
  ('golden-ridge-8', 13),
  ('golden-ridge-9', 11),
  ('golden-ridge-11', 14),
  ('chata-1-suite-7', 19)
) AS v(slug, room_use_id)
WHERE apartments.slug = v.slug AND apartments.fdm_room_use_id IS NULL;

-- 2) Cache kalendáře FDM: jeden řádek = apartmán + den
CREATE TABLE IF NOT EXISTS public.fdm_calendar (
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  date date NOT NULL,
  available boolean NOT NULL DEFAULT false,
  price_cents int,                       -- Standard Rate, v měně currency
  currency text NOT NULL DEFAULT 'EUR',
  min_stay int,                          -- MinStayArrival z FDM restrictions
  closed boolean NOT NULL DEFAULT false, -- Closed / ClosedOnArrival
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (apartment_id, date)
);

ALTER TABLE public.fdm_calendar ENABLE ROW LEVEL SECURITY;
-- Čte jen server přes service_role; anon/authenticated nemají přístup.
GRANT ALL ON public.fdm_calendar TO service_role;
REVOKE ALL ON public.fdm_calendar FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS fdm_calendar_date_idx ON public.fdm_calendar (date);

-- 3) Stav synchronizace jednotlivých synchronizací (pro admin přehled)
CREATE TABLE IF NOT EXISTS public.fdm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  apartments int NOT NULL DEFAULT 0,
  days int NOT NULL DEFAULT 0,
  error text
);
ALTER TABLE public.fdm_sync_log ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fdm_sync_log TO service_role;
REVOKE ALL ON public.fdm_sync_log FROM anon, authenticated;

-- 4) Rezervace z webu → stav zápisu do FDM
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fdm_reservation_code text,
  ADD COLUMN IF NOT EXISTS fdm_guest_account_id text,
  ADD COLUMN IF NOT EXISTS fdm_sync_status text NOT NULL DEFAULT 'skipped'
    CHECK (fdm_sync_status IN ('pending', 'synced', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS fdm_sync_error text,
  ADD COLUMN IF NOT EXISTS fdm_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_fdm_reservation_code_idx
  ON public.bookings (fdm_reservation_code) WHERE fdm_reservation_code IS NOT NULL;
