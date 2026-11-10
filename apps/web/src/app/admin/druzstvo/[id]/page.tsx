/**
 * Admin — Družstvo: detail kontaktu
 * /admin/druzstvo/[id] — údaje, stav, přílohy, historie jednání.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import {
  COOP_TOTAL_SHARES,
  coopFullName,
  coopSourceLabels,
  formatDateOnly,
  formatDateTime,
} from '@/lib/coop-shared';
import { AdminNav } from '../../_components/admin-nav';
import {
  CoopArchiveButton,
  CoopEditToggle,
  CoopEventComposer,
  CoopEventItem,
  CoopFileItem,
  CoopFileUpload,
  CoopStatusBadge,
  CoopStatusSwitcher,
  type CoopContactRow,
  type CoopEventRow,
  type CoopFileRow,
} from '../druzstvo-client';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm text-navy mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function formatCzk(n: number | null): string | null {
  if (n === null || n === undefined) return null;
  return `${Number(n).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} Kč`;
}

export default async function AdminDruzstvoDetailPage({ params }: { params: { id: string } }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  if (!UUID_RE.test(params.id)) notFound();

  const supabase = createSupabaseAdminClient();
  const [{ data: contact }, { data: files }, { data: events }] = await Promise.all([
    supabase.from('coop_contacts').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('coop_contact_files')
      .select('id, category, title, file_size_bytes, mime_type, created_at')
      .eq('contact_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('coop_contact_events')
      .select('id, kind, body, old_status, new_status, occurred_at')
      .eq('contact_id', params.id)
      .order('occurred_at', { ascending: false }),
  ]);

  if (!contact) notFound();
  const c = contact as CoopContactRow & { lead_id: string | null; created_at: string; updated_at: string; metadata: Record<string, unknown> | null };
  const archived = !!c.archived_at;

  const address = [c.street, [c.postal_code, c.city].filter(Boolean).join(' '), c.country].filter(Boolean).join(', ');
  const geo = (c.metadata?.geo ?? null) as { city?: string; country?: string } | null;

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/druzstvo" className="text-sm text-slate-500 hover:text-navy">
          ← Družstvo
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-3 mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">{coopFullName(c)}</h1>
            <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <CoopStatusBadge status={c.status} />
              <span>
                {c.share_count ? `${c.share_count} z ${COOP_TOTAL_SHARES} podílů` : 'počet podílů neuveden'}
              </span>
              {c.company_name && <span>· {c.company_name}</span>}
              {archived && <span className="text-red-600">· archivováno {formatDateTime(c.archived_at!)}</span>}
            </p>
          </div>
          <CoopArchiveButton contactId={c.id} archived={archived} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Levý sloupec — údaje + přílohy */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3">Stav</h2>
              <CoopStatusSwitcher contactId={c.id} status={c.status} disabled={archived} />
              <p className="text-xs text-slate-400 mt-3">
                Rezervace a Vlastník se odečítají od volných podílů na webu /podil.
              </p>
            </section>

            <section className="bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-widest text-slate-400">Údaje</h2>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Info label="E-mail" value={c.email ? <a href={`mailto:${c.email}`} className="hover:text-gold">{c.email}</a> : null} />
                <Info label="Telefon" value={c.phone ? <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="hover:text-gold">{c.phone}</a> : null} />
                <Info label="Datum narození" value={formatDateOnly(c.birth_date)} />
                <Info label="Adresa" value={address} />
                <Info label="Firma" value={[c.company_name, c.company_id ? `IČO ${c.company_id}` : null].filter(Boolean).join(', ')} />
                <Info label="Zdroj" value={coopSourceLabels[c.source as keyof typeof coopSourceLabels] ?? c.source} />
                <Info label="Přivedl" value={c.referred_by} />
                <Info label="Má na starosti" value={c.assigned_to} />
                <Info
                  label="Další krok"
                  value={c.next_step || c.next_step_date ? [c.next_step, formatDateOnly(c.next_step_date)].filter(Boolean).join(' · ') : null}
                />
                <Info label="Rezervace" value={formatDateOnly(c.reserved_at)} />
                <Info label="Podpis smlouvy" value={formatDateOnly(c.contract_signed_at)} />
                <Info
                  label="Úhrada"
                  value={c.paid_at || c.paid_amount !== null ? [formatCzk(c.paid_amount), formatDateOnly(c.paid_at)].filter(Boolean).join(' · ') : null}
                />
                <Info
                  label="Souhlas GDPR"
                  value={c.gdpr_consent ? `ano${c.gdpr_consent_at ? `, ${formatDateTime(c.gdpr_consent_at)}` : ''}` : 'ne'}
                />
                <Info label="Obchodní sdělení" value={c.marketing_consent ? 'ano' : 'ne'} />
                <Info label="Lokalita z webu" value={geo ? [geo.city, geo.country].filter(Boolean).join(', ') : null} />
              </dl>
              {c.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Poznámka</p>
                  <p className="text-sm text-navy whitespace-pre-line mt-0.5">{c.notes}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Založeno {formatDateTime(c.created_at)}</span>
                <span>Upraveno {formatDateTime(c.updated_at)}</span>
                {c.lead_id && (
                  <Link href={`/admin/leads/${c.lead_id}`} className="underline hover:text-navy">
                    původní poptávka v Leadech
                  </Link>
                )}
              </div>
              <div className="mt-4">
                <CoopEditToggle contact={c} />
              </div>
            </section>

            <section className="bg-white border border-slate-200 p-5">
              <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3">
                Přílohy {files && files.length > 0 ? `(${files.length})` : ''}
              </h2>
              {files && files.length > 0 ? (
                <ul className="divide-y divide-slate-100 mb-5">
                  {(files as CoopFileRow[]).map((f) => <CoopFileItem key={f.id} file={f} />)}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 mb-5">Zatím žádné přílohy.</p>
              )}
              <div className="pt-4 border-t border-slate-100">
                <CoopFileUpload contactId={c.id} />
              </div>
            </section>
          </div>

          {/* Pravý sloupec — historie */}
          <section className="bg-white border border-slate-200 p-5 self-start">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3">Historie a jednání</h2>
            <CoopEventComposer contactId={c.id} />
            {events && events.length > 0 ? (
              <ul className="divide-y divide-slate-100 mt-4">
                {(events as CoopEventRow[]).map((e) => <CoopEventItem key={e.id} event={e} />)}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 mt-4">Zatím bez záznamů.</p>
            )}
          </section>
        </div>

        <div className="h-14 md:hidden" />
      </main>
    </div>
  );
}
