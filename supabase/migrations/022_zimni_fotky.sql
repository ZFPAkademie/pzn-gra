-- 022: Zimní exteriéry obou domů do galerie všech apartmánů (10. 11. 2026)
-- Soubory jsou ve Storage: apartmany/zima/*.jpg (sdílené všemi byty — admin
-- je při mazání u jednoho bytu ze Storage neodstraní, dokud je používá jiný).
-- Přidávají se na konec galerie, hlavní (první) fotka bytu se nemění.
-- Idempotentní: UNIQUE(apartment_id, storage_path) + ON CONFLICT DO NOTHING.

INSERT INTO public.apartment_images (apartment_id, storage_path, sort_order, alt_text)
SELECT a.id,
       v.path,
       COALESCE((SELECT max(i.sort_order) FROM public.apartment_images i WHERE i.apartment_id = a.id), -1) + v.ord,
       v.alt
FROM public.apartments a
CROSS JOIN (VALUES
  ('zima/chaty-panorama.jpg',              1, 'Oba apartmánové domy Pod Zlatým návrším v zimě'),
  ('zima/chaty-pohled-na-dve.jpg',         2, 'Apartmánové domy Pod Zlatým návrším, příjezdová cesta v zimě'),
  ('zima/chaty-ptaci-pohled.jpg',          3, 'Domy u lanovky a sjezdovky Labská, pohled shora'),
  ('zima/chaty-lyzar-blue.jpg',            4, 'Lyžař na sjezdovce Labská, v pozadí apartmánové domy'),
  ('zima/chaty-lyzar-green.jpg',           5, 'Sjezdovka a dolní stanice lanovky Labská u domů'),
  ('zima/chaty-ptaci-pohled-vzdaleny.jpg', 6, 'Domy Pod Zlatým návrším ve Špindlerově Mlýně, celkový pohled'),
  ('zima/chaty-art.jpg',                   7, 'Domy pod sjezdovkou Labská za soumraku')
) AS v(path, ord, alt)
ON CONFLICT (apartment_id, storage_path) DO NOTHING;
