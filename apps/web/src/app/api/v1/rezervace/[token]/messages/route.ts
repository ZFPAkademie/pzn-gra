import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface Params { params: { token: string } }

// Hlášky pro hosta — v jazyce rezervace (bookings.language), než je rezervace známá, podle cookie
const ERR = {
  cs: {
    notFound: 'Rezervace nenalezena',
    empty: 'Zpráva nesmí být prázdná',
    tooLong: 'Zpráva je příliš dlouhá',
    cancelled: 'Rezervace je zrušena',
  },
  en: {
    notFound: 'Reservation not found',
    empty: 'The message cannot be empty',
    tooLong: 'The message is too long',
    cancelled: 'This reservation has been cancelled',
  },
  pl: {
    notFound: 'Nie znaleziono rezerwacji',
    empty: 'Wiadomość nie może być pusta',
    tooLong: 'Wiadomość jest zbyt długa',
    cancelled: 'Rezerwacja została anulowana',
  },
};

function errFor(language: string | null | undefined, req: NextRequest) {
  if (language === 'en' || language === 'cs' || language === 'pl') return ERR[language];
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  return cookie === 'en' ? ERR.en : cookie === 'pl' ? ERR.pl : ERR.cs;
}

// GET — načti zprávy pro rezervaci
export async function GET(req: NextRequest, { params }: Params) {
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('confirmation_token', params.token)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: errFor(null, req).notFound }, { status: 404 });

  const { data: messages, error } = await admin
    .from('booking_messages')
    .select('id, sender_role, sender_name, content, created_at, read_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: messages ?? [] });
}

// POST — host pošle zprávu (autorizace = znalost tokenu)
export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => ({}));
  const { content } = body;

  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, guest_first_name, guest_last_name, status, language')
    .eq('confirmation_token', params.token)
    .maybeSingle();

  const e = errFor(booking?.language, req);

  if (!content?.trim()) {
    return NextResponse.json({ error: e.empty }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: e.tooLong }, { status: 400 });
  }

  if (!booking) return NextResponse.json({ error: e.notFound }, { status: 404 });
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: e.cancelled }, { status: 403 });
  }

  const { data: msg, error } = await admin
    .from('booking_messages')
    .insert({
      booking_id: booking.id,
      sender_role: 'guest',
      sender_name: `${booking.guest_first_name} ${booking.guest_last_name}`,
      content: content.trim(),
    })
    .select('id, sender_role, sender_name, content, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: msg }, { status: 201 });
}
