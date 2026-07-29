-- ═══════════════════════════════════════════════════════════════════
-- MIGRACE 010 — apartment_images: fotogalerie spravovatelná z adminu
-- Fotky dosud žily v src/data/apartment-images.ts (změna = deploy).
-- Stejný pattern jako DEC-021 (C→A): naseedovat z kódu, přepnout čtení na DB.
-- Bucket `apartmany` zůstává public (CDN pro veřejné stránky).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apartment_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,

  storage_path  text NOT NULL,   -- cesta v bucketu `apartmany`, bez domény
  sort_order    int  NOT NULL DEFAULT 0,  -- nejnižší = hlavní (hero) foto
  alt_text      text,

  created_at    timestamptz NOT NULL DEFAULT now(),

  -- Stejná fotka nesmí být u jednoho bytu dvakrát
  UNIQUE (apartment_id, storage_path)
);

CREATE INDEX IF NOT EXISTS apartment_images_apartment_idx
  ON public.apartment_images(apartment_id, sort_order);

ALTER TABLE public.apartment_images ENABLE ROW LEVEL SECURITY;

-- Fotky bytů jsou veřejné (zobrazují se na webu bez přihlášení)
DROP POLICY IF EXISTS "apartment_images_public_read" ON public.apartment_images;
CREATE POLICY "apartment_images_public_read" ON public.apartment_images
  FOR SELECT USING (true);

GRANT SELECT ON TABLE public.apartment_images TO anon, authenticated;
GRANT ALL ON TABLE public.apartment_images TO service_role;
