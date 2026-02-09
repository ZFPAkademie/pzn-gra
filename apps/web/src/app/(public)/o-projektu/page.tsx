/**
 * O projektu (About the Project) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /o-projektu (SEO Critical)
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
    title: `${t('pages.about.title')} | Pod Zlatým návrším`,
    description: t('pages.about.subtitle'),
  };
}

export default function OProjektuPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <StaticPage
      title={t('pages.about.title')}
      subtitle={t('pages.about.subtitle')}
    >
      <PlaceholderContent pageName="O projektu" />

      {/* Placeholder content structure */}
      <div className="mt-8 space-y-6">
        <h2>Pod Zlatým návrším</h2>
        <p>
          Projekt Pod Zlatým návrším je exkluzivní rezidenční komplex 
          v samém srdci Špindlerova Mlýna. Nabízí 21 luxusních apartmánů 
          s jedinečným výhledem na okolní hory a snadným přístupem 
          k lyžařským svahům i turistickým stezkám.
        </p>

        <h3>Vize projektu</h3>
        <p>
          Naší vizí bylo vytvořit místo, které spojuje komfort moderního 
          bydlení s autentickou atmosférou hor. Místo, kam se budete 
          rádi vracet po celý rok – ať už za zimními radovánkami, 
          nebo letní turistikou.
        </p>

        <h3>Klíčové parametry</h3>
        <ul>
          <li>21 luxusních apartmánů</li>
          <li>Dispozice od 1+kk do 3+kk</li>
          <li>Plochy od 35 m² do 120 m²</li>
          <li>Podzemní parkování</li>
          <li>Společné prostory a služby</li>
        </ul>

        <h3>Dva způsoby využití</h3>
        <p>
          Apartmány můžete využívat jako svůj druhý domov, nebo je 
          pronajímat hostům přes naši profesionální správu. Kombinace 
          obou přístupů vám zajistí jak osobní užitek, tak finanční 
          zhodnocení.
        </p>
      </div>
    </StaticPage>
  );
}
