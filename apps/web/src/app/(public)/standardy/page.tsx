/**
 * Standardy (Standards) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /standardy (SEO Critical)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { StaticPage, PlaceholderContent } from '@/components/features/static-page';

// Force dynamic rendering (uses cookies for locale)
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('pages.standards.title')} | Pod Zlatým návrším`,
    description: t('pages.standards.subtitle'),
  };
}

export default function StandardyPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <StaticPage
      title={t('pages.standards.title')}
      subtitle={t('pages.standards.subtitle')}
    >
      <PlaceholderContent pageName="Standardy" />

      {/* Placeholder content structure */}
      <div className="mt-8 space-y-6">
        <h2>Kvalita bez kompromisů</h2>
        <p>
          Každý detail projektu Pod Zlatým návrším byl pečlivě navržen 
          s důrazem na kvalitu, funkčnost a estetiku. Používáme pouze 
          prémiové materiály a spolupracujeme s osvědčenými dodavateli.
        </p>

        <h3>Interiér</h3>
        <ul>
          <li>Dubové podlahy v celém apartmánu</li>
          <li>Designové koupelny s italskou keramikou</li>
          <li>Plně vybavená kuchyně s vestavěnými spotřebiči</li>
          <li>Kvalitní nábytek na míru</li>
        </ul>

        <h3>Technologie</h3>
        <ul>
          <li>Podlahové vytápění</li>
          <li>Klimatizace</li>
          <li>Vysokorychlostní Wi-Fi</li>
          <li>Chytrá domácnost</li>
        </ul>

        <h3>Vybavení budovy</h3>
        <ul>
          <li>Podzemní parkování</li>
          <li>Lyžárna s vyhřívanými botníky</li>
          <li>Společné prostory s recepcí</li>
          <li>Bezpečnostní systém</li>
        </ul>
      </div>
    </StaticPage>
  );
}
