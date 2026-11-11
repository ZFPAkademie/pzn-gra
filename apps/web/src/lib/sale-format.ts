/**
 * Formátování údajů pro prodejní stránky (/suites, /suites/[slug]) — podlaží, rozpětí cen, datum.
 * Sdílené výpisem i detailem, aby stejný údaj vypadal všude stejně.
 */

import { formatMoney } from '@/lib/booking-engine/money';
import type { GalleryChapter, RentalMonth } from '@/lib/sale-presentation';

type L = 'cs' | 'en';

/** Podlaží: CZ „2. NP“, EN britsky (1. NP = ground floor, 2. NP = 1st floor) */
export function floorLabel(floor: number, locale: L): string {
  if (locale !== 'en') return `${floor}. NP`;
  if (floor === 1) return 'Ground floor';
  const n = floor - 1;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix} floor`;
}

/** „6,25 m²“ → 6.25 (plochy místností jsou v DB jako text) */
export function parseArea(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[^\d,.]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Rozpětí dvou částek: „129–159 €“ / „€129–159“, stejné hodnoty bez pomlčky */
export function moneyRange(lo: number, hi: number, currency: string, locale: L): string {
  if (lo === hi) return formatMoney(lo, currency, locale);
  return locale === 'en'
    ? `${formatMoney(lo, currency, locale)}–${formatMoney(hi, currency, locale).replace('€', '')}`
    : `${formatMoney(lo, currency, locale).replace(' €', '')}–${formatMoney(hi, currency, locale)}`;
}

/** Rozpětí mediánů vybraných měsíců, null = ceník pro ně chybí */
export function priceRange(months: RentalMonth[], pick: (monthNo: number) => boolean, currency: string, locale: L): string | null {
  const vals = months
    .filter((m) => pick(Number(m.month.slice(5, 7))) && m.medianCents)
    .map((m) => m.medianCents as number);
  if (!vals.length) return null;
  return moneyRange(Math.min(...vals), Math.max(...vals), currency, locale);
}

export function formatDate(iso: string, locale: L, withTime = false): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleString(locale === 'en' ? 'en-GB' : 'cs-CZ', {
    day: 'numeric',
    month: locale === 'en' ? 'long' : 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Europe/Prague',
  });
}

/** Fotka z kapitol galerie podle cesty v úložišti (konec URL), null = byt ji nemá */
export function findChapterPhoto(chapters: GalleryChapter[], storagePath: string): string | null {
  for (const c of chapters) {
    const hit = c.photos.find((p) => p.url.endsWith(`/${storagePath}`));
    if (hit) return hit.url;
  }
  return null;
}
