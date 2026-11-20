-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 028 — Firma majitele
-- Projekt: Pod Zlatým návrším
-- Datum: 2026-11-20
--
-- Proč: apartmány většinou právně vlastní společnost (s.r.o.), majitel
-- v evidenci je kontaktní osoba s přístupem do portálu. Firma se váže
-- k majiteli (ne k apartmánu) — manželé mají každý svůj záznam, firmu
-- vyplní u obou. Údaje lze načíst z ARES podle IČO.
-- Pojmenování jako coop_contacts (021): company_name, company_id = IČO.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS company_name    text,
  ADD COLUMN IF NOT EXISTS company_id      text,   -- IČO
  ADD COLUMN IF NOT EXISTS company_vat_id  text,   -- DIČ
  ADD COLUMN IF NOT EXISTS company_address text;   -- sídlo

COMMENT ON COLUMN public.owners.company_name IS 'Společnost, která apartmán vlastní (majitel = kontaktní osoba)';
COMMENT ON COLUMN public.owners.company_id IS 'IČO společnosti';
COMMENT ON COLUMN public.owners.company_vat_id IS 'DIČ společnosti';
COMMENT ON COLUMN public.owners.company_address IS 'Sídlo společnosti';
