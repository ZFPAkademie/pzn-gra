-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 021 — Družstvo: evidence zájemců a vlastníků družstevních podílů
--
-- coop_contacts        kontakt (zájemce / vlastník), stav, počet podílů, obchodní údaje
-- coop_contact_files   přílohy (PDF, DOCX, JPG, PNG) v bucketu dokumenty pod druzstvo/{id}/
-- coop_contact_events  historie: založení, změny stavu, telefonáty, schůzky, poznámky
--
-- Počet volných podílů na /podil = 50 − součet share_count ve stavech
-- reservation + owner (bez archivovaných). Trigger hlídá, aby součet nepřesáhl 50.
-- Přístup výhradně přes service role (server actions za admin loginem).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.coop_contacts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status              text NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'contacted', 'reservation', 'owner', 'cancelled')),

  -- Osoba
  first_name          text NOT NULL,
  last_name           text,
  email               text,
  phone               text,
  street              text,
  city                text,
  postal_code         text,
  country             text,
  birth_date          date,

  -- Firma (kupuje-li právnická osoba)
  company_name        text,
  company_id          text,   -- IČO

  -- Obchod
  share_count         int CHECK (share_count IS NULL OR share_count BETWEEN 1 AND 50),
  source              text NOT NULL DEFAULT 'other'
                        CHECK (source IN ('web', 'referral', 'advisor', 'other')),
  referred_by         text,
  assigned_to         text,
  next_step           text,
  next_step_date      date,
  reserved_at         date,
  contract_signed_at  date,
  paid_at             date,
  paid_amount         numeric(12, 2),

  -- Souhlasy
  gdpr_consent        boolean NOT NULL DEFAULT false,
  gdpr_consent_at     timestamptz,
  marketing_consent   boolean NOT NULL DEFAULT false,

  notes               text,
  language            text,
  lead_id             uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  archived_at         timestamptz,

  -- Rezervace a vlastník musí mít počet podílů
  CONSTRAINT coop_contacts_shares_required
    CHECK (status NOT IN ('reservation', 'owner') OR share_count IS NOT NULL)
);

ALTER TABLE public.coop_contacts ENABLE ROW LEVEL SECURITY;
-- Žádné policies — přístup výhradně přes service role
REVOKE ALL ON TABLE public.coop_contacts FROM anon, authenticated;
GRANT ALL ON TABLE public.coop_contacts TO service_role;

CREATE INDEX IF NOT EXISTS coop_contacts_status_idx ON public.coop_contacts (status) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS coop_contacts_created_idx ON public.coop_contacts (created_at DESC);
-- Jedna poptávka z webu = nejvýš jeden kontakt (idempotence při opakovaném zpracování)
CREATE UNIQUE INDEX IF NOT EXISTS coop_contacts_lead_uniq ON public.coop_contacts (lead_id) WHERE lead_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- Kapacita 50 podílů — kontrola v DB, ne jen v aplikaci
-- Advisory lock serializuje souběžné zápisy (dva admini naráz).
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.coop_check_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  taken int;
BEGIN
  IF NEW.archived_at IS NULL AND NEW.status IN ('reservation', 'owner') THEN
    PERFORM pg_advisory_xact_lock(hashtext('coop_contacts_capacity'));
    SELECT COALESCE(SUM(share_count), 0) INTO taken
      FROM public.coop_contacts
     WHERE archived_at IS NULL
       AND status IN ('reservation', 'owner')
       AND id <> NEW.id;
    IF taken + COALESCE(NEW.share_count, 0) > 50 THEN
      RAISE EXCEPTION 'COOP_CAPACITY:%', 50 - taken USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.coop_check_capacity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS coop_contacts_capacity ON public.coop_contacts;
CREATE TRIGGER coop_contacts_capacity
  BEFORE INSERT OR UPDATE OF status, share_count, archived_at ON public.coop_contacts
  FOR EACH ROW EXECUTE FUNCTION public.coop_check_capacity();

-- ───────────────────────────────────────────────────────────────────
-- Přílohy
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coop_contact_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       uuid NOT NULL REFERENCES public.coop_contacts(id) ON DELETE CASCADE,
  category         text NOT NULL DEFAULT 'other'
                     CHECK (category IN ('application', 'contract', 'id_document', 'payment', 'other')),
  title            text NOT NULL,
  file_path        text NOT NULL UNIQUE,
  file_size_bytes  bigint,
  mime_type        text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coop_contact_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coop_contact_files FROM anon, authenticated;
GRANT ALL ON TABLE public.coop_contact_files TO service_role;

CREATE INDEX IF NOT EXISTS coop_contact_files_contact_idx ON public.coop_contact_files (contact_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────
-- Historie
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coop_contact_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   uuid NOT NULL REFERENCES public.coop_contacts(id) ON DELETE CASCADE,
  kind         text NOT NULL
                 CHECK (kind IN ('created', 'status', 'note', 'call', 'meeting', 'email',
                                 'file_added', 'file_removed', 'archived', 'restored')),
  body         text,
  old_status   text,
  new_status   text,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coop_contact_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.coop_contact_events FROM anon, authenticated;
GRANT ALL ON TABLE public.coop_contact_events TO service_role;

CREATE INDEX IF NOT EXISTS coop_contact_events_contact_idx ON public.coop_contact_events (contact_id, occurred_at DESC);
