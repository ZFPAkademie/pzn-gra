-- 011: token iCal exportu apartmánů není veřejný. Nalezeno security_probe.py 30. 9. 2026.
-- Policy apartments_public_read (for_sale/for_rent) zpřístupnila anon klíčem i ical_export_token
-- → kdokoli si stáhl kalendář obsazenosti všech apartmánů. Token čte jen admin (channel manager)
-- a export /api/v1/ical/[token] — obojí service rolí. Sloupcové granty místo celé tabulky:
--   anon          bez ical_export_token a owner_id
--   authenticated bez ical_export_token (portál majitelů filtruje .eq('owner_id', …))
revoke select on public.apartments from anon, authenticated;
grant select (id, slug, building, unit, layout, area_m2, floor, status, for_sale, for_rent,
              in_rental_program, features, created_at, updated_at, title, base_price_cents,
              max_guests, description, orientation, rooms, subtitle)
  on public.apartments to anon;
grant select (id, slug, building, unit, layout, area_m2, floor, owner_id, status, for_sale, for_rent,
              in_rental_program, features, created_at, updated_at, title, base_price_cents,
              max_guests, description, orientation, rooms, subtitle)
  on public.apartments to authenticated;
