/**
 * Bloky pro hosty: hodnocení z Booking.com, pravidla pobytu, praktické informace,
 * časté dotazy, mapa s okolím a výhody přímé rezervace.
 * Serverové komponenty bez stavu — data z `@/data/stay-info`.
 */

import type { Locale } from '@/lib/i18n';
import {
  FAQ,
  GUEST_QUOTES,
  GUEST_RATING,
  HOUSE_RULES,
  NEARBY,
  PRACTICAL,
  PROPERTY,
  formatAsOf,
  formatCount,
  formatScore,
  type RatingCategoryKey,
} from '@/data/stay-info';

const CATEGORY_LABEL: Record<RatingCategoryKey, Record<Locale, string>> = {
  comfort: { cs: 'Pohodlí', en: 'Comfort', pl: 'Komfort' },
  cleanliness: { cs: 'Čistota', en: 'Cleanliness', pl: 'Czystość' },
  facilities: { cs: 'Vybavení', en: 'Facilities', pl: 'Wyposażenie' },
  value: { cs: 'Poměr ceny a kvality', en: 'Value for money', pl: 'Stosunek jakości do ceny' },
  location: { cs: 'Lokalita', en: 'Location', pl: 'Lokalizacja' },
  staff: { cs: 'Personál', en: 'Staff', pl: 'Obsługa' },
  wifi: { cs: 'Wi-Fi', en: 'Wi-Fi', pl: 'Wi-Fi' },
};

const WORDS = {
  cs: {
    reviews: (n: number) => (n === 1 ? 'hodnocení' : 'hodnocení'),
    ratingOn: 'hodnocení hostů na',
    guestsSay: 'Hodnocení hostů',
    guestsLead: 'Co píší hosté, kteří u nás bydleli',
    sourceNote: (asOf: string) => `Zdroj: ${GUEST_RATING.source}, stav k ${asOf}.`,
    rules: 'Podmínky pobytu',
    practical: 'Dobré vědět',
    faq: 'Časté dotazy',
    nearby: 'Vzdálenosti od domu',
    map: 'Kde nás najdete',
    address: 'Adresa',
    openMap: 'Otevřít v Mapy.cz',
    openGoogle: 'Otevřít v Google Maps',
    mapTitle: 'Mapa: Golden Ridge Apartments, Labská, Špindlerův Mlýn',
    direct: 'Rezervace přímo u provozovatele',
    directItems: [
      'Bez zprostředkovatele, komunikujete přímo s námi',
      'Zrušení zdarma do 14 dnů před příjezdem',
      'Parkování, Wi-Fi, ložní prádlo a ručníky v ceně',
      'Samoobslužný příjezd 16:00–24:00',
    ],
  },
  en: {
    reviews: (n: number) => (n === 1 ? 'review' : 'reviews'),
    ratingOn: 'guest rating on',
    guestsSay: 'Guest reviews',
    guestsLead: 'What guests who stayed with us say',
    sourceNote: (asOf: string) => `Source: ${GUEST_RATING.source}, as of ${asOf}.`,
    rules: 'House rules',
    practical: 'Good to know',
    faq: 'Frequently asked questions',
    nearby: 'Distances from the building',
    map: 'Where to find us',
    address: 'Address',
    openMap: 'Open in Mapy.cz',
    openGoogle: 'Open in Google Maps',
    mapTitle: 'Map: Golden Ridge Apartments, Labská, Špindlerův Mlýn',
    direct: 'Book directly with the operator',
    directItems: [
      'No intermediary, you deal directly with us',
      'Free cancellation up to 14 days before arrival',
      'Parking, Wi-Fi, bed linen and towels included',
      'Self check-in from 4 pm to midnight',
    ],
  },
  pl: {
    reviews: (n: number) => (n === 1 ? 'opinia' : n >= 2 && n <= 4 ? 'opinie' : 'opinii'),
    ratingOn: 'ocena gości na',
    guestsSay: 'Opinie gości',
    guestsLead: 'Co piszą goście, którzy u nas mieszkali',
    sourceNote: (asOf: string) => `Źródło: ${GUEST_RATING.source}, stan na ${asOf}.`,
    rules: 'Zasady pobytu',
    practical: 'Warto wiedzieć',
    faq: 'Najczęstsze pytania',
    nearby: 'Odległości od budynku',
    map: 'Gdzie nas znaleźć',
    address: 'Adres',
    openMap: 'Otwórz w Mapy.cz',
    openGoogle: 'Otwórz w Google Maps',
    mapTitle: 'Mapa: Golden Ridge Apartments, Labská, Szpindlerowy Młyn',
    direct: 'Rezerwacja bezpośrednio u operatora',
    directItems: [
      'Bez pośrednika, kontaktują się Państwo bezpośrednio z nami',
      'Bezpłatne anulowanie do 14 dni przed przyjazdem',
      'Parking, Wi-Fi, pościel i ręczniki w cenie',
      'Samodzielne zameldowanie 16:00–24:00',
    ],
  },
} as const;

