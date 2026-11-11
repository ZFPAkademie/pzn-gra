-- 025: Kapitoly galerie pro apartmán v družstevních podílech (11. 11. 2026)
-- /podil dostal stejnou galerii po kapitolách jako /suites/[slug] (Apartmán · Dům v zimě ·
-- Dům v létě). Řádky chata-2-suite-7 ukazují na tytéž soubory jako chata-1-suite-7 (DEC-036,
-- stejná dispozice), ale kategorii měly jen zimní fotky (023 je doplnila plošně) — ostatní
-- se převezmou z dvojčete podle storage_path.
-- Popisek se u půdorysů NEPŘEBÍRÁ: obsahuje číslo bytu („apartmán 3.07“) a to se na /podil
-- nesmí objevit (DEC-009). Kapitolu Půdorysy stránka /podil nezobrazuje ze stejného důvodu.
-- Jen doplnění prázdných hodnot, nic se nepřepisuje ani nemaže.

UPDATE public.apartment_images t
SET category = s.category,
    alt_text = CASE WHEN s.category = 'plan' THEN t.alt_text ELSE COALESCE(t.alt_text, s.alt_text) END
FROM public.apartment_images s, public.apartments ta, public.apartments sa
WHERE ta.slug = 'chata-2-suite-7'
  AND sa.slug = 'chata-1-suite-7'
  AND t.apartment_id = ta.id
  AND s.apartment_id = sa.id
  AND t.storage_path = s.storage_path
  AND t.category IS NULL
  AND s.category IS NOT NULL;
