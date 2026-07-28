/**
 * Admin — údržba / hlášení závad od majitelů
 * /admin/udrzba
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { MaintenanceCard } from './udrzba-client';
import type { MaintenanceItem } from './udrzba-client';

export const dynamic = 'force-dynamic';

export default async function AdminMaintenancePage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: requests }, { data: owners }, { data: apartments }] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select('id, owner_id, apartment_id, title, description, status, priority, admin_note, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('owners').select('id, name'),
    supabase.from('apartments').select('id, unit, building'),
  ]);

  const ownerName = new Map((owners ?? []).map((o) => [o.id, o.name ?? '—']));
  const aptLabel = new Map((apartments ?? []).map((a) => [a.id, `${a.building ?? ''} ${a.unit ?? ''}`.trim()]));

  const items: MaintenanceItem[] = (requests ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    admin_note: r.admin_note,
    created_at: r.created_at,
    ownerName: ownerName.get(r.owner_id) ?? '—',
    apartmentLabel: aptLabel.get(r.apartment_id) ?? '—',
  }));

  const active = items.filter((i) => i.status !== 'resolved');
  const resolved = items.filter((i) => i.status === 'resolved');

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-light text-navy tracking-wide">Údržba</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hlášení závad od majitelů — {active.length} k řešení / {items.length} celkem.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Zatím žádná hlášení závad.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="space-y-3 mb-6">
                {active.map((item) => <MaintenanceCard key={item.id} item={item} />)}
              </div>
            )}

            {resolved.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Vyřešené</p>
                <div className="space-y-3">
                  {resolved.map((item) => <MaintenanceCard key={item.id} item={item} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Spacer pro mobilní bottom tab bar */}
        <div className="h-14 md:hidden" />
      </main>
    </div>
  );
}
