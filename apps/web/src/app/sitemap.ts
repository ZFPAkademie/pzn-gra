/**
 * Sitemap Generation
 * Slugy apartmánů se čtou z DB (visibility flags) — žádné hardcoded seznamy.
 */

import { MetadataRoute } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

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
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://podzlatymnavrsim.cz').replace(/\/+$/, '');
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
      url: `${baseUrl}/investicni-prilezitost`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nemovitostni-produkt`,
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
    // New rental section
    {
      url: `${baseUrl}/golden-ridge-apartments`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Prodej apartmánů
    {
      url: `${baseUrl}/apartmany-prodej`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Družstevní podíly
    {
      url: `${baseUrl}/podil`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Dynamické stránky apartmánů podle visibility flags v DB
  const saleApartments: MetadataRoute.Sitemap = apartments
    .filter((a) => a.for_sale)
    .map((a) => ({
      url: `${baseUrl}/apartmany-prodej/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const rentApartments: MetadataRoute.Sitemap = apartments
    .filter((a) => a.for_rent)
    .flatMap((a) => [
      {
        url: `${baseUrl}/apartmany-spindleruv-mlyn-pronajem/${a.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/golden-ridge-apartments/apartman/${a.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]);

  return [...staticPages, ...saleApartments, ...rentApartments];
}
