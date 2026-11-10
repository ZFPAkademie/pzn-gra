/**
 * Admin — Družstvo: evidence zájemců a vlastníků družstevních podílů
 * /admin/druzstvo — výpis, filtr podle stavu, hledání, přidání kontaktu.
 * Poptávky z /podil sem padají automaticky (stav Nový).
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import {
  COOP_STATUSES,
  COOP_TOTAL_SHARES,
  coopFullName,
  coopSourceLabels,
  coopStatusLabels,
  formatDateOnly,
  formatDateTime,
  isCoopStatus,
  type CoopStatus,
} from '@/lib/coop-shared';
import { AdminNav } from '../_components/admin-nav';
import { CoopStatusBadge, NewCoopContact } from './druzstvo-client';

export const dynamic = 'force-dynamic';

interface ListRow {
  id: string;
  status: CoopStatus;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  share_count: number | null;
  source: string;
  next_step: string | null;
  next_step_date: string | null;
  created_at: string;
  archived_at: string | null;
}

function sharesLabel(n: number): string {
  return `${n} ${n === 1 ? 'podíl' : n < 5 ? 'podíly' : 'podílů'}`;
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default async function AdminDruzstvoPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; archiv?: string };
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const statusFilter = isCoopStatus(searchParams.status) ? searchParams.status : null;
  const showArchived = searchParams.archiv === '1';
  const q = (searchParams.q ?? '').trim();

  const supabase = createSupabaseAdminClient();
  const [{ data, error }, { data: fileRows }] = await Promise.all([
    supabase
      .from('coop_contacts')
      .select('id, status, first_name, last_name, email, phone, company_name, share_count, source, next_step, next_step_date, created_at, archived_at')
      .order('created_at', { ascending: false }),
    supabase.from('coop_contact_files').select('contact_id'),
  ]);

  const all = (data ?? []) as ListRow[];
  const active = all.filter((c) => !c.archived_at);
  const archivedCount = all.length - active.length;

  // Souhrn podílů = stejný výpočet jako veřejný web (Rezervace + Vlastník, bez archivu)
  const owned = active.filter((c) => c.status === 'owner').reduce((s, c) => s + (c.share_count ?? 0), 0);
  const reserved = active.filter((c) => c.status === 'reservation').reduce((s, c) => s + (c.share_count ?? 0), 0);
  const available = Math.max(0, COOP_TOTAL_SHARES - owned - reserved);
  const counts = Object.fromEntries(COOP_STATUSES.map((s) => [s, active.filter((c) => c.status === s).length])) as Record<CoopStatus, number>;

  const filesByContact = new Map<string, number>();
  for (const f of fileRows ?? []) filesByContact.set(f.contact_id, (filesByContact.get(f.contact_id) ?? 0) + 1);

  const base = showArchived ? all.filter((c) => c.archived_at) : active;
  const nq = normalize(q);
  const rows = base.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (!nq) return true;
    const hay = normalize([c.first_name, c.last_name, c.email, c.phone, c.company_name].filter(Boolean).join(' '));
    return hay.includes(nq);
  });

  const todayPrague = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Prague' });

  function href(params: { status?: string | null; archiv?: boolean; noQuery?: boolean }) {
    const sp = new URLSearchParams();
    if (params.status) sp.set('status', params.status);
    if (params.archiv) sp.set('archiv', '1');
    if (q && !params.noQuery) sp.set('q', q);
    const s = sp.toString();
    return `/admin/druzstvo${s ? `?${s}` : ''}`;
  }

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">Družstvo</h1>
            <p className="text-sm text-slate-500 mt-1">
              Zájemci a vlastníci družstevních podílů. Poptávky z webu /podil se zakládají automaticky.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-white border border-red-200 text-red-700 text-sm p-4 mb-6">
            Evidenci se nepodařilo načíst: {error.message}
          </div>
        )}

        {/* Podíly */}
        <div className="bg-white border border-slate-200 p-5 mb-6">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <p className="text-sm text-slate-500">
              <span className="text-3xl font-light text-navy">{available}</span> z {COOP_TOTAL_SHARES} volných
            </p>
            <p className="text-sm text-slate-500"><span className="text-xl font-light text-navy">{owned}</span> ve vlastnictví</p>
            <p className="text-sm text-slate-500"><span className="text-xl font-light text-navy">{reserved}</span> v rezervaci</p>
          </div>
          <div className="mt-3 h-1.5 bg-stone flex overflow-hidden" aria-hidden>
            <div className="bg-navy" style={{ width: `${(owned / COOP_TOTAL_SHARES) * 100}%` }} />
            <div className="bg-gold" style={{ width: `${(reserved / COOP_TOTAL_SHARES) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Počet volných podílů na webu /podil se počítá odsud (Rezervace + Vlastník).
          </p>
        </div>

        {/* Filtry */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={href({ status: null })}
              className={`border px-3 py-1.5 text-sm min-h-[36px] ${!statusFilter && !showArchived ? 'border-navy text-navy bg-white' : 'border-slate-200 text-slate-500 bg-white hover:text-navy'}`}
            >
              Vše {active.length}
            </Link>
            {COOP_STATUSES.map((s) => (
              <Link
                key={s}
                href={href({ status: s, archiv: showArchived })}
                className={`border px-3 py-1.5 text-sm min-h-[36px] ${statusFilter === s ? 'border-navy text-navy bg-white' : 'border-slate-200 text-slate-500 bg-white hover:text-navy'}`}
              >
                {coopStatusLabels[s]} {counts[s]}
              </Link>
            ))}
            {archivedCount > 0 && (
              <Link
                href={href({ archiv: !showArchived })}
                className={`border px-3 py-1.5 text-sm min-h-[36px] ${showArchived ? 'border-navy text-navy bg-white' : 'border-slate-200 text-slate-400 bg-white hover:text-navy'}`}
              >
                Archiv {archivedCount}
              </Link>
            )}
          </div>
          <form method="GET" action="/admin/druzstvo" className="flex gap-2 lg:ml-auto">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            {showArchived && <input type="hidden" name="archiv" value="1" />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Hledat jméno, e-mail, telefon"
              className="border border-slate-200 bg-white px-3 py-2 text-base md:text-sm text-navy focus:outline-none focus:border-gold w-full lg:w-72"
            />
            <button type="submit" className="px-3 py-2 border border-slate-200 bg-white text-sm text-navy hover:border-navy">
              Hledat
            </button>
          </form>
        </div>

        <div className="mb-4">
          <NewCoopContact />
        </div>

        {/* Výpis */}
        <div className="bg-white border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 text-xs text-slate-400">
            {rows.length}/{base.length} kontaktů{showArchived ? ' v archivu' : ''}
            {q && <> · hledání „{q}“ · <Link href={href({ status: statusFilter, archiv: showArchived, noQuery: true })} className="underline">zrušit</Link></>}
          </div>

          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">
              {all.length === 0 ? 'Zatím žádné kontakty. Poptávky z webu se tu objeví samy, další přidáte tlačítkem výše.' : 'Nic neodpovídá filtru.'}
            </p>
          ) : (
            <>
              {/* Desktop tabulka */}
              <table className="w-full text-sm hidden md:table">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-2 font-normal">Kontakt</th>
                    <th className="px-3 py-2 font-normal">Stav</th>
                    <th className="px-3 py-2 font-normal text-right">Podíly</th>
                    <th className="px-3 py-2 font-normal">Další krok</th>
                    <th className="px-3 py-2 font-normal">Zdroj</th>
                    <th className="px-5 py-2 font-normal text-right">Založeno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c) => {
                    const overdue = c.next_step_date && c.next_step_date < todayPrague && !['owner', 'cancelled'].includes(c.status);
                    const files = filesByContact.get(c.id) ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-cream">
                        <td className="px-5 py-3">
                          <Link href={`/admin/druzstvo/${c.id}`} className="text-navy hover:text-gold">
                            {coopFullName(c)}
                          </Link>
                          {c.company_name && <span className="text-slate-400"> · {c.company_name}</span>}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                            {files > 0 && ` · ${files} ${files === 1 ? 'příloha' : files < 5 ? 'přílohy' : 'příloh'}`}
                          </p>
                        </td>
                        <td className="px-3 py-3"><CoopStatusBadge status={c.status} /></td>
                        <td className="px-3 py-3 text-right text-navy">{c.share_count ?? '—'}</td>
                        <td className="px-3 py-3 text-slate-600 max-w-xs">
                          <span className="line-clamp-1">{c.next_step ?? ''}</span>
                          {c.next_step_date && (
                            <span className={`text-xs ${overdue ? 'text-red-600' : 'text-slate-400'}`}>
                              {formatDateOnly(c.next_step_date)}{overdue ? ' · po termínu' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-500">{coopSourceLabels[c.source as keyof typeof coopSourceLabels] ?? c.source}</td>
                        <td className="px-5 py-3 text-right text-xs text-slate-400 whitespace-nowrap">{formatDateTime(c.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobil karty */}
              <ul className="md:hidden divide-y divide-slate-100">
                {rows.map((c) => {
                  const overdue = c.next_step_date && c.next_step_date < todayPrague && !['owner', 'cancelled'].includes(c.status);
                  return (
                    <li key={c.id}>
                      <Link href={`/admin/druzstvo/${c.id}`} className="block px-4 py-3 active:bg-cream">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-navy">{coopFullName(c)}</p>
                          <CoopStatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 break-all">{[c.email, c.phone].filter(Boolean).join(' · ') || '—'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {c.share_count ? sharesLabel(c.share_count) : 'počet podílů neuveden'}
                          {c.next_step_date && (
                            <span className={overdue ? 'text-red-600' : ''}> · {c.next_step ?? 'další krok'} {formatDateOnly(c.next_step_date)}</span>
                          )}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="h-14 md:hidden" />
      </main>
    </div>
  );
}
