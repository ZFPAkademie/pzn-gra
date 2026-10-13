/**
 * Apartmán k pronájmu - Detail page
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getApartmentBySlugDB, getSalesManager, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getRequestLocaleFull } from '@/lib/i18n-server';
import type { Locale } from '@/lib/i18n';
import { getFdmPriceFrom } from '@/lib/booking-engine/pricing';
import { getApartmentImages } from '@/data/apartment-images';
import { ApartmentGallery } from '@/components/features/apartment-gallery';
import { BookingWidget } from '@/components/features/booking-widget';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getRequestLocaleFull();
  const raw = await getApartmentBySlugDB(params.slug);
  if (!raw) return { title: locale === 'cs' ? 'Apartmán nenalezen' : locale === 'pl' ? 'Nie znaleziono apartamentu' : 'Apartment not found' };
  const apt = localizeApartment(raw, locale);

  return {
    title: locale === 'pl'
      ? `${apt.title} | Wynajem Szpindlerowy Młyn | Pod Zlatým návrším`
      : `${apt.title} | ${locale === 'cs' ? 'Pronájem' : 'Rentals'} | Pod Zlatým návrším`,
    description: apt.description ?? undefined,
  };
}

/** Plocha místnosti z DB („6,25 m²“) — v EN desetinná tečka, CS a PL čárka */
function roomArea(value: string, locale: Locale): string {
  return locale === 'cs' || locale === 'pl' ? value : value.replace(/(\d),(\d)/g, '$1.$2');
}

