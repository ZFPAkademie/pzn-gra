-- 014: polská verze pronájmu a rezervačního procesu (13. 10. 2026)
-- Jen apartmány k pronájmu — prodej v PL není (polský návštěvník tam vidí EN).
-- _pl sloupce, NULL = web spadne na angličtinu, pak na češtinu.

ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS title_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS subtitle_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS orientation_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS description_pl text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS features_pl jsonb;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_language_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_language_check CHECK (language IN ('cs', 'en', 'pl'));

-- Sloupcové granty (011)
grant select (title_pl, subtitle_pl, orientation_pl, description_pl, features_pl)
  on public.apartments to anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- Obsah PL — apartmány k pronájmu, překlad z češtiny ke dni 13. 10. 2026
-- ═══════════════════════════════════════════════════════════

UPDATE public.apartments SET
  title_pl = 'Apartament nr 2',
  subtitle_pl = 'Parter, kawalerka (1+kk) | 45 m²',
  orientation_pl = 'południe, zachód',
  description_pl = E'Apartament znajduje się naprzeciwko klatki schodowej. Po wejściu trafiają Państwo do przedpokoju o powierzchni niecałych 5 m² z miejscem na szafę. Naprzeciwko wejścia znajduje się przestronna łazienka, a po lewej stronie od drzwi wejściowych wejście do części dziennej. Salon z aneksem kuchennym ma powierzchnię prawie 35 m². Z salonu skierowanego na południe przechodzi się do części sypialnej skierowanej na zachód. Część dzienną i sypialną oddziela ścianka działowa.\n\nZabudowa kuchenna w białym wykończeniu z dekorem drewna jest wyposażona w zmywarkę, płytę grzewczą, kuchenkę mikrofalową i piekarnik marki Electrolux. Za dopłatą możliwa jest instalacja małej lodówki z zamrażarką.\n\nW łazience pod drewnianą podłogą znajdują się płytki z ogrzewaniem podłogowym. Łazienka jest wyposażona w armaturę i ceramikę firm Laufen i Grohe.\n\nNarty, sprzęt narciarski oraz rowery można przechowywać we wspólnych pomieszczeniach na poziomie -1, gdzie dostępne są zamykane boksy na narty.',
  features_pl = '["Orientacja na południe i zachód","Sprzęt AGD Electrolux","Ogrzewanie podłogowe","Laufen i Grohe","Narciarnia z boksami na poziomie -1"]'::jsonb
WHERE slug = 'chata-1-suite-2';

UPDATE public.apartments SET
  title_pl = 'Apartament nr 7',
  subtitle_pl = '2. piętro, kawalerka (1+kk) | 38 m²',
  orientation_pl = 'wschód',
  description_pl = 'Apartament obok klatki schodowej: przedpokój z miejscem na szafę, przestronna łazienka, salon z kuchnią skierowany na wschód z widokiem na stok Labská. Zabudowa kuchenna w białym wykończeniu z dekorem drewna, sprzęt AGD Electrolux, ogrzewanie podłogowe w łazience, Laufen i Grohe.',
  features_pl = '["Widok na stok Labská","Sprzęt AGD Electrolux","Ogrzewanie podłogowe","Laufen i Grohe"]'::jsonb
WHERE slug = 'chata-1-suite-7';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 1',
  orientation_pl = 'południe, zachód',
  description_pl = 'Komfortowe zakwaterowanie z widokiem na góry, bezpłatnym Wi-Fi i prywatnym parkingiem. Apartament ma część dzienną z wygodnym miejscem do siedzenia i telewizorem, w pełni wyposażoną kuchnię oraz łazienkę z suszarką do włosów. Salon skierowany na południe, otwarta sypialnia od strony zachodniej oddzielona ścianką działową. Ogrzewanie podłogowe, Grohe i Laufen. Designerskie meble KARE.',
  features_pl = '["Widok na góry","Meble KARE","Bezpłatne Wi-Fi","Parking","Ekspres do kawy","TV","Ogrzewanie podłogowe"]'::jsonb
