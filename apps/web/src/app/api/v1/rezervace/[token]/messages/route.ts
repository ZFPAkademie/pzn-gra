import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

interface Params { params: { token: string } }

// GET — načti zprávy pro rezervaci
export async function GET(_req: NextRequest, { params }: Params) {
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('confirmation_token', params.token)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });

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

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Zpráva nesmí být prázdná' }, { status: 400 });
  }
  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Zpráva je příliš dlouhá' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, guest_first_name, guest_last_name, status')
    .eq('confirmation_token', params.token)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: 'Rezervace nenalezena' }, { status: 404 });
  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Rezervace je zrušena' }, { status: 403 });
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
