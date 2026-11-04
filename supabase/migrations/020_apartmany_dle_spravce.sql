-- 020 — Parametry apartmánů podle tabulky správce rezervací, 4. 11. 2026
-- Zdroj pravdy: tabulka správce (House, Flat, Floor, type, Size, Sofa, Shower/Bath, obsazenost).
-- Obsazenost: 2+0 → max 2, „2+1 (2)“ → max 3 (rozhodnutí uživatele), 2+2 → max 4.
-- Dispozice: Studio / Apartment-open → 1+kk, Apartment-2kk → 2+kk.
-- Popisy převzaté ze starých inzerátů, které tabulce odporovaly (60 m², ložnice, pro 6, terasa),
-- přepsané fakticky (cs/en/pl). Podílový záznam chata-2-suite-7 beze změny (právní texty /podil).

-- 1) Nové sloupce
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS extra_beds smallint,      -- místa na rozkládací pohovce (0 = bez pohovky)
  ADD COLUMN IF NOT EXISTS bathroom text,            -- 'shower' | 'bath'
  ADD COLUMN IF NOT EXISTS floors_total smallint;    -- počet nadzemních podlaží budovy

DO $$ BEGIN
  ALTER TABLE public.apartments
    ADD CONSTRAINT apartments_bathroom_check CHECK (bathroom IS NULL OR bathroom IN ('shower', 'bath'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT (extra_beds, bathroom, floors_total) ON public.apartments TO anon, authenticated;

-- 2) Strukturovaná data z tabulky
UPDATE apartments a SET
  floor = v.floor,
  floors_total = 3,
  extra_beds = v.extra_beds,
  max_guests = 2 + v.extra_beds,
  bathroom = v.bathroom,
  layout = v.layout,
  area_m2 = COALESCE(v.area_m2, a.area_m2),
  updated_at = now()
FROM (VALUES
  -- slug,              floor, extra, bathroom, layout, area (NULL = ponechat přesnou z DB, sedí ±1 m²)
  ('chata-1-suite-7',   3, 0, 'shower', '1+kk', NULL::numeric),
  ('chata-1-suite-2',   1, 1, 'shower', '1+kk', 37),
  ('golden-ridge-11',   3, 1, 'bath',   '1+kk', NULL),
  ('chata-2-suite-11',  3, 1, 'bath',   '1+kk', NULL),
  ('golden-ridge-3',    1, 2, 'bath',   '1+kk', NULL),
  ('golden-ridge-7',    2, 2, 'bath',   '1+kk', 35),
  ('golden-ridge-8',    3, 2, 'bath',   '1+kk', 38),
  ('golden-ridge-4',    2, 2, 'bath',   '1+kk', 38),
  ('golden-ridge-2',    1, 2, 'shower', '1+kk', NULL),
  ('golden-ridge-9',    3, 2, 'bath',   '1+kk', 44),
  ('golden-ridge-1',    1, 2, 'shower', '2+kk', 59)
) AS v(slug, floor, extra_beds, bathroom, layout, area_m2)
WHERE a.slug = v.slug;

UPDATE apartments SET subtitle = '1NP, 1+kk | 37 m²' WHERE slug = 'chata-1-suite-2';

-- 3) Členění místností patřilo k jiným plochám → skrýt (sekce se při NULL nezobrazí)
UPDATE apartments SET rooms = NULL
WHERE slug IN ('chata-1-suite-2', 'golden-ridge-1', 'golden-ridge-4', 'golden-ridge-7', 'golden-ridge-8', 'golden-ridge-9');

-- 4) Vlastnosti, které tabulce odporují
UPDATE apartments SET
  features    = features    - 'Samostatná ložnice' - '2+kk pro 6 osob' - '2× TV' - 'Terasa',
  features_en = features_en - 'Separate bedroom' - 'One-bedroom (2+kk) for 6 guests' - '2 TVs' - 'Terrace',
  features_pl = features_pl - 'Oddzielna sypialnia' - '2+kk dla 6 osób' - '2 telewizory' - 'Taras'
WHERE slug IN ('golden-ridge-4', 'golden-ridge-8', 'golden-ridge-9');

-- B2A7 měl vlastnosti zkopírované z B1A7 (výhled na Labskou, Laufen…) — ponecháno jen „I k prodeji“
UPDATE apartments SET
  features    = '["Koupelna s vanou", "Rozkládací pohovka pro 2", "Plně vybavená kuchyň", "Wi-Fi", "I k prodeji"]'::jsonb,
  features_en = '["Bathroom with bathtub", "Sofa bed for 2", "Fully equipped kitchen", "Wi-Fi", "Also for sale"]'::jsonb,
  features_pl = '["Łazienka z wanną", "Rozkładana sofa dla 2 osób", "W pełni wyposażona kuchnia", "Wi-Fi", "Również na sprzedaż"]'::jsonb
WHERE slug = 'golden-ridge-7';

UPDATE apartments SET
  features    = features    || '["Samostatná ložnice"]'::jsonb,
  features_en = features_en || '["Separate bedroom"]'::jsonb,
  features_pl = features_pl || '["Oddzielna sypialnia"]'::jsonb
WHERE slug = 'golden-ridge-1' AND NOT features ? 'Samostatná ložnice';

-- 5) Popisy
UPDATE apartments a SET
  description = v.cs, description_en = v.en, description_pl = v.pl, updated_at = now()