export default async function RentalApartmentDetailPage({ params }: Props) {
  const locale = getRequestLocaleFull();
  const rawApt = await getApartmentBySlugDB(params.slug);
  const manager = getSalesManager();
  const images = await getApartmentImages(params.slug);

  if (!rawApt || !rawApt.for_rent) {
    notFound();
  }
  const apt = localizeApartment(rawApt, locale);

  const T = {
    cs: {
    back: 'Zpět na přehled',
    alsoForSale: 'I k prodeji',
    maxGuests: (n: number | null) => `max. ${n} hostů`,
    area: 'Plocha',
    layout: 'Dispozice',
    maxGuestsLabel: 'Max. hostů',
    orientation: 'Orientace',
    about: 'O apartmánu',
    rooms: 'Členění',
    hall: 'Vstupní hala',
    bathroom: 'Koupelna',
    bedroom: 'Ložnice',
    livingKitchen: 'Pokoj s kuchyní',
    features: 'Vybavení',
    rentFrom: 'Pronájem od',
    seasonal: 'Ceny se mohou lišit dle sezóny',
    enquire: 'Poptat rezervaci',
    orContact: 'Nebo nás kontaktujte přímo:',
    saleTitle: 'Tento apartmán je i k prodeji',
    saleText: 'Díky vybavení apartmánu můžete ihned bez dalších nákladů profitovat z pronájmu jednotky.',
    managerTitle: manager.title,
    mailSubject: `Zájem o koupi ${apt.title}`,
    writeEmail: 'Napsat e-mail',
    otherText: 'Prohlédněte si další dostupné apartmány',
    allRentals: 'Všechny apartmány k pronájmu',
  },
    en: {
    back: 'Back to overview',
    alsoForSale: 'Also for sale',
    maxGuests: (n: number | null) => `up to ${n} ${n === 1 ? 'guest' : 'guests'}`,
    area: 'Floor area',
    layout: 'Layout',
    maxGuestsLabel: 'Max. guests',
    orientation: 'Orientation',
    about: 'About the apartment',
    rooms: 'Room breakdown',
    hall: 'Entrance hall',
    bathroom: 'Bathroom',
    bedroom: 'Bedroom',
    livingKitchen: 'Living room with kitchen',
    features: 'Amenities',
    rentFrom: 'Rates from',
    seasonal: 'Prices may vary by season',
    enquire: 'Request a booking',
    orContact: 'Or contact us directly:',
    saleTitle: 'This apartment is also for sale',
    saleText: "Thanks to the apartment's furnishings, you can benefit from renting out the unit immediately, with no further costs.",
    managerTitle: manager.title === 'Manažer prodeje' ? 'Sales Manager' : manager.title,
    mailSubject: `Interest in purchasing ${apt.title}`,
    writeEmail: 'Send an email',
    otherText: 'Browse our other available apartments',
    allRentals: 'All apartments for rent',
  },
    pl: {
      back: 'Powrót do przeglądu',
      alsoForSale: 'Również na sprzedaż',
      maxGuests: (n: number | null) => `maks. ${n} ${n === 1 ? 'gość' : 'gości'}`,
      area: 'Powierzchnia',
      layout: 'Układ',
      maxGuestsLabel: 'Maks. gości',
      orientation: 'Orientacja',
      about: 'O apartamencie',
      rooms: 'Pomieszczenia',
      hall: 'Przedpokój',
      bathroom: 'Łazienka',
      bedroom: 'Sypialnia',
      livingKitchen: 'Salon z aneksem kuchennym',
      features: 'Wyposażenie',
      rentFrom: 'Wynajem od',
      seasonal: 'Ceny mogą się różnić w zależności od sezonu',
      enquire: 'Zapytaj o rezerwację',
      orContact: 'Lub prosimy o bezpośredni kontakt:',
      saleTitle: 'Ten apartament jest również na sprzedaż',
      saleText: 'Dzięki wyposażeniu apartamentu mogą Państwo od razu, bez dodatkowych kosztów, czerpać zyski z jego wynajmu.',
      managerTitle: manager.title === 'Manažer prodeje' ? 'Menedżer sprzedaży' : manager.title,
      mailSubject: `Zainteresowanie zakupem: ${apt.title}`,
      writeEmail: 'Napisz e-mail',
      otherText: 'Zobacz inne dostępne apartamenty',
      allRentals: 'Wszystkie apartamenty na wynajem',
    },
  };
  const t = T[locale];

  const totalArea = apt.area_m2 ? apt.area_m2.toLocaleString(locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB') + ' m²' : '—';
  // Cena „od": Front Desk Master (EUR), jinak lokální base_price (CZK)
  const fdmPriceFrom = apt.fdm_room_use_id ? await getFdmPriceFrom(apt.id) : null;
  const priceFrom = fdmPriceFrom
    ? { amount: Math.round(fdmPriceFrom.cents / 100), currency: fdmPriceFrom.currency }
    : apt.base_price_cents
      ? { amount: Math.round(apt.base_price_cents / 100), currency: 'CZK' as const }
      : null;
  const hasBookingEngine = !!apt.id && !!priceFrom;
  const alsoForSale = apt.for_sale;

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>

          <div className="flex items-center gap-4 mb-6">
            {alsoForSale && (
              <span className="px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest">
                {t.alsoForSale}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
            {apt.title}
          </h1>
          <div className="flex items-center gap-4 text-white/50">
            <span>{layoutLabel(apt.layout, locale)}</span>
            <span>·</span>
            <span>{totalArea}</span>
            <span>·</span>
            <span>{t.maxGuests(apt.max_guests)}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">

            {/* Left: Details */}
            <div className="lg:col-span-2">
              {/* Gallery */}
              <div className="mb-16">
                <ApartmentGallery images={images} title={apt.title ?? ''} />
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.area}</p>
                  <p className="text-2xl font-light text-navy">{totalArea}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.layout}</p>
                  <p className="text-2xl font-light text-navy">{apt.layout != null ? layoutLabel(apt.layout, locale) : '—'}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.maxGuestsLabel}</p>
                  <p className="text-2xl font-light text-navy">{apt.max_guests ?? '—'}</p>
                </div>
                <div className="border-b border-navy/10 pb-4">
                  <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.orientation}</p>
                  <p className="text-2xl font-light text-navy">{apt.orientation ?? '—'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-16">
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.about}</h2>
                <p className="text-navy/70 leading-relaxed text-lg whitespace-pre-line">
                  {apt.description}
                </p>
              </div>

              {/* Room breakdown */}
              {apt.rooms && (
                <div className="mb-16">
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.rooms}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.hall}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.hall, locale)}</p>
                    </div>
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.bathroom}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.bathroom, locale)}</p>
                    </div>
                    {apt.rooms.bedroom && (
                      <div className="bg-stone p-6">
                        <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.bedroom}</p>
                        <p className="text-xl text-navy">{roomArea(apt.rooms.bedroom, locale)}</p>
                      </div>
                    )}
                    <div className="bg-stone p-6">
                      <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{t.livingKitchen}</p>
                      <p className="text-xl text-navy">{roomArea(apt.rooms.livingKitchen, locale)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Features */}
              {apt.features && apt.features.length > 0 && (
                <div>
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.features}</h2>
                  <div className="flex flex-wrap gap-3">
                    {apt.features.map((feature, i) => (
                      <span key={i} className="px-4 py-2 bg-stone text-navy text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Booking Widget */}
            <div className="lg:col-span-1 space-y-6">
              {hasBookingEngine ? (
                <BookingWidget
                  apartmentId={apt.id}
                  apartmentSlug={params.slug}
                  maxGuests={apt.max_guests ?? 4}
                  basePricePerNight={priceFrom?.amount ?? 0}
                  currency={priceFrom?.currency ?? 'CZK'}
                />
              ) : (
                <div className="bg-navy p-8">
                  <p className="text-gold text-sm tracking-widest uppercase mb-4">{t.rentFrom}</p>
                  <p className="text-white/30 text-sm mb-8">
                    {t.seasonal}
                  </p>
                  <Link
                    href="/kontakt"
                    className="flex items-center justify-center w-full py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-[#b8913c] transition-colors mb-4"
                  >
                    {t.enquire}
                  </Link>
                  <div className="border-t border-white/10 pt-6 mt-6">
                    <p className="text-white/50 text-sm mb-4">{t.orContact}</p>
                    <a
                      href="mailto:rezervace@podzlatymnavrsim.cz"
                      className="flex items-center text-white hover:text-gold transition-colors text-sm"
                    >
                      <svg className="w-4 h-4 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      rezervace@podzlatymnavrsim.cz
                    </a>
                  </div>
                </div>
              )}

              {/* Sale Card - only if also for sale */}
              {alsoForSale && (
                <div className="bg-stone p-8 border-2 border-gold">
                  <p className="text-gold text-sm tracking-widest uppercase mb-4">{t.saleTitle}</p>
                  <p className="text-navy/70 text-sm mb-6">
                    {t.saleText}
                  </p>

                  <div className="flex items-center mb-6">
                    <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                      <Image
                        src={manager.photo}
                        alt={manager.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-navy font-medium">{manager.name}</p>
                      <p className="text-navy/50 text-xs">{t.managerTitle}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={`tel:${manager.phone.replace(/\s/g, '')}`}
                      className="flex items-center justify-center w-full py-3 bg-navy text-white text-sm uppercase tracking-widest hover:bg-navy/90 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {manager.phone}
                    </a>
                    <a
                      href={`mailto:${manager.email}?subject=${t.mailSubject}`}
                      className="flex items-center justify-center w-full py-3 border border-navy text-navy text-sm uppercase tracking-widest hover:bg-navy/5 transition-colors"
                    >
                      {t.writeEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Other apartments */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-navy/50 mb-6">
            {t.otherText}
          </p>
          <Link
            href="/apartmany-spindleruv-mlyn-pronajem"
            className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors"
          >
            {t.allRentals}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
