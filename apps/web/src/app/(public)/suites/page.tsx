/**
 * Apartmány na prodej — výpis (11. 11. 2026)
 *
 * Stejná kostra a jazyk jako detail /suites/[slug] (vzor Vibekodex „vyber-prezentace“):
 * úvod → čísla → apartmány jako „dossier“ (fotka, parametry, pronájem v číslech z FDM) →
 * srovnání vedle sebe → domy a standard → video → lokalita → postup koupě a kontakt → zdroje.
 * Data z DB (apartments, apartment_images) a z kalendáře správce (fdm_calendar).
 * Cena „Na dotaz“ → žádný výnos v % ani cena za m² (DEC-040).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSaleApartmentsDB, getSalesManager, localizeApartment, layoutLabel } from '@/lib/apartments';
import { getHeroImagesBySlugs } from '@/data/apartment-images';
import { getRequestLocale } from '@/lib/i18n-server';
import { getGalleryChapters, getRentalSnapshot } from '@/lib/sale-presentation';
import { floorLabel, priceRange, formatDate, findChapterPhoto } from '@/lib/sale-format';
import { todayPrague } from '@/lib/booking-engine/dates';
import { GUEST_RATING, NEARBY, formatScore, formatCount } from '@/data/stay-info';
import { ApartmentTitle } from '@/components/features/apartment-title';
import { SaleInfoBoxes } from '@/components/features/sale-info-boxes';
import { SectionLabel } from '@/components/ui/ornaments';
import { withSeo } from '@/lib/seo';
import { getSaleTexts, PURCHASE_STEPS } from './[slug]/texts';
import { getSaleListTexts } from './list-texts';

export const dynamic = 'force-dynamic';

/** Úvodní fotka výpisu: oba domy v zimě (migrace 022); když ji byt v galerii nemá, jeho hlavní fotka. */
const HERO_PHOTO = 'zima/chaty-panorama.jpg';

/** Kolik vzdáleností z přehledu ukázat ve výpisu (celý seznam je na detailu a na /lokalita) */
const NEARBY_COUNT = 6;

export async function generateMetadata(): Promise<Metadata> {
  const locale = getRequestLocale();
  if (locale === 'en') {
    return withSeo({
      title: 'Completed apartments for sale in the Krkonoše (Giant Mountains) | Pod Zlatým návrším',
      description: 'Choose from the last available apartments in Špindlerův Mlýn – some come fully furnished with KARE Design furniture, ready to use or let straight away.',
    }, '/suites');
  }
  return withSeo({
    title: 'Zkolaudované apartmány v Krkonoších prodej | Pod Zlatým návrším',
    description: 'Vyberte si z posledních dostupných apartmánů ve Špindlerově Mlýně – některé jsou plně vybavené nábytkem KARE Design a připravené k okamžitému využití i pronájmu.',
  }, '/suites');
}

