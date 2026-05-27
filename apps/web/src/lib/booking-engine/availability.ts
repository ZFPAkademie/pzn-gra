import { createSupabaseAdminClient } from '@/lib/supabase-server';

function eachDayInRange(checkIn: string, checkOut: string): string[] {
  const days: string[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
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
): Promise<{ available: boolean; blockedDates: string[] }> {
  const admin = createSupabaseAdminClient();
  const days = eachDayInRange(checkIn, checkOut);
  if (days.length === 0) return { available: false, blockedDates: [] };

  const { data, error } = await admin
    .from('blocked_dates')
    .select('date')
    .eq('apartment_id', apartmentId)
    .in('date', days);

  if (error) {
    console.error('[availability] checkAvailability error:', error);
    return { available: false, blockedDates: [] };
  }

  const blockedDates = (data || []).map((r) => r.date as string);
  return { available: blockedDates.length === 0, blockedDates };
}

export async function getMonthAvailability(
  apartmentId: string,
  year: number,
  month: number
): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayDate = new Date(year, month, 0);
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`;

  const { data, error } = await admin
    .from('blocked_dates')
    .select('date')
    .eq('apartment_id', apartmentId)
    .gte('date', firstDay)
    .lte('date', lastDay);

  if (error) {
    console.error('[availability] getMonthAvailability error:', error);
    return [];
  }

  return (data || []).map((r) => r.date as string);
}

export async function blockDatesForBooking(
  bookingId: string,
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();
  const days = eachDayInRange(checkIn, checkOut);
  if (days.length === 0) return { ok: true };

  const rows = days.map((date) => ({
    apartment_id: apartmentId,
    date,
    reason: 'BOOKED' as const,
    booking_id: bookingId,
  }));

  const { error } = await admin
    .from('blocked_dates')
    .upsert(rows, { onConflict: 'apartment_id,date', ignoreDuplicates: true });

  if (error) {
    console.error('[availability] blockDatesForBooking error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
