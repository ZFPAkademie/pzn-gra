/**
 * Volné termíny — hledání napříč apartmány.
 * S termínem (?od&do): volné apartmány, případně náhradní termíny. Bez termínu: nejbližší volné pobyty.
 * Každá nabídka vede na detail apartmánu s předvyplněným termínem.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getRentalApartmentsDB, localizeApartment, layoutLabel, type ApartmentDB } from '@/lib/apartments';
import { getHeroImagesBySlugs } from '@/data/apartment-images';
import { getRequestLocaleFull } from '@/lib/i18n-server';
import type { Locale } from '@/lib/i18n';
import { addDays, formatStayDate, formatStayRange, nightsLabel, parseStay, todayPrague } from '@/lib/booking-engine/dates';
import { formatMoney } from '@/lib/booking-engine/money';
import {
  findOffers,
  loadStayCalendars,
  nearestOffers,
  requiredMinNights,
  stayOffer,
  type StayCalendar,
  type StayOffer,
} from '@/lib/booking-engine/search';
import { DateSearchBar } from '@/components/features/date-search';
import { ApartmentTitle } from '@/components/features/apartment-title';

export const dynamic = 'force-dynamic';

const LENGTHS = [2, 3, 5, 7];
const DEFAULT_LENGTH = 3;
/** Kolik měsíců ukázat ve filtru přehledu bez termínu */
const MONTH_FILTERS = 4;
const OFFERS_PER_APARTMENT = 3;
/** Náhradní termíny: kolik dní kolem hledaného a kolik u jednoho apartmánu */
const ALTERNATIVE_RADIUS_DAYS = 14;
const ALTERNATIVES_PER_APARTMENT = 2;
const EMPTY_CALENDAR: StayCalendar = { free: new Set(), nights: new Map() };

interface Props {
  searchParams: { od?: string; do?: string; noci?: string; mesic?: string };
}

const RENTAL_PATH = '/apartmany-spindleruv-mlyn-pronajem';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getRequestLocaleFull();
  // Výsledky konkrétních hledání do indexu nepatří, jen přehled
  const robots = Object.keys(searchParams).length > 0 ? { index: false, follow: true } : undefined;
  if (locale === 'pl') {
    return {
      title: 'Wolne terminy | Apartamenty Szpindlerowy Młyn | Pod Zlatým návrším',
      description: 'Sprawdź wolne apartamenty w Szpindlerowym Młynie w wybranym terminie, z ceną za cały pobyt. 50 metrów od wyciągu Labská.',
      robots,
    };
  }
  if (locale === 'en') {
    return {
      title: 'Available dates | Apartments in Špindlerův Mlýn | Pod Zlatým návrším',
      description: 'See which apartments in Špindlerův Mlýn are available for your dates, with the price for the whole stay. 50 metres from the Labská chairlift.',
      robots,
    };
  }
  return {
    title: 'Volné termíny | Apartmány Špindlerův Mlýn | Pod Zlatým návrším',
    description: 'Podívejte se, které apartmány ve Špindlerově Mlýně jsou ve vašem termínu volné, s cenou za celý pobyt. 50 metrů od lanovky Labská.',
    robots,
  };
}

function apartmentsWord(n: number, locale: Locale): string {
  if (locale === 'en') return n === 1 ? 'apartment available' : 'apartments available';
  if (locale === 'cs') return n === 1 ? 'volný apartmán' : n >= 2 && n <= 4 ? 'volné apartmány' : 'volných apartmánů';
  const d = n % 10;
  const dd = n % 100;
  if (n === 1) return 'wolny apartament';
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 'wolne apartamenty' : 'wolnych apartamentów';
}

