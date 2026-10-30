/**
 * Datumy pobytu jako řetězce YYYY-MM-DD (DB-03) — bez místních půlnocí, ať CET/UTC neposune den.
 * Bez závislostí na serveru: používá je i vyhledávací kalendář v prohlížeči.
 */

import type { Locale } from '@/lib/i18n';

export const MIN_STAY_NIGHTS = 2;
/** Jak daleko dopředu jde hledat — odpovídá horizontu synchronizace fdm_calendar */
export const SEARCH_HORIZON_DAYS = 365;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  pl: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
};

/** Dnešek ve Špindlu, ne na serveru v UTC (mezi půlnocí a 2:00 by to byl včerejšek) */
export function todayPrague(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut + 'T00:00:00Z') - Date.parse(checkIn + 'T00:00:00Z')) / 86400000);
}

function isRealDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const time = Date.parse(value + 'T00:00:00Z');
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Termín z URL (`?od=&do=`) — cokoli neplatného nebo v minulosti vrací null */
export function parseStay(
  checkIn: unknown,
  checkOut: unknown,
  today: string = todayPrague()
): { checkIn: string; checkOut: string; nights: number } | null {
  if (!isRealDate(checkIn) || !isRealDate(checkOut) || checkIn < today) return null;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < MIN_STAY_NIGHTS || nights > SEARCH_HORIZON_DAYS) return null;
  return { checkIn, checkOut, nights };
}

/** Pevný formát místo toLocaleDateString — server i prohlížeč musí vypsat totéž (hydratace) */
export function formatStayDate(date: string, locale: Locale, withYear = false): string {
  const [y, m, d] = date.split('-').map(Number);
  const short = locale === 'cs' ? `${d}. ${m}.` : `${d} ${MONTHS_SHORT[locale][m - 1]}`;
  return withYear ? `${short} ${y}` : short;
}

export function formatStayRange(checkIn: string, checkOut: string, locale: Locale): string {
  return `${formatStayDate(checkIn, locale)} – ${formatStayDate(checkOut, locale)}`;
}

/** cs: 1 noc / 2–4 noci / 5 nocí · en: night(s) · pl: noc / noce / nocy (12–14 → nocy) */
export function nightsLabel(n: number, locale: Locale): string {
  if (locale === 'en') return n === 1 ? 'night' : 'nights';
  if (n === 1) return 'noc';
  if (locale === 'cs') return n >= 2 && n <= 4 ? 'noci' : 'nocí';
  const d = n % 10;
  const dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 'noce' : 'nocy';
}
