import { createSupabaseAdminClient } from '@/lib/supabase-server';

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

export async function checkAvailability(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean }> {
  const admin = createSupabaseAdminClient();

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
