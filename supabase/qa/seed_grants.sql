-- Sloupcová práva, která supabase db dump nepřenáší (parity.sh je neporovnává).
-- Zdroj: supabase/migrations/011_apartments_hide_ical_token.sql — iCal token není veřejný.
revoke select on public.apartments from anon, authenticated;
grant select (id, slug, building, unit, layout, area_m2, floor, status, for_sale, for_rent,
              in_rental_program, features, created_at, updated_at, title, base_price_cents,
              max_guests, description, orientation, rooms, subtitle)
  on public.apartments to anon;
grant select (id, slug, building, unit, layout, area_m2, floor, owner_id, status, for_sale, for_rent,
              in_rental_program, features, created_at, updated_at, title, base_price_cents,
              max_guests, description, orientation, rooms, subtitle)
  on public.apartments to authenticated;
-- Zdroj: 013_i18n_en.sql — anglické texty apartmánů
grant select (title_en, subtitle_en, orientation_en, description_en, features_en)
  on public.apartments to anon, authenticated;
-- Zdroj: 014_i18n_pl.sql — polské texty apartmánů k pronájmu
grant select (title_pl, subtitle_pl, orientation_pl, description_pl, features_pl)
  on public.apartments to anon, authenticated;
