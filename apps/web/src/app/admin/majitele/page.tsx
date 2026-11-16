/**
 * Admin Majitelé — správa vlastníků apartmánů
 * /admin/majitele
 */

import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAllApartmentOwnerLinks } from '@/lib/apartment-owners';
import { AdminNav } from '../_components/admin-nav';
import { AddOwnerForm, InviteButton, CommissionEditor, ToggleActiveButton, EditOwnerForm, DeleteOwnerButton } from './majitele-client';

export const dynamic = 'force-dynamic';

export default async function AdminMajitelePage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) redirect('/admin/login');

  const supabase = createSupabaseAdminClient();

  const [{ data: owners }, { data: apartments }, links] = await Promise.all([
    supabase
      .from('owners')
      .select('id, name, email, phone, commission_rate, is_active, user_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('apartments')
      .select('id, slug, title, in_rental_program')
      .order('slug'),
    getAllApartmentOwnerLinks(supabase),
  ]);

  // M:N (migrace 026): majitel → apartmány, apartmán → jména majitelů
  const aptById = new Map((apartments ?? []).map(a => [a.id, a]));
  const ownerNameById = new Map((owners ?? []).map(o => [o.id, o.name]));
  const aptByOwner: Record<string, NonNullable<typeof apartments>> = {};
  const ownersByApt: Record<string, { id: string; name: string }[]> = {};
  for (const link of links) {
    const apt = aptById.get(link.apartment_id);
    if (apt) (aptByOwner[link.owner_id] ??= []).push(apt);
    const name = ownerNameById.get(link.owner_id);
    if (name) (ownersByApt[link.apartment_id] ??= []).push({ id: link.owner_id, name });
  }
  // Volby apartmánů pro formulář; `exceptOwnerId` = nevypisovat upravovaného majitele
  const aptOptions = (exceptOwnerId?: string) => (apartments ?? []).map(a => ({
    id: a.id,
    label: a.title ?? a.slug,
    ownerNames: (ownersByApt[a.id] ?? []).filter(o => o.id !== exceptOwnerId).map(o => o.name),
  }));

  return (
    <div className="min-h-screen bg-stone">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-navy tracking-wide">Majitelé</h1>
            <p className="text-sm text-slate-500 mt-1">
              Správa vlastníků apartmánů. Pozvat do klientského portálu pomocí magic linku.
            </p>
          </div>
          <div className="shrink-0">
            <AddOwnerForm apartments={aptOptions()} />
          </div>
        </div>

        {(owners ?? []).length === 0 ? (
          <div className="bg-white border border-stone p-8 text-center text-sm text-slate-400">
            Žádní majitelé. Přidejte prvního kliknutím na tlačítko výše.
          </div>
        ) : (
          <div className="space-y-4">
            {(owners ?? []).map(owner => {
              const ownerApts = aptByOwner[owner.id] ?? [];
              const coOwners = (apt: { id: string }) =>
                (ownersByApt[apt.id] ?? []).filter(o => o.id !== owner.id).map(o => o.name);
              return (
                <div key={owner.id} className="bg-white border border-stone p-4 sm:p-5">
                  {/* Hlavička */}
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-base font-medium text-navy">{owner.name}</h3>
                    <ToggleActiveButton ownerId={owner.id} isActive={owner.is_active} />
                    {owner.user_id && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">přihlášen do portálu</span>
                    )}
                  </div>

                  {/* Kontakt */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-slate-500 mb-2">
                    <span className="truncate">{owner.email}</span>
                    {owner.phone && <span>{owner.phone}</span>}
                    <span className="flex items-center gap-1">
                      Provize: <CommissionEditor ownerId={owner.id} currentRate={owner.commission_rate} />
                    </span>
                  </div>

                  {/* Apartmány */}
                  {ownerApts.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {ownerApts.map(apt => (
                        <span
                          key={apt.id}
                          className={`text-xs px-2 py-0.5 rounded ${apt.in_rental_program ? 'bg-gold/10 text-gold' : 'bg-stone text-slate-500'}`}
                        >
                          {apt.title ?? apt.slug}
                          {apt.in_rental_program && ' (pronájem)'}
                          {coOwners(apt).length > 0 && ` · spolu s ${coOwners(apt).join(', ')}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Akce */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone">
                    <InviteButton ownerId={owner.id} email={owner.email} hasPortalAccess={!!owner.user_id} />
                    <EditOwnerForm
                      owner={{ id: owner.id, name: owner.name, email: owner.email, phone: owner.phone ?? null }}
                      apartments={aptOptions(owner.id)}
                      selectedApartmentIds={ownerApts.map(a => a.id)}
                    />
                    <DeleteOwnerButton ownerId={owner.id} name={owner.name} />
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
