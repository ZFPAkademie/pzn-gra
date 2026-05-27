import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { buildICalFeed } from '@/lib/ical-parser';

// Public iCal export — token is ical_export_token on apartments table
// URL: /api/v1/ical/[token] (no auth, URL is the secret)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createSupabaseAdminClient();

  const { data: apartment } = await supabase
    .from('apartments')
    .select('id, title, slug')
    .eq('ical_export_token', params.token)
    .maybeSingle();

  if (!apartment) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Fetch confirmed/pending bookings (not cancelled)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, status, guest_first_name')
    .eq('apartment_id', apartment.id)
    .neq('status', 'cancelled')
    .gte('check_out', new Date().toISOString().slice(0, 10));

  // Fetch owner blocks
  const { data: ownerBlocks } = await supabase
    .from('blocked_dates')
    .select('id, start_date, end_date, reason')
    .eq('apartment_id', apartment.id)
    .eq('source', 'owner')
    .gte('end_date', new Date().toISOString().slice(0, 10));

  const events: Array<{ uid: string; summary: string; startDate: string; endDate: string }> = [];

  for (const b of bookings ?? []) {
    // iCal DTEND is exclusive (day after last night)
    const dtend = new Date(b.check_out);
    dtend.setDate(dtend.getDate() + 1);
    events.push({
      uid: `booking-${b.id}@podzlatymnavrsim.cz`,
      summary: b.status === 'confirmed' ? 'Rezervováno' : 'Blokováno',
      startDate: b.check_in,
      endDate: dtend.toISOString().slice(0, 10),
    });
  }

  for (const block of ownerBlocks ?? []) {
    const dtend = new Date(block.end_date);
    dtend.setDate(dtend.getDate() + 1);
    events.push({
      uid: `block-${block.id}@podzlatymnavrsim.cz`,
      summary: block.reason ?? 'Blokováno majitelem',
      startDate: block.start_date,
      endDate: dtend.toISOString().slice(0, 10),
    });
  }

  const feed = buildICalFeed({
    apartmentTitle: apartment.title ?? apartment.slug,
    events,
  });

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${apartment.slug}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
