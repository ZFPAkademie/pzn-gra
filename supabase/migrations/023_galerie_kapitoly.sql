-- 023: Kapitoly galerie + popisky fotek pro prezentaci apartmánů na prodej (10. 11. 2026)
-- Prodejní stránka /suites/[slug] skládá galerii po kapitolách (Apartmán · Dům v zimě ·
-- Dům v létě · Půdorysy). Kategorie je vlastnost řádku (fotky jsou sdílené mezi byty,
-- ale každý byt má vlastní řádek). NULL = „Další fotografie“ — nová fotka z adminu
-- se tak na prodejní stránce nikdy neztratí.
-- Popisky = co na fotce je (podle náhledů), bez tvrzení, která fotka nedokládá.

ALTER TABLE public.apartment_images
  ADD COLUMN IF NOT EXISTS category text
  CHECK (category IN ('interior', 'winter', 'exterior', 'plan'));

-- Zimní exteriéry (022) u všech bytů
UPDATE public.apartment_images SET category = 'winter'
WHERE storage_path LIKE 'zima/%' AND category IS NULL;

-- B1A7 (chata-1-suite-7) a B2A11 (chata-2-suite-11)
UPDATE public.apartment_images i SET category = v.cat, alt_text = v.alt
FROM public.apartments a, (VALUES
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/01_27e65d_a6cf6b9857e94.jpg', 'interior', 'Obytný prostor s lůžkem a oknem do krajiny'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/01_38c5f5789b86.jpg', 'plan', 'Půdorys 3. NP, apartmán 3.07'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/02_27e65d_f0dc9c95c73c4.jpg', 'interior', 'Kuchyňská linka a sedačka'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/02_6bde29a3d134.jpg', 'plan', 'Půdorys 1. PP: garáže a lyžárna'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/03_b67c27bc3970.jpg', 'plan', 'Půdorys apartmánu 3.07, 1+kk'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/05_037c38fa440e.jpg', 'interior', 'Koupelna'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/06_05ad62303b18.jpg', 'interior', 'Obývací část s výhledem do krajiny'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/08_9d8f012f82a5.jpg', 'interior', 'Kuchyňská linka'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/09_apartmany-krkonose-spindleruv-mlyn-posteljpg.jpg', 'interior', 'Lůžko a jídelní stůl u okna'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/13_apartmany-krkonose-spindleruv-mlyn-prodej-labska-kuchynejpg.jpg', 'interior', 'Kuchyň a sedací souprava'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/07_13bb21839b53.jpg', 'exterior', 'Apartmánový dům v létě'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/10_a88334def7fe.jpg', 'exterior', 'Lanovka Labská a oba domy v létě'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/11_b6f1acfdaa90.jpg', 'interior', 'Předsíň'),
  ('chata-1-suite-7', 'chata1_apartman-7_1kk_38m2/14_f64e8463e498.jpg', 'exterior', 'Domy a sjezdovka Labská z výšky v létě'),

  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/01_27e65d_1b7edee6d1b34.jpg', 'interior', 'Obytný prostor s lůžkem, kuchyní a jídelním stolem'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/01_4f62958a8992.jpg', 'plan', 'Půdorys 1. PP: garáže a lyžárna'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/02_27e65d_a3a7a4b293894.jpg', 'interior', 'Kuchyňská linka a jídelní stůl'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/02_7f367bc5e571.jpg', 'plan', 'Půdorys 3. NP, apartmán 3.11'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/03_cec79c4b4000.jpg', 'plan', 'Půdorys apartmánu 3.11, 1+kk'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/06_1b7edee6d1b3.jpg', 'interior', 'Obytný prostor pod šikmým stropem'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/10_66ee16b71f16.jpg', 'interior', 'Obytný prostor s lůžkem'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/11_8cc273c60a7e.jpg', 'interior', 'Koupelna s vanou'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/12_a3a7a4b29389.jpg', 'interior', 'Kuchyň a jídelní kout'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/05_13bb21839b53.jpg', 'exterior', 'Apartmánový dům v létě'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/13_a88334def7fe.jpg', 'exterior', 'Lanovka Labská a oba domy v létě'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/16_f64e8463e498.jpg', 'exterior', 'Domy a sjezdovka Labská z výšky v létě'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/07_1f5bef0405bb.png', 'interior', 'Kuchyňský kout'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/08_258522294d6d.png', 'interior', 'Manželská postel'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/09_58ea799fd959.png', 'interior', 'Jídelní kout a televize'),
  ('chata-2-suite-11', 'chata2_apartman-11_1kk_35m2/15_f5233a09512b.png', 'interior', 'Pohovka')
) AS v(slug, path, cat, alt)
WHERE a.slug = v.slug AND i.apartment_id = a.id AND i.storage_path = v.path;
