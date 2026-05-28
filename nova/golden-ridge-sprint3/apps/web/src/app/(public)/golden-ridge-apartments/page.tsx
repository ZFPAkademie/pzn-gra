/**
 * Golden Ridge Apartments Page
 * Sprint 1: Rental section homepage per SPRINT_1_PLAN.md §3.2
 * 
 * URL: /golden-ridge-apartments
 * 
 * Sprint 3: Uses mock data directly for reliable SSR
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { getMockApartments } from '@/lib/mock-data';
import { Container, Section, SectionHeader, Button } from '@/components/ui';
import { ApartmentGrid } from '@/components/features/apartment-grid';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  return {
    title: `${t('rental.subtitle')} | ${t('rental.title')}`,
    description: locale === 'cs' 
      ? 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně. Rezervujte si pobyt v Golden Ridge Apartments.'
      : 'Luxury apartments for rent in Špindlerův Mlýn. Book your stay at Golden Ridge Apartments.',
    keywords: 'Golden Ridge Apartments, pronájem apartmánů, Špindlerův Mlýn, ubytování Krkonoše',
  };
}

export default async function GoldenRidgeApartmentsPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  // Use mock data directly - no fetch needed
  const apartments = getMockApartments(locale);

  return (
    <>
      {/* Hero Section */}
      <Section background="dark" className="py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sky-400 font-medium mb-2">Golden Ridge Apartments</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t('rental.title')}
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              {locale === 'cs'
                ? 'Luxusní apartmány k pronájmu v srdci Špindlerova Mlýna. Ideální pro váš odpočinek v Krkonoších.'
                : 'Luxury apartments for rent in the heart of Špindlerův Mlýn. Ideal for your relaxation in the Krkonoše mountains.'}
            </p>
            <div className="flex items-center space-x-2 text-slate-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zm0 4l7.53 14H4.47L12 6z"/>
              </svg>
              <span>Špindlerův Mlýn, Krkonoše</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Apartment Listing */}
      <Section>
        <Container>
          <SectionHeader
            title={locale === 'cs' ? 'Dostupné apartmány' : 'Available Apartments'}
            subtitle={locale === 'cs'
              ? 'Vyberte si z naší nabídky luxusních apartmánů'
              : 'Choose from our selection of luxury apartments'}
          />
          <ApartmentGrid apartments={apartments} />
        </Container>
      </Section>

      {/* Features Section */}
      <Section background="light">
        <Container>
          <SectionHeader
            title={locale === 'cs' ? 'Proč Golden Ridge?' : 'Why Golden Ridge?'}
            centered
          />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-sky-100 rounded-lg flex items-center justify-center text-sky-600 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {locale === 'cs' ? 'Prémiová lokalita' : 'Premium Location'}
              </h3>
              <p className="text-slate-600">
                {locale === 'cs'
                  ? 'V centru Špindlerova Mlýna, blízko lanovek a sjezdovek'
                  : 'In the center of Špindlerův Mlýn, close to cable cars and slopes'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-sky-100 rounded-lg flex items-center justify-center text-sky-600 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {locale === 'cs' ? 'Luxusní vybavení' : 'Luxury Amenities'}
              </h3>
              <p className="text-slate-600">
                {locale === 'cs'
                  ? 'Moderní apartmány s plným vybavením pro maximální komfort'
                  : 'Modern apartments fully equipped for maximum comfort'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-sky-100 rounded-lg flex items-center justify-center text-sky-600 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {locale === 'cs' ? 'Snadná rezervace' : 'Easy Booking'}
              </h3>
              <p className="text-slate-600">
                {locale === 'cs'
                  ? 'Jednoduchý proces rezervace s okamžitým potvrzením'
                  : 'Simple booking process with instant confirmation'}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact CTA */}
      <Section>
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {locale === 'cs' ? 'Máte dotazy?' : 'Have questions?'}
            </h2>
            <p className="text-slate-600 mb-6">
              {locale === 'cs'
                ? 'Kontaktujte nás a rádi vám pomůžeme s výběrem apartmánu.'
                : 'Contact us and we will be happy to help you choose an apartment.'}
            </p>
            <Link href="/kontakt">
              <Button variant="secondary">
                {t('nav.contact')}
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
