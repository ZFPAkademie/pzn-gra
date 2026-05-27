-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 001 — Owner Portal Foundation
-- Projekt: Pod Zlatým návrším
-- Datum: 2026-05-27
--
-- Spustit ručně v Supabase SQL Editoru.
-- Evoluční migrace — žádný DROP, žádná ztráta dat.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. OWNERS
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.owners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Kontakt
  name              text NOT NULL DEFAULT '',
  email             text NOT NULL DEFAULT '',
  phone             text,

  -- Finance (bank_account šifrovat před Stripe Connect produkcí)
  bank_account      text,
  commission_rate   decimal(5,4),  -- např. 0.2000 = 20%

  -- Status
  is_active         boolean NOT NULL DEFAULT true,

  -- Audit
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexy
CREATE INDEX IF NOT EXISTS owners_user_id_idx ON public.owners(user_id);
CREATE INDEX IF NOT EXISTS owners_email_idx ON public.owners(email);

-- RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "owners_select_own" ON public.owners;
CREATE POLICY "owners_select_own" ON public.owners
  FOR SELECT USING (auth.uid() = user_id);

-- Admin client (service role) obchází RLS — žádná admin policy nutná


-- ───────────────────────────────────────────────────────────────────
-- 2. APARTMENTS — přidat owner_id a visibility flags
--    (tabulka může již existovat z budoucích migrací, ALTER je bezpečný)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.apartments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,
  building            text,
  unit                text,
  layout              text,
  area_m2             decimal(6,2),
  floor               int,

  -- Vlastnictví
  owner_id            uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'reserved', 'sold')),

  -- Visibility flags (admin nastavuje)
  for_sale            boolean NOT NULL DEFAULT false,
  for_rent            boolean NOT NULL DEFAULT false,
  in_rental_program   boolean NOT NULL DEFAULT false,

  -- Metadata
  features            jsonb,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS apartments_owner_id_idx ON public.apartments(owner_id);
CREATE INDEX IF NOT EXISTS apartments_slug_idx ON public.apartments(slug);

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

-- Veřejný read pro for_rent / for_sale (web)
DROP POLICY IF EXISTS "apartments_public_read" ON public.apartments;
CREATE POLICY "apartments_public_read" ON public.apartments
  FOR SELECT USING (for_sale = true OR for_rent = true);

-- Owner vidí svůj apartmán (i když není veřejně viditelný)
DROP POLICY IF EXISTS "apartments_owner_read" ON public.apartments;
CREATE POLICY "apartments_owner_read" ON public.apartments
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM public.owners WHERE user_id = auth.uid()
    )
  );


-- ───────────────────────────────────────────────────────────────────
-- 3. OWNER_DOCUMENTS — dokumenty k apartmánu (kupní smlouvy, protokoly)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.owner_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  apartment_id    uuid REFERENCES public.apartments(id) ON DELETE SET NULL,

  category        text NOT NULL DEFAULT 'other'
                  CHECK (category IN ('purchase_contract', 'handover_protocol', 'insurance', 'other')),
  title           text NOT NULL,
  file_path       text NOT NULL,  -- Supabase Storage path
  file_size_bytes int,
  mime_type       text,

  uploaded_by     text NOT NULL DEFAULT 'admin'
                  CHECK (uploaded_by IN ('admin', 'owner')),

  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS owner_documents_owner_id_idx ON public.owner_documents(owner_id);

ALTER TABLE public.owner_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_documents_select_own" ON public.owner_documents;
CREATE POLICY "owner_documents_select_own" ON public.owner_documents
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

-- Owner může uploadovat vlastní dokumenty
DROP POLICY IF EXISTS "owner_documents_insert_own" ON public.owner_documents;
CREATE POLICY "owner_documents_insert_own" ON public.owner_documents
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
    AND uploaded_by = 'owner'
  );


-- ───────────────────────────────────────────────────────────────────
-- 4. MAINTENANCE_REQUESTS — owner hlásí závadu
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  apartment_id    uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,

  title           text NOT NULL,
  description     text,

  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'resolved')),
  priority        text NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low', 'normal', 'urgent')),

  admin_note      text,
  resolved_at     timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_owner_id_idx ON public.maintenance_requests(owner_id);
CREATE INDEX IF NOT EXISTS maintenance_status_idx ON public.maintenance_requests(status);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maintenance_select_own" ON public.maintenance_requests;
CREATE POLICY "maintenance_select_own" ON public.maintenance_requests
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "maintenance_insert_own" ON public.maintenance_requests;
CREATE POLICY "maintenance_insert_own" ON public.maintenance_requests
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );


