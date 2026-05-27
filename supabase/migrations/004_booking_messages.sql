-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 004 — Booking messages + checkin_info
-- ═══════════════════════════════════════════════════════════════════

-- Přidat checkin_info do bookings (admin nastavuje po potvrzení)
-- { wifi_name, wifi_password, door_code, parking, note }
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS checkin_info jsonb;

-- ───────────────────────────────────────────────────────────────────
-- BOOKING_MESSAGES — zprávy mezi hostem a adminem
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  sender_role   text NOT NULL CHECK (sender_role IN ('guest', 'admin', 'system')),
  sender_name   text,                -- zobrazované jméno (host: fullname, admin: 'Tým PZN')
  content       text NOT NULL,

  read_at       timestamptz,         -- NULL = nepřečteno druhou stranou

  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_messages_booking_id_idx ON public.booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS booking_messages_created_at_idx ON public.booking_messages(booking_id, created_at);

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

-- Přístup přes admin client (service role) — žádné user-level RLS potřeba
-- V budoucnu: owner policy přes portal

-- ───────────────────────────────────────────────────────────────────
-- GRANTS
-- ───────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT ON public.booking_messages TO authenticated;
-- anon nepotřebuje — vše jde přes API routes s admin clientem
