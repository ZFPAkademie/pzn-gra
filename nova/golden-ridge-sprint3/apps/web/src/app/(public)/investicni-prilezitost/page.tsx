/**
 * Investiční příležitost (Investment Opportunity) Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /investicni-prilezitost (SEO Critical)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { StaticPage, PlaceholderContent } from '@/components/features/static-page';
import { Container, Section, Badge, Button } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('pages.investment.title')} | Pod Zlatým návrším`,
    description: t('pages.investment.subtitle'),
  };
}

export default function InvesticniPrilezitostPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <>
      <StaticPage
        title={t('pages.investment.title')}
        subtitle={t('pages.investment.subtitle')}
      >
        <PlaceholderContent pageName="Investiční příležitost" />

        {/* Placeholder content structure */}
        <div className="mt-8 space-y-6">
          <h2>Investujte do nemovitosti v Krkonoších</h2>
          <p>
            Apartmány Pod Zlatým návrším představují jedinečnou investiční 
            příležitost v nejžádanější horské lokalitě České republiky. 
            Kombinace luxusního bydlení a stabilních výnosů z pronájmu.
          </p>

          <h3>Výhody investice</h3>
          <ul>
            <li>Stabilní zhodnocení nemovitosti v prémiové lokalitě</li>
            <li>Pasivní příjem z krátkodobého pronájmu</li>
            <li>Možnost vlastního využití po celý rok</li>
            <li>Profesionální správa a servis</li>
            <li>Vysoká obsazenost díky celoroční atraktivitě destinace</li>
          </ul>

          <h3>Výnosy z pronájmu</h3>
          <p>
            Díky celoroční atraktivitě Špindlerova Mlýna a profesionální 
            správě dosahují apartmány vysoké obsazenosti a stabilních 
            výnosů z pronájmu.
          </p>
        </div>
      </StaticPage>

      {/* Last Apartment CTA Section */}
      <Section background="dark">
        <Container>
          <div className="text-center py-8">
            <Badge variant="highlight" className="mb-4">
              {t('pages.investment.lastChance')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('pages.investment.lastApartment')}
            </h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Poslední příležitost stát se vlastníkem luxusního apartmánu 
              v projektu Pod Zlatým návrším.
            </p>
            <Link href="/kontakt">
              <Button variant="primary" size="lg" className="bg-amber-500 hover:bg-amber-600">
                {locale === 'cs' ? 'Mám zájem' : 'I am interested'}
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
