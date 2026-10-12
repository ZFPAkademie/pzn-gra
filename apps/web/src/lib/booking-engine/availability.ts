import { createSupabaseAdminClient } from '@/lib/supabase-server';

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function eachDayInRange(startStr: string, endStr: string): string[] {
  const days: string[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current < end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Apartmán napojený na FDM: volné dny = fdm_calendar.available a ne closed.
 * Vrací null, když apartmán na FDM napojen není (→ původní logika).
 */
async function fdmBlockedDays(
  apartmentId: string,
  fromInclusive: string,
  toExclusive: string
): Promise<Set<string> | null> {
  const admin = createSupabaseAdminClient();
  const { data: apt } = await admin
    .from('apartments')
    .select('fdm_room_use_id')
    .eq('id', apartmentId)
    .maybeSingle();
  if (!apt?.fdm_room_use_id) return null;

  const { data: days, error } = await admin
    .from('fdm_calendar')
    .select('date, available, closed')
    .eq('apartment_id', apartmentId)
    .gte('date', fromInclusive)
    .lt('date', toExclusive);
  if (error) {
    console.error('[availability] fdm_calendar error:', error);
    return null;
  }

  const known = new Map((days ?? []).map((d) => [d.date as string, !!d.available && !d.closed]));
  const blocked = new Set<string>();
  // Den, který v cache chybí (mimo horizont synchronizace), bereme jako obsazený — FDM je zdroj pravdy.
  for (const day of eachDayInRange(fromInclusive, toExclusive)) {
    if (known.get(day) !== true) blocked.add(day);
  }
  return blocked;
}

export async function checkAvailability(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean }> {
  const admin = createSupabaseAdminClient();

  // FDM (master) — obsazeno podle synchronizovaného kalendáře
  const fdmBlocked = await fdmBlockedDays(apartmentId, checkIn, checkOut);
  if (fdmBlocked && fdmBlocked.size > 0) return { available: false };

  // Zkontroluj překrývající se rezervace (pending + confirmed)
  const { data: overlappingBookings, error } = await admin
    .from('bookings')
    .select('id')
    .eq('apartment_id', apartmentId)
    .neq('status', 'cancelled')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)
    .limit(1);

  if (error) {
    console.error('[availability] checkAvailability error:', error);
    return { available: false };
  }

  // Zkontroluj owner bloky (date-range z portálu)
  const { data: ownerBlocks } = await admin
    .from('blocked_dates')
    .select('id')
    .eq('apartment_id', apartmentId)
    .lt('start_date', checkOut)
    .gte('end_date', checkIn)
    .limit(1);

  const blocked =
    (overlappingBookings?.length ?? 0) > 0 || (ownerBlocks?.length ?? 0) > 0;

  return { available: !blocked };
}

export async function getMonthAvailability(
  apartmentId: string,
  year: number,
  month: number
): Promise<string[]> {
  const admin = createSupabaseAdminClient();

  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const firstStr = firstDay.toISOString().slice(0, 10);
  const lastStr = lastDay.toISOString().slice(0, 10);

  const blockedSet = new Set<string>();

  // FDM (master) — dny obsazené podle synchronizovaného kalendáře
  const fdmBlocked = await fdmBlockedDays(apartmentId, firstStr, lastStr > firstStr ? nextDay(lastStr) : lastStr);
  fdmBlocked?.forEach((d) => blockedSet.add(d));

  // Rezervace překrývající se s tímto měsícem
  const { data: bookings } = await admin
    .from('bookings')
    .select('check_in, check_out')
    .eq('apartment_id', apartmentId)
    .neq('status', 'cancelled')
    .lt('check_in', lastStr)
    .gt('check_out', firstStr);

  for (const b of bookings ?? []) {
    const start = b.check_in > firstStr ? b.check_in : firstStr;
    const end = b.check_out < lastStr ? b.check_out : lastStr;
    eachDayInRange(start, end).forEach((d) => blockedSet.add(d));
  }

  // Owner bloky překrývající se s tímto měsícem
  const { data: ownerBlocks } = await admin
    .from('blocked_dates')
    .select('start_date, end_date')
    .eq('apartment_id', apartmentId)
    .lte('start_date', lastStr)
    .gte('end_date', firstStr);

  for (const b of ownerBlocks ?? []) {
    const start = b.start_date > firstStr ? b.start_date : firstStr;
    const end = b.end_date < lastStr ? b.end_date : lastStr;
    eachDayInRange(start, end).forEach((d) => blockedSet.add(d));
  }

  return Array.from(blockedSet).sort();
}
