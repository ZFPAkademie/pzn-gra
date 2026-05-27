/**
 * Admin Majitelé — správa vlastníků apartmánů
 * /admin/majitele
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { AdminNav } from '../_components/admin-nav';
import { AddOwnerForm, InviteButton, CommissionEditor, ToggleActiveButton, EditOwnerForm, DeleteOwnerButton } from './majitele-client';

export const dynamic = 'force-dynamic';

export default async function AdminMajitelePage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: owners }, { data: apartments }] = await Promise.all([
    supabase
      .from('owners')
      .select('id, name, email, phone, commission_rate, is_active, user_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('apartments')
      .select('id, slug, title, owner_id, in_rental_program')
      .order('slug'),
  ]);

  const aptByOwner: Record<string, typeof apartments> = {};
  for (const apt of apartments ?? []) {
    if (apt.owner_id) {
      if (!aptByOwner[apt.owner_id]) aptByOwner[apt.owner_id] = [];
      aptByOwner[apt.owner_id]!.push(apt);
    }
  }

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">Majitelé</h1>
            <p className="text-sm text-slate-500 mt-1">
              Správa vlastníků apartmánů. Pozvat do klientského portálu pomocí magic linku.
            </p>
          </div>
          <AddOwnerForm apartments={apartments ?? []} />
        </div>

        {(owners ?? []).length === 0 ? (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Žádní majitelé. Přidejte prvního kliknutím na tlačítko výše.
          </div>
        ) : (
          <div className="space-y-4">
            {(owners ?? []).map(owner => {
              const ownerApts = aptByOwner[owner.id] ?? [];
              return (
                <div key={owner.id} className="bg-white border border-stone p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Hlavička */}
                      <div className="flex items-center gap-4">
                        <h3 className="text-base font-medium text-navy">{owner.name}</h3>
                        <ToggleActiveButton ownerId={owner.id} isActive={owner.is_active} />
                        {owner.user_id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">přihlášen do portálu</span>
                        )}
                      </div>

                      {/* Kontakt */}
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span>{owner.email}</span>
                        {owner.phone && <span>{owner.phone}</span>}
                        <span className="flex items-center gap-1">
                          Provize: <CommissionEditor ownerId={owner.id} currentRate={owner.commission_rate} />
                        </span>
                      </div>

                      {/* Apartmány */}
                      {ownerApts.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {ownerApts.map(apt => (
                            <span
                              key={apt.id}
                              className={`text-xs px-2 py-0.5 rounded ${apt.in_rental_program ? 'bg-gold/10 text-gold' : 'bg-stone text-slate-500'}`}
                            >
                              {apt.title ?? apt.slug}
                              {apt.in_rental_program && ' (pronájem)'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Akce */}
                    <div className="ml-4 flex flex-col gap-2 items-end">
                      <InviteButton ownerId={owner.id} email={owner.email} hasPortalAccess={!!owner.user_id} />
                      <div className="flex gap-3">
                        <EditOwnerForm owner={{ id: owner.id, name: owner.name, email: owner.email, phone: owner.phone ?? null }} />
                        <DeleteOwnerButton ownerId={owner.id} name={owner.name} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