-- ───────────────────────────────────────────────────────────────────
-- 5. BLOCKED_DATES — owner blokuje termíny pro vlastní použití
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  owner_id        uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,

  start_date      date NOT NULL,
  end_date        date NOT NULL,
  reason          text NOT NULL DEFAULT 'owner_use'
                  CHECK (reason IN ('owner_use', 'maintenance', 'other')),
  note            text,

  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT blocked_dates_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS blocked_dates_apartment_idx ON public.blocked_dates(apartment_id);
CREATE INDEX IF NOT EXISTS blocked_dates_dates_idx ON public.blocked_dates(apartment_id, start_date, end_date);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_dates_select_own" ON public.blocked_dates;
CREATE POLICY "blocked_dates_select_own" ON public.blocked_dates
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "blocked_dates_insert_own" ON public.blocked_dates;
CREATE POLICY "blocked_dates_insert_own" ON public.blocked_dates
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "blocked_dates_delete_own" ON public.blocked_dates;
CREATE POLICY "blocked_dates_delete_own" ON public.blocked_dates
  FOR DELETE USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );


-- ───────────────────────────────────────────────────────────────────
-- 6. SVJ TABULKY
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.svj_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid REFERENCES public.owners(id) ON DELETE SET NULL,

  type        text NOT NULL DEFAULT 'announcement'
              CHECK (type IN ('announcement', 'discussion', 'poll', 'document')),
  title       text NOT NULL,
  content     text,

  is_pinned   boolean NOT NULL DEFAULT false,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS svj_posts_type_idx ON public.svj_posts(type);
CREATE INDEX IF NOT EXISTS svj_posts_created_at_idx ON public.svj_posts(created_at DESC);

ALTER TABLE public.svj_posts ENABLE ROW LEVEL SECURITY;

-- Všichni owners vidí posty (nástěnka)
DROP POLICY IF EXISTS "svj_posts_select_owners" ON public.svj_posts;
CREATE POLICY "svj_posts_select_owners" ON public.svj_posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid() AND is_active = true)
  );


CREATE TABLE IF NOT EXISTS public.svj_poll_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES public.svj_posts(id) ON DELETE CASCADE,
  owner_id    uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  option_key  text NOT NULL,  -- klíč z options jsonb v svj_posts
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (post_id, owner_id)  -- jeden owner = jeden hlas per poll (gotcha z CLAUDE.md)
);

ALTER TABLE public.svj_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "svj_poll_votes_select" ON public.svj_poll_votes;
CREATE POLICY "svj_poll_votes_select" ON public.svj_poll_votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.owners WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "svj_poll_votes_insert_own" ON public.svj_poll_votes;
CREATE POLICY "svj_poll_votes_insert_own" ON public.svj_poll_votes
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );

-- Smazat vlastní hlas (změna hlasu = delete + insert)
DROP POLICY IF EXISTS "svj_poll_votes_delete_own" ON public.svj_poll_votes;
CREATE POLICY "svj_poll_votes_delete_own" ON public.svj_poll_votes
  FOR DELETE USING (
    owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())
  );


-- ───────────────────────────────────────────────────────────────────
-- 7. AUDIT_LOG — centrální audit trail (spíše připravit, aktivovat postupně)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  text NOT NULL,
  record_id   uuid,
  action      text NOT NULL,  -- 'created', 'updated', 'deleted', 'status_changed'
  old_data    jsonb,
  new_data    jsonb,
  actor_role  text,           -- 'owner', 'admin', 'system'
  user_id     uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Jen service role může zapisovat (přes admin client)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read via service role — žádná user-facing policy


-- ───────────────────────────────────────────────────────────────────
-- 8. GRANT — důležité! Bez tohoto anon/authenticated tiše selžou (ERR-01)
-- ───────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.apartments TO anon;
GRANT SELECT, INSERT, UPDATE ON public.owners TO authenticated;
GRANT SELECT, INSERT ON public.owner_documents TO authenticated;
GRANT SELECT, INSERT ON public.maintenance_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_dates TO authenticated;
GRANT SELECT ON public.svj_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.svj_poll_votes TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;


-- ═══════════════════════════════════════════════════════════════════
-- SEED DAT — volitelné testovací záznamy
-- Odkomentovat pro development, NEPOUŠTĚT na produkci
-- ═══════════════════════════════════════════════════════════════════

-- INSERT INTO public.owners (name, email, phone, is_active)
-- VALUES ('Jan Novák', 'jan@example.com', '+420 777 000 000', true);