function Arrow({ className = 'w-4 h-4 ml-2' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
    </svg>
  );
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default async function SuitesPage() {
  const locale = getRequestLocale();
  const en = locale === 'en';
  const t = getSaleListTexts(locale);
  const d = getSaleTexts(locale);
  const numLocale = en ? 'en-GB' : 'cs-CZ';
  // DB-05: datum mimo async closure
  const today = todayPrague();

  const raws = await getSaleApartmentsDB();
  const [heroImages, rentals, chapterLists] = await Promise.all([
    getHeroImagesBySlugs(raws.map((a) => a.slug)),
    Promise.all(raws.map((a) => getRentalSnapshot(a))),
    Promise.all(raws.map((a) => getGalleryChapters(a.id))),
  ]);
  const manager = getSalesManager();
  const count = raws.length;
  const area = (v: number) => `${v.toLocaleString(numLocale)} m²`;
  // Procenta: česky s mezerou („61 %“), anglicky bez („61%“)
  const pc = (v: number) => (en ? `${v}%` : `${v} %`);
  // Plochy místností jsou v DB jako text „6,25 m²“ — pro EN desetinná tečka
  const roomArea = (v: string | null | undefined) => (v ? (en ? v.replace(/(\d),(\d)/g, '$1.$2') : v) : null);

  const items = raws.map((raw, i) => {
    const apt = localizeApartment(raw, locale);
    const rental = rentals[i];
    const chapters = chapterLists[i];
    const season = rental?.season ?? null;
    // Nadtitulek karty = čím se apartmán liší (výhled), jinak první položka vybavení; zbytek jako štítky
    const features = apt.features ?? [];
    const lead = features.find((f) => /výhled|view/i.test(f)) ?? features[0] ?? null;
    return {
      apt,
      lead,
      chips: features.filter((f) => f !== lead),
      rental,
      season,
      hero: heroImages[raw.slug] ?? null,
      photoCount: chapters.reduce((s, c) => s + (c.key === 'plan' ? 0 : c.photos.length), 0),
      planCount: chapters.find((c) => c.key === 'plan')?.photos.length ?? 0,
      isTopFloor: apt.floor != null && apt.floors_total != null && apt.floor === apt.floors_total,
      guests: rental?.maxGuests ?? apt.max_guests,
      occupied: season ? pct(season.booked, season.nights) : null,
      house: season ? pct(season.houseBooked, season.houseNights) : null,
      peak: rental ? priceRange(rental.months, (m) => m === 1 || m === 2, rental.currency, locale) : null,
      off: rental ? priceRange(rental.months, (m) => m >= 4 && m <= 10, rental.currency, locale) : null,
    };
  });

  const pageHero =
    chapterLists.map((c) => findChapterPhoto(c, HERO_PHOTO)).find(Boolean) ?? items.find((it) => it.hero)?.hero ?? null;

  // Společná čísla nabídky
  const areas = items.map((it) => it.apt.area_m2).filter((v): v is number => v != null);
  const areaRange =
    areas.length === 0
      ? '—'
      : Math.min(...areas) === Math.max(...areas)
        ? area(areas[0])
        : `${Math.min(...areas).toLocaleString(numLocale)}–${area(Math.max(...areas))}`;
  const uniq = <T,>(list: T[]) => Array.from(new Set(list));
  const layouts = uniq(items.map((it) => it.apt.layout).filter((v): v is string => !!v));
  const floors = uniq(items.map((it) => it.apt.floor).filter((v): v is number => v != null)).sort((a, b) => a - b);
  const allTop = items.length > 0 && items.every((it) => it.isTopFloor);

  // Obsazenost domu a datum stavu jsou pro všechny apartmány stejné — stačí první, který data má
  const withSeason = items.find((it) => it.season);
  const season = withSeason?.season ?? null;
  const syncedAt = items.map((it) => it.rental?.syncedAt).filter((v): v is string => !!v).sort().pop() ?? null;
  const asOf = syncedAt ? formatDate(syncedAt, locale, true) : formatDate(today, locale);
  const asOfDay = formatDate(syncedAt ?? today, locale);

  const stats: { label: string; value: string; note?: string }[] = [
    { label: t.stats.forSale, value: t.stats.forSaleValue(count), note: t.stats.forSaleNote },
    { label: d.stats.layout, value: layouts.map((l) => layoutLabel(l, locale)).join(', ') || '—' },
    { label: t.stats.area, value: areaRange },
    {
      label: d.stats.floor,
      value: floors.length ? floors.map((f) => floorLabel(f, locale)).join(', ') : '—',
      note: allTop ? d.stats.topFloor : undefined,
    },
    { label: d.stats.lift, value: '50 m' },
    {
      label: d.stats.rating,
      value: `${formatScore(GUEST_RATING.score, locale)} / 10`,
      note: d.stats.ratingNote(formatCount(GUEST_RATING.count, locale)),
    },
    { label: t.stats.completed, value: t.stats.completedValue },
    ...(season
      ? [
          {
            label: season.kind === 'winter' ? t.stats.houseWinter(season.label) : t.stats.houseNext90,
            value: pc(pct(season.houseBooked, season.houseNights)),
            note:
              season.kind === 'winter'
                ? t.stats.houseNote(season.houseUnits, asOfDay)
                : t.stats.houseNoteNext90(season.houseUnits, asOfDay),
          },
        ]
      : []),
  ];

  // Srovnání vedle sebe má smysl pro dva až tři apartmány (víc sloupců se na telefon nevejde)
  const showCompare = items.length >= 2 && items.length <= 3;
  const dash = '—';
  const compareRows: { label: string; values: (string | null)[] }[] = [
    { label: d.stats.area, values: items.map((it) => (it.apt.area_m2 != null ? area(it.apt.area_m2) : null)) },
    { label: d.stats.layout, values: items.map((it) => (it.apt.layout ? layoutLabel(it.apt.layout, locale) : null)) },
    {
      label: d.stats.floor,
      values: items.map((it) => (it.apt.floor != null ? floorLabel(it.apt.floor, locale) : null)),
    },
    { label: d.stats.aspect, values: items.map((it) => it.apt.orientation) },
    { label: d.roomNames.livingKitchen, values: items.map((it) => roomArea(it.apt.rooms?.livingKitchen)) },
    { label: d.roomNames.bedroom, values: items.map((it) => roomArea(it.apt.rooms?.bedroom)) },
    { label: d.roomNames.hall, values: items.map((it) => roomArea(it.apt.rooms?.hall)) },
    { label: d.roomNames.bathroom, values: items.map((it) => roomArea(it.apt.rooms?.bathroom)) },
    { label: d.stats.guests, values: items.map((it) => (it.guests ? String(it.guests) : null)) },
    {
      label: season?.kind === 'winter' ? t.occupiedWinter(season.label) : t.occupiedNext90,
      values: items.map((it) => (it.occupied != null ? pc(it.occupied) : null)),
    },
    { label: t.nightPeak, values: items.map((it) => it.peak) },
    { label: t.nightOff, values: items.map((it) => it.off) },
  ].filter((r) => r.values.some((v) => v != null && v !== ''));

  const houseFacts = t.houseFacts(layouts.join(en ? ' and ' : ' a ') || '1+kk');

  return (
    <>
      {/* ── Úvod ─────────────────────────────────────────────── */}
      <section className="relative bg-navy pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden md:min-h-[44rem] md:flex md:flex-col md:justify-end">
        {pageHero && (
          <div className="absolute inset-0">
            <Image src={pageHero} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-3xl">
            <p className="text-gold text-sm tracking-[0.2em] uppercase mb-6">{t.heroLabel(count)}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-2xl mb-10">{t.heroLead}</p>

            <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
              <div>
                <p className="text-gold text-xs tracking-widest uppercase mb-1">{d.price}</p>
                <p className="text-3xl font-light text-white">{d.priceOnRequest}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#apartmany" className="px-6 py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors">
                  {t.ctaChoose}
                </a>
                <a href="#kontakt" className="px-6 py-4 border border-white/30 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                  {d.ctaViewing}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Čísla ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{d.numbersLabel}</SectionLabel>
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

      {/* ── Apartmány ───────────────────────────────────────── */}
      <section id="apartmany" className="py-16 md:py-24 bg-stone scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.listLabel(count)}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-4 max-w-2xl">{t.listTitle}</h2>
          <p className="text-navy/60 leading-relaxed max-w-2xl mb-12">{t.listLead}</p>

          <div className="space-y-8 md:space-y-10">
            {items.map((it, index) => {
              const { apt } = it;
              const href = `/suites/${apt.slug}`;
              const specs = [
                { label: d.stats.area, value: apt.area_m2 != null ? area(apt.area_m2) : dash },
                { label: d.stats.layout, value: apt.layout ? layoutLabel(apt.layout, locale) : dash },
                { label: d.stats.floor, value: apt.floor != null ? floorLabel(apt.floor, locale) : dash, note: it.isTopFloor ? d.stats.topFloor : undefined },
                { label: d.stats.aspect, value: apt.orientation ?? dash },
              ];
              return (
                <article key={apt.slug} className="bg-white grid lg:grid-cols-2">
                  <Link
                    href={href}
                    className={`group relative block aspect-[4/3] lg:aspect-auto lg:min-h-[34rem] bg-stone overflow-hidden ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                  >
                    {it.hero ? (
                      <Image
                        src={it.hero}
                        alt={apt.title ?? ''}
                        fill
                        priority={index === 0}
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-navy/10" />
                    )}
                    <span className="absolute top-5 left-5 px-4 py-2 bg-gold text-navy text-xs uppercase tracking-widest">{d.forSale}</span>
                    {it.photoCount > 0 && (
                      <span className="absolute bottom-5 left-5 px-3 py-1.5 bg-navy/80 text-white text-xs tracking-wide">
                        {t.photos(it.photoCount)}
                        {it.planCount > 0 && ` · ${t.plans(it.planCount)}`}
                      </span>
                    )}
                  </Link>

                  <div className="p-6 sm:p-8 lg:p-12 flex flex-col">
                    {it.lead && <p className="text-gold text-xs tracking-[0.2em] uppercase mb-3">{it.lead}</p>}
                    <h3 className="text-3xl md:text-4xl font-light text-navy">
                      <Link href={href} className="hover:text-gold transition-colors">
                        <ApartmentTitle title={apt.title} />
                      </Link>
                    </h3>

                    <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-y border-navy/10 py-6 my-6">
                      {specs.map((s) => (
                        <div key={s.label}>
                          <dt className="text-xs text-navy/40 uppercase tracking-widest mb-1">{s.label}</dt>
                          <dd className="text-xl font-light text-navy">{s.value}</dd>
                          {s.note && <dd className="text-xs text-navy/50 mt-0.5">{s.note}</dd>}
                        </div>
                      ))}
                    </dl>

                    {/* Pronájem v číslech — jen když je apartmán v kalendáři správce */}
                    {it.season && it.occupied != null && it.house != null && (
                      <div className="bg-stone p-5 mb-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
                          <p className="text-xs text-navy/40 uppercase tracking-widest">
                            {it.season.kind === 'winter' ? t.occupiedWinter(it.season.label) : t.occupiedNext90}
                          </p>
                          <p className="tabular-nums whitespace-nowrap">
                            <span className="text-2xl font-light text-navy">{pc(it.occupied)}</span>
                            <span className="text-navy/50 text-sm ml-2">{d.nightsTotal(it.season.booked, it.season.nights)}</span>
                          </p>
                        </div>
                        <div className="relative h-2 bg-navy/10 rounded-full">
                          <div className="absolute inset-y-0 left-0 bg-gold rounded-full" style={{ width: `${it.occupied}%` }} />
                          <div className="absolute -top-1 -bottom-1 w-0.5 bg-navy" style={{ left: `calc(${it.house}% - 1px)` }} />
                        </div>
                        <p className="text-xs text-navy/50 mt-2">
                          {t.houseAvg} {pc(it.house)}
                        </p>
                        {(it.peak || it.off) && (
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 pt-4 border-t border-navy/10">
                            {it.peak && (
                              <div>
                                <dt className="text-xs text-navy/50 mb-0.5">{t.nightPeak}</dt>
                                <dd className="text-lg font-light text-navy tabular-nums whitespace-nowrap">{it.peak}</dd>
                              </div>
                            )}
                            {it.off && (
                              <div>
                                <dt className="text-xs text-navy/50 mb-0.5">{t.nightOff}</dt>
                                <dd className="text-lg font-light text-navy tabular-nums whitespace-nowrap">{it.off}</dd>
                              </div>
                            )}
                          </dl>
                        )}
                      </div>
                    )}

                    {it.chips.length > 0 && (
                      <ul className="flex flex-wrap gap-2 mb-8">
                        {it.chips.map((f) => (
                          <li key={f} className="px-3 py-1.5 border border-navy/10 text-navy/70 text-sm">{f}</li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                      <div>
                        <p className="text-xs text-navy/40 uppercase tracking-widest mb-1">{d.price}</p>
                        <p className="text-2xl font-light text-navy">{d.priceOnRequest}</p>
                      </div>
                      <Link
                        href={href}
                        className="inline-flex items-center px-6 py-4 bg-navy text-white text-sm uppercase tracking-widest hover:bg-gold hover:text-navy transition-colors"
                      >
                        {t.open}
                        <Arrow />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {season && <p className="text-navy/50 text-xs leading-relaxed mt-8 max-w-4xl">{d.rentalNote(asOf)}</p>}
        </div>
      </section>

      {/* ── Srovnání ────────────────────────────────────────── */}
      {showCompare && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <SectionLabel>{t.compareLabel}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-10">{t.compareTitle}</h2>

            <table className="w-full table-fixed text-left border-t border-navy/10">
              <thead>
                <tr className="border-b border-navy/10">
                  <th scope="col" className="w-[36%] md:w-[30%] py-4 pr-3 text-xs text-navy/40 uppercase tracking-widest font-normal align-bottom">
                    {t.compareParam}
                  </th>
                  {items.map((it) => (
                    <th key={it.apt.slug} scope="col" className="py-4 pr-3 last:pr-0 font-light text-navy text-sm sm:text-base md:text-xl align-bottom">
                      <Link href={`/suites/${it.apt.slug}`} className="hover:text-gold transition-colors">
                        <ApartmentTitle title={it.apt.title} />
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label} className="border-b border-navy/10">
                    <th scope="row" className="py-3.5 pr-3 text-sm text-navy/60 font-normal align-top">{row.label}</th>
                    {row.values.map((v, i) => (
                      <td key={items[i].apt.slug} className="py-3.5 pr-3 last:pr-0 text-navy tabular-nums align-top">
                        {v || <span className="text-navy/30">{dash}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-5 pr-3 text-sm text-navy/60 font-normal align-top">{d.price}</th>
                  {items.map((it) => (
                    <td key={it.apt.slug} className="py-5 pr-3 last:pr-0 align-top">
                      <span className="block text-navy mb-2">{d.priceOnRequest}</span>
                      <Link href={`/suites/${it.apt.slug}`} className="inline-flex items-center text-sm text-navy border-b border-navy pb-0.5 hover:text-gold hover:border-gold transition-colors">
                        {t.open}
                        <Arrow className="w-4 h-4 ml-1.5 shrink-0" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Domy a standard ─────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.houseLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-navy mt-4 mb-12 max-w-2xl">{t.houseTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-16">
            {houseFacts.map((f, i) => (
              <div key={f.title} className="border-t border-navy/15 pt-5">
                <span className="text-gold text-sm tracking-widest">0{i + 1}</span>
                <h3 className="text-xl font-light text-navy mt-2 mb-2">{f.title}</h3>
                <p className="text-navy/60 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="-mb-16">
            <SaleInfoBoxes showRealEstateProduct={false} locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Video ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel light>{t.videoLabel}</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-light text-white mt-4 mb-10">{t.videoTitle}</h2>
          <div className="relative aspect-video bg-black/30">
            <iframe
              src="https://www.youtube.com/embed/gJqA9imgAsQ"
              title="Pod Zlatým návrším"
              loading="lazy"
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── Lokalita ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-stone">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>{t.locLabel}</SectionLabel>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 mt-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-navy mb-6">{d.locationTitle}</h2>
              <p className="text-navy/60 leading-relaxed text-lg mb-8">{t.locText}</p>
              <Link href="/lokalita" className="inline-flex items-center text-navy font-medium hover:text-gold transition-colors">
                {t.locLink}
                <Arrow />
              </Link>
            </div>
            <div>
              <h3 className="text-sm text-navy/40 uppercase tracking-widest mb-4">{d.nearbyTitle}</h3>
              <ul className="divide-y divide-navy/10 border-y border-navy/10">
                {NEARBY.slice(0, NEARBY_COUNT).map((n) => (
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

      {/* ── Postup koupě a kontakt ──────────────────────────── */}
      <section id="kontakt" className="py-16 md:py-24 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2">
            <SectionLabel>{d.stepsTitle}</SectionLabel>
            <ol className="grid sm:grid-cols-2 gap-4 mt-8">
              {PURCHASE_STEPS[locale].map((step, i) => (
                <li key={step.title} className="bg-stone p-6">
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
              <h2 className="text-2xl font-light text-white mb-4">{t.contactTitle}</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6">{t.contactText}</p>
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 shrink-0">
                  <Image src={manager.photo} alt={manager.name} width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-white font-medium">{manager.name}</p>
                  <p className="text-white/50 text-sm">{d.salesManager ?? manager.title}</p>
                </div>
              </div>

              <div className="space-y-4">
                <a
                  href={`tel:${manager.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center w-full py-4 bg-gold text-navy text-sm uppercase tracking-widest hover:bg-gold-400 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {manager.phone}
                </a>
                <a
                  href={`mailto:${manager.email}`}
                  className="flex items-center justify-center w-full py-4 border border-white/20 text-white text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {d.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kalkulačka a podíl ──────────────────────────────── */}
      <section className="py-16 bg-stone border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {[
            { text: t.crossCalcText, link: t.crossCalcLink, href: '/kalkulacka' },
            { text: t.crossShareText, link: t.crossShareLink, href: '/nemovitostni-produkt' },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="group bg-white p-8 flex items-center justify-between gap-6">
              <span>
                <span className="block text-navy/50 text-sm mb-1">{c.text}</span>
                <span className="block text-xl font-light text-navy group-hover:text-gold transition-colors">{c.link}</span>
              </span>
              <Arrow className="w-5 h-5 shrink-0 text-gold group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Zdroje ──────────────────────────────────────────── */}
      <section className="py-10 bg-cream border-t border-navy/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs text-navy/40 uppercase tracking-widest mb-4">{d.sourcesTitle}</h2>
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
