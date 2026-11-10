/**
 * Apartmán na prodej — prezentace pro kupce a investory (10. 11. 2026)
 *
 * Kostra převzatá z Vibekodex „vyber-prezentace“ (ZFP Výběr), převedená do designu
 * Alpine Quiet Luxury: úvod → čísla → pro koho → pronájem v číslech (živě z FDM) →
 * apartmán → galerie po kapitolách → dům a lokalita → trh (ČSÚ, DEC-030) → postup
 * koupě a kontakt → další apartmán → zdroje.
 * Cena „Na dotaz“ → bez kalkulačky, výnosu v % i ceny za m² (rozhodnutí uživatele).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getApartmentBySlugDB, getSaleApartmentsDB, getSalesManager, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getRequestLocale } from '@/lib/i18n-server';
import { getApartmentImages, getHeroImagesBySlugs } from '@/data/apartment-images';
import { ApartmentGallery } from '@/components/features/apartment-gallery';
import { SaleInfoBoxes } from '@/components/features/sale-info-boxes';
import { ApartmentTitle } from '@/components/features/apartment-title';
import { SectionLabel } from '@/components/ui/ornaments';
import { GUEST_RATING, NEARBY, formatScore, formatCount } from '@/data/stay-info';
import { MARKET_FACTS } from '@/data/market-facts';
import { formatMoney } from '@/lib/booking-engine/money';
import { getGalleryChapters, getRentalSnapshot, type RentalMonth } from '@/lib/sale-presentation';
import { withSeo } from '@/lib/seo';
import { getSaleTexts } from './texts';
import { ChapterGallery } from './chapter-gallery';
import { RentalMonths } from './rental-months';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getRequestLocale();
  const raw = await getApartmentBySlugDB(params.slug);
  if (!raw) return withSeo({ title: locale === 'en' ? 'Apartment not found' : 'Apartmán nenalezen' }, `/suites/${params.slug}`, { ownImage: true });
  const apt = localizeApartment(raw, locale);

  return withSeo({
    title: `${apt.title} | ${locale === 'en' ? 'For sale' : 'Na prodej'} | Pod Zlatým návrším`,
    description: apt.description ?? undefined,
  }, `/suites/${params.slug}`, { ownImage: true });
}

/** Postup koupě — převzato ze starého webu, bez rezervační zálohy (zadání 3. 11. 2026) */
const PURCHASE_STEPS = {
  cs: [
    { title: 'Rezervace', text: 'Vybraný apartmán vám nezávazně rezervujeme na dobu deseti dnů.' },
    { title: 'Rezervační smlouva', text: 'V této lhůtě svůj zájem potvrdíte podpisem rezervační smlouvy.' },
    { title: 'Kupní smlouva', text: 'Po podpisu kupní smlouvy uhradíte kupní cenu podle sjednaných platebních podmínek.' },
    { title: 'Zápis do katastru', text: 'Prodávající podá návrh na vklad vlastnického práva do katastru nemovitostí a apartmán vám předá.' },
  ],
  en: [
    { title: 'Reservation', text: 'We will reserve the apartment of your choice for ten days, with no obligation.' },
    { title: 'Reservation agreement', text: 'Within this period, you confirm your interest by signing a reservation agreement.' },
    { title: 'Purchase agreement', text: 'After signing the purchase agreement, you pay the purchase price according to the agreed payment terms.' },
    { title: 'Land register', text: 'The seller files the application to register your ownership in the Land Register and hands the apartment over to you.' },
  ],
} as const;

