/**
 * Apartment Detail (Rent) - Design Checklist 2030
 *
 * - Fotografie fullscreen
 * - Cena sekundární
 * - CTA klidné
 * - Technické údaje jako metadata
 * - Žádné tabulky
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRequestLocaleFull } from '@/lib/i18n-server';
import { getApartmentBySlugDB, localizeApartment, layoutLabel } from '@/lib/apartments';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = getRequestLocaleFull();
  const raw = await getApartmentBySlugDB(params.slug);
  if (!raw) return { title: locale === 'cs' ? 'Apartmán nenalezen' : locale === 'pl' ? 'Nie znaleziono apartamentu' : 'Apartment not found' };
  const apartment = localizeApartment(raw, locale);
  return {
    title: locale === 'pl'
      ? `${apartment.title} | Wynajem Szpindlerowy Młyn | Pod Zlatým návrším`
      : `${apartment.title} | ${locale === 'cs' ? 'Pronájem' : 'Rentals'} | Pod Zlatým návrším`,
    description: apartment.description ?? undefined,
  };
}

export default async function RentApartmentDetailPage({ params }: PageProps) {
  const locale = getRequestLocaleFull();

  const rawApartment = await getApartmentBySlugDB(params.slug);
  if (!rawApartment || !rawApartment.for_rent) notFound();
  const apartment = localizeApartment(rawApartment, locale);

  const T = {
    cs: {
    back: 'Zpět na přehled',
    area: 'Plocha',
    rooms: 'Místnosti',
    capacity: 'Kapacita',
    persons: (_n: number) => 'osob',
    priceFrom: 'Cena od',
    perNight: 'za noc',
    amenities: 'Vybavení',
    cta: 'Poptat termín',
    ctaSubtext: 'Odpovíme do 24 hodin',
    descriptionFallback: 'Luxusní apartmán s výhledem na hory. Plně vybavený pro komfortní pobyt v Krkonoších.',
  },
    en: {
    back: 'Back to overview',
    area: 'Floor area',
    rooms: 'Layout',
    capacity: 'Capacity',
    persons: (n: number) => (n === 1 ? 'guest' : 'guests'),
    priceFrom: 'Price from',
    perNight: 'per night',
    amenities: 'Amenities',
    cta: 'Enquire about availability',
    ctaSubtext: 'We respond within 24 hours',
    descriptionFallback: 'A luxury apartment with mountain views. Fully equipped for a comfortable stay in the Krkonoše (Giant Mountains).',
  },
    pl: {
      back: 'Powrót do przeglądu',
      area: 'Powierzchnia',
      rooms: 'Układ',
      capacity: 'Liczba miejsc',
      persons: (n: number) => (n === 1 ? 'osoba' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'osoby' : 'osób'),
      priceFrom: 'Cena od',
      perNight: 'za noc',
      amenities: 'Wyposażenie',
      cta: 'Zapytaj o termin',
      ctaSubtext: 'Odpowiadamy w ciągu 24 godzin',
      descriptionFallback: 'Luksusowy apartament z widokiem na góry. W pełni wyposażony, zapewnia komfortowy pobyt w Karkonoszach.',
    },
  };
  const t = T[locale];
  const numLocale = locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB';

  const totalArea = apartment.area_m2 ? apartment.area_m2.toLocaleString(numLocale) + ' m²' : '—';
  const priceFrom = apartment.base_price_cents ? Math.round(apartment.base_price_cents / 100) : null;

  return (
    <>
      {/* Hero Image - Fullscreen */}
      <section className="relative h-[70vh] bg-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />

        {/* Back link */}
        <div className="absolute top-32 left-6 z-10">
          <Link
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="text-white/60 text-sm hover:text-white transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
              {apartment.title}
            </h1>
            <p className="text-white/60 text-lg">
              {totalArea} · {layoutLabel(apartment.layout, locale)}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">

            {/* Main content */}
            <div className="lg:col-span-2 space-y-16">

              {/* Description */}
              <div>
                <p className="text-lg text-navy/70 leading-relaxed">
                  {apartment.description ?? t.descriptionFallback}
                </p>
              </div>

              {/* Specs - as metadata, not table */}
              <div className="grid grid-cols-3 gap-8 py-8 border-t border-b border-navy/10">
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.area}</p>
                  <p className="text-2xl font-light text-navy">{totalArea}</p>
                </div>
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.rooms}</p>
                  <p className="text-2xl font-light text-navy">{apartment.layout != null ? layoutLabel(apartment.layout, locale) : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-navy/40 mb-2">{t.capacity}</p>
                  <p className="text-2xl font-light text-navy">{apartment.max_guests ?? 4} {t.persons(apartment.max_guests ?? 4)}</p>
                </div>
              </div>

              {/* Amenities - simple list */}
              {apartment.features && apartment.features.length > 0 && (
                <div>
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.amenities}</h2>
                  <div className="flex flex-wrap gap-3">
                    {apartment.features.map((amenity, i) => (
                      <span key={i} className="px-4 py-2 bg-stone text-navy/70 text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - CTA */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-white p-8 border border-navy/10">
                {priceFrom && (
                  <div className="mb-8">
                    <p className="text-sm text-navy/40 mb-2">{t.priceFrom}</p>
                    <p className="text-3xl font-light text-navy">
                      {priceFrom.toLocaleString(numLocale)} {locale === 'pl' ? 'CZK' : 'Kč'}
                      <span className="text-lg text-navy/50 ml-2">{t.perNight}</span>
                    </p>
                  </div>
                )}

                <Link
                  href={`/kontakt?apartment=${apartment.slug}`}
                  className="block w-full py-4 bg-gold text-navy text-center text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors mb-4"
                >
                  {t.cta}
                </Link>

                <p className="text-sm text-navy/40 text-center">
                  {t.ctaSubtext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