const T = {
  cs: {
    eyebrow: 'Pronájem',
    h1: 'Volné termíny',
    lead: 'Vyberte termín a ukážeme vám apartmány, které jsou volné, s cenou za celý pobyt.',
    yourStay: 'Váš termín',
    othersTaken: 'Ostatní apartmány jsou v tomto termínu obsazené.',
    allApartments: 'Všechny apartmány k pronájmu',
    noneTitle: 'Pro tento termín nemáme volný apartmán',
    noneAlternatives: 'Zkuste prosím jiné datum. Nejbližší volné termíny stejné délky:',
    noneNoAlternatives: 'Zkuste prosím jiné datum. V okolí vybraného termínu je obsazeno.',
    minStay: (n: number) => `V tomto termínu platí minimální pobyt ${n} ${nightsLabel(n, 'cs')}.`,
    nearestTitle: 'Nejbližší volné pobyty',
    length: 'Délka',
    month: 'Měsíc',
    allMonths: 'Nejbližší',
    nothingFound: 'V tomto výběru nemáme volný pobyt. Zkuste jinou délku nebo měsíc, případně vyberte termín nahoře.',
    errorTitle: 'Dostupnost se teď nepodařilo načíst',
    errorText: 'Zkuste to prosím za chvíli, nebo se nám ozvěte a termín ověříme.',
    contact: 'Kontaktovat nás',
    guests: 'hostů',
    perNight: 'noc',
    average: 'průměr',
    book: 'Rezervovat',
    detail: 'Detail apartmánu',
  },
  en: {
    eyebrow: 'Rentals',
    h1: 'Available dates',
    lead: 'Choose your dates and we will show you which apartments are available, with the price for the whole stay.',
    yourStay: 'Your dates',
    othersTaken: 'The other apartments are booked for these dates.',
    allApartments: 'All apartments for rent',
    noneTitle: 'We have no apartment available for these dates',
    noneAlternatives: 'Please try different dates. The nearest available stays of the same length:',
    noneNoAlternatives: 'Please try different dates. We are fully booked around the dates you selected.',
    minStay: (n: number) => `A minimum stay of ${n} ${nightsLabel(n, 'en')} applies to these dates.`,
    nearestTitle: 'Next available stays',
    length: 'Length',
    month: 'Month',
    allMonths: 'Soonest',
    nothingFound: 'Nothing is available for this selection. Try a different length or month, or choose your dates above.',
    errorTitle: 'We could not load availability just now',
    errorText: 'Please try again in a moment, or contact us and we will check your dates.',
    contact: 'Contact us',
    guests: 'guests',
    perNight: 'night',
    average: 'average',
    book: 'Book',
    detail: 'Apartment details',
  },
  pl: {
    eyebrow: 'Wynajem',
    h1: 'Wolne terminy',
    lead: 'Wybierz termin, a pokażemy wolne apartamenty z ceną za cały pobyt.',
    yourStay: 'Państwa termin',
    othersTaken: 'Pozostałe apartamenty są w tym terminie zajęte.',
    allApartments: 'Wszystkie apartamenty na wynajem',
    noneTitle: 'W tym terminie nie mamy wolnego apartamentu',
    noneAlternatives: 'Prosimy wybrać inną datę. Najbliższe wolne terminy o tej samej długości:',
    noneNoAlternatives: 'Prosimy wybrać inną datę. W pobliżu wybranego terminu nie ma wolnych miejsc.',
    minStay: (n: number) => `W tym terminie obowiązuje minimalny pobyt ${n} ${nightsLabel(n, 'pl')}.`,
    nearestTitle: 'Najbliższe wolne pobyty',
    length: 'Długość',
    month: 'Miesiąc',
    allMonths: 'Najbliższe',
    nothingFound: 'W tym wyborze nie ma wolnego pobytu. Spróbuj innej długości lub miesiąca albo wybierz termin powyżej.',
    errorTitle: 'Nie udało się teraz wczytać dostępności',
    errorText: 'Prosimy spróbować za chwilę lub skontaktować się z nami, a sprawdzimy termin.',
    contact: 'Kontakt',
    guests: 'gości',
    perNight: 'noc',
    average: 'średnio',
    book: 'Zarezerwuj',
    detail: 'Szczegóły apartamentu',
  },
};

