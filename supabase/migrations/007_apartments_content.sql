-- ═══════════════════════════════════════════════════════════
-- Migrace 007 — Obsah apartmánů z JSON do DB
-- Spustit ručně v Supabase SQL Editoru
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS orientation text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS rooms jsonb;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS subtitle text;

-- ═══════════════════════════════════════════════════════════
-- SEED: Prodejní apartmány (chata-1, chata-2)
-- ═══════════════════════════════════════════════════════════

UPDATE public.apartments SET
  title = 'Apartmán č. 7',
  subtitle = '3NP, 1+kk | 38 m²',
  layout = '1+kk',
  area_m2 = 37.89,
  floor = 3,
  orientation = 'východ',
  description = 'Apartmán vedle schodiště, předsíň s prostorem pro skříň, prostorná koupelna, obývací pokoj s kuchyní orientovaný na východ s výhledem na sjezdovku Labská. Kuchyňská linka bílý design s dřevěným dekorem, Electrolux spotřebiče, podlahové vytápění v koupelně, Laufen a Grohe.',
  features = '["Výhled na sjezdovku Labská","Electrolux spotřebiče","Podlahové vytápění","Laufen a Grohe"]'::jsonb,
  rooms = '{"hall":"6,25 m²","bathroom":"4,34 m²","bedroom":null,"livingKitchen":"27,3 m²"}'::jsonb
WHERE slug = 'chata-1-suite-7';

UPDATE public.apartments SET
  title = 'Apartmán č. 9',
  subtitle = '3NP, 2+kk | 62 m²',
  layout = '2+kk',
  area_m2 = 61.53,
  floor = 3,
  orientation = 'západ, jih',
  description = 'Prostorná chodba 13 m² s místem pro velkou skříň a botník. Ložnice s výhledem na západ. Obývací pokoj 25 m² orientovaný na západ a jih s výhledem do lesů. Kuchyň Electrolux, koupelna s vanou, Laufen a Grohe. Vhodný i pro rodinu s dětmi.',
  features = '["Samostatná ložnice","Koupelna s vanou","Výhled do lesů","Vhodný pro rodinu"]'::jsonb,
  rooms = '{"hall":"11,05 m²","bathroom":"5,33 m²","bedroom":"18,06 m²","livingKitchen":"25,01 m²"}'::jsonb
WHERE slug = 'chata-1-suite-9';

UPDATE public.apartments SET
  title = 'Apartmán č. 11',
  subtitle = '3NP, 1+kk | 35 m²',
  layout = '1+kk',
  area_m2 = 34.7,
  floor = 3,
  orientation = 'západ',
  description = 'Apartmán naproti schodišti, předsíň 2,5 m² s prostorem pro skříň, koupelna s vanou vlevo. Obývací pokoj s kuchyní 34 m² orientovaný na západ s výhledem do přírody. Kuchyň Electrolux, bílá s dekorem dřeva. Podlahové vytápění, Laufen a Grohe. Vhodný pro malou rodinu nebo pár.',
  features = '["Koupelna s vanou","Výhled do přírody","Electrolux kuchyň","Podlahové vytápění"]'::jsonb,
  rooms = '{"hall":"2,53 m²","bathroom":"6,03 m²","bedroom":null,"livingKitchen":"26,14 m²"}'::jsonb
WHERE slug = 'chata-2-suite-11';

-- ═══════════════════════════════════════════════════════════
-- SEED: Pronájmové apartmány (golden-ridge-*)
-- ═══════════════════════════════════════════════════════════

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 1',
  layout = '1+kk',
  area_m2 = 44.74,
  orientation = 'jih, západ',
  max_guests = 4,
  description = 'Nadstandardní ubytování s výhledem na hory, bezplatné Wi-Fi a soukromé parkoviště. Apartmán má obývací část s příjemným posezením a televizí, kompletně vybavenou kuchyň a koupelnu s fénem. Obývák orientovaný na jih, otevřená ložnice na západ oddělená příčkou. Podlahové vytápění, Grohe a Laufen. Designový nábytek KARE.',
  features = '["Výhled na hory","Nábytek KARE","Wi-Fi zdarma","Parkoviště","Kávovar","TV","Podlahové vytápění"]'::jsonb,
  rooms = '{"hall":"4,69 m²","bathroom":"5,62 m²","bedroom":null,"livingKitchen":"34,43 m²"}'::jsonb
WHERE slug = 'golden-ridge-1';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 2',
  layout = '1+kk',
  area_m2 = 44.74,
  orientation = 'západ',
  max_guests = 4,
  description = 'Apartmán s výhledem do lesa, vhodný pro malou rodinu nebo pár. Obývák orientovaný na západ, otevřená ložnice oddělená příčkou. Designový nábytek KARE, myčka, trouba, kávovar, TV, Wi-Fi, trezor.',
  features = '["Výhled do lesa","Nábytek KARE","Myčka","Kávovar","TV","Wi-Fi","Trezor"]'::jsonb,
  rooms = '{"hall":"4,69 m²","bathroom":"5,62 m²","bedroom":null,"livingKitchen":"34,43 m²"}'::jsonb
