/**
 * Admin Apartmán — detail správy
 * /admin/apartmany/[id]
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../../_components/admin-nav';
import {
  BasicInfoSection,
  FeaturesSection,
  PricingRulesSection,
  BlockedDatesSection,
  RecentBookingsSection,
} from './detail-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

const statusLabels: Record<string, string> = {
  available: 'Volný',
  reserved: 'Rezervováno',
  sold: 'Prodáno',
};

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-amber-100 text-amber-700',
  sold: 'bg-slate-100 text-slate-600',
};

export default async function AdminApartmanDetailPage({ params }: PageProps) {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const { id } = params;
  const supabase = createSupabaseAdminClient();

  const [
    { data: apt },
    { data: pricingRules },
    { data: blockedDates },
    { data: bookings },
  ] = await Promise.all([
    supabase
      .from('apartments')
      .select('id, slug, title, unit, building, layout, area_m2, floor, max_guests, status, for_sale, for_rent, in_rental_program, base_price_cents, features')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('pricing_rules')
      .select('id, name, start_date, end_date, price_per_night_cents, min_nights')
      .eq('apartment_id', id)
      .order('start_date', { ascending: true }),
    supabase
      .from('blocked_dates')
      .select('id, start_date, end_date, reason, source')
      .eq('apartment_id', id)
      .not('source', 'in', '("booking_com","airbnb")')
      .order('start_date', { ascending: true }),
    supabase
      .from('bookings')
      .select('id, confirmation_token, guest_first_name, guest_last_name, check_in, check_out, nights, total_amount_cents, status')
      .eq('apartment_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (!apt) notFound();

  const features: string[] = Array.isArray(apt.features) ? (apt.features as string[]) : [];

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb + header */}
        <div className="mb-6">
          <Link href="/admin/apartmany" className="text-xs text-slate-400 hover:text-navy transition-colors">
            ← Zpět na Apartmány
          </Link>

          <div className="flex items-start justify-between mt-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-light text-navy tracking-wide">
                  {apt.title ?? apt.slug}
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[apt.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statusLabels[apt.status] ?? apt.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">slug: {apt.slug}</p>
            </div>

            <div className="flex gap-4 text-xs text-slate-500 mt-1">
              <span className={apt.for_sale ? 'text-navy' : 'text-slate-300'}>
                Prodej {apt.for_sale ? 'on' : 'off'}
              </span>
              <span className={apt.for_rent ? 'text-navy' : 'text-slate-300'}>
                Pronájem {apt.for_rent ? 'on' : 'off'}
              </span>
              <span className={apt.in_rental_program ? 'text-navy' : 'text-slate-300'}>
                Rental {apt.in_rental_program ? 'on' : 'off'}
              </span>
              <Link href="/admin/apartmany" className="text-slate-400 hover:text-navy transition-colors">
                Upravit přepínače →
              </Link>
            </div>
          </div>
        </div>

        {/* Sekce */}
        <BasicInfoSection apt={{ ...apt, features }} />

        <FeaturesSection apt={{ ...apt, features }} />

        <PricingRulesSection
          aptId={id}
          rules={pricingRules ?? []}
        />

        <BlockedDatesSection
          aptId={id}
          blocks={(blockedDates ?? []).filter(b => b.source !== 'booking_com' && b.source !== 'airbnb')}
        />

        <RecentBookingsSection bookings={bookings ?? []} />
      </main>
    </div>
  );
}
