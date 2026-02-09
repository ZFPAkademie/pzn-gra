/**
 * Sitemap Generation
 * Sprint 1: SEO sitemap per SPRINT_1_PLAN.md §9.3
 */

import { MetadataRoute } from 'next';

// Placeholder apartment data for sitemap
const apartmentSlugs = [
  'apartman-1',
  'apartman-2',
  'apartman-3',
  'apartman-5',
  'apartman-7',
  'apartman-9',
  'apartman-12',
  'apartman-15',
  'apartman-18',
  'apartman-21',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://podzlatymnavrsim.cz';

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
  ];

  // Dynamic apartment pages
  const apartmentPages: MetadataRoute.Sitemap = apartmentSlugs.map((slug) => ({
    url: `${baseUrl}/golden-ridge-apartments/apartman/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...apartmentPages];
}
