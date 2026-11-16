-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 026 — Více majitelů u apartmánu (M:N)
-- Projekt: Pod Zlatým návrším
-- Datum: 2026-11-16
--
-- Proč: manželé = dva majitelé (každý vlastní přihlášení do portálu)
-- u jednoho apartmánu; jeden majitel může mít víc apartmánů.
--
-- Zdroj pravdy = apartment_owners. Sloupec apartments.owner_id zůstává
-- (evoluční migrace) a aplikace do něj dál píše prvního majitele,
-- ale nic z něj nečte.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apartment_owners (
  apartment_id  uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  owner_id      uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (apartment_id, owner_id)
);

CREATE INDEX IF NOT EXISTS apartment_owners_owner_id_idx ON public.apartment_owners(owner_id);

-- Přístup jen přes admin client (DB-01), žádný veřejný ani owner přístup
ALTER TABLE public.apartment_owners ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.apartment_owners FROM anon, authenticated;
GRANT ALL ON TABLE public.apartment_owners TO service_role;

-- Převod stávajících vazeb 1:N
INSERT INTO public.apartment_owners (apartment_id, owner_id)
SELECT id, owner_id FROM public.apartments WHERE owner_id IS NOT NULL
ON CONFLICT DO NOTHING;
