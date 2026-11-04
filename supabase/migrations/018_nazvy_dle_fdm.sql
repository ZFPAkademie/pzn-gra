-- 018 — Názvy apartmánů sjednocené s Front Desk Master, 4. 11. 2026
-- FDM pojmenovává typy pokojů B<budova>Apt<číslo> (B2Apt2 = budova 2, apartmán 2).
-- Na webu „B2A2“, ať se host, recepce i majitel bavili o stejném apartmánu.
-- chata-2-suite-7 (družstevní podíly) se nemění — /podil nesmí jmenovat číslo apartmánu.

UPDATE apartments a SET
  title    = v.title_cs,
  title_en = v.title_en,
  title_pl = v.title_pl,
  building = v.building,
  updated_at = now()
FROM (VALUES
  ('golden-ridge-1',   'Golden Ridge apartmán B2A1',  'Golden Ridge Apartment B2A1',  'Golden Ridge apartament B2A1',  '2'),
  ('golden-ridge-2',   'Golden Ridge apartmán B2A2',  'Golden Ridge Apartment B2A2',  'Golden Ridge apartament B2A2',  '2'),
  ('golden-ridge-3',   'Golden Ridge apartmán B2A3',  'Golden Ridge Apartment B2A3',  'Golden Ridge apartament B2A3',  '2'),
  ('golden-ridge-4',   'Golden Ridge apartmán B2A4',  'Golden Ridge Apartment B2A4',  'Golden Ridge apartament B2A4',  '2'),
  ('golden-ridge-7',   'Golden Ridge apartmán B2A7',  'Golden Ridge Apartment B2A7',  'Golden Ridge apartament B2A7',  '2'),
  ('golden-ridge-8',   'Golden Ridge apartmán B2A8',  'Golden Ridge Apartment B2A8',  'Golden Ridge apartament B2A8',  '2'),
  ('golden-ridge-9',   'Golden Ridge apartmán B2A9',  'Golden Ridge Apartment B2A9',  'Golden Ridge apartament B2A9',  '2'),
  ('golden-ridge-11',  'Golden Ridge apartmán B2A11', 'Golden Ridge Apartment B2A11', 'Golden Ridge apartament B2A11', '2'),
  ('chata-1-suite-2',  'Apartmán B1A2',  'Apartment B1A2',  'Apartament B1A2',  '1'),
  ('chata-1-suite-7',  'Apartmán B1A7',  'Apartment B1A7',  'Apartament B1A7',  '1'),
  ('chata-1-suite-9',  'Apartmán B1A9',  'Apartment B1A9',  'Apartament B1A9',  '1'),
  ('chata-2-suite-11', 'Apartmán B2A11', 'Apartment B2A11', 'Apartament B2A11', '2')
) AS v(slug, title_cs, title_en, title_pl, building)
WHERE a.slug = v.slug;
