import { createSupabaseAdminClient } from '@/lib/supabase-server';

export interface CreateBookingData {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmountCents: number;
  currency: string;
  gdprConsent: boolean;
}

export async function createBooking(
  data: CreateBookingData
): Promise<{ ok: true; bookingId: string; confirmationToken: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const confirmationToken = crypto.randomUUID();

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      apartment_id: data.apartmentId,
      status: 'pending',
      check_in: data.checkIn,
      check_out: data.checkOut,
      nights: data.nights,
      guest_first_name: data.firstName,
      guest_last_name: data.lastName,
      guest_email: data.email,
      guest_phone: data.phone,
      guests_count: data.guestsCount,
      total_amount_cents: data.totalAmountCents,
      currency: data.currency,
      confirmation_token: confirmationToken,
    })
    .select('id')
    .single();

  if (error || !booking) {
    console.error('[bookings] createBooking error:', error);
    return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit rezervaci' };
  }

  return { ok: true, bookingId: booking.id, confirmationToken };
}

export async function getBookingByToken(token: string) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      check_in,
      check_out,
      nights,
      guest_first_name,
      guest_last_name,
      guest_email,
      guests_count,
      total_amount_cents,
      currency,
      confirmation_token,
      created_at,
      apartments (
        id,
        slug,
        title
      )
    `)
    .eq('confirmation_token', token)
    .maybeSingle();

  if (error) {
    console.error('[bookings] getBookingByToken error:', error);
    return null;
  }

  return data;
}

export async function confirmBookingPayment(
  bookingId: string,
  paymentIntentId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from('bookings')
    .update({
      status: 'confirmed',
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('[bookings] confirmBookingPayment error:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function getBookingByCheckoutSession(
  sessionId: string
) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('bookings')
    .select('id, apartment_id, check_in, check_out, stripe_payment_intent_id')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('[bookings] getBookingByCheckoutSession error:', error);
    return null;
  }

  return data;
}

export async function updateStripeCheckoutSession(
  bookingId: string,
  sessionId: string
): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin
    .from('bookings')
    .update({ stripe_checkout_session_id: sessionId })
    .eq('id', bookingId);
}
