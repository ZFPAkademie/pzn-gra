/**
 * Suites Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /suites (SEO Critical)
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { Container, Section, SectionHeader, Card, CardContent, Badge, Button } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('pages.suites.title')} | Pod Zlatým návrším`,
    description: t('pages.suites.subtitle'),
  };
}

// Placeholder suite types
const suiteTypes = [
  {
    id: 'studio',
    name: 'Studio',
    size: '35-45 m²',
    capacity: '2 osoby',
    description: 'Kompaktní apartmán ideální pro páry. Plně vybavený s kuchyňským koutem a moderní koupelnou.',
    available: false,
  },
  {
    id: '1kk',
    name: 'Apartmán 1+kk',
    size: '45-55 m²',
    capacity: '2-3 osoby',
    description: 'Prostorný apartmán s odděleným spaním. Ideální pro menší rodiny nebo dvojice vyžadující více prostoru.',
    available: false,
  },
  {
    id: '2kk',
    name: 'Apartmán 2+kk',
    size: '65-85 m²',
    capacity: '4-5 osob',
    description: 'Rodinný apartmán se dvěma ložnicemi. Prostorný obývací pokoj s plně vybavenou kuchyní.',
    available: true,
  },
  {
    id: '3kk',
    name: 'Apartmán 3+kk',
    size: '95-120 m²',
    capacity: '6-8 osob',
    description: 'Nejluxusnější apartmán s třemi ložnicemi. Ideální pro větší rodiny nebo skupiny přátel.',
    available: false,
  },
];

export default function SuitesPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return (
    <>
      {/* Page Header */}
      <Section background="light" className="py-12 md:py-16">
        <Container>
          <SectionHeader
            title={t('pages.suites.title')}
            subtitle={t('pages.suites.subtitle')}
          />
        </Container>
      </Section>

      {/* Suite Types */}
      <Section>
        <Container>
          <div className="grid md:grid-cols-2 gap-8">
            {suiteTypes.map((suite) => (
              <Card key={suite.id} className="overflow-hidden">
                {/* Placeholder image */}
                <div className="aspect-[16/10] bg-slate-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-stone-500">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {suite.available && (
                    <Badge variant="highlight" className="absolute top-4 right-4">
                      {locale === 'cs' ? 'K dispozici' : 'Available'}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-navy mb-2">{suite.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-stone-700 mb-4">
                    <span>{suite.size}</span>
                    <span>•</span>
                    <span>{suite.capacity}</span>
                  </div>
                  <p className="text-stone-700 mb-4">{suite.description}</p>
                  {suite.available ? (
                    <Link href="/kontakt">
                      <Button variant="primary" size="sm">
                        {locale === 'cs' ? 'Mám zájem' : 'I am interested'}
                      </Button>
                    </Link>
                  ) : (
                    <Badge variant="default">
                      {locale === 'cs' ? 'Prodáno' : 'Sold'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section background="light">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">
              {locale === 'cs' 
                ? 'Hledáte ubytování místo koupě?' 
                : 'Looking for accommodation instead of purchase?'}
            </h2>
            <p className="text-stone-700 mb-6">
              {locale === 'cs'
                ? 'Prohlédněte si naše apartmány k pronájmu v rámci Golden Ridge Apartments.'
                : 'Browse our apartments for rent within Golden Ridge Apartments.'}
            </p>
            <Link href="/golden-ridge-apartments">
              <Button variant="secondary">
                {locale === 'cs' ? 'Zobrazit pronájem' : 'View rentals'}
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