/** Podlaží: CZ „2. NP“, EN britsky (1. NP = ground floor, 2. NP = 1st floor) */
function floorLabel(floor: number, locale: 'cs' | 'en'): string {
  if (locale !== 'en') return `${floor}. NP`;
  if (floor === 1) return 'Ground floor';
  const n = floor - 1;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix} floor`;
}

/** „6,25 m²“ → 6.25 (plochy místností jsou v DB jako text) */
function parseArea(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^\d,.]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Rozpětí mediánů vybraných měsíců: „129–159 €“, jedna hodnota bez pomlčky */
function priceRange(months: RentalMonth[], pick: (monthNo: number) => boolean, currency: string, locale: 'cs' | 'en') {
  const vals = months
    .filter((m) => pick(Number(m.month.slice(5, 7))) && m.medianCents)
    .map((m) => m.medianCents as number);
  if (!vals.length) return null;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (lo === hi) return formatMoney(lo, currency, locale);
  return locale === 'en'
    ? `${formatMoney(lo, currency, locale)}–${formatMoney(hi, currency, locale).replace('€', '')}`
    : `${formatMoney(lo, currency, locale).replace(' €', '')}–${formatMoney(hi, currency, locale)}`;
}

function formatDate(iso: string, locale: 'cs' | 'en', withTime = false) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleString(locale === 'en' ? 'en-GB' : 'cs-CZ', {
    day: 'numeric',
    month: locale === 'en' ? 'long' : 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Prague',
  });
}

export default async function SaleApartmentDetailPage({ params }: Props) {
  const locale = getRequestLocale();
  const en = locale === 'en';
  const t = getSaleTexts(locale);
  const raw = await getApartmentBySlugDB(params.slug);

  if (!raw || !raw.for_sale) {
    notFound();
  }

  const manager = getSalesManager();
  const [images, chapters, rental, saleList] = await Promise.all([
    getApartmentImages(params.slug),
    getGalleryChapters(raw.id),
    getRentalSnapshot(raw),
    getSaleApartmentsDB(),
  ]);
  const others = saleList.filter((a) => a.slug !== raw.slug).map((a) => localizeApartment(a, locale));
  const otherHeroes = others.length ? await getHeroImagesBySlugs(others.map((a) => a.slug)) : {};

  const apt = localizeApartment(raw, locale);
  const numLocale = en ? 'en-GB' : 'cs-CZ';
  const totalArea = apt.area_m2 ? apt.area_m2.toLocaleString(numLocale) + ' m²' : '—';
  // Plochy místností jsou v DB jako text „6,25 m²“ — pro EN desetinná tečka
  const roomArea = (v: string) => (en ? v.replace(/(\d),(\d)/g, '$1.$2') : v);
  const heroImage = images[0] ?? null;
  const isTopFloor = apt.floor != null && apt.floors_total != null && apt.floor === apt.floors_total;
  const guests = rental?.maxGuests ?? apt.max_guests;

  const roomRows = apt.rooms
    ? ([
        ['livingKitchen', apt.rooms.livingKitchen],
        ['bedroom', apt.rooms.bedroom],
        ['hall', apt.rooms.hall],
        ['bathroom', apt.rooms.bathroom],
      ] as const)
        .filter(([, v]) => !!v)
        .map(([k, v]) => ({ key: k, label: t.roomNames[k], text: roomArea(v as string), value: parseArea(v) }))
    : [];
  const roomsTotal = roomRows.reduce((s, r) => s + (r.value ?? 0), 0);

  const peak = rental ? priceRange(rental.months, (m) => m === 1 || m === 2, rental.currency, locale) : null;
  const offSeason = rental ? priceRange(rental.months, (m) => m >= 4 && m <= 10, rental.currency, locale) : null;
  const market = MARKET_FACTS[locale];

  const stats: { label: string; value: string; note?: string }[] = [
    { label: t.stats.area, value: totalArea },
    { label: t.stats.layout, value: apt.layout != null ? layoutLabel(apt.layout, locale) : '—' },
    { label: t.stats.floor, value: apt.floor != null ? floorLabel(apt.floor, locale) : '—', note: isTopFloor ? t.stats.topFloor : undefined },
    { label: t.stats.aspect, value: apt.orientation ?? '—' },
    ...(guests ? [{ label: t.stats.guests, value: String(guests) }] : []),
    { label: t.stats.lift, value: '50 m' },
    {
      label: t.stats.rating,
      value: `${formatScore(GUEST_RATING.score, locale)} / 10`,
      note: t.stats.ratingNote(formatCount(GUEST_RATING.count, locale)),
    },
    { label: t.stats.completed, value: t.stats.completedValue },
  ];

  return (
    <>
      {/* ── Úvod ─────────────────────────────────────────────── */}
      {/* md:min-h = o ~50 % vyšší než obsah (zadání 10. 11.), text u spodní hrany, ať je vidět fotka */}
      <section className="relative bg-navy pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden md:min-h-[50rem] md:flex md:flex-col md:justify-end">
        {heroImage && (
          <div className="absolute inset-0">
            <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <Link href="/suites" className="inline-flex items-center text-white/50 hover:text-white mb-10 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.back}
          </Link>

          <div className="max-w-2xl">
            <span className="inline-block px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest mb-8">{t.forSale}</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
              <ApartmentTitle title={apt.title} />
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-light mb-10">
              {[apt.layout ? layoutLabel(apt.layout, locale) : null, totalArea, apt.floor != null ? floorLabel(apt.floor, locale) : null, apt.features?.[0]]
                .filter(Boolean)
                .join(' · ')}
            </p>

            <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
              <div>
                <p className="text-gold text-xs tracking-widest uppercase mb-1">{t.price}</p>
                <p className="text-3xl font-light text-white">{t.priceOnRequest}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#kontakt" className="px-6 py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors">
                  {t.ctaViewing}
                </a>
                {rental && (
                  <a href="#pronajem" className="px-6 py-4 border border-white/30 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                    {t.ctaRental}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Čísla ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.numbersLabel}</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 mt-8">
            {stats.map((s) => (
              <div key={s.label} className="border-b border-navy/10 pb-4">
                <p className="text-xs text-navy/40 uppercase tracking-widest mb-2">{s.label}</p>
                <p className="text-2xl md:text-3xl font-light text-navy">{s.value}</p>
                {s.note && <p className="text-xs text-navy/50 mt-1 leading-snug">{s.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pro koho ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.personasLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12 max-w-2xl">{t.personasTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.personas.map((p, i) => (
              <div key={p.title} className="bg-white p-8 relative">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-3 mb-3">{p.title}</h3>
                <p className="text-navy/60 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pronájem v číslech (živě z FDM) ─────────────────── */}
      {rental && rental.months.length > 0 && (
        <section id="pronajem" className="py-16 md:py-24 bg-navy scroll-mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <SectionLabel light>{t.rentalLabel}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-4 max-w-3xl">{t.rentalTitle}</h2>
            <p className="text-white/60 leading-relaxed max-w-3xl mb-12">{t.rentalLead}</p>

            <div className="grid sm:grid-cols-3 gap-px bg-white/10 mb-12">
              {rental.winter && (
                <div className="bg-navy p-6 md:p-8">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.winterBooked(rental.winter.label)}</p>
                  <p className="text-3xl md:text-4xl font-extralight text-white">
                    {Math.round((rental.winter.booked / rental.winter.nights) * 100)}
                    <span className="text-gold text-2xl ml-1">%</span>
                  </p>
                  <p className="text-white/50 text-sm mt-1">{t.winterOf(rental.winter.booked, rental.winter.nights)}</p>
                </div>
              )}
              {peak && (
                <div className="bg-navy p-6 md:p-8">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.peakPrice}</p>
                  <p className="text-3xl md:text-4xl font-extralight text-white whitespace-nowrap">{peak}</p>
                </div>
              )}
              {offSeason && (
                <div className="bg-navy p-6 md:p-8">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-3">{t.offPrice}</p>
                  <p className="text-3xl md:text-4xl font-extralight text-white whitespace-nowrap">{offSeason}</p>
                </div>
              )}
            </div>

            <RentalMonths
              months={rental.months}
              currency={rental.currency}
              locale={locale}
              labels={{ colMonth: t.colMonth, colPrice: t.colPrice, colPriceShort: t.colPriceShort, colBooked: t.colBooked, fromToday: t.fromToday, upTo: t.upTo, nightsOf: t.nightsOf }}
            />

            <p className="text-white/40 text-xs leading-relaxed mt-6 max-w-4xl">
              {t.rentalNote(rental.syncedAt ? formatDate(rental.syncedAt, locale, true) : formatDate(new Date().toISOString(), locale))}
            </p>

            {rental.rentalSlug && (
              <Link
                href={`/apartmany-spindleruv-mlyn-pronajem/${rental.rentalSlug}`}
                className="inline-flex items-center mt-8 text-gold hover:text-white transition-colors"
              >
                {t.tryAsGuest}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Apartmán ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.apartmentLabel}</SectionLabel>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-8">
            <div>
              <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.about}</h2>
              <p className="text-navy/70 leading-relaxed text-lg whitespace-pre-line">{apt.description}</p>

              {apt.features && apt.features.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.features}</h2>
                  <div className="flex flex-wrap gap-3">
                    {apt.features.map((feature, i) => (
                      <span key={i} className="px-4 py-2 bg-stone text-navy text-sm">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {roomRows.length > 0 && (
              <div>
                <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.rooms}</h2>
                <div className="space-y-5">
                  {roomRows.map((r) => (
                    <div key={r.key}>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-navy font-light">{r.label}</span>
                        <span className="text-navy tabular-nums">{r.text}</span>
                      </div>
                      <div className="h-2 bg-navy/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy/70 rounded-full"
                          style={{ width: `${roomsTotal && r.value ? Math.max(3, Math.round((r.value / roomsTotal) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-baseline pt-4 border-t border-navy/10">
                    <span className="text-xs text-navy/40 uppercase tracking-widest">{t.stats.area}</span>
                    <span className="text-2xl font-light text-navy">{totalArea}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-16">
            <SaleInfoBoxes showRealEstateProduct={false} locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Galerie po kapitolách ───────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.galleryLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-10">{t.galleryTitle}</h2>
          {chapters.length > 0 ? (
            <ChapterGallery
              chapters={chapters}
              title={apt.title ?? ''}
              labels={{ chapters: t.chapters, close: t.close, prev: t.prev, next: t.next }}
            />
          ) : (
            <ApartmentGallery images={images} title={apt.title ?? ''} />
          )}
        </div>
      </section>

      {/* ── Dům a lokalita ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.locationLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12 max-w-2xl">{t.locationTitle}</h2>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-8">
              {t.house.map((h) => (
                <div key={h.value} className="flex items-baseline gap-6 border-b border-navy/10 pb-6">
                  <span className="text-3xl md:text-4xl font-extralight text-navy whitespace-nowrap w-36 shrink-0">{h.value}</span>
                  <span className="text-navy/60 leading-snug">{h.label}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.nearbyTitle}</h3>
              <ul className="divide-y divide-navy/10">
                {NEARBY.map((n) => (
                  <li key={n.key} className="flex justify-between gap-6 py-3">
                    <span className="text-navy/70">{n.label[locale]}</span>
                    <span className="text-navy tabular-nums whitespace-nowrap">{en ? n.distance.replace(',', '.') : n.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trh (ČSÚ, DEC-030) ──────────────────────────────── */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{market.label}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-10">{t.marketTitle}</h2>
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-5xl font-extralight text-navy">{market.growth}</p>
              <p className="text-navy/60 mt-3 leading-relaxed">{market.growthNote}</p>
            </div>
            <div>
              <p className="text-5xl font-extralight text-navy">{market.local}</p>
              <p className="text-navy/60 mt-3 leading-relaxed">{market.localNote}</p>
            </div>
          </div>
          <p className="text-navy/40 text-xs leading-relaxed max-w-4xl">{market.source}</p>
          <p className="text-navy/60 text-sm leading-relaxed max-w-4xl mt-3">{market.warning}</p>
        </div>
      </section>

      {/* ── Postup koupě a kontakt ──────────────────────────── */}
      <section id="kontakt" className="py-16 md:py-24 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2">
            <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{t.stepsTitle}</h2>
            <ol className="grid sm:grid-cols-2 gap-4">
              {PURCHASE_STEPS[locale].map((step, i) => (
                <li key={i} className="bg-stone p-6">
                  <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                  <h3 className="text-lg font-light text-navy mt-2 mb-2">{step.title}</h3>
                  <p className="text-navy/60 text-sm leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="bg-navy p-8">
              <p className="text-gold text-xs tracking-widest uppercase mb-4">{t.contactLabel}</p>
              <p className="text-white/60 text-sm mb-6">{t.contactTitle}</p>
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 shrink-0">
                  <Image src={manager.photo} alt={manager.name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-white font-medium">{manager.name}</p>
                  <p className="text-white/50 text-sm">{t.salesManager ?? manager.title}</p>
                </div>
              </div>

              <div className="space-y-4">
                <a
                  href={`tel:${manager.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center w-full py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {manager.phone}
                </a>
                <a
                  href={`mailto:${manager.email}?subject=${t.emailSubject} ${apt.title}`}
                  className="flex items-center justify-center w-full py-4 border border-white/20 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {t.email}
                </a>
              </div>
              <p className="text-white/30 text-xs text-center mt-6">{t.contactNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Další apartmán na prodej ────────────────────────── */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          {others.length > 0 && (
            <>
              <SectionLabel>{t.otherLabel}</SectionLabel>
              <div className="grid md:grid-cols-2 gap-6 mt-8 mb-10">
                {others.map((o) => (
                  <Link key={o.slug} href={`/suites/${o.slug}`} className="group flex bg-white overflow-hidden">
                    <div className="relative w-36 sm:w-48 shrink-0 bg-cream">
                      {otherHeroes[o.slug] && (
                        <Image src={otherHeroes[o.slug] as string} alt="" fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-lg font-light text-navy group-hover:text-gold transition-colors">
                        <ApartmentTitle title={o.title} />
                      </p>
                      <p className="text-navy/50 text-sm mt-1">
                        {[o.layout ? layoutLabel(o.layout, locale) : null, o.area_m2 ? `${o.area_m2.toLocaleString(numLocale)} m²` : null, o.floor != null ? floorLabel(o.floor, locale) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="text-center">
            <Link href="/suites" className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors">
              {t.allForSale}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Zdroje ──────────────────────────────────────────── */}
      <section className="py-10 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-4">{t.sourcesTitle}</h2>
          <ul className="space-y-2 text-xs text-navy/50 leading-relaxed max-w-4xl">
            {t.sources(formatDate(GUEST_RATING.asOf, locale)).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
