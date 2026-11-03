/**
 * SEO metadata — kanonická doména, Open Graph a Twitter karta pro každou stránku.
 *
 * Stránky dál skládají vlastní title + description, `withSeo()` k nim doplní
 * canonical, og:* a twitter:*. Obrázek pro sdílení dodává file-based
 * `opengraph-image.tsx` (kořen + detaily apartmánů s jejich fotkou).
 * Jazyk je v cookie, URL je pro všechny jazyky stejná → canonical = cesta.
 */

import type { Metadata } from 'next';
import { getRequestLocaleFull } from '@/lib/i18n-server';

/** Kanonická adresa webu (s www). E-mailové odkazy dál řídí NEXT_PUBLIC_APP_URL. */
export const SITE_URL = 'https://www.podzlatymnavrsim.cz';
export const SITE_NAME = 'Pod Zlatým návrším';

const OG_LOCALE = { cs: 'cs_CZ', en: 'en_GB', pl: 'pl_PL' } as const;

// Page-level openGraph přepíše obrázek zděděný z kořenového opengraph-image → výchozí doplňujeme ručně.
// Segmenty s vlastním opengraph-image.tsx (detaily apartmánů) volají withSeo(…, { ownImage: true }),
// jinak by výchozí obrázek z konfigurace stránky přebil jejich fotku.
const DEFAULT_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'Pod Zlatým návrším — apartmány u lanovky Labská ve Špindlerově Mlýně' };

export function withSeo(meta: Metadata, path: string, opts: { ownImage?: boolean } = {}): Metadata {
  const title = typeof meta.title === 'string' ? meta.title : undefined;
  const description = meta.description ?? undefined;
  const image = opts.ownImage ? {} : { images: [DEFAULT_IMAGE] };
  const twitterImage = opts.ownImage ? {} : { images: [DEFAULT_IMAGE.url] };
  return {
    ...meta,
    alternates: { canonical: path, ...meta.alternates },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALE[getRequestLocaleFull()],
      url: path,
      title,
      description,
      ...image,
      ...meta.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...twitterImage,
      ...meta.twitter,
    },
  };
}

/** Zkratka pro stránky, které metadata teprve zakládají */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return withSeo({ title, description }, path);
}