WHERE slug = 'golden-ridge-1';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 11',
  orientation_pl = 'zachód',
  description_pl = 'Przytulny apartament z widokiem na przyrodę i lasy. Salon z kuchnią skierowany na zachód, łazienka z wanną. Kuchnia Electrolux, designerskie meble, TV, Wi-Fi.',
  features_pl = '["Widok na przyrodę","Łazienka z wanną","Kuchnia Electrolux","TV","Wi-Fi"]'::jsonb
WHERE slug = 'golden-ridge-11';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 2',
  orientation_pl = 'zachód',
  description_pl = 'Apartament z widokiem na las, odpowiedni dla małej rodziny lub pary. Salon skierowany na zachód, otwarta sypialnia oddzielona ścianką działową. Designerskie meble KARE, zmywarka, piekarnik, ekspres do kawy, TV, Wi-Fi, sejf.',
  features_pl = '["Widok na las","Meble KARE","Zmywarka","Ekspres do kawy","TV","Wi-Fi","Sejf"]'::jsonb
WHERE slug = 'golden-ridge-2';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 3',
  orientation_pl = 'widok na góry',
  description_pl = 'W pełni wyposażony apartament (35 m²) z kuchnią, własną łazienką i widokiem na góry. Designerskie meble KARE, zmywarka, piekarnik, ekspres do kawy, TV, Wi-Fi, sejf.',
  features_pl = '["Widok na góry","Meble KARE","Zmywarka","Ekspres do kawy","TV","Wi-Fi","Sejf"]'::jsonb
WHERE slug = 'golden-ridge-3';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 4',
  orientation_pl = 'zachód, południe',
  description_pl = 'Największy apartament w Golden Ridge (60 m²). Oddzielna sypialnia dla 2 osób, salon z rozkładaną sofą dla 2 osób, w pełni wyposażona kuchnia. Idealny dla rodzin lub dwóch par. Designerskie meble KARE, zmywarka, piekarnik, 2 telewizory, Wi-Fi, sejf.',
  features_pl = '["Oddzielna sypialnia","2+kk dla 6 osób","Meble KARE","Zmywarka","2 telewizory","Wi-Fi","Sejf"]'::jsonb
WHERE slug = 'golden-ridge-4';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 7',
  orientation_pl = 'wschód',
  description_pl = 'Komfortowe zakwaterowanie z widokiem na stok Labská, bezpłatnym Wi-Fi i prywatnym parkingiem. Salon z kuchnią skierowany na wschód. Przestronna łazienka, zabudowa kuchenna w białym wykończeniu z dekorem drewna. Sprzęt AGD Electrolux, ogrzewanie podłogowe, Laufen i Grohe. Ten apartament jest również na sprzedaż.',
  features_pl = '["Widok na stok Labská","Sprzęt AGD Electrolux","Ogrzewanie podłogowe","Laufen i Grohe","Bezpłatne Wi-Fi","Również na sprzedaż"]'::jsonb
WHERE slug = 'golden-ridge-7';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 8',
  orientation_pl = 'zachód, południe',
  description_pl = 'Przestronny apartament 2+kk (60 m²) z tarasem z widokiem na góry. Designerskie meble KARE, w pełni wyposażona kuchnia, zmywarka, dwa telewizory, Wi-Fi, sejf. Idealny dla rodzin lub grup przyjaciół.',
  features_pl = '["Taras","Widok na góry","Meble KARE","Zmywarka","2 telewizory","Wi-Fi","Sejf"]'::jsonb
WHERE slug = 'golden-ridge-8';

UPDATE public.apartments SET
  title_pl = 'Golden Ridge apartament nr 9',
  orientation_pl = 'zachód, południe',
  description_pl = 'Duży apartament 2+kk z panoramicznym widokiem na góry i lasy. Przestronna sypialnia, salon z kącikiem jadalnym, designerskie meble KARE. Zmywarka, piekarnik, ekspres do kawy, 2 telewizory, Wi-Fi, sejf.',
  features_pl = '["Panoramiczny widok","Oddzielna sypialnia","Meble KARE","Zmywarka","2 telewizory","Wi-Fi","Sejf"]'::jsonb
WHERE slug = 'golden-ridge-9';
