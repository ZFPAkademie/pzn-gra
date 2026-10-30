import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { BookingCurrency } from './money';

export interface PriceBreakdown {
  date: string;
  pricePerNightCents: number;
  ruleName: string | null;
}

export interface PriceResult {
  totalCents: number;
  pricePerNightCents: number;
  nights: number;
  minNights: number;
  breakdown: PriceBreakdown[];
  currency: BookingCurrency;
  /** 'fdm' = ceny z Front Desk Master, 'local' = pricing_rules/base_price */
  source: 'fdm' | 'local';
}

export interface FdmNight {
  date: string;
  price_cents: number | null;
  min_stay: number | null;
  currency: string | null;
}

/**
 * Cena pobytu z nocí fdm_calendar — jediné místo výpočtu pro rezervaci i hledání termínů.
 * Vrací null, když některá noc nemá cenu.
 */
export function priceFdmStay(
  nightsByDate: Map<string, FdmNight>,
  checkIn: string,
  checkOut: string
): PriceResult | null {
  const breakdown: PriceBreakdown[] = [];
  let totalCents = 0;
  let minNights = 2;
  let currency: BookingCurrency = 'EUR';

  const current = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  while (current < end) {
    const dateStr = current.toISOString().slice(0, 10);
    const d = nightsByDate.get(dateStr);
    if (!d || d.price_cents == null) return null;
    breakdown.push({ date: dateStr, pricePerNightCents: d.price_cents, ruleName: 'FDM' });
    totalCents += d.price_cents;
    if (d.min_stay && d.min_stay > minNights) minNights = d.min_stay;
    if (d.currency === 'CZK' || d.currency === 'EUR') currency = d.currency;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  const nights = breakdown.length;
  return {
    totalCents,
    pricePerNightCents: nights > 0 ? Math.round(totalCents / nights) : 0,
    nights,
    minNights,
    breakdown,
    currency,
    source: 'fdm',
  };
}

/**
 * Ceník z FDM (fdm_calendar, Standard Rate). Vrací null, když apartmán není na FDM
 * napojen; když napojen je, ale některá noc nemá cenu, vrací { missing: true } —
 * rezervovat pak nelze (FDM je zdroj pravdy, nic nedopočítáváme).
 */
async function calculateFdmPrice(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<PriceResult | { missing: true } | null> {
  const admin = createSupabaseAdminClient();
  const { data: apt } = await admin
    .from('apartments')
    .select('fdm_room_use_id')
    .eq('id', apartmentId)
    .maybeSingle();
  if (!apt?.fdm_room_use_id) return null;

  const { data: days } = await admin
    .from('fdm_calendar')
    .select('date, price_cents, min_stay, currency')
    .eq('apartment_id', apartmentId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .order('date', { ascending: true });

  const byDate = new Map((days ?? []).map((d) => [d.date as string, d as FdmNight]));
  return priceFdmStay(byDate, checkIn, checkOut) ?? { missing: true };
}

/** Batch varianta getFdmPriceFrom pro seznamy (sync → async: listy nemohou awaitovat v .map()). */
export async function getFdmPriceFromMany(
  apartmentIds: string[]
): Promise<Record<string, { cents: number; currency: BookingCurrency }>> {
  if (apartmentIds.length === 0) return {};
  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from('fdm_calendar')
    .select('apartment_id, price_cents, currency')
    .in('apartment_id', apartmentIds)
    .gte('date', today)
    .eq('available', true)
    .not('price_cents', 'is', null);
  const out: Record<string, { cents: number; currency: BookingCurrency }> = {};
  for (const row of data ?? []) {
    const id = row.apartment_id as string;
    const cents = row.price_cents as number;
    if (!out[id] || cents < out[id].cents) {
      out[id] = { cents, currency: row.currency === 'CZK' ? 'CZK' : 'EUR' };
    }
  }
  return out;
}

/** Nejnižší cena za noc v příštím roce (pro „Pronájem od“). Null = apartmán není na FDM nebo bez cen. */
export async function getFdmPriceFrom(
  apartmentId: string
): Promise<{ cents: number; currency: BookingCurrency } | null> {
  const admin = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from('fdm_calendar')
    .select('price_cents, currency')
    .eq('apartment_id', apartmentId)
    .gte('date', today)
    .eq('available', true)
    .not('price_cents', 'is', null)
    .order('price_cents', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data?.price_cents) return null;
  return { cents: data.price_cents, currency: data.currency === 'CZK' ? 'CZK' : 'EUR' };
}

export async function calculatePrice(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<PriceResult | null> {
  // FDM je zdroj pravdy pro ceny napojených apartmánů
  const fdm = await calculateFdmPrice(apartmentId, checkIn, checkOut);
  if (fdm && 'missing' in fdm) return null;
  if (fdm) return fdm;

  const admin = createSupabaseAdminClient();

  const { data: apartment, error: aptError } = await admin
    .from('apartments')
    .select('base_price_cents')
    .eq('id', apartmentId)
    .maybeSingle();

  if (aptError || !apartment) {
    console.error('[pricing] apartment not found:', aptError);
    return null;
  }

  const basePriceCents: number = apartment.base_price_cents ?? 0;

  const { data: rules } = await admin
    .from('pricing_rules')
    .select('name, start_date, end_date, price_per_night_cents, min_nights')
    .eq('apartment_id', apartmentId)
    .lte('start_date', checkOut)
    .gte('end_date', checkIn)
    .order('start_date', { ascending: true });

  const current = new Date(checkIn);
  const end = new Date(checkOut);
  const breakdown: PriceBreakdown[] = [];
  let totalCents = 0;

  while (current < end) {
    const dateStr = current.toISOString().slice(0, 10);

    const matchingRule = (rules || []).find((rule) => {
      return dateStr >= rule.start_date && dateStr <= rule.end_date;
    });

    const nightCents = matchingRule
      ? matchingRule.price_per_night_cents
      : basePriceCents;

    breakdown.push({
      date: dateStr,
      pricePerNightCents: nightCents,
      ruleName: matchingRule ? matchingRule.name : null,
    });

    totalCents += nightCents;
    current.setDate(current.getDate() + 1);
  }

  const nights = breakdown.length;
  const avgPricePerNight = nights > 0 ? Math.round(totalCents / nights) : basePriceCents;

  const overlappingRules = (rules || []).filter((rule) => {
    return rule.start_date <= checkOut && rule.end_date >= checkIn;
  });
  const minNights = overlappingRules.reduce((max, rule) => {
    const ruleMin = rule.min_nights ?? 2;
    return ruleMin > max ? ruleMin : max;
  }, 2);

  return {
    totalCents,
    pricePerNightCents: avgPricePerNight,
    nights,
    minNights,
    breakdown,
    currency: 'CZK',
    source: 'local',
  };
}
