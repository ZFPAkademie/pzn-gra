-- 013: anglická verze webu (13. 10. 2026)
-- Texty apartmánů (_en sloupce, NULL = web spadne zpět na češtinu) a jazyk rezervace,
-- podle kterého jdou hostovi e-maily a karta rezervace.

ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS subtitle_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS orientation_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS features_en jsonb;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'cs';
DO $$ BEGIN
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_language_check CHECK (language IN ('cs', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sloupcové granty (011) — nové sloupce musí být vyjmenované, jinak je anon nepřečte
grant select (title_en, subtitle_en, orientation_en, description_en, features_en)
  on public.apartments to anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- Obsah EN — překlad textů z 007 / adminu ke dni 13. 10. 2026
-- ═══════════════════════════════════════════════════════════

UPDATE public.apartments SET
  title_en = 'Apartment No. 2',
  subtitle_en = 'Ground floor, studio (1+kk) | 45 m²',
  orientation_en = 'south, west',
  description_en = E'As you enter the apartment, located opposite the staircase, you step into a hallway of just under 5 m² with space for a wardrobe. Directly opposite the entrance is a spacious bathroom, and to the left of the front door is the entrance to the living area. The living room with kitchenette measures almost 35 m². From the south-facing living room you also enter the west-facing sleeping area. The living and sleeping areas are separated by a partition wall.\n\nThe kitchen units have a white design with wood décor and are equipped with a dishwasher, hob, microwave and oven by Electrolux. A small fridge-freezer can be installed for an additional charge.\n\nThe bathroom is tiled and has underfloor heating; the rest of the apartment has wooden flooring. Bathroom fittings are by Laufen and Grohe.\n\nSkis, ski equipment and bicycles can be stored in the shared area on the lower ground floor, where lockable ski lockers are available.',
  features_en = '["South and west facing","Electrolux appliances","Underfloor heating","Laufen and Grohe","Ski room with lockers on the lower ground floor"]'::jsonb
WHERE slug = 'chata-1-suite-2';

UPDATE public.apartments SET
  title_en = 'Apartment No. 7',
  subtitle_en = '2nd floor, studio (1+kk) | 38 m²',
  orientation_en = 'east',
  description_en = 'Apartment next to the staircase with a hallway offering space for a wardrobe, a spacious bathroom and an east-facing living room with kitchen overlooking the Labská ski slope. White kitchen units with wood décor, Electrolux appliances, underfloor heating in the bathroom, Laufen and Grohe fittings.',
  features_en = '["View of the Labská ski slope","Electrolux appliances","Underfloor heating","Laufen and Grohe"]'::jsonb
WHERE slug = 'chata-1-suite-7';

UPDATE public.apartments SET
  title_en = 'Apartment No. 9',
  subtitle_en = '2nd floor, one-bedroom (2+kk) | 62 m²',
  orientation_en = 'west, south',
  description_en = 'A spacious 13 m² hallway with room for a large wardrobe and shoe cabinet. West-facing bedroom. A 25 m² living room facing west and south with views of the forest. Electrolux kitchen, bathroom with bathtub, Laufen and Grohe fittings. Also suitable for families with children.',
  features_en = '["Separate bedroom","Bathroom with bathtub","Forest views","Family friendly"]'::jsonb
WHERE slug = 'chata-1-suite-9';

UPDATE public.apartments SET
  title_en = 'Apartment No. 11',
  subtitle_en = '2nd floor, studio (1+kk) | 35 m²',
  orientation_en = 'west',
  description_en = 'Apartment opposite the staircase with a 2.5 m² hallway offering space for a wardrobe and a bathroom with bathtub on the left. A 34 m² west-facing living room with kitchen overlooking the countryside. White Electrolux kitchen with wood décor. Underfloor heating, Laufen and Grohe fittings. Suitable for a small family or a couple.',
  features_en = '["Bathroom with bathtub","Nature views","Electrolux kitchen","Underfloor heating"]'::jsonb
WHERE slug = 'chata-2-suite-11';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 1',
  orientation_en = 'south, west',
  description_en = 'Superior accommodation with mountain views, free Wi-Fi and private parking. The apartment has a living area with a comfortable seating corner and TV, a fully equipped kitchen and a bathroom with hairdryer. South-facing living room and a west-facing open-plan bedroom separated by a partition. Underfloor heating, Grohe and Laufen fittings. Designer furniture by KARE.',
  features_en = '["Mountain views","KARE furniture","Free Wi-Fi","Parking","Coffee machine","TV","Underfloor heating"]'::jsonb
WHERE slug = 'golden-ridge-1';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 11',
  orientation_en = 'west',
  description_en = 'Cosy apartment with views of nature and the forest. West-facing living room with kitchen and a bathroom with bathtub. Electrolux kitchen, designer furniture, TV, Wi-Fi.',
  features_en = '["Nature views","Bathroom with bathtub","Electrolux kitchen","TV","Wi-Fi"]'::jsonb
WHERE slug = 'golden-ridge-11';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 2',
  orientation_en = 'west',
  description_en = 'Apartment with forest views, suitable for a small family or a couple. West-facing living room and an open-plan bedroom separated by a partition. Designer furniture by KARE, dishwasher, oven, coffee machine, TV, Wi-Fi, safe.',
  features_en = '["Forest views","KARE furniture","Dishwasher","Coffee machine","TV","Wi-Fi","Safe"]'::jsonb
WHERE slug = 'golden-ridge-2';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 3',
  orientation_en = 'mountain view',
  description_en = 'Fully equipped apartment (35 m²) with kitchen, private bathroom and mountain views. Designer furniture by KARE, dishwasher, oven, coffee machine, TV, Wi-Fi, safe.',
  features_en = '["Mountain views","KARE furniture","Dishwasher","Coffee machine","TV","Wi-Fi","Safe"]'::jsonb
WHERE slug = 'golden-ridge-3';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 4',
  orientation_en = 'west, south',
  description_en = 'The largest apartment in Golden Ridge (60 m²). A separate bedroom for 2, a living room with a sofa bed for 2 and a fully equipped kitchen. Ideal for families or two couples. Designer furniture by KARE, dishwasher, oven, 2 TVs, Wi-Fi, safe.',
  features_en = '["Separate bedroom","One-bedroom (2+kk) for 6 guests","KARE furniture","Dishwasher","2 TVs","Wi-Fi","Safe"]'::jsonb
WHERE slug = 'golden-ridge-4';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 7',
  orientation_en = 'east',
  description_en = 'Superior accommodation overlooking the Labská ski slope, with free Wi-Fi and private parking. East-facing living room with kitchen. Spacious bathroom, white kitchen units with wood décor. Electrolux appliances, underfloor heating, Laufen and Grohe fittings. This apartment is also for sale.',
  features_en = '["View of the Labská ski slope","Electrolux appliances","Underfloor heating","Laufen and Grohe","Free Wi-Fi","Also for sale"]'::jsonb
WHERE slug = 'golden-ridge-7';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 8',
  orientation_en = 'west, south',
  description_en = 'Spacious one-bedroom (2+kk) apartment (60 m²) with a terrace overlooking the mountains. Designer furniture by KARE, fully equipped kitchen, dishwasher, two TVs, Wi-Fi, safe. Ideal for families or groups of friends.',
  features_en = '["Terrace","Mountain views","KARE furniture","Dishwasher","2 TVs","Wi-Fi","Safe"]'::jsonb
WHERE slug = 'golden-ridge-8';

UPDATE public.apartments SET
  title_en = 'Golden Ridge Apartment No. 9',
  orientation_en = 'west, south',
  description_en = 'Large one-bedroom (2+kk) apartment with panoramic views of the mountains and forests. Spacious bedroom, living room with dining area, designer furniture by KARE. Dishwasher, oven, coffee machine, 2 TVs, Wi-Fi, safe.',
  features_en = '["Panoramic views","Separate bedroom","KARE furniture","Dishwasher","2 TVs","Wi-Fi","Safe"]'::jsonb
WHERE slug = 'golden-ridge-9';
