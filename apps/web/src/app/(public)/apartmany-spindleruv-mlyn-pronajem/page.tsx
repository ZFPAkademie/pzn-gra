/**
 * Apartmány k pronájmu - Design 2030
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getRentalApartmentsDB, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getFdmPriceFromMany } from '@/lib/booking-engine/pricing';
import { formatMoney } from '@/lib/booking-engine/money';
import { getHeroImagesBySlugs } from '@/data/apartment-images';
import { getRequestLocaleFull } from '@/lib/i18n-server';

import { ApartmentTitle } from '@/components/features/apartment-title';
import { DateSearchBar } from '@/components/features/date-search';
import { GuestRatingBadge, StayRules, StayFaq } from '@/components/features/guest-info';
export const dynamic = 'force-dynamic';

/** Polské množné číslo: 1 / 2–4 (mimo 12–14) / ostatní */
function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getRequestLocaleFull();
  if (locale === 'pl') {
    return {
      title: 'Apartamenty na wynajem | Pod Zlatým návrším | Szpindlerowy Młyn',
      description: 'Luksusowe apartamenty na wynajem w Szpindlerowym Młynie, tuż przy wyciągu krzesełkowym. W pełni wyposażone, designerskie meble KARE.',
    };
  }
  if (locale === 'en') {
    return {
      title: 'Apartments for rent | Pod Zlatým návrším | Špindlerův Mlýn',
      description: 'Luxury apartments for rent in Špindlerův Mlýn, right by the chairlift. Fully equipped, KARE designer furniture.',
    };
  }
  return {
    title: 'Apartmány k pronájmu | Pod Zlatým návrším | Špindlerův Mlýn',
    description: 'Luxusní apartmány k pronájmu ve Špindlerově Mlýně, přímo u lanovky. Plně vybavené, designový nábytek KARE.',
  };
}