/** Kompaktní odznak „9,4 · 398 hodnocení na Booking.com“ */
export function GuestRatingBadge({ locale, light = false, className = '' }: { locale: Locale; light?: boolean; className?: string }) {
  const w = WORDS[locale];
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="inline-flex items-center justify-center w-12 h-12 bg-gold text-navy text-xl font-light">
        {formatScore(GUEST_RATING.score, locale)}
      </span>
      <span className={`text-sm leading-tight ${light ? 'text-white/70' : 'text-navy/60'}`}>
        {formatCount(GUEST_RATING.count, locale)} {w.reviews(GUEST_RATING.count)}
        <br />
        {w.ratingOn} {GUEST_RATING.source}
      </span>
    </div>
  );
}

/** Sekce hodnocení: celkové skóre, kategorie a citace hostů */
export function GuestReviews({ locale, quotes = 3 }: { locale: Locale; quotes?: number }) {
  const w = WORDS[locale];
  return (
    <div>
      <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.guestsSay}</h2>
      <div className="grid md:grid-cols-3 gap-8 mb-10">
        <div className="bg-navy p-8 text-white">
          <p className="text-6xl font-extralight text-gold mb-2">{formatScore(GUEST_RATING.score, locale)}</p>
          <p className="text-white/60 text-sm">
            {formatCount(GUEST_RATING.count, locale)} {w.reviews(GUEST_RATING.count)} · {GUEST_RATING.source}
          </p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          {GUEST_RATING.categories.map((c) => (
            <div key={c.key} className="border-b border-navy/10 pb-2">
              <p className="text-xs text-navy/40 uppercase tracking-widest">{CATEGORY_LABEL[c.key][locale]}</p>
              <p className="text-xl font-light text-navy">{formatScore(c.score, locale)}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-navy/70 mb-6">{w.guestsLead}</p>
      <div className="grid md:grid-cols-3 gap-6">
        {GUEST_QUOTES.slice(0, quotes).map((q) => (
          <blockquote key={q.name} className="bg-stone p-6">
            <p className="text-navy/80 leading-relaxed mb-4">„{q.text[locale]}“</p>
            <footer className="text-sm text-navy/40">{q.name}</footer>
          </blockquote>
        ))}
      </div>
      <p className="text-xs text-navy/40 mt-6">{w.sourceNote(formatAsOf(GUEST_RATING.asOf, locale))}</p>
    </div>
  );
}

/** Pravidla pobytu jako dvousloupcový seznam */
export function StayRules({ locale }: { locale: Locale }) {
  const w = WORDS[locale];
  return (
    <div>
      <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.rules}</h2>
      <dl className="grid sm:grid-cols-2 gap-x-10">
        {HOUSE_RULES.map((r) => (
          <div key={r.key} className="py-4 border-b border-navy/10">
            <dt className="text-xs text-navy/40 uppercase tracking-widest mb-1">{r.label[locale]}</dt>
            <dd className="text-navy/80">{r.value[locale]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Praktické informace o domě */
export function StayPractical({ locale }: { locale: Locale }) {
  const w = WORDS[locale];
  return (
    <div>
      <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.practical}</h2>
      <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
        {PRACTICAL.map((p) => (
          <li key={p.key} className="flex items-start text-navy/70">
            <span className="w-6 h-px bg-gold mr-4 mt-3 shrink-0" />
            <span>{p.text[locale]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Časté dotazy — nativní details/summary, bez JavaScriptu */
export function StayFaq({ locale }: { locale: Locale }) {
  const w = WORDS[locale];
  return (
    <div>
      <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.faq}</h2>
      <div className="divide-y divide-navy/10 border-y border-navy/10">
        {FAQ.map((f) => (
          <details key={f.key} className="group py-4">
            <summary className="flex items-center justify-between cursor-pointer list-none text-navy text-lg font-light">
              <span>{f.q[locale]}</span>
              <span className="ml-6 text-gold text-2xl leading-none transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-navy/70 leading-relaxed">{f.a[locale]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/** Tabulka vzdáleností */
export function NearbyList({ locale, limit }: { locale: Locale; limit?: number }) {
  const w = WORDS[locale];
  const items = limit ? NEARBY.slice(0, limit) : NEARBY;
  return (
    <div>
      <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.nearby}</h2>
      <div>
        {items.map((n) => (
          <div key={n.key} className="flex justify-between gap-6 py-3 border-b border-navy/10">
            <span className="text-navy">{n.label[locale]}</span>
            <span className="text-navy/40 whitespace-nowrap">{locale === 'en' ? n.distance.replace(',', '.') : n.distance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mapa (OpenStreetMap, bez cookies třetích stran) + adresa a odkazy do map */
export function LocationMap({ locale, heading = true }: { locale: Locale; heading?: boolean }) {
  const w = WORDS[locale];
  const d = 0.008;
  const bbox = [PROPERTY.lng - d, PROPERTY.lat - d / 2, PROPERTY.lng + d, PROPERTY.lat + d / 2].join('%2C');
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${PROPERTY.lat}%2C${PROPERTY.lng}`;
  const mapy = `https://mapy.cz/zakladni?q=${PROPERTY.lat}%2C${PROPERTY.lng}&z=16`;
  const google = `https://www.google.com/maps/search/?api=1&query=${PROPERTY.lat}%2C${PROPERTY.lng}`;
  return (
    <div>
      {heading && <h2 className="text-sm text-navy/40 uppercase tracking-widest mb-6">{w.map}</h2>}
      <div className="aspect-[16/9] bg-stone">
        <iframe
          title={w.mapTitle}
          src={osm}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
        <p className="text-navy/70">
          <span className="text-navy/40 uppercase tracking-widest text-xs mr-3">{w.address}</span>
          {PROPERTY.street}, {PROPERTY.city}
        </p>
        <p className="flex gap-6">
          <a href={mapy} target="_blank" rel="noopener noreferrer" className="text-navy border-b border-navy/30 hover:text-gold hover:border-gold transition-colors">
            {w.openMap}
          </a>
          <a href={google} target="_blank" rel="noopener noreferrer" className="text-navy border-b border-navy/30 hover:text-gold hover:border-gold transition-colors">
            {w.openGoogle}
          </a>
        </p>
      </div>
    </div>
  );
}

/** Karta „proč rezervovat přímo“ pod rezervačním panelem */
export function DirectBookingBenefits({ locale }: { locale: Locale }) {
  const w = WORDS[locale];
  return (
    <div className="bg-stone p-8">
      <p className="text-xs text-navy/40 uppercase tracking-widest mb-4">{w.direct}</p>
      <ul className="space-y-3">
        {w.directItems.map((item) => (
          <li key={item} className="flex items-start text-sm text-navy/80">
            <span className="w-4 h-px bg-gold mr-3 mt-2.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-6 border-t border-navy/10">
        <GuestRatingBadge locale={locale} />
      </div>
    </div>
  );
}
