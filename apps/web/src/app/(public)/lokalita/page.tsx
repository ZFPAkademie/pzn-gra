/**
 * Lokalita (Location) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /lokalita (SEO Critical)
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
    title: `${t('pages.location.title')} | Pod Zlatým návrším`,
    description: t('pages.location.subtitle'),
  };
}

export default function LokalitaPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <StaticPage
      title={t('pages.location.title')}
      subtitle={t('pages.location.subtitle')}
    >
      <PlaceholderContent pageName="Lokalita" />
      
      {/* Placeholder content structure */}
      <div className="mt-8 space-y-6">
        <h2>Špindlerův Mlýn</h2>
        <p>
          Špindlerův Mlýn je nejznámější horské středisko v České republice, 
          ležící v srdci Krkonoš. Toto místo nabízí jedinečnou kombinaci 
          přírodních krás, sportovních aktivit a relaxace po celý rok.
        </p>

        <h3>Zimní sezóna</h3>
        <p>
          V zimě nabízí Špindlerův Mlýn vynikající podmínky pro lyžování 
          a snowboarding na svazích Svatého Petra a Medvědína. Běžkaři 
          si přijdou na své na upravených tratích v okolí.
        </p>

        <h3>Letní sezóna</h3>
        <p>
          V létě je Špindl ideálním výchozím bodem pro turistiku do Krkonoš, 
          cykloturistiku a další outdoorové aktivity. Lanovky vás vyvezou 
          do výšin s krásnými výhledy.
        </p>

        <h3>Dopravní dostupnost</h3>
        <p>
          Z Prahy se do Špindlerova Mlýna dostanete za přibližně 2 hodiny 
          autem. Pravidelné autobusové spojení zajišťuje pohodlné cestování 
          i bez vlastního vozu.
        </p>
      </div>
    </StaticPage>
  );
}
