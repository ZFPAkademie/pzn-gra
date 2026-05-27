/**
 * Admin Ceníky — správa sezónních cenových pravidel
 * /admin/ceniky
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { AddRuleForm, RulesList } from './ceniky-client';

export const dynamic = 'force-dynamic';

export default async function AdminCenikyPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: apartments }, { data: rules }] = await Promise.all([
    supabase
      .from('apartments')
      .select('id, slug, title')
      .eq('for_rent', true)
      .order('slug'),
    supabase
      .from('pricing_rules')
      .select('*')
      .order('start_date', { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">Sezónní ceníky</h1>
            <p className="text-sm text-slate-500 mt-1">
              Cenová pravidla přepíší základní cenu apartmánu pro dané datum.
              {' '}Priorita: pokud se překrývá více pravidel, použije se první shoda (dle start_date).
            </p>
          </div>
          <AddRuleForm apartments={apartments ?? []} />
        </div>

        {/* Přehled per apartmán */}
        {(apartments ?? []).length === 0 ? (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Žádné apartmány s pronájmem
          </div>
        ) : (
          <div className="space-y-6">
            {(apartments ?? []).map(apt => {
              const aptRules = (rules ?? []).filter(r => r.apartment_id === apt.id);
              return (
                <div key={apt.id}>
                  <h2 className="text-sm font-medium text-slate-600 mb-2">
                    {apt.title ?? apt.slug}
                    <span className="text-slate-400 font-normal ml-2">({aptRules.length} pravidel)</span>
                  </h2>
                  {aptRules.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 pl-4">Žádná pravidla — použije se základní cena apartmánu</p>
                  ) : (
                    <RulesList rules={aptRules} apartments={apartments ?? []} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
