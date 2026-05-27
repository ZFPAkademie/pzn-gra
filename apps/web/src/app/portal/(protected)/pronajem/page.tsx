/**
 * Portal — Pronájem dashboard
 * /portal/pronajem — zobrazí se jen majitelům s in_rental_program = true
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'short',
  });
}

function formatAmount(cents: number) {
  return (cents / 100).toLocaleString('cs-CZ') + ' Kč';
}

const statusLabels: Record<string, string> = {
  pending: 'Čeká na platbu',
  confirmed: 'Potvrzeno',
  completed: 'Dokončeno',
  cancelled: 'Zrušeno',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-[#0B1626]/5 text-[#0B1626]/50',
  cancelled: 'bg-red-50 text-red-600',
};

export default async function PronaJemPage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();

  const { data: owner } = await admin
    .from('owners')
    .select('id, commission_rate')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  const { data: apartments } = await admin
    .from('apartments')
    .select('id, unit, building, in_rental_program')
    .eq('owner_id', owner.id);

  const rentalApts = (apartments ?? []).filter(a => a.in_rental_program);

  if (rentalApts.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
          <h1 className="text-[#0B1626] font-light text-3xl">Pronájem</h1>
        </div>
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Vaše apartmány zatím nejsou v rental programu.</p>
          <p className="text-[#0B1626]/30 text-sm mt-2">Kontaktujte správce pro aktivaci.</p>
        </div>
      </div>
    );
  }

  const aptIds = rentalApts.map(a => a.id);

  // Načti rezervace pro tento měsíc a příší
  const thisMonth = new Date();
  const from = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 3, 0).toISOString().slice(0, 10);

  const { data: upcomingBookings } = await admin
    .from('bookings')
    .select('id, apartment_id, check_in, check_out, nights_count, total_price_cents, status, guest_first_name, guest_last_name')
    .in('apartment_id', aptIds)
    .not('status', 'eq', 'cancelled')
    .gte('check_out', from)
    .lte('check_in', to)
    .order('check_in', { ascending: true })
    .limit(20);

  // Stats — tento měsíc
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data: monthBookings } = await admin
    .from('bookings')
    .select('nights_count, total_price_cents, status')
    .in('apartment_id', aptIds)
    .eq('status', 'confirmed')
    .gte('check_in', monthStart)
    .lte('check_out', monthEnd);

  const monthNights = (monthBookings ?? []).reduce((s, b) => s + (b.nights_count ?? 0), 0);
  const monthRevenueCents = (monthBookings ?? []).reduce((s, b) => s + (b.total_price_cents ?? 0), 0);
  const commissionRate = owner.commission_rate ?? 0.2;
  const monthNetCents = Math.round(monthRevenueCents * (1 - commissionRate));

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">Pronájem</h1>
      </div>

      {/* Stats karta */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Nocí tento měsíc', value: monthNights.toString() },
          { label: 'Tržby (hrubé)', value: formatAmount(monthRevenueCents) },
          { label: `Váš podíl (${Math.round((1 - commissionRate) * 100)} %)`, value: formatAmount(monthNetCents) },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#0B1626]/10 rounded-sm p-5">
            <p className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-2">{stat.label}</p>
            <p className="text-[#0B1626] font-light text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Rychlé odkazy */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/portal/pronajem/blokace"
          className="px-4 py-2 border border-[#0B1626]/20 text-sm text-[#0B1626] font-light hover:border-[#0B1626] transition-colors"
        >
          Blokovat termíny
        </Link>
      </div>

      {/* Nadcházející rezervace */}
      <div className="bg-white border border-[#0B1626]/10 rounded-sm">
        <div className="px-6 py-4 border-b border-[#0B1626]/10 flex items-center justify-between">
          <h2 className="text-[#0B1626] font-light text-base">Nadcházející rezervace</h2>
          <span className="text-[#0B1626]/30 text-xs">příštích 90 dní</span>
        </div>

        {(upcomingBookings ?? []).length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[#0B1626]/40 font-light text-sm">Žádné nadcházející rezervace</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0B1626]/5">
            {(upcomingBookings ?? []).map(booking => {
              const apt = rentalApts.find(a => a.id === booking.apartment_id);
              return (
                <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    {rentalApts.length > 1 && apt && (
                      <p className="text-[#0B1626]/40 text-xs">{apt.building} {apt.unit}</p>
                    )}
                    <p className="text-[#0B1626] font-light text-sm">
                      {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                      <span className="text-[#0B1626]/40 ml-2">({booking.nights_count} nocí)</span>
                    </p>
                    {booking.guest_first_name && (
                      <p className="text-[#0B1626]/50 text-xs">{booking.guest_first_name} {booking.guest_last_name}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`text-xs px-2 py-0.5 rounded-sm ${statusColors[booking.status] ?? ''}`}>
                      {statusLabels[booking.status] ?? booking.status}
                    </span>
                    {booking.total_price_cents && (
                      <p className="text-[#0B1626]/50 text-xs">{formatAmount(booking.total_price_cents)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
