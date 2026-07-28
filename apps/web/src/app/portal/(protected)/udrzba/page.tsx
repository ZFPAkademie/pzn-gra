/**
 * Portal — údržba / hlášení závad
 * /portal/udrzba — majitel hlásí závady, sleduje stav řešení
 */

import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { NewRequestForm } from './udrzba-client';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Čeká na vyřízení', className: 'bg-amber-50 text-amber-700' },
  in_progress: { label: 'V řešení', className: 'bg-blue-50 text-blue-700' },
  resolved: { label: 'Vyřešeno', className: 'bg-green-50 text-green-700' },
};

const priorityLabels: Record<string, string> = {
  low: 'Nízká',
  normal: 'Běžná',
  urgent: 'Urgentní',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function MaintenancePage() {
  const user = await getServerUser();
  if (!user) redirect('/portal/login');

  const admin = createSupabaseAdminClient();

  const { data: owner } = await admin
    .from('owners')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!owner) redirect('/portal/login?error=no_access');

  const [{ data: apartments }, { data: requests }] = await Promise.all([
    admin
      .from('apartments')
      .select('id, unit, building')
      .eq('owner_id', owner.id)
      .order('unit'),
    admin
      .from('maintenance_requests')
      .select('id, apartment_id, title, description, status, priority, admin_note, resolved_at, created_at')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false }),
  ]);

  const apts = apartments ?? [];
  const items = requests ?? [];

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">Údržba</h1>
        <p className="text-[#0B1626]/40 text-sm mt-2 font-light">
          Nahlaste závadu a sledujte stav jejího řešení.
        </p>
      </div>

      {apts.length > 0 && <NewRequestForm apartments={apts} />}

      {items.length === 0 ? (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Zatím žádná hlášení.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((req) => {
            const status = statusLabels[req.status] ?? statusLabels.pending;
            const apt = apts.find((a) => a.id === req.apartment_id);
            return (
              <div key={req.id} className="bg-white border border-[#0B1626]/10 rounded-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs tracking-wider uppercase px-2 py-0.5 rounded-sm ${status.className}`}>
                      {status.label}
                    </span>
                    {req.priority === 'urgent' && (
                      <span className="text-red-600 text-xs tracking-wider uppercase">Urgentní</span>
                    )}
                    {apts.length > 1 && apt && (
                      <span className="text-[#0B1626]/40 text-xs">{apt.building} {apt.unit}</span>
                    )}
                  </div>
                  <span className="text-[#0B1626]/30 text-xs whitespace-nowrap">{formatDate(req.created_at)}</span>
                </div>
                <h2 className="text-[#0B1626] font-light text-base mb-1">{req.title}</h2>
                {req.description && (
                  <p className="text-[#0B1626]/60 font-light text-sm whitespace-pre-line">{req.description}</p>
                )}
                {req.admin_note && (
                  <div className="mt-3 pt-3 border-t border-[#0B1626]/10">
                    <p className="text-[#0B1626]/40 text-xs tracking-wider uppercase mb-1">Vyjádření správce</p>
                    <p className="text-[#0B1626]/60 font-light text-sm whitespace-pre-line">{req.admin_note}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
