/**
 * Admin Rezervace — detail rezervace
 * /admin/rezervace/[id]
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { StatusActions } from './status-actions';
import { CheckinForm } from './checkin-form';
import { MessageThread } from './message-thread';

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Čeká na platbu',
  confirmed: 'Potvrzeno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}

export default async function AdminRezervaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const supabase = createSupabaseAdminClient();

  // Fetch booking with apartment
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      apartments ( title, slug )
    `)
    .eq('id', params.id)
    .single();

  if (!booking) {
    notFound();
  }

  // Mark guest messages as read
  await supabase
    .from('booking_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('booking_id', params.id)
    .eq('sender_role', 'guest')
    .is('read_at', null);

  // Fetch messages
  const { data: messages } = await supabase
    .from('booking_messages')
    .select('id, sender_role, sender_name, content, read_at, created_at')
    .eq('booking_id', params.id)
    .order('created_at', { ascending: true });

  const apt = booking.apartments as { title?: string; slug?: string } | null;
  const checkinInfo = (booking.checkin_info as Record<string, string>) || {};
  const ref = 'REZ-' + booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-stone">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <span className="text-lg font-light text-navy tracking-wide">Pod Zlatým návrším</span>
            <nav className="flex items-center gap-6">
              <Link href="/admin/leads" className="text-sm text-slate-500 hover:text-navy transition-colors">
                Leady
              </Link>
              <Link href="/admin/rezervace" className="text-sm font-medium text-navy border-b border-navy pb-0.5">
                Rezervace
              </Link>
            </nav>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="text-sm text-slate-500 hover:text-navy transition-colors">
              Odhlásit
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/admin/rezervace"
          className="text-sm text-slate-500 hover:text-navy transition-colors mb-4 inline-block"
        >
          ← Zpět na seznam
        </Link>

        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy">
              {apt?.title || apt?.slug || 'Rezervace'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{ref}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${
                statusColors[booking.status] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {statusLabels[booking.status] || booking.status}
            </span>
            {booking.confirmation_token && (
              <a
                href={`/rezervace/${booking.confirmation_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:text-sky-800 transition-colors"
              >
                Zobrazit stránku hosta →
              </a>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-medium text-navy mb-4">Informace o rezervaci</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-400">Host</dt>
                <dd className="text-navy font-medium mt-0.5">
                  {booking.guest_first_name} {booking.guest_last_name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">E-mail</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${booking.guest_email}`} className="text-sky-600 hover:text-sky-800">
                    {booking.guest_email}
                  </a>
                </dd>
              </div>
              {booking.guest_phone && (
                <div>
                  <dt className="text-slate-400">Telefon</dt>
                  <dd className="mt-0.5">
                    <a href={`tel:${booking.guest_phone}`} className="text-sky-600 hover:text-sky-800">
                      {booking.guest_phone}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-400">Počet hostů</dt>
                <dd className="text-navy mt-0.5">{booking.guests_count} os.</dd>
              </div>
              <div>
                <dt className="text-slate-400">Příjezd</dt>
                <dd className="text-navy mt-0.5">{formatDate(booking.check_in)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Odjezd</dt>
                <dd className="text-navy mt-0.5">{formatDate(booking.check_out)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Počet nocí</dt>
                <dd className="text-navy mt-0.5">{booking.nights}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Celková částka</dt>
                <dd className="text-navy font-medium mt-0.5">
                  {formatAmount(booking.total_amount_cents)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-medium text-navy mb-4">Změna statusu</h2>
            <StatusActions bookingId={booking.id} currentStatus={booking.status} />
          </div>

          {/* Check-in info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-medium text-navy mb-4">Pokyny pro příjezd</h2>
            <CheckinForm bookingId={booking.id} initialData={checkinInfo} />
          </div>

          {/* Messaging */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base font-medium text-navy mb-4">
              Zprávy
              {messages && messages.length > 0 && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  {messages.length} {messages.length === 1 ? 'zpráva' : messages.length < 5 ? 'zprávy' : 'zpráv'}
                </span>
              )}
            </h2>
            <MessageThread
              bookingId={booking.id}
              messages={messages || []}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
