import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { checkAvailability } from '@/lib/booking-engine/availability';
import { calculatePrice } from '@/lib/booking-engine/pricing';
import { createBooking } from '@/lib/booking-engine/bookings';
import { sendBookingReceivedEmail, sendAdminNewBookingEmail } from '@/lib/email';
import { fdmGetAvailability, isFdmConfigured } from '@/lib/fdm/client';
import { pushBookingToFdm } from '@/lib/fdm/push';

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
      .select('id, title, slug, max_guests, base_price_cents, fdm_room_use_id')
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

    // FDM je master: před zápisem ještě živá kontrola dostupnosti (soft fail → platí cache)
    const fdmLinked = !!apartment.fdm_room_use_id && isFdmConfigured();
    if (fdmLinked) {
      const lastNight = new Date(checkOut + 'T00:00:00Z');
      lastNight.setUTCDate(lastNight.getUTCDate() - 1);
      const live = await fdmGetAvailability(checkIn, lastNight.toISOString().slice(0, 10));
      if (live.ok) {
        const taken = live.data.some(
          (d) => d.roomUseId === apartment.fdm_room_use_id && d.date >= checkIn && d.date < checkOut && d.available < 1
        );
        if (taken) {
          return NextResponse.json({ error: 'Vybrané termíny nejsou volné' }, { status: 409 });
        }
      } else {
        console.warn('[bookings] FDM živá kontrola selhala, platí cache:', live.error);
      }
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
      currency: price.currency,
      fdmLinked,
      gdprConsent,
    });

    if (!booking.ok) {
      return NextResponse.json({ error: booking.error }, { status: 500 });
    }

    console.log('[bookings] Rezervace vytvořena:', booking.bookingId, booking.confirmationToken);

    const reference = `REZ-${booking.confirmationToken.slice(0, 8).toUpperCase()}`;

    // Zápis do Front Desk Master — soft fail, výsledek v bookings.fdm_* (admin může poslat znovu)
    let fdmNote: string | null = null;
    if (fdmLinked) {
      const pushed = await pushBookingToFdm(booking.bookingId);
      fdmNote = pushed.ok ? `FDM: ${pushed.reservationCode}` : `FDM zápis selhal: ${pushed.error}`;
      if (!pushed.ok) console.error('[bookings] FDM push failed:', pushed.error);
    }

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
      currency: price.currency,
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
      currency: price.currency,
      reference,
      fdmNote,
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
