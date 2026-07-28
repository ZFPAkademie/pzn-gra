/**
 * Admin — klientské dokumenty (kupní smlouvy, protokoly, pojištění)
 * /admin/dokumenty — upload per majitel, majitel je vidí v portálu
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { UploadOwnerDocForm, OwnerDocCard } from './dokumenty-client';
import type { OwnerOption, OwnerDocItem } from './dokumenty-client';

export const dynamic = 'force-dynamic';

export default async function AdminDocumentsPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: owners }, { data: apartments }, { data: documents }] = await Promise.all([
    supabase.from('owners').select('id, name').eq('is_active', true).order('name'),
    supabase.from('apartments').select('id, unit, building, owner_id'),
    supabase
      .from('owner_documents')
      .select('id, owner_id, apartment_id, category, title, file_size_bytes, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const aptLabel = new Map((apartments ?? []).map((a) => [a.id, `${a.building ?? ''} ${a.unit ?? ''}`.trim()]));

  const ownerOptions: OwnerOption[] = (owners ?? []).map((o) => ({
    id: o.id,
    name: o.name ?? '—',
    apartments: (apartments ?? [])
      .filter((a) => a.owner_id === o.id)
      .map((a) => ({ id: a.id, label: aptLabel.get(a.id) ?? '—' })),
  }));

  const ownerName = new Map((owners ?? []).map((o) => [o.id, o.name ?? '—']));

  const docs: OwnerDocItem[] = (documents ?? []).map((d) => ({
    id: d.id,
    owner_id: d.owner_id,
    category: d.category,
    title: d.title,
    file_size_bytes: d.file_size_bytes,
    created_at: d.created_at,
    ownerName: ownerName.get(d.owner_id) ?? '—',
    apartmentLabel: d.apartment_id ? (aptLabel.get(d.apartment_id) ?? null) : null,
  }));

  // Základ listu = majitelé (primární entita), dokumenty přimapované
  const ownersWithDocs = ownerOptions.map((owner) => ({
    owner,
    docs: docs.filter((d) => d.owner_id === owner.id),
  }));

  const totalDocs = docs.length;

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-light text-navy tracking-wide">Klientské dokumenty</h1>
          <p className="text-sm text-slate-500 mt-1">
            {ownersWithDocs.filter((o) => o.docs.length > 0).length}/{ownerOptions.length} majitelů s dokumenty · {totalDocs} dokumentů celkem.
            Majitel vidí své dokumenty v portálu.
          </p>
        </div>

        {ownerOptions.length === 0 ? (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Zatím žádní majitelé. Nejdřív vytvořte majitele v sekci Majitelé.
          </div>
        ) : (
          <>
            <UploadOwnerDocForm owners={ownerOptions} />

            <div className="space-y-4">
              {ownersWithDocs.map(({ owner, docs: ownerDocs }) => (
                <div key={owner.id} className="bg-white border border-stone rounded-sm">
                  <div className="px-5 py-3 border-b border-stone flex items-center justify-between">
                    <p className="text-sm text-navy font-light">{owner.name}</p>
                    <p className="text-xs text-slate-400">
                      {ownerDocs.length === 0 ? 'Žádné dokumenty' : `${ownerDocs.length} dok.`}
                    </p>
                  </div>
                  {ownerDocs.length > 0 && (
                    <div className="divide-y divide-stone">
                      {ownerDocs.map((doc) => <OwnerDocCard key={doc.id} doc={doc} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Spacer pro mobilní bottom tab bar */}
        <div className="h-14 md:hidden" />
      </main>
    </div>
  );
}
