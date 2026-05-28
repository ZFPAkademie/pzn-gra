/**
 * Admin Blokace — správa blokovaných termínů
 * /admin/blokace
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { AddBlockForm, BlocksList } from './blokace-client';

export const dynamic = 'force-dynamic';

export default async function AdminBlokacePage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: apartments }, { data: blocks }] = await Promise.all([
    supabase
      .from('apartments')
      .select('id, slug, title')
      .eq('for_rent', true)
      .order('slug'),
    supabase
      .from('blocked_dates')
      .select('id, apartment_id, owner_id, start_date, end_date, reason, note')
      .not('source', 'in', '("booking_com","airbnb")')
      .order('start_date', { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">Blokace termínů</h1>
            <p className="text-sm text-slate-500 mt-1">
              Blokace od admina (údržba, vlastní pobyt) i od majitelů portálu.
              Blokace z Booking.com / Airbnb jsou ve Channel Manageru.
            </p>
          </div>
          <div className="shrink-0">
            <AddBlockForm apartments={apartments ?? []} />
          </div>
        </div>

        <BlocksList blocks={blocks ?? []} apartments={apartments ?? []} />
      </main>
    </div>
  );
}
