/**
 * Portal — dokumenty majitele (kupní smlouva, předávací protokol, pojištění)
 * /portal/dokumenty — čtení přes signed URLs z privátního bucketu
 */

import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { OwnerDocumentRow } from './document-row';

export const dynamic = 'force-dynamic';

const categoryLabels: Record<string, string> = {
  purchase_contract: 'Kupní smlouva',
  handover_protocol: 'Předávací protokol',
  insurance: 'Pojištění',
  other: 'Ostatní',
};

const categoryOrder = ['purchase_contract', 'handover_protocol', 'insurance', 'other'];

export default async function OwnerDocumentsPage() {
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

  const { data: documents } = await admin
    .from('owner_documents')
    .select('id, category, title, file_size_bytes, created_at')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false });

  const docs = documents ?? [];
  const byCategory = categoryOrder
    .map((cat) => ({ cat, items: docs.filter((d) => d.category === cat) }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">Dokumenty</h1>
        <p className="text-[#0B1626]/40 text-sm mt-2 font-light">
          Dokumenty k vašemu apartmánu — smlouvy, protokoly a další.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Zatím žádné dokumenty.</p>
          <p className="text-[#0B1626]/30 text-sm mt-2">Správce zde nahraje dokumenty k vašemu apartmánu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byCategory.map(({ cat, items }) => (
            <div key={cat} className="bg-white border border-[#0B1626]/10 rounded-sm">
              <div className="px-6 py-4 border-b border-[#0B1626]/10">
                <h2 className="text-[#0B1626] font-light text-base">{categoryLabels[cat] ?? cat}</h2>
              </div>
              <div className="divide-y divide-[#0B1626]/5">
                {items.map((doc) => (
                  <OwnerDocumentRow
                    key={doc.id}
                    id={doc.id}
                    title={doc.title}
                    sizeBytes={doc.file_size_bytes}
                    createdAt={doc.created_at}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
