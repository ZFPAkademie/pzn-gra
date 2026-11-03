-- 015 — Družstevní podíly = apartmán 7 v budově 2 (chata-2-suite-7), 3. 11. 2026
--
-- Ověřeno uživatelem: B1 A7 (chata-1-suite-7) je na prodej, B2 A7 je apartmán družstva
-- na podíly, B2 A11 (chata-2-suite-11) beze změny. B2 A7 má stejnou dispozici jako B1 A7
-- (37,89 m², 3. NP, východ, výhled na sjezdovku Labská) — údaje i fotky se přebírají z B1 A7.
-- Nový záznam má všechny příznaky viditelnosti vypnuté: zobrazuje se jen na /podil.

INSERT INTO apartments (
  slug, building, unit, layout, area_m2, floor, status,
  for_sale, for_rent, in_rental_program,
  title, subtitle, description, orientation, rooms, features,
  title_en, subtitle_en, orientation_en, description_en, features_en,
  title_pl, subtitle_pl, orientation_pl, description_pl, features_pl
)
SELECT
  'chata-2-suite-7', '2', unit, layout, area_m2, floor, 'sold',
  false, false, false,
  'Apartmán č. 7 – budova 2 (družstevní podíly)', subtitle, description, orientation, rooms, features,
  title_en, subtitle_en, orientation_en, description_en, features_en,
  title_pl, subtitle_pl, orientation_pl, description_pl, features_pl
FROM apartments
WHERE slug = 'chata-1-suite-7'
ON CONFLICT (slug) DO NOTHING;

-- Fotky: stejné soubory jako B1 A7 (sdílené storage_path, mazání v adminu to ošetřuje)
INSERT INTO apartment_images (apartment_id, storage_path, sort_order, alt_text)
SELECT n.id, i.storage_path, i.sort_order, i.alt_text
FROM apartment_images i
JOIN apartments s ON s.id = i.apartment_id AND s.slug = 'chata-1-suite-7'
CROSS JOIN apartments n
WHERE n.slug = 'chata-2-suite-7'
ON CONFLICT (apartment_id, storage_path) DO NOTHING;

-- B1 A7 zpět do prodeje (DEC-033 ho stáhl v domnění, že jde do družstva)
UPDATE apartments SET for_sale = true, updated_at = now() WHERE slug = 'chata-1-suite-7';
