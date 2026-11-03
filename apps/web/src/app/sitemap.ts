/**
 * Sitemap Generation
 * Slugy apartmánů se čtou z DB (visibility flags) — žádné hardcoded seznamy.
 */

import { MetadataRoute } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { SITE_URL } from '@/lib/seo';

// Regenerovat každou hodinu — slugy se mění se změnou visibility flags v adminu
export const revalidate = 3600;

async function getApartmentSlugs(): Promise<{ slug: string; for_sale: boolean; for_rent: boolean }[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from('apartments')
      .select('slug, for_sale, for_rent')
      .or('for_sale.eq.true,for_rent.eq.true');
    return data ?? [];
  } catch {
    // Soft fail — sitemap bez apartmánů je lepší než 500
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Kanonická doména s www — nezávisle na NEXT_PUBLIC_APP_URL (ten řídí odkazy v e-mailech)
  const baseUrl = SITE_URL;
  const apartments = await getApartmentSlugs();

  // Static pages (SEO critical URLs)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/lokalita`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/standardy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/o-projektu`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kdo-stavi-chaty`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/suites`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // SEO Critical rental URL
    {
      url: `${baseUrl}/apartmany-spindleruv-mlyn-pronajem`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/volne-terminy`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Družstevní podíly
    {
      url: `${baseUrl}/podil`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kalkulacka`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/obchodni-podminky`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/ochrana-osobnich-udaju`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamické stránky apartmánů podle visibility flags v DB
  const saleApartments: MetadataRoute.Sitemap = apartments
    .filter((a) => a.for_sale)
    .map((a) => ({
      url: `${baseUrl}/suites/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const rentApartments: MetadataRoute.Sitemap = apartments
    .filter((a) => a.for_rent)
    .map((a) => ({
      // /golden-ridge-apartments/apartman/[slug] je duplicita s canonical sem — do sitemapy nepatří
      url: `${baseUrl}/apartmany-spindleruv-mlyn-pronajem/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...saleApartments, ...rentApartments];
}
