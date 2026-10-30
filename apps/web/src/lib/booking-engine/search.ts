/**
 * Hledání volných apartmánů podle termínu.
 * Stejná pravidla jako checkAvailability + calculatePrice (tedy co rezervace přijme),
 * ale dávkově pro všechny apartmány najednou. Apartmán bez fdm_room_use_id se nehledá —
 * pronájem běží přes Front Desk Master a bez něj nemáme kalendář ani cenu.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { addDays } from './dates';
import { priceFdmStay, type FdmNight } from './pricing';
import type { BookingCurrency } from './money';

/** PostgREST vrací nejvýš 1000 řádků; 10 apartmánů × 365 dní je 3650 */
const PAGE_SIZE = 1000;

export interface StayCalendar {
  /** Volné noci — den, který ve fdm_calendar chybí, volný není (FDM je zdroj pravdy) */
  free: Set<string>;
  nights: Map<string, FdmNight>;
}

export interface StayOffer {
  checkIn: string;
  checkOut: string;
  nights: number;
  totalCents: number;
  pricePerNightCents: number;
  /** false = cena se během pobytu mění, pricePerNightCents je průměr */
  uniformPrice: boolean;
  currency: BookingCurrency;
}

export type StayCalendars =
  | { ok: true; calendars: Record<string, StayCalendar> }
  | { ok: false; error: string };

type FdmRow = FdmNight & { apartment_id: string; available: boolean; closed: boolean };

async function fetchFdmRows(
  apartmentIds: string[],
  from: string,
  to: string
): Promise<{ rows: FdmRow[]; error: string | null }> {
  const admin = createSupabaseAdminClient();
  const rows: FdmRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await admin
      .from('fdm_calendar')
      .select('apartment_id, date, available, closed, price_cents, min_stay, currency')
      .in('apartment_id', apartmentIds)
      .gte('date', from)
      .lt('date', to)
      .order('apartment_id')
      .order('date')
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data ?? []) as FdmRow[]));
    if ((data?.length ?? 0) < PAGE_SIZE) return { rows, error: null };
  }
}

/** Kalendáře apartmánů pro noci od `from` do `to` (bez `to`) */
export async function loadStayCalendars(apartmentIds: string[], from: string, to: string): Promise<StayCalendars> {
  if (apartmentIds.length === 0) return { ok: true, calendars: {} };
  const admin = createSupabaseAdminClient();

  const [fdm, bookings, ownerBlocks] = await Promise.all([
    fetchFdmRows(apartmentIds, from, to),
    admin
      .from('bookings')
      .select('apartment_id, check_in, check_out')
      .in('apartment_id', apartmentIds)
      .neq('status', 'cancelled')
      .lt('check_in', to)
      .gt('check_out', from),
    admin
      .from('blocked_dates')
      .select('apartment_id, start_date, end_date')
      .in('apartment_id', apartmentIds)
      .lt('start_date', to)
      .gte('end_date', from),
  ]);

  const error = fdm.error ?? bookings.error?.message ?? ownerBlocks.error?.message;
  if (error) {
    console.error('[search] loadStayCalendars error:', error);
    return { ok: false, error };
  }

  const calendars: Record<string, StayCalendar> = {};
  for (const id of apartmentIds) calendars[id] = { free: new Set(), nights: new Map() };

  for (const row of fdm.rows) {
    const cal = calendars[row.apartment_id];
    cal.nights.set(row.date, row);
    if (row.available && !row.closed) cal.free.add(row.date);
  }
  // Noc odjezdu je volná (check_out bez dne), blokace majitele včetně posledního dne
  for (const b of bookings.data ?? []) {
    for (let d = b.check_in as string; d < b.check_out; d = addDays(d, 1)) {
      calendars[b.apartment_id as string].free.delete(d);
    }
  }
  for (const b of ownerBlocks.data ?? []) {
    for (let d = b.start_date as string; d <= b.end_date; d = addDays(d, 1)) {
      calendars[b.apartment_id as string].free.delete(d);
    }
  }

  return { ok: true, calendars };
}

function isFree(cal: StayCalendar, checkIn: string, checkOut: string): boolean {
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    if (!cal.free.has(d)) return false;
  }
  return true;
}

/** Nabídka pro konkrétní termín, nebo null, když by ho rezervace odmítla */
export function stayOffer(cal: StayCalendar, checkIn: string, checkOut: string): StayOffer | null {
  if (!isFree(cal, checkIn, checkOut)) return null;
  const price = priceFdmStay(cal.nights, checkIn, checkOut);
  if (!price || price.nights < price.minNights) return null;
  return {
    checkIn,
    checkOut,
    nights: price.nights,
    totalCents: price.totalCents,
    pricePerNightCents: price.pricePerNightCents,
    uniformPrice: new Set(price.breakdown.map((n) => n.pricePerNightCents)).size === 1,
    currency: price.currency,
  };
}

/** Minimální pobyt termínu, jehož noci jsou volné — null, když jsou obsazené nebo bez ceny */
export function requiredMinNights(cal: StayCalendar, checkIn: string, checkOut: string): number | null {
  if (!isFree(cal, checkIn, checkOut)) return null;
  return priceFdmStay(cal.nights, checkIn, checkOut)?.minNights ?? null;
}

/** Nejbližší nepřekrývající se nabídky s příjezdem mezi firstArrival a lastArrival (včetně) */
export function findOffers(
  cal: StayCalendar,
  { firstArrival, lastArrival, nights, limit }: { firstArrival: string; lastArrival: string; nights: number; limit: number }
): StayOffer[] {
  const offers: StayOffer[] = [];
  let arrival = firstArrival;
  while (arrival <= lastArrival && offers.length < limit) {
    const offer = stayOffer(cal, arrival, addDays(arrival, nights));
    if (offer) offers.push(offer);
    arrival = offer ? offer.checkOut : addDays(arrival, 1);
  }
  return offers;
}

/** Náhradní termíny stejné délky co nejblíž `around` — seřazené podle data */
export function nearestOffers(
  cal: StayCalendar,
  { around, earliest, radiusDays, nights, limit }: { around: string; earliest: string; radiusDays: number; nights: number; limit: number }
): StayOffer[] {
  const picked: StayOffer[] = [];
  const offsets = Array.from({ length: radiusDays * 2 + 1 }, (_, i) => i - radiusDays).sort(
    (a, b) => Math.abs(a) - Math.abs(b)
  );
  for (const offset of offsets) {
    if (picked.length === limit) break;
    const arrival = addDays(around, offset);
    if (arrival < earliest) continue;
    const offer = stayOffer(cal, arrival, addDays(arrival, nights));
    if (offer && picked.every((p) => offer.checkOut <= p.checkIn || offer.checkIn >= p.checkOut)) picked.push(offer);
  }
  return picked.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

/** Dny, kdy není volný žádný apartmán — v kalendáři je nejde vybrat jako příjezd */
export function soldOutDays(calendars: Record<string, StayCalendar>, from: string, to: string): string[] {
  const cals = Object.values(calendars);
  const days: string[] = [];
  for (let d = from; d < to; d = addDays(d, 1)) {
    if (!cals.some((cal) => cal.free.has(d))) days.push(d);
  }
  return days;
}
