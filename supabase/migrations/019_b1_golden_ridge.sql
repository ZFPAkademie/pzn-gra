-- 019 — B1A2 a B1A7 jsou v pronájmu → stejná značka jako ostatní pronajímané, 4. 11. 2026
-- (018 je pojmenovala jako prodejní „Apartmán B1A2“). B1A9 a B2A11 jsou jen k prodeji, beze změny.

UPDATE apartments a SET
  title    = v.title_cs,
  title_en = v.title_en,
  title_pl = v.title_pl,
  updated_at = now()
FROM (VALUES
  ('chata-1-suite-2', 'Golden Ridge apartmán B1A2', 'Golden Ridge Apartment B1A2', 'Golden Ridge apartament B1A2'),
  ('chata-1-suite-7', 'Golden Ridge apartmán B1A7', 'Golden Ridge Apartment B1A7', 'Golden Ridge apartament B1A7')
) AS v(slug, title_cs, title_en, title_pl)
WHERE a.slug = v.slug;
