import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { checkAvailability } from '@/lib/booking-engine/availability';
import { calculatePrice } from '@/lib/booking-engine/pricing';
import { createBooking } from '@/lib/booking-engine/bookings';
import { sendBookingReceivedEmail, sendAdminNewBookingEmail } from '@/lib/email';

const BANK_IBAN = process.env.BANK_IBAN ?? 'CZ00 0000 0000 0000 0000 0000';
const BANK_NAME = process.env.BANK_NAME ?? 'Pod Zlatým návrším s.r.o.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apartmentId, checkIn, checkOut, guests, firstName, lastName, email, phone, gdprConsent } = body;

    if (!apartmentId || !checkIn || !checkOut || !firstName || !lastName || !email || !gdprConsent) {
      return NextResponse.json({ error: 'Chybí povinné pole' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: apartment } = await admin
      .from('apartments')
      .select('id, title, slug, max_guests, base_price_cents')
      .eq('id', apartmentId)
      .eq('for_rent', true)
      .maybeSingle();

    if (!apartment) {
      return NextResponse.json({ error: 'Apartmán nenalezen' }, { status: 404 });
    }

    const price = await calculatePrice(apartmentId, checkIn, checkOut);
    if (!price) {
      return NextResponse.json({ error: 'Nelze vypočítat cenu' }, { status: 500 });
    }

    if (price.nights < price.minNights) {
      return NextResponse.json(
        { error: `Minimální délka pobytu jsou ${price.minNights} ${price.minNights === 1 ? 'noc' : price.minNights < 5 ? 'noci' : 'nocí'}` },
        { status: 400 }
      );
    }

    const avail = await checkAvailability(apartmentId, checkIn, checkOut);
    if (!avail.available) {
      return NextResponse.json({ error: 'Vybrané termíny nejsou volné' }, { status: 409 });
    }

    const booking = await createBooking({
      apartmentId,
      checkIn,
      checkOut,
      nights: price.nights,
      guestsCount: guests ?? 1,
      firstName,
      lastName,
      email,
      phone: phone ?? '',
      totalAmountCents: price.totalCents,
      gdprConsent,
    });

    if (!booking.ok) {
      return NextResponse.json({ error: booking.error }, { status: 500 });
    }

    console.log('[bookings] Rezervace vytvořena:', booking.bookingId, booking.confirmationToken);

    const reference = `REZ-${booking.confirmationToken.slice(0, 8).toUpperCase()}`;

    // Emails — soft-fail via sendSafe wrapper
    sendBookingReceivedEmail({
      guestEmail: email,
      guestName: `${firstName} ${lastName}`,
      apartmentTitle: apartment.title ?? apartment.slug,
      checkIn,
      checkOut,
      nights: price.nights,
      guestsCount: guests ?? 1,
      totalAmountCents: price.totalCents,
      confirmationToken: booking.confirmationToken,
      bankIban: BANK_IBAN,
      bankName: BANK_NAME,
      reference,
    });

    sendAdminNewBookingEmail({
      bookingId: booking.bookingId,
      guestName: `${firstName} ${lastName}`,
      guestEmail: email,
      guestPhone: phone ?? null,
      apartmentTitle: apartment.title ?? apartment.slug,
      checkIn,
      checkOut,
      nights: price.nights,
      totalAmountCents: price.totalCents,
      reference,
    });

    return NextResponse.json({
      bookingId: booking.bookingId,
      confirmationToken: booking.confirmationToken,
    });
  } catch (err) {
    console.error('[bookings] POST error:', err);
    return NextResponse.json({ error: 'Interní chyba serveru' }, { status: 500 });
  }
}
