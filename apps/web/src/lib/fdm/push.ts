/**
 * Zápis rezervace z webu do Front Desk Master.
 * Volá se po založení lokální rezervace (route POST /api/v1/bookings) a ručně z adminu
 * (tlačítko „Odeslat do FDM"). Nikdy nehází — výsledek se ukládá do bookings.fdm_*.
 */

import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { fdmCreateReservation, isFdmConfigured } from './client';
import { FDM_STANDARD_RATE_ID } from './sync';

export type PushResult = { ok: true; reservationCode: string } | { ok: false; error: string };

export async function pushBookingToFdm(bookingId: string): Promise<PushResult> {
  const admin = createSupabaseAdminClient();

  const { data: b, error } = await admin
    .from('bookings')
    .select(
      'id, status, check_in, check_out, guests_count, guest_first_name, guest_last_name, guest_email, guest_phone, total_amount_cents, currency, notes, fdm_reservation_code, confirmation_token, apartments ( slug, title, fdm_room_use_id )'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !b) return { ok: false, error: error?.message ?? 'Rezervace nenalezena' };
  if (b.fdm_reservation_code) return { ok: true, reservationCode: b.fdm_reservation_code };

  const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
  const roomUseId = apt?.fdm_room_use_id as number | null | undefined;

  const fail = async (msg: string, status: 'failed' | 'skipped' = 'failed'): Promise<PushResult> => {
    await admin
      .from('bookings')
      .update({ fdm_sync_status: status, fdm_sync_error: msg, updated_at: new Date().toISOString() })
      .eq('id', bookingId);
    return { ok: false, error: msg };
  };

  if (!isFdmConfigured()) return fail('FDM_HOSTEL_ID není nastaveno', 'skipped');
  if (!roomUseId) return fail('Apartmán nemá namapovaný typ pokoje FDM', 'skipped');
  if (b.currency !== 'EUR') return fail(`Rezervace v měně ${b.currency}, FDM účtuje v EUR`, 'skipped');
  if (b.status === 'cancelled') return fail('Zrušená rezervace se do FDM neposílá', 'skipped');

  const reference = `REZ-${String(b.confirmation_token).slice(0, 8).toUpperCase()}`;
  const note = [
    `Web podzlatymnavrsim.cz, ref. ${reference}`,
    'Platba bankovním převodem přes web.',
    b.notes ? `Poznámka hosta: ${b.notes}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const res = await fdmCreateReservation({
    roomUseId,
    roomUseName: `${apt?.title ?? apt?.slug ?? ''}`,
    rateId: FDM_STANDARD_RATE_ID,
    checkIn: b.check_in,
    checkOut: b.check_out,
    guests: b.guests_count ?? 1,
    totalPrice: (b.total_amount_cents ?? 0) / 100,
    note,
    guest: {
      firstName: b.guest_first_name,
      lastName: b.guest_last_name,
      email: b.guest_email,
      phone: b.guest_phone ?? undefined,
    },
  });

  if (!res.ok) return fail(res.error);

  const code = res.data?.ReservationCode ? String(res.data.ReservationCode) : null;
  if (!code) return fail(`FDM nevrátilo ReservationCode: ${JSON.stringify(res.data).slice(0, 200)}`);

  await admin
    .from('bookings')
    .update({
      fdm_reservation_code: code,
      fdm_guest_account_id: res.data?.GuestAccountId != null ? String(res.data.GuestAccountId) : null,
      fdm_sync_status: 'synced',
      fdm_sync_error: null,
      fdm_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  return { ok: true, reservationCode: code };
}