FROM (VALUES
  ('chata-1-suite-2',
   'Studio o 37 m² v 1. NP budovy B1. Obytný prostor s kuchyňským koutem, manželská postel pro 2 osoby a rozkládací pohovka pro třetího hosta. Koupelna se sprchovým koutem. V suterénu lyžárna s boxy.',
   'A 37 m² studio on the first level of building B1. Living space with a kitchenette, a double bed for 2 and a sofa bed for a third guest. Bathroom with a walk-in shower. Ski room with lockers on the lower ground floor.',
   'Studio o powierzchni 37 m² na pierwszej kondygnacji budynku B1. Część dzienna z aneksem kuchennym, łóżko małżeńskie dla 2 osób i rozkładana sofa dla trzeciego gościa. Łazienka z prysznicem. Narciarnia ze schowkami w suterenie.'),
  ('golden-ridge-1',
   'Největší apartmán v nabídce: 2+kk o 59 m² v 1. NP. Samostatná ložnice s manželskou postelí, obývací pokoj s plně vybavenou kuchyní a rozkládací pohovkou pro 2 osoby. Koupelna se sprchovým koutem. Pro 4 osoby. Designový nábytek KARE, podlahové vytápění, Wi-Fi.',
   'The largest apartment we offer: a 59 m² one-bedroom apartment on the first level. Separate bedroom with a double bed, living room with a fully equipped kitchen and a sofa bed for 2. Bathroom with a walk-in shower. Sleeps 4. KARE designer furniture, underfloor heating, Wi-Fi.',
   'Największy apartament w ofercie: 2+kk o powierzchni 59 m² na pierwszej kondygnacji. Oddzielna sypialnia z łóżkiem małżeńskim, salon z w pełni wyposażoną kuchnią i rozkładaną sofą dla 2 osób. Łazienka z prysznicem. Dla 4 osób. Designerskie meble KARE, ogrzewanie podłogowe, Wi-Fi.'),
  ('golden-ridge-4',
   'Studio o 38 m² ve 2. NP. Manželská postel, rozkládací pohovka pro 2 osoby a plně vybavený kuchyňský kout. Koupelna s vanou. Pro 4 osoby. Designový nábytek KARE, myčka, trouba, TV, Wi-Fi, trezor.',
   'A 38 m² studio on the second level. Double bed, sofa bed for 2 and a fully equipped kitchenette. Bathroom with a bathtub. Sleeps 4. KARE designer furniture, dishwasher, oven, TV, Wi-Fi, safe.',
   'Studio o powierzchni 38 m² na drugiej kondygnacji. Łóżko małżeńskie, rozkładana sofa dla 2 osób i w pełni wyposażony aneks kuchenny. Łazienka z wanną. Dla 4 osób. Designerskie meble KARE, zmywarka, piekarnik, TV, Wi-Fi, sejf.'),
  ('golden-ridge-7',
   'Studio o 35 m² ve 2. NP. Manželská postel, rozkládací pohovka pro 2 osoby a plně vybavený kuchyňský kout. Koupelna s vanou. Pro 4 osoby. Wi-Fi.',
   'A 35 m² studio on the second level. Double bed, sofa bed for 2 and a fully equipped kitchenette. Bathroom with a bathtub. Sleeps 4. Wi-Fi.',
   'Studio o powierzchni 35 m² na drugiej kondygnacji. Łóżko małżeńskie, rozkładana sofa dla 2 osób i w pełni wyposażony aneks kuchenny. Łazienka z wanną. Dla 4 osób. Wi-Fi.'),
  ('golden-ridge-8',
   'Studio o 38 m² ve 3. NP s výhledem na hory. Manželská postel, rozkládací pohovka pro 2 osoby a plně vybavený kuchyňský kout. Koupelna s vanou. Pro 4 osoby. Designový nábytek KARE, myčka, TV, Wi-Fi, trezor.',
   'A 38 m² studio on the third level with mountain views. Double bed, sofa bed for 2 and a fully equipped kitchenette. Bathroom with a bathtub. Sleeps 4. KARE designer furniture, dishwasher, TV, Wi-Fi, safe.',
   'Studio o powierzchni 38 m² na trzeciej kondygnacji z widokiem na góry. Łóżko małżeńskie, rozkładana sofa dla 2 osób i w pełni wyposażony aneks kuchenny. Łazienka z wanną. Dla 4 osób. Designerskie meble KARE, zmywarka, TV, Wi-Fi, sejf.'),
  ('golden-ridge-9',
   'Otevřený apartmán o 44 m² ve 3. NP s výhledem na hory a lesy. Obytná a spací část v jednom prostoru: manželská postel, rozkládací pohovka pro 2 osoby, jídelní kout a plně vybavená kuchyň. Koupelna s vanou. Pro 4 osoby. Designový nábytek KARE, myčka, trouba, kávovar, TV, Wi-Fi, trezor.',
   'A 44 m² open-plan apartment on the third level with views of the mountains and forest. Living and sleeping areas in one space: double bed, sofa bed for 2, dining corner and a fully equipped kitchen. Bathroom with a bathtub. Sleeps 4. KARE designer furniture, dishwasher, oven, coffee machine, TV, Wi-Fi, safe.',
   'Otwarty apartament o powierzchni 44 m² na trzeciej kondygnacji z widokiem na góry i lasy. Część dzienna i sypialna w jednej przestrzeni: łóżko małżeńskie, rozkładana sofa dla 2 osób, kącik jadalny i w pełni wyposażona kuchnia. Łazienka z wanną. Dla 4 osób. Designerskie meble KARE, zmywarka, piekarnik, ekspres do kawy, TV, Wi-Fi, sejf.')
) AS v(slug, cs, en, pl)
WHERE a.slug = v.slug;
