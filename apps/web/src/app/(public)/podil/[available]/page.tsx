/**
 * Družstevní podíl - Dynamic share count
 * URL: /podil/45 = 45 dostupných podílů (5 prodáno) — marketingové odkazy (DEC-010, DEC-039)
 * Obsah a vzhled jsou ve ../view.tsx (sdílené s /podil), texty v ../texts.tsx.
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getPodilTexts, PODIL_TOTAL_SHARES } from '../texts';
import { PodilView } from '../view';
import { withSeo } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = getPodilTexts(toBaseLocale(getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value)));
  return withSeo({ title: t.metaTitle, description: t.metaDescriptionShort }, '/podil');
}

interface PageProps {
  params: { available: string };
}

export default async function PodilDynamicPage({ params }: PageProps) {
  const locale = toBaseLocale(getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value));

  // Parse available shares from URL
  const availableShares = parseInt(params.available, 10);

  // Validate: must be number between 0 and 50
  if (isNaN(availableShares) || availableShares < 0 || availableShares > PODIL_TOTAL_SHARES) {
    notFound();
  }

  return <PodilView locale={locale} availableShares={availableShares} />;
}
