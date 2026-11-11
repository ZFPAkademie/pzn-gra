/**
 * Družstevní podíl - Apartmán ve Špindlerově Mlýně
 * Obsah a vzhled jsou ve view.tsx (sdílené s /podil/[available]), texty v texts.tsx.
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, toBaseLocale } from '@/lib/i18n';
import { getPodilTexts, getPodilAvailableShares } from './texts';
import { PodilView } from './view';
import { withSeo } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = getPodilTexts(toBaseLocale(getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value)));
  return withSeo({ title: t.metaTitle, description: t.metaDescription }, '/podil');
}

export default async function PodilPage() {
  const locale = toBaseLocale(getLocaleFromCookie(cookies().get('NEXT_LOCALE')?.value));
  // Počet volných podílů = 50 − Rezervace − Vlastník z evidence v admin sekci Družstvo (DEC-039).
  // Fallback 50 při výpadku DB.
  const availableShares = await getPodilAvailableShares();

  return <PodilView locale={locale} availableShares={availableShares} />;
}
