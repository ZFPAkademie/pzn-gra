-- ─────────────────────────────────────────────────────────────────
-- 005: Channel Manager
-- iCal sync: channel_connections + blocked_dates source tracking
-- ─────────────────────────────────────────────────────────────────

-- Where to fetch iCal feeds from (per apartment, per channel)
CREATE TABLE IF NOT EXISTS channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('booking_com', 'airbnb', 'other')),
  label text,               -- display name, e.g. "Booking.com – Suite 9"
  ical_url text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  last_sync_count int,      -- how many blocks were imported in last sync
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, channel)
);

-- Add source tracking to blocked_dates
ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'owner'
    CHECK (source IN ('owner', 'booking_com', 'airbnb', 'other')),
  ADD COLUMN IF NOT EXISTS external_uid text,
  ADD COLUMN IF NOT EXISTS channel_connection_id uuid REFERENCES channel_connections(id) ON DELETE CASCADE;

-- Index for fast upsert on external_uid
CREATE INDEX IF NOT EXISTS blocked_dates_external_uid_idx
  ON blocked_dates (channel_connection_id, external_uid)
  WHERE external_uid IS NOT NULL;

-- Export tokens: each apartment gets a secret token for its iCal export URL
-- so Booking.com/Airbnb can fetch our calendar without exposing the apartment id
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS ical_export_token text UNIQUE DEFAULT gen_random_uuid()::text;

-- Grant service role access
GRANT ALL ON channel_connections TO service_role;
GRANT SELECT ON channel_connections TO anon, authenticated;
