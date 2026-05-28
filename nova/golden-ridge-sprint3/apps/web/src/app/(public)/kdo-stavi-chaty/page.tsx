/**
 * Kdo staví (The Builder) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /kdo-stavi-chaty (SEO Critical)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { StaticPage, PlaceholderContent } from '@/components/features/static-page';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('pages.builder.title')} | Pod Zlatým návrším`,
    description: t('pages.builder.subtitle'),
  };
}

export default function KdoStaviPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <StaticPage
      title={t('pages.builder.title')}
      subtitle={t('pages.builder.subtitle')}
    >
      <PlaceholderContent pageName="Kdo staví" />

      {/* Placeholder content structure */}
      <div className="mt-8 space-y-6">
        <h2>Zkušený developer</h2>
        <p>
          Za projektem Pod Zlatým návrším stojí zkušený developerský tým 
          s dlouholetou tradicí v oblasti prémiové výstavby. Naše projekty 
          se vyznačují důrazem na kvalitu, design a spokojenost klientů.
        </p>

        <h3>Naše zkušenosti</h3>
        <ul>
          <li>Více než 20 let na trhu</li>
          <li>Desítky úspěšně dokončených projektů</li>
          <li>Specializace na prémiové rezidenční projekty</li>
          <li>Silný tým architektů a projektantů</li>
        </ul>

        <h3>Reference</h3>
        <p>
          Naše portfolio zahrnuje rezidenční projekty v nejatraktivnějších 
          lokalitách České republiky. Každý projekt je pro nás výzvou 
          k dosažení maximální kvality a spokojenosti našich klientů.
        </p>

        <h3>Přístup ke klientům</h3>
        <p>
          Věříme v transparentní komunikaci a partnerský přístup. 
          Naši klienti jsou průběžně informováni o postupu výstavby 
          a mají možnost konzultovat individuální úpravy svých apartmánů.
        </p>
      </div>
    </StaticPage>
  );
}
