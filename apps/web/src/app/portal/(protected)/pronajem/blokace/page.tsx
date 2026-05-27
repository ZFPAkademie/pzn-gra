/**
 * Portal — blokace termínů (pro majitele v rental programu)
 * /portal/pronajem/blokace
 */

import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient, requireOwner } from '@/lib/supabase-server';
import { BlokaceClient } from './blokace-client';

export const dynamic = 'force-dynamic';

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default async function PronaJemBlokacePage() {
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

  const { data: apartments } = await admin
    .from('apartments')
    .select('id, unit, building, in_rental_program')
    .eq('owner_id', owner.id)
    .eq('in_rental_program', true)
    .order('unit');

  const { data: blocks } = await admin
    .from('blocked_dates')
    .select('id, apartment_id, start_date, end_date, note, reason')
    .eq('owner_id', owner.id)
    .eq('reason', 'owner_use')
    .gte('end_date', new Date().toISOString().slice(0, 10))
    .order('start_date', { ascending: true });

  const apts = apartments ?? [];

  if (apts.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Pronájem</p>
          <h1 className="text-[#0B1626] font-light text-3xl">Blokace termínů</h1>
        </div>
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Vaše apartmány nejsou v rental programu.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Pronájem</p>
        <h1 className="text-[#0B1626] font-light text-3xl">Blokace termínů</h1>
        <p className="text-[#0B1626]/50 text-sm mt-2 font-light">
          Zablokujte termíny pro vlastní pobyt. Tyto termíny nebudou dostupné k rezervaci.
        </p>
      </div>

      <BlokaceClient
        apartments={apts.map(a => ({ id: a.id, label: `${a.building ?? ''} ${a.unit ?? ''}`.trim() }))}
        blocks={(blocks ?? []).map(b => ({
          id: b.id,
          apartment_id: b.apartment_id,
          start_date: b.start_date,
          end_date: b.end_date,
          note: b.note,
          displayStart: formatDate(b.start_date),
          displayEnd: formatDate(b.end_date),
          apartmentLabel: apts.find(a => a.id === b.apartment_id)
            ? `${apts.find(a => a.id === b.apartment_id)?.building ?? ''} ${apts.find(a => a.id === b.apartment_id)?.unit ?? ''}`.trim()
            : b.apartment_id,
        }))}
      />
    </div>
  );
}
