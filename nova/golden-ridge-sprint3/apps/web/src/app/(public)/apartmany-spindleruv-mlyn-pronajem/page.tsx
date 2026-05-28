/**
 * Apartmány Špindlerův Mlýn Pronájem Page
 * Sprint 1: Existing URL preserved per SPRINT_1_PLAN.md §3.1
 * 
 * URL: /apartmany-spindleruv-mlyn-pronajem (SEO Critical)
 * 
 * This URL must be preserved exactly for SEO.
 * It serves as an alternate entry point to the rental listing.
 * 
 * Sprint 3: Uses mock data directly for reliable SSR
 */

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromCookie, createT } from '@/lib/i18n';
import { getMockApartments } from '@/lib/mock-data';
import { Container, Section, SectionHeader } from '@/components/ui';
import { ApartmentGrid } from '@/components/features/apartment-grid';

export const metadata: Metadata = {
  title: 'Apartmány Špindlerův Mlýn Pronájem | Golden Ridge Apartments',
  description: 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně. Golden Ridge Apartments - krátkodobý pronájem v Krkonoších.',
  keywords: 'apartmány Špindl, apartmány Špindlerův Mlýn, pronájem apartmánů, ubytování Krkonoše, Golden Ridge',
};

export default async function ApartmanySpindlPage() {
  const cookieStore = cookies();
  const locale = getLocaleFromCookie(cookieStore.get('NEXT_LOCALE')?.value);
  const t = createT(locale);

  // Use mock data directly - no fetch needed
  const apartments = getMockApartments(locale);

  return (
    <>
      {/* Page Header */}
      <Section background="light" className="py-12 md:py-16">
        <Container>
          <SectionHeader
            title={t('rental.title')}
            subtitle={t('rental.subtitle')}
          />
        </Container>
      </Section>

      {/* Apartment Listing */}
      <Section>
        <Container>
          <ApartmentGrid apartments={apartments} />
        </Container>
      </Section>

      {/* SEO Content */}
      <Section background="light">
        <Container size="narrow">
          <div className="prose prose-slate max-w-none">
            <h2>Pronájem apartmánů ve Špindlerově Mlýně</h2>
            <p>
              Hledáte kvalitní ubytování v Krkonoších? Golden Ridge Apartments 
              nabízí luxusní apartmány k pronájmu přímo v centru Špindlerova Mlýna. 
              Naše apartmány jsou ideální pro rodiny, páry i skupiny přátel.
            </p>
            <h3>Proč zvolit Golden Ridge Apartments?</h3>
            <ul>
              <li>Prémiová lokalita v centru Špindlu</li>
              <li>Moderní vybavení a vysoký standard</li>
              <li>Blízkost lyžařských svahů a turistických tras</li>
              <li>Možnost celoročního pobytu</li>
            </ul>
          </div>
        </Container>
      </Section>
    </>
  );
}
