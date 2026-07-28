/**
 * Portal SVJ — dokumenty (stanovy, zápisy, finance)
 * /portal/svj/dokumenty — čtení přes signed URLs z privátního bucketu
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase-server';
import { DocumentRow } from './download-button';

export const dynamic = 'force-dynamic';

const categoryLabels: Record<string, string> = {
  stanovy: 'Stanovy',
  zapisy: 'Zápisy ze schůzí',
  finance: 'Finance',
  other: 'Ostatní',
};

const categoryOrder = ['stanovy', 'zapisy', 'finance', 'other'];

export default async function SvjDocumentsPage() {
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
    .from('svj_documents')
    .select('id, category, title, file_size_bytes, mime_type, created_at')
    .order('created_at', { ascending: false });

  const docs = documents ?? [];
  const byCategory = categoryOrder
    .map((cat) => ({ cat, items: docs.filter((d) => d.category === cat) }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <div className="mb-8">
        <p className="text-[#C9A24D] text-xs tracking-[0.25em] uppercase mb-1">Klientský portál</p>
        <h1 className="text-[#0B1626] font-light text-3xl">SVJ — Dokumenty</h1>
      </div>

      {/* Sub-navigace: Nástěnka | Dokumenty */}
      <div className="flex gap-2 mb-8">
        <Link
          href="/portal/svj"
          className="px-4 py-2 border border-[#0B1626]/20 text-sm text-[#0B1626] font-light rounded-sm hover:border-[#0B1626] transition-colors"
        >
          Nástěnka
        </Link>
        <span className="px-4 py-2 bg-[#0B1626] text-white text-sm font-light rounded-sm">Dokumenty</span>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-[#0B1626]/10 rounded-sm p-8 text-center">
          <p className="text-[#0B1626]/40 font-light">Zatím žádné dokumenty.</p>
          <p className="text-[#0B1626]/30 text-sm mt-2">Správce zde bude zveřejňovat stanovy, zápisy a další dokumenty.</p>
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
                  <DocumentRow
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
