/**
 * Admin Rezervace — seznam rezervací
 * /admin/rezervace
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';

export const dynamic = 'force-dynamic';

// Status badge colors
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

function formatCreatedAt(dateString: string): string {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type FilterStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | undefined;

export default async function AdminRezervacePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect('/admin/login');
  }

  const statusFilter = searchParams.status as FilterStatus;
  const supabase = createSupabaseAdminClient();

  // Fetch bookings with apartment info
  let query = supabase
    .from('bookings')
    .select(`
      id,
      guest_first_name,
      guest_last_name,
      guest_email,
      check_in,
      check_out,
      nights,
      guests_count,
      total_amount_cents,
      currency,
      status,
      created_at,
      apartments ( title, slug )
    `)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: bookings } = await query;

  // Fetch counts per status
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id, status');

  const counts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  (allBookings || []).forEach((b) => {
    if (b.status in counts) counts[b.status]++;
  });
  const total = (allBookings || []).length;

  // Fetch unread message counts per booking
  const bookingIds = (bookings || []).map((b) => b.id);
  let unreadMap: Record<string, number> = {};
  if (bookingIds.length > 0) {
    const { data: unreadRows } = await supabase
      .from('booking_messages')
      .select('booking_id')
      .in('booking_id', bookingIds)
      .eq('sender_role', 'guest')
      .is('read_at', null);

    (unreadRows || []).forEach((row) => {
      unreadMap[row.booking_id] = (unreadMap[row.booking_id] || 0) + 1;
    });
  }

  const filterTabs: { label: string; value?: string; count: number }[] = [
    { label: 'Všechny', value: undefined, count: total },
    { label: 'Čeká na platbu', value: 'pending', count: counts.pending },
    { label: 'Potvrzené', value: 'confirmed', count: counts.confirmed },
    { label: 'Dokončené', value: 'completed', count: counts.completed },
    { label: 'Zrušené', value: 'cancelled', count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-light text-navy mb-6">Rezervace</h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            const href = tab.value ? `/admin/rezervace?status=${tab.value}` : '/admin/rezervace';
            return (
              <Link
                key={tab.value ?? 'all'}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-stone">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Apartmán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Termín
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Noci / Hosté
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Částka
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vytvořeno
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {!bookings || bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                    Žádné rezervace
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const apt = booking.apartments as { title?: string; slug?: string } | null;
                  const unread = unreadMap[booking.id] || 0;
                  return (
                    <tr key={booking.id} className="hover:bg-stone/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-navy">
                        {apt?.title || apt?.slug || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-navy">
                          {booking.guest_first_name} {booking.guest_last_name}
                        </div>
                        <div className="text-xs text-slate-500">{booking.guest_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {booking.nights} nocí / {booking.guests_count} os.
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-navy whitespace-nowrap">
                        {formatAmount(booking.total_amount_cents)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                            statusColors[booking.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatCreatedAt(booking.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/rezervace/${booking.id}`}
                          className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 text-sm font-medium"
                        >
                          Detail
                          {unread > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-amber-500 text-white font-medium">
                              {unread}
                            </span>
                          )}
                          {' →'}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