const MONTH_NAMES = {
  cs: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pl: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
};

function bookingHref(slug: string, offer: StayOffer) {
  return `${RENTAL_PATH}/${slug}?od=${offer.checkIn}&do=${offer.checkOut}#rezervace`;
}

/** Měsíce filtru: aktuální + další, klíč YYYY-MM */
function upcomingMonths(today: string): string[] {
  const [y, m] = today.split('-').map(Number);
  return Array.from({ length: MONTH_FILTERS }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return d.toISOString().slice(0, 7);
  });
}

function lastDayOfMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`inline-flex items-center min-h-[44px] px-4 text-sm border transition-colors ${
        active ? 'bg-navy border-navy text-white' : 'bg-white border-navy/15 text-navy/70 hover:border-gold hover:text-navy'
      }`}
    >
      {children}
    </Link>
  );
}

function OfferCard({
  apt,
  image,
  offers,
  locale,
  prominent,
}: {
  apt: ApartmentDB;
  image: string | null;
  offers: StayOffer[];
  locale: Locale;
  /** Hledaný termín: jedna nabídka s tlačítkem Rezervovat */
  prominent: boolean;
}) {
  const t = T[locale];
  const numLocale = locale === 'cs' ? 'cs-CZ' : locale === 'pl' ? 'pl-PL' : 'en-GB';
  const detailHref = `${RENTAL_PATH}/${apt.slug}`;
  return (
    <article className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bg-white border border-navy/5">
      <Link href={detailHref} aria-label={`${t.detail}: ${apt.title ?? ''}`} className="group relative block aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-stone overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={apt.title ?? ''}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
        ) : (
          <div className="absolute inset-0 bg-navy/10" />
        )}
      </Link>

      <div className="p-5 md:p-8">
        <h3 className="text-xl font-light text-navy mb-1">
          <Link href={detailHref} className="hover:text-gold transition-colors">
            <ApartmentTitle title={apt.title} />
          </Link>
        </h3>
        <p className="text-sm text-navy/50 mb-5">
          {layoutLabel(apt.layout, locale)}
          {apt.area_m2 ? ` · ${Number(apt.area_m2).toLocaleString(numLocale)} m²` : ''}
          {apt.max_guests ? ` · ${apt.max_guests} ${t.guests}` : ''}
        </p>

        <div className="space-y-2">
          {offers.map((offer) => (
            <Link
              key={offer.checkIn}
              href={bookingHref(apt.slug, offer)}
              className="group flex items-center justify-between gap-4 min-h-[68px] px-4 py-3 bg-cream border border-navy/10 hover:border-gold transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-navy">{formatStayRange(offer.checkIn, offer.checkOut, locale)}</span>
                <span className="block text-xs text-navy/50 mt-0.5">
                  {offer.nights} {nightsLabel(offer.nights, locale)} · {offer.uniformPrice ? '' : `${t.average} `}
                  {formatMoney(offer.uniformPrice ? offer.pricePerNightCents : Math.round(offer.pricePerNightCents / 100) * 100, offer.currency, locale)} / {t.perNight}
                </span>
              </span>
              <span className="shrink-0 flex items-center gap-3">
                <span className="text-xl font-light text-navy">{formatMoney(offer.totalCents, offer.currency, locale)}</span>
                <svg className="w-4 h-4 text-gold group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

        {prominent && offers[0] && (
          <Link
            href={bookingHref(apt.slug, offers[0])}
            className="flex items-center justify-center min-h-[48px] mt-4 px-8 bg-gold text-navy text-sm tracking-[0.15em] uppercase hover:bg-navy hover:text-white transition-colors duration-500"
          >
            {t.book}
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function FreeDatesPage({ searchParams }: Props) {
  const locale = getRequestLocaleFull();
  const t = T[locale];
  const today = todayPrague();
  const stay = parseStay(searchParams.od, searchParams.do, today);

  const nightsParam = Number(searchParams.noci);
  const length = LENGTHS.includes(nightsParam) ? nightsParam : DEFAULT_LENGTH;
  const months = upcomingMonths(today);
  const month = months.includes(searchParams.mesic ?? '') ? searchParams.mesic! : null;

  const apartments = (await getRentalApartmentsDB())
    .filter((a) => a.fdm_room_use_id)
    .map((a) => localizeApartment(a, locale));
  const heroImages = await getHeroImagesBySlugs(apartments.map((a) => a.slug));

  // Bez měsíce se přehled dívá 90 dní dopředu; rozsah noci navíc pokrývá poslední možný pobyt
  const firstArrival = month && `${month}-01` > today ? `${month}-01` : today;
  const lastArrival = month ? lastDayOfMonth(month) : addDays(today, 90);
  const alternativesFrom = stay ? addDays(stay.checkIn, -ALTERNATIVE_RADIUS_DAYS) : firstArrival;
  const loadFrom = alternativesFrom > today ? alternativesFrom : today;
  const loadTo = stay ? addDays(stay.checkOut, ALTERNATIVE_RADIUS_DAYS) : addDays(lastArrival, length);
  const result = await loadStayCalendars(apartments.map((a) => a.id), loadFrom, loadTo);

  const withOffers = (pick: (id: string) => StayOffer[]) =>
    apartments
      .map((apt) => ({ apt, offers: pick(apt.id) }))
      .filter((row) => row.offers.length > 0)
      .sort((a, b) => a.offers[0].checkIn.localeCompare(b.offers[0].checkIn) || a.offers[0].totalCents - b.offers[0].totalCents);

  const calendarOf = (id: string) => (result.ok ? result.calendars[id] : EMPTY_CALENDAR);
  const free = stay
    ? withOffers((id) => {
        const offer = stayOffer(calendarOf(id), stay.checkIn, stay.checkOut);
        return offer ? [offer] : [];
      })
    : [];
  const alternatives =
    stay && free.length === 0
      ? withOffers((id) =>
          nearestOffers(calendarOf(id), {
            around: stay.checkIn,
            earliest: today,
            radiusDays: ALTERNATIVE_RADIUS_DAYS,
            nights: stay.nights,
            limit: ALTERNATIVES_PER_APARTMENT,
          })
        )
      : [];
  const nearest = stay
    ? []
    : withOffers((id) => findOffers(calendarOf(id), { firstArrival, lastArrival, nights: length, limit: OFFERS_PER_APARTMENT }));

  // Noci jsou volné, jen je termín kratší než minimum (Silvestr) — host to musí vědět
  const minStayNeeded = stay
    ? Math.min(
        ...apartments
          .map((a) => requiredMinNights(calendarOf(a.id), stay.checkIn, stay.checkOut) ?? 0)
          .filter((n) => n > stay.nights)
      )
    : Infinity;

  const filterHref = (next: { noci?: number; mesic?: string | null }) => {
    const params = new URLSearchParams();
    const noci = next.noci ?? length;
    const mesic = next.mesic === undefined ? month : next.mesic;
    if (noci !== DEFAULT_LENGTH) params.set('noci', String(noci));
    if (mesic) params.set('mesic', mesic);
    const query = params.toString();
    return query ? `/volne-terminy?${query}` : '/volne-terminy';
  };

  return (
    <>
      <section className="bg-navy pt-28 md:pt-32 pb-10 md:pb-14">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4">{t.eyebrow}</p>
          <h1 className="text-3xl md:text-5xl font-light text-white mb-4">{t.h1}</h1>
          {!stay && <p className="text-lg text-white/50 max-w-xl mb-8">{t.lead}</p>}
          <div className={stay ? 'mt-6' : ''}>
            <DateSearchBar key={`${stay?.checkIn}-${stay?.checkOut}`} initialCheckIn={stay?.checkIn} initialCheckOut={stay?.checkOut} />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-cream min-h-[40vh]">
        <div className="max-w-6xl mx-auto px-6">
          {!result.ok ? (
            <div className="bg-white border border-navy/10 p-6 md:p-10 text-center">
              <h2 className="text-2xl font-light text-navy mb-3">{t.errorTitle}</h2>
              <p className="text-navy/60 mb-6">{t.errorText}</p>
              <Link href="/kontakt" className="inline-block px-8 py-3 bg-navy text-white text-sm tracking-[0.15em] uppercase hover:bg-gold hover:text-navy transition-colors duration-500">
                {t.contact}
              </Link>
            </div>
          ) : stay ? (
            <>
              <div className="mb-6 md:mb-8">
                <p className="text-xs tracking-[0.2em] uppercase text-navy/40 mb-2">{t.yourStay}</p>
                <h2 className="text-2xl md:text-3xl font-light text-navy">
                  {formatStayDate(stay.checkIn, locale)} – {formatStayDate(stay.checkOut, locale, true)}
                  <span className="text-navy/50 whitespace-nowrap"> · {stay.nights} {nightsLabel(stay.nights, locale)}</span>
                </h2>
                {free.length > 0 && (
                  <p className="text-navy/60 mt-2">{free.length} {apartmentsWord(free.length, locale)}</p>
                )}
              </div>

              {free.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {free.map(({ apt, offers }) => (
                      <OfferCard key={apt.id} apt={apt} image={heroImages[apt.slug] ?? null} offers={offers} locale={locale} prominent />
                    ))}
                  </div>
                  {free.length < apartments.length && (
                    <p className="text-sm text-navy/50 mt-8">
                      {t.othersTaken}{' '}
                      <Link href={RENTAL_PATH} className="text-navy border-b border-navy/30 hover:text-gold hover:border-gold transition-colors">
                        {t.allApartments}
                      </Link>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white border-l-2 border-gold p-5 md:p-6 mb-8">
                    <h3 className="text-xl font-light text-navy mb-2">{t.noneTitle}</h3>
                    {Number.isFinite(minStayNeeded) && <p className="text-navy/70 mb-2">{t.minStay(minStayNeeded)}</p>}
                    <p className="text-navy/60">{alternatives.length > 0 ? t.noneAlternatives : t.noneNoAlternatives}</p>
                  </div>
                  <div className="space-y-6">
                    {alternatives.map(({ apt, offers }) => (
                      <OfferCard key={apt.id} apt={apt} image={heroImages[apt.slug] ?? null} offers={offers} locale={locale} prominent={false} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-light text-navy mb-6">{t.nearestTitle}</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-8 gap-y-4 mb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-16 sm:w-auto text-sm text-navy/40">{t.length}</span>
                  {LENGTHS.map((n) => (
                    <FilterChip key={n} href={filterHref({ noci: n })} active={n === length}>
                      {n} {nightsLabel(n, locale)}
                    </FilterChip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-16 sm:w-auto text-sm text-navy/40">{t.month}</span>
                  <FilterChip href={filterHref({ mesic: null })} active={!month}>{t.allMonths}</FilterChip>
                  {months.map((key) => (
                    <FilterChip key={key} href={filterHref({ mesic: key })} active={key === month}>
                      {MONTH_NAMES[locale][Number(key.slice(5)) - 1]}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {nearest.length > 0 ? (
                <div className="space-y-6">
                  {nearest.map(({ apt, offers }) => (
                    <OfferCard key={apt.id} apt={apt} image={heroImages[apt.slug] ?? null} offers={offers} locale={locale} prominent={false} />
                  ))}
                </div>
              ) : (
                <p className="bg-white border-l-2 border-gold p-5 md:p-6 text-navy/70">{t.nothingFound}</p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
