/**
 * Admin Apartmány — správa všech apartmánů
 * /admin/apartmany
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { ApartmanyTable, AddApartmentForm } from './apartmany-client';

export const dynamic = 'force-dynamic';

export default async function AdminApartmanyPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: apartments }, { data: owners }] = await Promise.all([
    supabase
      .from('apartments')
      .select('id, slug, title, unit, building, layout, area_m2, floor, status, for_sale, for_rent, in_rental_program, owner_id, base_price_cents')
      .order('slug'),
    supabase
      .from('owners')
      .select('id, name, email')
      .eq('is_active', true)
      .order('name'),
  ]);

  const apts = apartments ?? [];
  const forSale = apts.filter(a => a.for_sale).length;
  const forRent = apts.filter(a => a.for_rent).length;
  const inProgram = apts.filter(a => a.in_rental_program).length;
  const withOwner = apts.filter(a => a.owner_id).length;

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-light text-navy tracking-wide">Apartmány</h1>
              <p className="text-sm text-slate-500 mt-1">
                Správa visibility flags, přiřazení majitelů a základních cen.
              </p>
            </div>
            <div className="shrink-0">
              <AddApartmentForm />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:flex sm:gap-6 gap-2 mt-3 text-xs text-slate-500">
            <span>Celkem: <strong className="text-navy">{apts.length}</strong></span>
            <span>S majitelem: <strong className="text-navy">{withOwner}</strong></span>
            <span>Prodej: <strong className="text-navy">{forSale}</strong></span>
            <span>Pronájem: <strong className="text-navy">{forRent}</strong></span>
            <span>Rental: <strong className="text-navy">{inProgram}</strong></span>
          </div>
        </div>

        {/* Legenda */}
        <div className="bg-white border border-stone px-4 py-3 mb-4 text-xs text-slate-500 flex flex-col sm:flex-row gap-2 sm:gap-6">
          <span><strong>Prodej</strong> — zobrazí se na /apartmany-prodej</span>
          <span><strong>Pronájem</strong> — zobrazí se na /apartmany-spindleruv-mlyn-pronajem</span>
          <span><strong>Rental prog.</strong> — aktivní v booking engine (lze rezervovat)</span>
        </div>

        <ApartmanyTable apartments={apts} owners={owners ?? []} />
      </main>
    </div>
  );
}
