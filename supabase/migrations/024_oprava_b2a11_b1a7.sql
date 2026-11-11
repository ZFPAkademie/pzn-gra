-- 024: opravy údajů prodávaných apartmánů (uživatel 11. 11. 2026)
--  1. B2A11: obývací pokoj s kuchyní 26,14 m² podle půdorysu (popis uváděl 34 m²)
--  2. B1A7: koupelna s vanou (DB uváděla sprchu, fotka koupelny ukazuje vanu)
--  3. Duplicitní fotky v galeriích: tentýž snímek byl dvakrát (ořez na šířku + celý),
--     ověřeno vizuálně i perceptuálním otiskem. Ponechána verze ze začátku galerie,
--     duplicita se maže jen tam, kde ponechaná verze v téže galerii je.
--     Soubory ve Storage zůstávají (sdílené složky, statická záloha) — smazány jen řádky.
-- Každá změna → audit_log.

BEGIN;

-- 1. B2A11 (prodejní záznam; pronájemní golden-ridge-11 plochu v popisu nemá)
WITH old AS (
  SELECT id, description, description_en FROM public.apartments WHERE slug = 'chata-2-suite-11'
), upd AS (
  UPDATE public.apartments a
     SET description    = replace(a.description, 'Obývací pokoj s kuchyní 34 m²', 'Obývací pokoj s kuchyní 26,14 m²'),
         description_en = replace(a.description_en, 'A 34 m² west-facing', 'A 26.14 m² west-facing'),
         updated_at     = now()
    FROM old
   WHERE a.id = old.id
  RETURNING a.id, a.description, a.description_en
)
INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data)
SELECT 'apartments', upd.id, 'update',
       jsonb_build_object('description', old.description, 'description_en', old.description_en),
       jsonb_build_object('description', upd.description, 'description_en', upd.description_en)
  FROM upd JOIN old ON old.id = upd.id;

-- 2. B1A7 koupelna s vanou
WITH upd AS (
  UPDATE public.apartments
     SET bathroom = 'bath', updated_at = now()
   WHERE slug = 'chata-1-suite-7' AND bathroom IS DISTINCT FROM 'bath'
  RETURNING id
)
INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data)
SELECT 'apartments', id, 'update', '{"bathroom":"shower"}'::jsonb, '{"bathroom":"bath"}'::jsonb FROM upd;

-- 3. Duplicitní fotky (duplicita → ponechaná verze)
WITH pairs(dup, keep) AS (VALUES
  ('chata1_apartman-7_1kk_38m2/09_apartmany-krkonose-spindleruv-mlyn-posteljpg.jpg',                 'chata1_apartman-7_1kk_38m2/01_27e65d_a6cf6b9857e94.jpg'),
  ('chata1_apartman-7_1kk_38m2/13_apartmany-krkonose-spindleruv-mlyn-prodej-labska-kuchynejpg.jpg',  'chata1_apartman-7_1kk_38m2/02_27e65d_f0dc9c95c73c4.jpg'),
  ('chata2_apartman-11_1kk_35m2/06_1b7edee6d1b3.jpg',                                                'chata2_apartman-11_1kk_35m2/01_27e65d_1b7edee6d1b34.jpg'),
  ('chata2_apartman-11_1kk_35m2/10_66ee16b71f16.jpg',                                                'chata2_apartman-11_1kk_35m2/01_27e65d_1b7edee6d1b34.jpg'),
  ('chata2_apartman-11_1kk_35m2/12_a3a7a4b29389.jpg',                                                'chata2_apartman-11_1kk_35m2/02_27e65d_a3a7a4b293894.jpg')
), del AS (
  DELETE FROM public.apartment_images i
   USING pairs p
   WHERE i.storage_path = p.dup
     AND EXISTS (SELECT 1 FROM public.apartment_images k
                  WHERE k.apartment_id = i.apartment_id AND k.storage_path = p.keep)
  RETURNING i.*
)
INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data)
SELECT 'apartment_images', del.id, 'delete', to_jsonb(del), NULL FROM del;

COMMIT;

-- 4. B1A7: vana i ve výbavě (prodejní stránka typ koupelny jinak neukazuje; B2A11 to tak má)
BEGIN;
WITH old AS (
  SELECT id, features, features_en, features_pl FROM public.apartments
   WHERE slug = 'chata-1-suite-7' AND NOT (features ? 'Koupelna s vanou')
), upd AS (
  UPDATE public.apartments a
     SET features    = jsonb_insert(a.features, '{1}', '"Koupelna s vanou"'),
         features_en = jsonb_insert(a.features_en, '{1}', '"Bathroom with bathtub"'),
         features_pl = jsonb_insert(a.features_pl, '{1}', '"Łazienka z wanną"'),
         updated_at  = now()
    FROM old WHERE a.id = old.id
  RETURNING a.id, a.features, a.features_en, a.features_pl
)
INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data)
SELECT 'apartments', upd.id, 'update',
       jsonb_build_object('features', old.features, 'features_en', old.features_en, 'features_pl', old.features_pl),
       jsonb_build_object('features', upd.features, 'features_en', upd.features_en, 'features_pl', upd.features_pl)
  FROM upd JOIN old ON old.id = upd.id;
COMMIT;