export default async function RentalApartmentsPage() {
  const locale = getRequestLocaleFull();
  const numLocale = locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB';
  const apartments = (await getRentalApartmentsDB()).map((a) => localizeApartment(a, locale));
  const T = {
    cs: {
    eyebrow: 'Pronájem',
    h1: 'Apartmány k pronájmu',
    lead: 'Luxusní apartmány ve Špindlerově Mlýně, přímo u lanovky Labská. Plně vybavené, designový nábytek KARE.',
    statApartments: (_n: number) => 'apartmánů',
    statArea: 'm² plocha',
    statGuests: 'hosté',
    statLift: 'od lanovky',
    alsoForSale: 'I k prodeji',
    maxGuests: (n: number | null) => `max. ${n} hostů`,
    from: 'od',
    perNight: 'za noc',
    priceOnRequest: 'Cena na dotaz',
    detail: 'Detail',
    featuresTitle: 'Všechny apartmány nabízejí',
    features: [
      { title: 'Designový nábytek', desc: 'KARE Design' },
      { title: 'Plná výbava', desc: 'Myčka, trouba, kávovar, pračka' },
      { title: 'Komfort', desc: 'TV se streamováním, Wi-Fi, trezor' },
      { title: 'Umístění', desc: '50 m od lanovky Labská' },
      { title: 'Parkování zdarma', desc: 'Soukromé, přímo u domu' },
      { title: 'Lyžárna a kolárna', desc: 'Uzamykatelná, v přízemí' },
      { title: 'Samoobslužný příjezd', desc: '16:00–24:00, klíče ve schránce' },
      { title: 'Mazlíčci vítáni', desc: 'Za poplatek, na vyžádání' },
    ],
    directTitle: 'Proč rezervovat přímo',
    directText: 'Rezervujete u provozovatele apartmánů, bez zprostředkovatele. Zrušení zdarma do 14 dnů před příjezdem, parkování, Wi-Fi, ložní prádlo a ručníky v ceně.',
    ctaTitle: 'Chcete rezervovat?',
    ctaText: 'Kontaktujte nás pro rezervaci nebo více informací o dostupnosti.',
    ctaButton: 'Kontaktovat nás',
    noFixedDates: 'Nemáte přesný termín?',
    nearestStays: 'Zobrazit nejbližší volné pobyty',
    ctaFreeDates: 'Zobrazit volné termíny',
  },
    en: {
    eyebrow: 'Rentals',
    h1: 'Apartments for rent',
    lead: 'Luxury apartments in Špindlerův Mlýn, right by the Labská chairlift. Fully equipped, KARE designer furniture.',
    statApartments: (n: number) => (n === 1 ? 'apartment' : 'apartments'),
    statArea: 'm² floor area',
    statGuests: 'guests',
    statLift: 'from the chairlift',
    alsoForSale: 'Also for sale',
    maxGuests: (n: number | null) => `up to ${n} ${n === 1 ? 'guest' : 'guests'}`,
    from: 'from',
    perNight: 'per night',
    priceOnRequest: 'Price on request',
    detail: 'Details',
    featuresTitle: 'Every apartment offers',
    features: [
      { title: 'Designer furniture', desc: 'KARE Design' },
      { title: 'Fully equipped', desc: 'Dishwasher, oven, coffee machine, washing machine' },
      { title: 'Comfort', desc: 'TV with streaming, Wi-Fi, safe' },
      { title: 'Location', desc: '50 m from the Labská chairlift' },
      { title: 'Free parking', desc: 'Private, right by the building' },
      { title: 'Ski and bike room', desc: 'Lockable, ground floor' },
      { title: 'Self check-in', desc: '4 pm to midnight, key box' },
      { title: 'Pets welcome', desc: 'For a fee, on request' },
    ],
    directTitle: 'Why book directly',
    directText: 'You book with the operator of the apartments, with no intermediary. Free cancellation up to 14 days before arrival; parking, Wi-Fi, bed linen and towels are included.',
    ctaTitle: 'Would you like to book?',
    ctaText: 'Contact us to make a reservation or for more information on availability.',
    ctaButton: 'Contact us',
    noFixedDates: 'No fixed dates?',
    nearestStays: 'See the next available stays',
    ctaFreeDates: 'See available dates',
  },
    pl: {
      eyebrow: 'Wynajem',
      h1: 'Apartamenty na wynajem',
      lead: 'Luksusowe apartamenty w Szpindlerowym Młynie, tuż przy wyciągu krzesełkowym Labská. W pełni wyposażone, designerskie meble KARE.',
      statApartments: (n: number) => plPlural(n, 'apartament', 'apartamenty', 'apartamentów'),
      statArea: 'm² powierzchni',
      statGuests: 'gości',
      statLift: 'od wyciągu',
      alsoForSale: 'Również na sprzedaż',
      maxGuests: (n: number | null) => `maks. ${n} ${plPlural(n ?? 0, 'gość', 'gości', 'gości')}`,
      from: 'od',
      perNight: 'za noc',
      priceOnRequest: 'Cena na zapytanie',
      detail: 'Szczegóły',
      featuresTitle: 'Każdy apartament oferuje',
      features: [
        { title: 'Designerskie meble', desc: 'KARE Design' },
        { title: 'Pełne wyposażenie', desc: 'Zmywarka, piekarnik, ekspres do kawy, pralka' },
        { title: 'Komfort', desc: 'TV ze streamingiem, Wi-Fi, sejf' },
        { title: 'Lokalizacja', desc: '50 m od wyciągu Labská' },
        { title: 'Bezpłatny parking', desc: 'Prywatny, przy budynku' },
        { title: 'Narciarnia i rowerownia', desc: 'Zamykana, na parterze' },
        { title: 'Samodzielne zameldowanie', desc: '16:00–24:00, klucze w skrzynce' },
        { title: 'Zwierzęta mile widziane', desc: 'Za opłatą, na życzenie' },
      ],
      directTitle: 'Dlaczego rezerwować bezpośrednio',
      directText: 'Rezerwują Państwo u operatora apartamentów, bez pośrednika. Bezpłatne anulowanie do 14 dni przed przyjazdem; parking, Wi-Fi, pościel i ręczniki w cenie.',
      ctaTitle: 'Chcą Państwo zarezerwować?',
      ctaText: 'Prosimy o kontakt w celu rezerwacji lub uzyskania informacji o dostępności.',
      ctaButton: 'Kontakt',
      noFixedDates: 'Nie mają Państwo ustalonego terminu?',
      nearestStays: 'Zobacz najbliższe wolne pobyty',
      ctaFreeDates: 'Zobacz wolne terminy',
    },
  };
  const t = T[locale];
  // Cena „od" z Front Desk Master pro napojené apartmány (klíč = slug)
  const fdmPrices = await getFdmPriceFromMany(apartments.filter((a) => a.fdm_room_use_id).map((a) => a.id));
  const priceFromBySlug: Record<string, { cents: number; currency: 'CZK' | 'EUR' } | undefined> = {};
  for (const a of apartments) priceFromBySlug[a.slug] = fdmPrices[a.id];
  const heroImages = await getHeroImagesBySlugs(apartments.map((a) => a.slug));

  // Rozsahy pro pruh se statistikami počítané z dat, ne natvrdo
  const areas  = apartments.map((a) => Number(a.area_m2)).filter((n) => n > 0);
  const guests = apartments.map((a) => Number(a.max_guests)).filter((n) => n > 0);
  const range  = (xs: number[]) => {
    if (!xs.length) return '—';
    const lo = Math.floor(Math.min(...xs)), hi = Math.floor(Math.max(...xs));
    return lo === hi ? String(lo) : `${lo}–${hi}`;
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">
            {t.eyebrow}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6">
            {t.h1}
          </h1>
          <p className="text-xl text-white/50 max-w-xl mb-10">
            {t.lead}
          </p>
          <DateSearchBar />
          <div className="mt-6">
            <GuestRatingBadge locale={locale} light />
          </div>
          <p className="mt-3 text-sm text-white/50">
            {t.noFixedDates}{' '}
            <Link
              href="/volne-terminy"
              className="inline-block py-2 text-gold border-b border-gold/40 hover:border-gold transition-colors"
            >
              {t.nearestStays}
            </Link>
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-gold py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-y-6 md:flex md:flex-wrap md:justify-center md:gap-16 text-navy">
            <div className="text-center">
              <p className="text-3xl font-light">{apartments.length}</p>
              <p className="text-sm opacity-70">{t.statApartments(apartments.length)}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">{range(areas)}</p>
              <p className="text-sm opacity-70">{t.statArea}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">{range(guests)}</p>
              <p className="text-sm opacity-70">{t.statGuests}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light">50 m</p>
              <p className="text-sm opacity-70">{t.statLift}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apartments Grid */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apt) => {
              const heroImage = heroImages[apt.slug] ?? null;
              const totalArea = apt.area_m2 ? apt.area_m2.toLocaleString(numLocale) + ' m²' : '—';
              const alsoForSale = apt.for_sale;
              return (
                <Link
                  key={apt.slug}
                  href={`/apartmany-spindleruv-mlyn-pronajem/${apt.slug}`}
                  className="group block bg-white"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-stone overflow-hidden">
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={apt.title ?? ''}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-navy/10" />
                    )}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 text-navy text-xs">
                        {layoutLabel(apt.layout, locale)} · {totalArea}
                      </span>
                    </div>
                    {alsoForSale && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-gold text-navy text-xs uppercase tracking-wider">
                          {t.alsoForSale}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-light text-navy group-hover:text-gold transition-colors mb-2">
                      <ApartmentTitle title={apt.title} />
                    </h2>

                    <div className="flex items-center gap-4 text-sm text-navy/50 mb-4">
                      <span>{t.maxGuests(apt.max_guests)}</span>
                      <span>·</span>
                      <span>{apt.orientation}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-navy/10">
                      <div>
                        {priceFromBySlug[apt.slug] ? (
                          <>
                            <p className="text-2xl font-light text-navy">
                              {t.from} {formatMoney(priceFromBySlug[apt.slug]!.cents, priceFromBySlug[apt.slug]!.currency, locale)}
                            </p>
                            <p className="text-xs text-navy/40">{t.perNight}</p>
                          </>
                        ) : apt.base_price_cents ? (
                          <>
                            <p className="text-2xl font-light text-navy">
                              {Math.round(apt.base_price_cents / 100).toLocaleString(numLocale)} {locale === 'pl' ? 'CZK' : 'Kč'}
                            </p>
                            <p className="text-xs text-navy/40">{t.perNight}</p>
                          </>
                        ) : (
                          <p className="text-sm text-navy/50">{t.priceOnRequest}</p>
                        )}
                      </div>
                      <span className="text-sm text-navy border-b border-navy pb-1 group-hover:text-gold group-hover:border-gold transition-colors">
                        {t.detail}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm text-navy/40 uppercase tracking-widest text-center mb-16">
            {t.featuresTitle}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.features.map((item, i) => (
              <div key={i} className="text-center">
                <h3 className="text-navy font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-navy/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Přímá rezervace, podmínky pobytu a časté dotazy — převzato z Booking.com, zdroj @/data/stay-info */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16">
            <div>
              <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.directTitle}</h2>
              <p className="text-navy/70 leading-relaxed">{t.directText}</p>
            </div>
            <div className="lg:col-span-2">
              <StayRules locale={locale} />
            </div>
          </div>
          <div className="mt-20 max-w-3xl">
            <StayFaq locale={locale} />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light text-white mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            {t.ctaText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/volne-terminy"
              className="inline-block px-10 py-4 bg-gold text-navy text-sm tracking-widest uppercase hover:bg-gold-400 transition-colors"
            >
              {t.ctaFreeDates}
            </Link>
            <Link
              href="/kontakt"
              className="inline-block px-10 py-4 border border-white/30 text-white text-sm tracking-widest uppercase hover:border-gold transition-colors"
            >
              {t.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
