import { NextResponse } from 'next/server';
import { getRentalApartmentsDB } from '@/lib/apartments';
import { addDays, SEARCH_HORIZON_DAYS, todayPrague } from '@/lib/booking-engine/dates';
import { loadStayCalendars, soldOutDays } from '@/lib/booking-engine/search';

export const dynamic = 'force-dynamic';

/**
 * Dny, kdy je obsazený každý apartmán — jen nápověda pro vyhledávací kalendář.
 * Pět minut z CDN nevadí: výsledek hledání i rezervace se počítají živě.
 * Soft fail: prázdný seznam, kalendář funguje dál bez přeškrtnutých dnů.
 */
export async function GET() {
  const today = todayPrague();
  const end = addDays(today, SEARCH_HORIZON_DAYS);
  const apartments = (await getRentalApartmentsDB()).filter((a) => a.fdm_room_use_id);
  const result = await loadStayCalendars(apartments.map((a) => a.id), today, end);

  if (!result.ok) return NextResponse.json({ soldOutDays: [] });

  return NextResponse.json(
    { soldOutDays: soldOutDays(result.calendars, today, end) },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
