import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { checkAvailability, getMonthAvailability } from '@/lib/booking-engine/availability';
import { calculatePrice } from '@/lib/booking-engine/pricing';

interface RouteParams {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);

  const admin = createSupabaseAdminClient();
  const { data: apartment } = await admin
    .from('apartments')
    .select('id, max_guests, base_price_cents')
    .eq('slug', slug)
    .eq('for_rent', true)
    .maybeSingle();

  if (!apartment) {
    return NextResponse.json({ error: 'Apartmán nenalezen' }, { status: 404 });
  }

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  if (yearParam && monthParam) {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Neplatné datum' }, { status: 400 });
    }

    const blockedDates = await getMonthAvailability(apartment.id, year, month);
    return NextResponse.json({ blockedDates });
  }

  if (checkIn && checkOut) {
    if (checkIn >= checkOut) {
      return NextResponse.json({ error: 'Neplatný rozsah dat' }, { status: 400 });
    }

    const [avail, price] = await Promise.all([
      checkAvailability(apartment.id, checkIn, checkOut),
      calculatePrice(apartment.id, checkIn, checkOut),
    ]);

    return NextResponse.json({
      available: avail.available,
      nights: price?.nights ?? 0,
      minNights: price?.minNights ?? 2,
      totalCents: price?.totalCents ?? 0,
      pricePerNightCents: price?.pricePerNightCents ?? apartment.base_price_cents,
      currency: 'CZK',
      blockedDates: avail.blockedDates,
    });
  }

  return NextResponse.json(
    { error: 'Zadej year+month nebo checkIn+checkOut' },
    { status: 400 }
  );
}