WHERE slug = 'golden-ridge-2';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 3',
  layout = '1+kk',
  area_m2 = 35.02,
  orientation = 'hory',
  max_guests = 2,
  description = 'Plně vybavený apartmán (35 m²) s kuchyní, vlastní koupelnou a výhledem na hory. Designový nábytek KARE, myčka, trouba, kávovar, TV, Wi-Fi, trezor.',
  features = '["Výhled na hory","Nábytek KARE","Myčka","Kávovar","TV","Wi-Fi","Trezor"]'::jsonb,
  rooms = '{"hall":"3,21 m²","bathroom":"5,97 m²","bedroom":null,"livingKitchen":"25,84 m²"}'::jsonb
WHERE slug = 'golden-ridge-3';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 4',
  layout = '2+kk',
  area_m2 = 60.5,
  orientation = 'západ, jih',
  max_guests = 6,
  description = 'Největší apartmán v Golden Ridge (60 m²). Samostatná ložnice pro 2 osoby, obývací pokoj s rozkládací pohovkou pro 2, plně vybavená kuchyň. Ideální pro rodiny nebo 2 páry. Designový nábytek KARE, myčka, trouba, 2× TV, Wi-Fi, trezor.',
  features = '["Samostatná ložnice","2+kk pro 6 osob","Nábytek KARE","Myčka","2× TV","Wi-Fi","Trezor"]'::jsonb,
  rooms = '{"hall":"5,1 m²","bathroom":"6,9 m²","bedroom":"16,5 m²","livingKitchen":"32,0 m²"}'::jsonb
WHERE slug = 'golden-ridge-4';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 7',
  layout = '1+kk',
  area_m2 = 37.89,
  orientation = 'východ',
  max_guests = 4,
  description = 'Nadstandardní ubytování s výhledem na sjezdovku Labská, bezplatné Wi-Fi a soukromé parkoviště. Obývací pokoj s kuchyní orientovaný na východ. Prostorná koupelna, kuchyňská linka v bílém designu s dřevěným dekorem. Electrolux spotřebiče, podlahové vytápění, Laufen a Grohe. Tento apartmán je také k prodeji.',
  features = '["Výhled na sjezdovku Labská","Electrolux spotřebiče","Podlahové vytápění","Laufen a Grohe","Wi-Fi zdarma","I k prodeji"]'::jsonb,
  rooms = '{"hall":"6,25 m²","bathroom":"4,34 m²","bedroom":null,"livingKitchen":"27,3 m²"}'::jsonb
WHERE slug = 'golden-ridge-7';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 8',
  layout = '2+kk',
  area_m2 = 60.5,
  orientation = 'západ, jih',
  max_guests = 6,
  description = 'Prostorný 2+kk apartmán (60 m²) s terasou s výhledem na hory. Designový nábytek KARE, plně vybavená kuchyň, myčka, dvě TV, Wi-Fi, trezor. Ideální pro rodiny nebo skupinky přátel.',
  features = '["Terasa","Výhled na hory","Nábytek KARE","Myčka","2× TV","Wi-Fi","Trezor"]'::jsonb,
  rooms = '{"hall":"5,1 m²","bathroom":"6,9 m²","bedroom":"16,5 m²","livingKitchen":"32,0 m²"}'::jsonb
WHERE slug = 'golden-ridge-8';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 9',
  layout = '2+kk',
  area_m2 = 61.53,
  orientation = 'západ, jih',
  max_guests = 6,
  description = 'Velký 2+kk apartmán s panoramatickým výhledem na hory a lesy. Prostorná ložnice, obývák s jídelním koutem, designový nábytek KARE. Myčka, trouba, kávovar, 2× TV, Wi-Fi, trezor.',
  features = '["Panoramatický výhled","Samostatná ložnice","Nábytek KARE","Myčka","2× TV","Wi-Fi","Trezor"]'::jsonb,
  rooms = '{"hall":"11,05 m²","bathroom":"5,33 m²","bedroom":"18,06 m²","livingKitchen":"25,01 m²"}'::jsonb
WHERE slug = 'golden-ridge-9';

UPDATE public.apartments SET
  title = 'Golden Ridge apartmán č. 11',
  layout = '1+kk',
  area_m2 = 34.7,
  orientation = 'západ',
  max_guests = 4,
  description = 'Útulný apartmán s výhledem do přírody a lesů. Obývací pokoj s kuchyní orientovaný na západ, koupelna s vanou. Kuchyň Electrolux, designový nábytek, TV, Wi-Fi.',
  features = '["Výhled do přírody","Koupelna s vanou","Electrolux kuchyň","TV","Wi-Fi"]'::jsonb,
  rooms = '{"hall":"2,53 m²","bathroom":"6,03 m²","bedroom":null,"livingKitchen":"26,14 m²"}'::jsonb
WHERE slug = 'golden-ridge-11';
